import Stripe from 'stripe';
import { db } from './db';
import { customers, subscriptions, payments, billingEvents } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});

export class StripeService {
  // Create a Stripe customer
  async createCustomer(customerData: {
    email: string;
    name: string;
    companyName: string;
    phone?: string;
    address?: string;
  }) {
    const stripeCustomer = await stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      phone: customerData.phone,
      metadata: {
        company: customerData.companyName,
      },
    });

    return stripeCustomer;
  }

  // Create a subscription
  async createSubscription(data: {
    customerId: string;
    priceId: string;
    trialPeriodDays?: number;
  }) {
    const subscription = await stripe.subscriptions.create({
      customer: data.customerId,
      items: [{ price: data.priceId }],
      trial_period_days: data.trialPeriodDays,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  }

  // Create a payment intent for one-time payments
  async createPaymentIntent(data: {
    amount: number;
    currency: string;
    customerId?: string;
    description?: string;
  }) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Convert to cents
      currency: data.currency,
      customer: data.customerId,
      description: data.description,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  }

  // Get subscription details
  async getSubscription(subscriptionId: string) {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice.payment_intent'],
    });
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true) {
    if (cancelAtPeriodEnd) {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      return await stripe.subscriptions.cancel(subscriptionId);
    }
  }

  // Update subscription
  async updateSubscription(subscriptionId: string, data: {
    priceId?: string;
    quantity?: number;
  }) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    return await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: data.priceId || subscription.items.data[0].price.id,
        quantity: data.quantity || subscription.items.data[0].quantity,
      }],
      proration_behavior: 'create_prorations',
    });
  }

  // Get customer invoices
  async getCustomerInvoices(customerId: string, limit: number = 10) {
    return await stripe.invoices.list({
      customer: customerId,
      limit,
      expand: ['data.payment_intent'],
    });
  }

  // Get payment intent
  async getPaymentIntent(paymentIntentId: string) {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  // Webhook handler for Stripe events
  async handleWebhook(body: string, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err}`);
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    // Find customer in our database
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.stripeCustomerId, subscription.customer as string));

    if (!customer) {
      console.error(`Customer not found for subscription: ${subscription.id}`);
      return;
    }

    // Create subscription record
    await db.insert(subscriptions).values({
      customerId: customer.id,
      stripeSubscriptionId: subscription.id,
      planId: 'starter', // You'll need to map this from the price ID
      status: subscription.status,
      billingCycle: subscription.items.data[0]?.price?.recurring?.interval || 'monthly',
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      amount: ((subscription.items.data[0]?.price?.unit_amount || 0) / 100).toString(),
      currency: subscription.currency,
    });

    // Log billing event
    await db.insert(billingEvents).values({
      customerId: customer.id,
      eventType: 'subscription_created',
      description: `Subscription ${subscription.id} created`,
      eventData: subscription as any,
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    // Update subscription record
    await db
      .update(subscriptions)
      .set({
        status: subscription.status,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

    // Find customer for billing event
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.stripeCustomerId, subscription.customer as string));

    if (customer) {
      await db.insert(billingEvents).values({
        customerId: customer.id,
        eventType: 'subscription_updated',
        description: `Subscription ${subscription.id} updated`,
        eventData: subscription as any,
      });
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    // Update subscription record
    await db
      .update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

    // Find customer for billing event
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.stripeCustomerId, subscription.customer as string));

    if (customer) {
      await db.insert(billingEvents).values({
        customerId: customer.id,
        eventType: 'subscription_canceled',
        description: `Subscription ${subscription.id} canceled`,
        eventData: subscription as any,
      });
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    // Find customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.stripeCustomerId, invoice.customer as string));

    if (!customer) return;

    // Find subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, (invoice as any).subscription as string));

    // Create payment record
    await db.insert(payments).values({
      customerId: customer.id,
      subscriptionId: subscription?.id,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: (invoice as any).payment_intent as string,
      amount: ((invoice.amount_paid || 0) / 100).toString(),
      currency: invoice.currency,
      status: 'succeeded',
      paymentMethod: 'card', // You might want to get this from payment intent
      description: invoice.description || `Payment for invoice ${invoice.number}`,
      paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
    });

    // Log billing event
    await db.insert(billingEvents).values({
      customerId: customer.id,
      subscriptionId: subscription?.id,
      eventType: 'payment_succeeded',
      description: `Payment succeeded for invoice ${invoice.number}`,
      eventData: invoice as any,
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    // Find customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.stripeCustomerId, invoice.customer as string));

    if (!customer) return;

    // Find subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, (invoice as any).subscription as string));

    // Create payment record
    await db.insert(payments).values({
      customerId: customer.id,
      subscriptionId: subscription?.id,
      stripeInvoiceId: invoice.id,
      amount: ((invoice.amount_due || 0) / 100).toString(),
      currency: invoice.currency,
      status: 'failed',
      description: invoice.description || `Failed payment for invoice ${invoice.number}`,
      failureReason: 'Payment failed',
    });

    // Log billing event
    await db.insert(billingEvents).values({
      customerId: customer.id,
      subscriptionId: subscription?.id,
      eventType: 'payment_failed',
      description: `Payment failed for invoice ${invoice.number}`,
      eventData: invoice as any,
    });
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    // Find customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.stripeCustomerId, paymentIntent.customer as string));

    if (!customer) return;

    // Update or create payment record
    await db.insert(payments).values({
      customerId: customer.id,
      stripePaymentIntentId: paymentIntent.id,
      amount: (paymentIntent.amount / 100).toString(),
      currency: paymentIntent.currency,
      status: 'succeeded',
      description: paymentIntent.description || 'One-time payment',
      paidAt: new Date(),
    });

    // Log billing event
    await db.insert(billingEvents).values({
      customerId: customer.id,
      eventType: 'payment_succeeded',
      description: `One-time payment succeeded: ${paymentIntent.id}`,
      eventData: paymentIntent as any,
    });
  }
}

export const stripeService = new StripeService();