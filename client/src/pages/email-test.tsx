import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  CreditCard,
  UserPlus,
  XCircle,
  Bell,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface TrialRequest {
  id: number;
  name: string;
  email: string;
  company: string;
  phone?: string;
  jobTitle: string;
  teamSize: string;
  planId: string;
  billingCycle: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function EmailTestCenter() {
  const [selectedRequest, setSelectedRequest] = useState<TrialRequest | null>(null);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [customMessage, setCustomMessage] = useState('');
  const { toast } = useToast();

  // Fetch trial requests to test with
  const { data: trialRequests = [], refetch: refetchRequests } = useQuery<TrialRequest[]>({
    queryKey: ['/api/trial-requests'],
  });

  // Test trial request notification email
  const testTrialNotificationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/test-emails/trial-notification', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Email Sent Successfully",
        description: "Trial request notification email has been sent to HR admins.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send trial notification email",
        variant: "destructive",
      });
    },
  });

  // Test trial approval email
  const testApprovalMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/test-emails/trial-approval', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Email Sent Successfully", 
        description: "Trial approval email has been sent to the requester.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send approval email",
        variant: "destructive",
      });
    },
  });

  // Test trial rejection email
  const testRejectionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/test-emails/trial-rejection', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Email Sent Successfully",
        description: "Trial rejection email has been sent to the requester.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send rejection email",
        variant: "destructive",
      });
    },
  });

  const handleTestTrialNotification = () => {
    const mockData = {
      name: "John Smith",
      email: testEmail,
      company: "Acme Corporation",
      phone: "+1-555-123-4567",
      jobTitle: "HR Manager",
      teamSize: "50-100",
      planId: "professional",
      billingCycle: "monthly"
    };
    
    testTrialNotificationMutation.mutate(mockData);
  };

  const handleTestApproval = () => {
    if (!selectedRequest) {
      toast({
        title: "Select a Request",
        description: "Please select a trial request to test approval email",
        variant: "destructive",
      });
      return;
    }

    const data = {
      ...selectedRequest,
      email: testEmail, // Override with test email
      credentials: {
        username: "trial_user",
        password: "trial123"
      }
    };

    testApprovalMutation.mutate(data);
  };

  const handleTestRejection = () => {
    if (!selectedRequest) {
      toast({
        title: "Select a Request",
        description: "Please select a trial request to test rejection email",
        variant: "destructive",
      });
      return;
    }

    const data = {
      ...selectedRequest,
      email: testEmail, // Override with test email
      reason: customMessage || "After reviewing your request, we're unable to approve it at this time due to capacity constraints."
    };

    testRejectionMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Test Center</h1>
          <p className="text-gray-600 mt-2">
            Test all trial request notification emails and system email functionality
          </p>
        </div>
        <Button 
          onClick={() => refetchRequests()} 
          variant="outline" 
          size="sm"
          className="flex items-center space-x-2"
        >
          <RefreshCw size={16} />
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* Email Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="text-blue-500" size={20} />
            <span>Email Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure test parameters for email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="testEmail">Test Email Address</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">
              All test emails will be sent to this address instead of the original recipient
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Three Notification Methods */}
      <Tabs defaultValue="notification" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notification" className="flex items-center space-x-2">
            <Bell size={16} />
            <span>HR Notification</span>
          </TabsTrigger>
          <TabsTrigger value="approval" className="flex items-center space-x-2">
            <CheckCircle size={16} />
            <span>Approval Email</span>
          </TabsTrigger>
          <TabsTrigger value="rejection" className="flex items-center space-x-2">
            <XCircle size={16} />
            <span>Rejection Email</span>
          </TabsTrigger>
        </TabsList>

        {/* Method 1: HR Notification Email */}
        <TabsContent value="notification">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="text-orange-500" size={20} />
                <span>HR Admin Notification</span>
                <Badge variant="outline">Method 1</Badge>
              </CardTitle>
              <CardDescription>
                Test the automatic email notification sent to hr@themeetingmatters.com when a new trial request is submitted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What this tests:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Professional HTML email template with company branding</li>
                  <li>• Complete trial request details and contact information</li>
                  <li>• Direct links to admin dashboard for quick action</li>
                  <li>• Immediate notification to HR team about new requests</li>
                </ul>
              </div>
              
              <Button 
                onClick={handleTestTrialNotification}
                disabled={testTrialNotificationMutation.isPending}
                className="w-full"
              >
                {testTrialNotificationMutation.isPending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Sending Test Email...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test HR Notification
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Method 2: Trial Approval Email */}
        <TabsContent value="approval">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="text-green-500" size={20} />
                <span>Trial Approval Email</span>
                <Badge variant="outline">Method 2</Badge>
              </CardTitle>
              <CardDescription>
                Test the approval email sent to customers when their trial request is approved
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Trial Request to Test</Label>
                <div className="grid gap-2 mt-2">
                  {trialRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedRequest?.id === request.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{request.company}</p>
                          <p className="text-sm text-gray-600">{request.name} • {request.planId}</p>
                        </div>
                        <Badge variant={request.status === 'pending' ? 'secondary' : 'outline'}>
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {trialRequests.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No trial requests available. Submit a trial request first to test approval emails.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">What this tests:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Welcome email with trial access details</li>
                  <li>• Login credentials and platform access instructions</li>
                  <li>• Feature overview and getting started guide</li>
                  <li>• Support contact information</li>
                </ul>
              </div>

              <Button 
                onClick={handleTestApproval}
                disabled={testApprovalMutation.isPending || !selectedRequest}
                className="w-full"
              >
                {testApprovalMutation.isPending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Sending Approval Email...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Send Test Approval Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Method 3: Trial Rejection Email */}
        <TabsContent value="rejection">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <XCircle className="text-red-500" size={20} />
                <span>Trial Rejection Email</span>
                <Badge variant="outline">Method 3</Badge>
              </CardTitle>
              <CardDescription>
                Test the rejection email sent to customers when their trial request is declined
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Trial Request to Test</Label>
                <div className="grid gap-2 mt-2">
                  {trialRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedRequest?.id === request.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{request.company}</p>
                          <p className="text-sm text-gray-600">{request.name} • {request.planId}</p>
                        </div>
                        <Badge variant={request.status === 'pending' ? 'secondary' : 'outline'}>
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="customMessage">Custom Rejection Reason</Label>
                <Textarea
                  id="customMessage"
                  placeholder="Enter a custom rejection reason for testing..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to use the default rejection message
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">What this tests:</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• Professional rejection notification</li>
                  <li>• Clear explanation of rejection reason</li>
                  <li>• Alternative contact options for future discussions</li>
                  <li>• Respectful and encouraging tone</li>
                </ul>
              </div>

              <Button 
                onClick={handleTestRejection}
                disabled={testRejectionMutation.isPending || !selectedRequest}
                className="w-full"
                variant="destructive"
              >
                {testRejectionMutation.isPending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Sending Rejection Email...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Send Test Rejection Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="text-purple-500" size={20} />
            <span>Trial Request Notification Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Bell className="mx-auto mb-2 text-orange-500" size={24} />
              <h3 className="font-medium text-orange-900">HR Email Alerts</h3>
              <p className="text-sm text-orange-700 mt-1">
                Instant notifications to hr@themeetingmatters.com
              </p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Eye className="mx-auto mb-2 text-blue-500" size={24} />
              <h3 className="font-medium text-blue-900">Dashboard Badges</h3>
              <p className="text-sm text-blue-700 mt-1">
                Real-time notification badges in sidebar and header
              </p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="mx-auto mb-2 text-green-500" size={24} />
              <h3 className="font-medium text-green-900">Admin Interface</h3>
              <p className="text-sm text-green-700 mt-1">
                Dedicated trial management dashboard at /admin/trial-requests
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}