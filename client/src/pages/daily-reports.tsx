import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Mail, Send, Calendar, Clock } from 'lucide-react';

export default function DailyReports() {
  const { toast } = useToast();
  const [email, setEmail] = useState('its.shahzad67@gmail.com');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Get all projects for individual reports
  const { data: projects = [], isLoading: projectsLoading } = useQuery<any[]>({
    queryKey: ['/api/projects']
  });

  // Send daily reports for all projects
  const sendAllReportsMutation = useMutation({
    mutationFn: async ({ toEmail, date }: { toEmail: string; date: string }) => {
      const response = await apiRequest('POST', '/api/reports/daily/email', {
        toEmail,
        date
      });
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Reports Sent Successfully",
        description: `${data.emailsSent || 0} project reports sent to ${email}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Reports",
        description: error.message || "Failed to send daily reports",
        variant: "destructive",
      });
    },
  });

  // Send individual project report
  const sendProjectReportMutation = useMutation({
    mutationFn: async ({ projectId, toEmail, date }: { projectId: number; toEmail: string; date: string }) => {
      const response = await apiRequest('POST', `/api/projects/${projectId}/report/email`, {
        toEmail,
        date
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Report Sent Successfully",
        description: `Project report sent to ${email}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Report",
        description: error.message || "Failed to send project report",
        variant: "destructive",
      });
    },
  });

  // Automated daily scheduler
  const scheduleDailyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/reports/daily/schedule', {});
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Automated Reports Sent",
        description: `${data.emailsSent || 0} reports sent to ${data.recipientEmail || 'email recipient'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Automated Reports",
        description: error.message || "Failed to send automated reports",
        variant: "destructive",
      });
    },
  });

  const handleSendAllReports = () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    sendAllReportsMutation.mutate({ toEmail: email, date });
  };

  const handleSendProjectReport = (projectId: number) => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    sendProjectReportMutation.mutate({ projectId, toEmail: email, date });
  };

  const handleScheduleDaily = () => {
    scheduleDailyMutation.mutate();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Daily Project Reports</h1>
        <p className="text-muted-foreground">
          Send automated daily project activity reports via email
        </p>
      </div>

      <div className="grid gap-6">
        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Configure email settings for daily project reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter recipient email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Report Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Automated Daily Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Automated Daily Reports
            </CardTitle>
            <CardDescription>
              Send today's reports to its.shahzad67@gmail.com (only projects with activity)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleScheduleDaily}
              disabled={scheduleDailyMutation.isPending}
              className="w-full"
            >
              {scheduleDailyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Today's Automated Reports
            </Button>
          </CardContent>
        </Card>

        {/* Send All Project Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send All Project Reports
            </CardTitle>
            <CardDescription>
              Send daily reports for all projects with activity to the specified email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSendAllReports}
              disabled={sendAllReportsMutation.isPending}
              className="w-full"
            >
              {sendAllReportsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send All Daily Reports
            </Button>
          </CardContent>
        </Card>

        {/* Individual Project Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Individual Project Reports
            </CardTitle>
            <CardDescription>
              Send daily report for a specific project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading projects...</span>
              </div>
            ) : projects.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No projects found</p>
            ) : (
              <div className="space-y-3">
                {projects.map((project: any) => (
                  <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {project.description || 'No description'}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleSendProjectReport(project.id)}
                      disabled={sendProjectReportMutation.isPending}
                      size="sm"
                    >
                      {sendProjectReportMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">📧 Daily Project Reports Include:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Tasks created, completed, and updated for the day</li>
                  <li>Team communication and chat messages</li>
                  <li>Files and documents uploaded</li>
                  <li>Project notes and updates</li>
                  <li>Activity statistics and member attribution</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">🔄 Automated Reports:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Automatically sent to its.shahzad67@gmail.com</li>
                  <li>Only includes projects with daily activity</li>
                  <li>Professional HTML email formatting</li>
                  <li>Can be triggered manually or scheduled</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">⚡ Email System:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Uses existing Gmail SMTP configuration</li>
                  <li>Sends from meetingmatters786@gmail.com</li>
                  <li>Professional templates with company branding</li>
                  <li>Fallback to development email for testing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}