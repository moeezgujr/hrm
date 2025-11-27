import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, Crown, Star, Zap } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const planIcons = {
  starter: <Zap className="h-6 w-6" />,
  professional: <Star className="h-6 w-6" />,
  enterprise: <Crown className="h-6 w-6" />
};

const planColors = {
  starter: "from-blue-500 to-blue-600",
  professional: "from-purple-500 to-purple-600", 
  enterprise: "from-amber-500 to-amber-600"
};

const SubscribeForm = ({ planId, billingCycle, plan, userEmail, userName }: { planId: string, billingCycle: string, plan: any, userEmail?: string, userName?: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!stripe || !elements) {
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription-success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Welcome to Meeting Matters! Your subscription is now active.",
        });
        setLocation('/subscription-success');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const price = billingCycle === 'yearly' ? parseFloat(plan.yearlyPrice) : parseFloat(plan.monthlyPrice);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Plan Summary */}
      <Card className="lg:sticky lg:top-6 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${planColors[plan.planId as keyof typeof planColors]} text-white`}>
              {planIcons[plan.planId as keyof typeof planIcons]}
            </div>
            <div>
              <div className="text-xl">{plan.name} Plan</div>
              <Badge className="mt-1" variant={billingCycle === 'yearly' ? 'default' : 'secondary'}>
                {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} Billing
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center border-b pb-4">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                ${price.toFixed(0)}
                <span className="text-lg font-normal text-gray-500">
                  /{billingCycle === 'yearly' ? 'year' : 'month'}
                </span>
              </div>
              {billingCycle === 'yearly' && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  Save ${((parseFloat(plan.monthlyPrice) * 12) - parseFloat(plan.yearlyPrice)).toFixed(0)} per year!
                </p>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Included Features:</h4>
              <ul className="space-y-2">
                {plan.features.slice(0, 5).map((feature: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                  </li>
                ))}
                {plan.features.length > 5 && (
                  <li className="text-sm text-gray-500">
                    ...and {plan.features.length - 5} more features
                  </li>
                )}
              </ul>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <div className="flex justify-between">
                  <span>Employees:</span>
                  <span className="font-semibold">
                    {plan.maxEmployees ? `Up to ${plan.maxEmployees}` : 'Unlimited'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Projects:</span>
                  <span className="font-semibold">
                    {plan.maxProjects ? `Up to ${plan.maxProjects}` : 'Unlimited'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <span className="font-semibold">
                    {plan.maxStorage ? `${plan.maxStorage}GB` : 'Unlimited'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className="bg-blue-500 rounded-full p-1 mt-0.5">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">Secure Payment</p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Your payment information is encrypted and secure. You can cancel anytime.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <PaymentElement 
                options={{
                  layout: 'tabs'
                }}
              />
            </div>

            <div className="flex space-x-4">
              <Link to="/subscription-plans" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Plans
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={!stripe || isSubmitting}
                className={`flex-1 bg-gradient-to-r ${planColors[plan.planId as keyof typeof planColors]} text-white hover:opacity-90`}
              >
                {isSubmitting ? 'Processing...' : `Subscribe to ${plan.name}`}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By subscribing, you agree to our Terms of Service and Privacy Policy. 
              You can cancel your subscription at any time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Subscribe() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const planId = params.get('plan') || 'professional';
  const billingCycle = params.get('billing') || 'monthly';
  
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [needsUserInfo, setNeedsUserInfo] = useState(false);
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [requestingTrial, setRequestingTrial] = useState(false);
  const [trialRequested, setTrialRequested] = useState(false);
  
  const { user } = useAuth();

  const { data: plans } = useQuery({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const response = await fetch('/api/subscription-plans');
      if (!response.ok) throw new Error('Failed to fetch subscription plans');
      return response.json();
    }
  });

  const plan = plans?.find((p: any) => p.planId === planId);

  const createSubscription = () => {
    if (!plan) return;

    const payload: any = { planId, billingCycle };
    
    // If user is not authenticated, include email and name
    if (!user) {
      if (!email.trim() || !name.trim()) {
        setNeedsUserInfo(true);
        return;
      }
      payload.email = email;
      payload.name = name;
    }

    // Create subscription
    apiRequest("POST", "/api/get-or-create-subscription", payload)
      .then(async (res) => {
        const data = await res.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setNeedsUserInfo(false);
        } else if (data.requiresAuth) {
          setNeedsUserInfo(true);
          setError(data.message);
        } else if (data.error) {
          setError(data.error.message || 'Failed to create subscription');
        } else {
          setError('No client secret received');
        }
      })
      .catch((err) => {
        console.error('Subscription creation error:', err);
        if (err.message && err.message.includes('401')) {
          setNeedsUserInfo(true);
        } else {
          setError('Failed to initialize subscription');
        }
      });
  };

  useEffect(() => {
    if (plan) {
      // Pre-fill user info if authenticated
      if (user) {
        setEmail(user.email || '');
        setName(`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '');
        createSubscription(); // Call immediately if user is authenticated
      } else {
        // For unauthenticated users, show the form to collect info
        setNeedsUserInfo(true);
      }
    }
  }, [planId, billingCycle, plan, user]);

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading subscription plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Subscription Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Link to="/subscription-plans">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret && !needsUserInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Subscribe to Meeting Matters
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete your subscription to start transforming your business operations
          </p>
        </div>

        {needsUserInfo && !clientSecret && !trialRequested ? (
          // Show comprehensive user info collection form
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Complete Your Information</CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                Tell us about your organization to get started with Meeting Matters.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name *</Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Enter your company name"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    type="text"
                    placeholder="e.g., HR Manager, CEO"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamSize">Team Size *</Label>
                  <select
                    id="teamSize"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select team size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-25">11-25 employees</option>
                    <option value="26-50">26-50 employees</option>
                    <option value="51-100">51-100 employees</option>
                    <option value="101-250">101-250 employees</option>
                    <option value="251-500">251-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
              </div>

              {/* Free Trial Option */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Start with a Free Trial
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
                  Get 14 days free access to all {plan.name} plan features. No payment required upfront.
                </p>
                <Button
                  onClick={async () => {
                    if (!name.trim() || !email.trim() || !company.trim() || !jobTitle.trim() || !teamSize) {
                      setError('Please fill in all required fields before requesting a trial.');
                      return;
                    }
                    setRequestingTrial(true);
                    try {
                      await apiRequest("POST", "/api/request-trial", {
                        name: name.trim(),
                        email: email.trim(),
                        company: company.trim(),
                        phone: phone.trim(),
                        jobTitle: jobTitle.trim(),
                        teamSize,
                        planId,
                        billingCycle
                      });
                      setTrialRequested(true);
                      setRequestingTrial(false);
                    } catch (error) {
                      console.error('Trial request error:', error);
                      setError('Failed to request trial. Please try again.');
                      setRequestingTrial(false);
                    }
                  }}
                  disabled={requestingTrial || !name.trim() || !email.trim() || !company.trim() || !jobTitle.trim() || !teamSize}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {requestingTrial ? 'Requesting Trial...' : 'Request Free Trial'}
                </Button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Or proceed directly to payment
                </p>
                <div className="flex space-x-4">
                  <Link to="/subscription-plans" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Plans
                    </Button>
                  </Link>
                  <Button 
                    onClick={createSubscription}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                    disabled={!email.trim() || !name.trim() || !company.trim() || !jobTitle.trim() || !teamSize}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : trialRequested ? (
          // Show trial requested confirmation
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-green-600">Free Trial Requested!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <div className="text-green-600 dark:text-green-400 text-6xl mb-4">✓</div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                    Trial Request Submitted
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    Thank you for your interest in Meeting Matters! We've received your free trial request for the {plan.name} plan.
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What happens next?</h4>
                  <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1 text-left">
                    <li>• Our HR specialists will review your request within 24 hours</li>
                    <li>• You'll receive an email with your trial account setup instructions</li>
                    <li>• Get 14 days of full access to all {plan.name} features</li>
                    <li>• Personal onboarding session with our team</li>
                  </ul>
                </div>

                <div className="pt-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Have questions? Contact us at <a href="mailto:support@themeetingmatters.com" className="text-blue-600 hover:underline">support@themeetingmatters.com</a>
                  </p>
                  <Link to="/subscription-plans">
                    <Button variant="outline" className="w-full">
                      Back to Plans
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : clientSecret ? (
          // Show payment form
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SubscribeForm 
              planId={planId} 
              billingCycle={billingCycle} 
              plan={plan}
              userEmail={email}
              userName={name}
            />
          </Elements>
        ) : null}
      </div>
    </div>
  );
}