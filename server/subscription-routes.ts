import type { Express } from "express";
import { stripeService } from "./stripe-service";
import { storage } from "./storage";
import { z } from "zod";

// Route handlers for subscription management
export function registerSubscriptionRoutes(app: Express) {
  
  // Create a Stripe customer
  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = z.object({
        trialRequestId: z.number(),
        companyName: z.string(),
        contactName: z.string(),
        contactEmail: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
        planId: z.enum(['starter', 'professional', 'enterprise']),
        billingCycle: z.enum(['monthly', 'yearly']),
      }).parse(req.body);

      // Create Stripe customer
      const stripeCustomer = await stripeService.createCustomer({
        email: customerData.contactEmail,
        name: customerData.contactName,
        companyName: customerData.companyName,
        phone: customerData.phone,
        address: customerData.address,
      });

      // Create customer record in database
      const customer = await storage.createCustomer({
        trialRequestId: customerData.trialRequestId,
        stripeCustomerId: stripeCustomer.id,
        companyName: customerData.companyName,
        contactName: customerData.contactName,
        contactEmail: customerData.contactEmail,
        phone: customerData.phone,
        address: customerData.address,
        planId: customerData.planId,
        billingCycle: customerData.billingCycle,
        status: 'trial',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      });

      // Log billing event
      await storage.createBillingEvent({
        customerId: customer.id,
        eventType: 'customer_created',
        description: `Customer created for ${customerData.companyName}`,
        eventData: { customer, stripeCustomer },
      });

      res.json({ customer, stripeCustomer });
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // Create a subscription
  app.post("/api/subscriptions", async (req, res) => {
    try {
      const subscriptionData = z.object({
        customerId: z.number(),
        planId: z.enum(['starter', 'professional', 'enterprise']),
        billingCycle: z.enum(['monthly', 'yearly']),
        trialPeriodDays: z.number().optional(),
      }).parse(req.body);

      // Get customer
      const customer = await storage.getCustomer(subscriptionData.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Get subscription plan
      const plan = await storage.getSubscriptionPlan(subscriptionData.planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }

      // Get the appropriate price ID based on billing cycle
      const priceId = subscriptionData.billingCycle === 'monthly' 
        ? plan.stripePriceIdMonthly 
        : plan.stripePriceIdYearly;

      if (!priceId) {
        return res.status(400).json({ message: "Price ID not configured for this plan and billing cycle" });
      }

      // Create Stripe subscription
      const stripeSubscription = await stripeService.createSubscription({
        customerId: customer.stripeCustomerId!,
        priceId,
        trialPeriodDays: subscriptionData.trialPeriodDays,
      });

      // Create subscription record in database
      const subscription = await storage.createSubscription({
        customerId: customer.id,
        stripeSubscriptionId: stripeSubscription.id,
        planId: subscriptionData.planId,
        status: stripeSubscription.status,
        billingCycle: subscriptionData.billingCycle,
        currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        amount: (subscriptionData.billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice).toString(),
        currency: 'usd',
      });

      // Update customer status
      await storage.updateCustomer(customer.id, {
        status: 'active',
        subscriptionStartDate: new Date(),
      });

      // Log billing event
      await storage.createBillingEvent({
        customerId: customer.id,
        subscriptionId: subscription.id,
        eventType: 'subscription_created',
        description: `Subscription created for ${customer.companyName}`,
        eventData: { subscription, stripeSubscription },
      });

      res.json({ 
        subscription, 
        clientSecret: stripeSubscription.latest_invoice?.payment_intent?.client_secret 
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Get all customers with pagination
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Get customer details
  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const customer = await storage.getCustomer(customerId);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Get customer's subscriptions
      const subscriptions = await storage.getCustomerSubscriptions(customerId);
      
      // Get customer's payments
      const payments = await storage.getCustomerPayments(customerId);
      
      // Get customer's billing events
      const billingEvents = await storage.getBillingEvents(customerId);

      res.json({
        customer,
        subscriptions,
        payments,
        billingEvents,
      });
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  // Get all subscriptions
  app.get("/api/subscriptions", async (req, res) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  // Update subscription
  app.put("/api/subscriptions/:id", async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      const updateData = z.object({
        planId: z.enum(['starter', 'professional', 'enterprise']).optional(),
        status: z.string().optional(),
        cancelAtPeriodEnd: z.boolean().optional(),
      }).parse(req.body);

      const subscription = await storage.getSubscription(subscriptionId);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      // Update in Stripe if needed
      if (updateData.planId) {
        const plan = await storage.getSubscriptionPlan(updateData.planId);
        if (plan) {
          const priceId = subscription.billingCycle === 'monthly' 
            ? plan.stripePriceIdMonthly 
            : plan.stripePriceIdYearly;
          
          if (priceId) {
            await stripeService.updateSubscription(subscription.stripeSubscriptionId!, {
              priceId,
            });
          }
        }
      }

      if (updateData.cancelAtPeriodEnd !== undefined) {
        await stripeService.cancelSubscription(subscription.stripeSubscriptionId!, updateData.cancelAtPeriodEnd);
      }

      // Update in database
      const updatedSubscription = await storage.updateSubscription(subscriptionId, updateData);

      // Log billing event
      await storage.createBillingEvent({
        customerId: subscription.customerId,
        subscriptionId: subscription.id,
        eventType: 'subscription_updated',
        description: `Subscription updated`,
        eventData: { updateData, updatedSubscription },
      });

      res.json(updatedSubscription);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // Cancel subscription
  app.post("/api/subscriptions/:id/cancel", async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      const { cancelAtPeriodEnd = true } = req.body;

      const subscription = await storage.getSubscription(subscriptionId);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      // Cancel in Stripe
      const canceledSubscription = await stripeService.cancelSubscription(
        subscription.stripeSubscriptionId!,
        cancelAtPeriodEnd
      );

      // Update in database
      const updatedSubscription = await storage.updateSubscription(subscriptionId, {
        status: cancelAtPeriodEnd ? 'active' : 'canceled',
        cancelAtPeriodEnd,
        canceledAt: cancelAtPeriodEnd ? null : new Date(),
      });

      // Log billing event
      await storage.createBillingEvent({
        customerId: subscription.customerId,
        subscriptionId: subscription.id,
        eventType: cancelAtPeriodEnd ? 'subscription_cancel_scheduled' : 'subscription_canceled',
        description: cancelAtPeriodEnd 
          ? 'Subscription scheduled for cancellation at period end'
          : 'Subscription canceled immediately',
        eventData: { canceledSubscription, updatedSubscription },
      });

      res.json(updatedSubscription);
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Get all payments
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Create payment intent for one-time payment
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const paymentData = z.object({
        amount: z.number().positive(),
        currency: z.string().default('usd'),
        customerId: z.number().optional(),
        description: z.string().optional(),
      }).parse(req.body);

      let stripeCustomerId: string | undefined;
      
      if (paymentData.customerId) {
        const customer = await storage.getCustomer(paymentData.customerId);
        stripeCustomerId = customer?.stripeCustomerId || undefined;
      }

      const paymentIntent = await stripeService.createPaymentIntent({
        amount: paymentData.amount,
        currency: paymentData.currency,
        customerId: stripeCustomerId,
        description: paymentData.description,
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Get subscription analytics
  app.get("/api/analytics/subscriptions", async (req, res) => {
    try {
      const analytics = await storage.getSubscriptionAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching subscription analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Get billing events
  app.get("/api/billing-events", async (req, res) => {
    try {
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
      const billingEvents = await storage.getBillingEvents(customerId);
      res.json(billingEvents);
    } catch (error) {
      console.error("Error fetching billing events:", error);
      res.status(500).json({ message: "Failed to fetch billing events" });
    }
  });

  // Stripe webhook endpoint
  app.post("/api/stripe/webhook", async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const body = req.body;

      await stripeService.handleWebhook(body, signature);
      res.json({ received: true });
    } catch (error) {
      console.error("Error handling webhook:", error);
      res.status(400).json({ message: "Webhook handling failed" });
    }
  });
}