import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  User,
  Mail,
  Building,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EmployeeOnboardingPortal() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmitEmail = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Here you could add logic to send onboarding email or check status
      toast({
        title: "Email Sent",
        description: "Please check your email for onboarding instructions",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Meeting Matters</h1>
            <p className="text-gray-600 mt-2">Employee Onboarding Portal</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Main Card */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              <User className="h-8 w-8 mr-3 text-blue-600" />
              Get Started with Your Onboarding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-600 text-lg">
              Enter your email address to receive your personalized onboarding link
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-gray-500" />
                <Input
                  type="email"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              <Button 
                onClick={handleSubmitEmail}
                disabled={loading || !email}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-5 w-5 mr-2" />
                )}
                Get Onboarding Link
              </Button>
            </div>

            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4">What to expect:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Complete personal information</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Upload required documents</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Take assessment tests</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
              <p className="text-gray-600 mb-4">
                If you have any questions or issues with the onboarding process, contact our HR team.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>hr@themeetingmatters.com</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>Human Resources Department</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}