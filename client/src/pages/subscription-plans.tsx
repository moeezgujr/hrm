import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

interface SubscriptionPlan {
  id: number;
  name: string;
  planId: 'starter' | 'professional' | 'enterprise';
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: string[];
  maxEmployees: number | null;
  maxProjects: number | null;
  maxStorage: number | null;
  isActive: boolean;
}

const planIcons = {
  starter: <Zap className="h-6 w-6" />,
  professional: <Star className="h-6 w-6" />,
  enterprise: <Crown className="h-6 w-6" />
};

const planColors = {
  starter: "bg-blue-500",
  professional: "bg-purple-500", 
  enterprise: "bg-amber-500"
};

export default function SubscriptionPlans() {
  const [, setLocation] = useLocation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  const { data: plans, isLoading } = useQuery({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const response = await fetch('/api/subscription-plans');
      if (!response.ok) throw new Error('Failed to fetch subscription plans');
      return response.json() as SubscriptionPlan[];
    }
  });

  const { data: userSubscription } = useQuery({
    queryKey: ['/api/my-subscription'],
    queryFn: async () => {
      const response = await fetch('/api/my-subscription');
      if (!response.ok) return null;
      return response.json();
    }
  });

  const handleSelectPlan = (planId: string) => {
    setLocation(`/subscribe?plan=${planId}&billing=${billingCycle}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Business Management Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform your business operations with Meeting Matters. Select the perfect plan for your organization.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white dark:bg-gray-800 p-1 rounded-lg border">
            <div className="flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-md transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Yearly
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-xs px-1">
                  Save 20%
                </Badge>
              </button>
            </div>
          </div>
        </div>

        {/* Current Subscription Status */}
        {userSubscription?.subscriptionStatus && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              <Check className="h-4 w-4 mr-2" />
              Current Plan: {userSubscription.subscriptionPlan} ({userSubscription.subscriptionStatus})
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans?.map((plan) => {
            const isCurrentPlan = userSubscription?.subscriptionPlan === plan.planId;
            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            const priceNum = parseFloat(price);
            const monthlyEquivalent = billingCycle === 'yearly' ? (priceNum / 12).toFixed(2) : price;

            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                  plan.planId === 'professional' ? 'ring-2 ring-purple-500 scale-105' : ''
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
              >
                {/* Plan Icon Header */}
                <div className={`${planColors[plan.planId]} p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {planIcons[plan.planId]}
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                    </div>
                    {plan.planId === 'professional' && (
                      <Badge className="bg-white text-purple-600">Most Popular</Badge>
                    )}
                    {isCurrentPlan && (
                      <Badge className="bg-green-600 text-white">Current</Badge>
                    )}
                  </div>
                </div>

                <CardHeader className="pb-4">
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                    {plan.description}
                  </CardDescription>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${priceNum.toFixed(0)}
                      <span className="text-lg font-normal text-gray-500">
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-sm text-gray-500 mt-1">
                        ${monthlyEquivalent}/month when paid yearly
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pb-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
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
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleSelectPlan(plan.planId)}
                    disabled={isCurrentPlan}
                    className={`w-full ${
                      plan.planId === 'professional' 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : plan.planId === 'enterprise'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } ${isCurrentPlan ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isCurrentPlan ? 'Current Plan' : `Get ${plan.name}`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Compare All Features
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Feature</th>
                  <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Starter</th>
                  <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Professional</th>
                  <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="p-4">Employee Management</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="p-4">Task Management</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="p-4">Psychometric Testing</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="p-4">Advanced Analytics</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="p-4">API Access</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">24/7 Support</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto text-left">
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Can I change plans later?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We offer a 14-day free trial on all plans. No credit card required to get started.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We accept all major credit cards and debit cards through our secure payment processor.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-12">
          <Link to="/">
            <Button variant="outline" className="px-8">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}