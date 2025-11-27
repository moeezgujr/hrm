import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Crown, Star, Zap } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const planIcons = {
  starter: <Zap className="h-8 w-8" />,
  professional: <Star className="h-8 w-8" />,
  enterprise: <Crown className="h-8 w-8" />
};

export default function SubscriptionSuccess() {
  const { data: userSubscription, refetch } = useQuery({
    queryKey: ['/api/my-subscription'],
    queryFn: async () => {
      const response = await fetch('/api/my-subscription');
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Refetch subscription data on mount to get the latest status
  useEffect(() => {
    const timer = setTimeout(() => {
      refetch();
    }, 2000);

    return () => clearTimeout(timer);
  }, [refetch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full text-center shadow-xl">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4">
            <div className="bg-green-500 rounded-full p-6 inline-block">
              <CheckCircle className="h-16 w-16 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Meeting Matters!
          </CardTitle>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Your subscription is now active and ready to transform your business operations
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Subscription Details */}
          {userSubscription?.subscriptionPlan && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  {planIcons[userSubscription.subscriptionPlan as keyof typeof planIcons]}
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                    {userSubscription.subscriptionPlan} Plan
                  </h3>
                  <Badge className="mt-1" variant="default">
                    {userSubscription.subscriptionStatus}
                  </Badge>
                </div>
              </div>
              
              {userSubscription.subscriptionStartDate && userSubscription.subscriptionEndDate && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    Active from {new Date(userSubscription.subscriptionStartDate).toLocaleDateString()} 
                    to {new Date(userSubscription.subscriptionEndDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* What's Next */}
          <div className="text-left bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ArrowRight className="h-5 w-5 mr-2 text-blue-500" />
              What's Next?
            </h3>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Start managing your team with comprehensive employee profiles</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Create projects and assign tasks to boost productivity</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Set up onboarding processes for new employees</span>
              </li>
              {userSubscription?.subscriptionPlan !== 'starter' && (
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Use psychometric testing to better understand your team</span>
                </li>
              )}
              <li className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Track performance and recognize achievements</span>
              </li>
            </ul>
          </div>

          {/* Support Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Need Help Getting Started?
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Our support team is here to help you make the most of your new subscription.
            </p>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              {userSubscription?.subscriptionPlan === 'enterprise' ? (
                <p>📞 24/7 Phone Support: Contact your dedicated account manager</p>
              ) : userSubscription?.subscriptionPlan === 'professional' ? (
                <p>✉️ Priority Email Support: We'll respond within 4 hours</p>
              ) : (
                <p>✉️ Email Support: We'll respond within 24 hours</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90">
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/subscription-plans" className="flex-1">
              <Button variant="outline" className="w-full">
                View All Plans
              </Button>
            </Link>
          </div>

          {/* Receipt Information */}
          <div className="pt-6 border-t text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              You will receive a receipt confirmation via email shortly. 
              You can manage your subscription from your account settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}