import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, CheckCircle, XCircle, Clock, User, Mail, Briefcase, Building2, Calendar, MessageSquare, Send, Copy, Link2, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RegistrationRequest {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  requestedRole: string;
  requestedDepartment?: string;
  position?: string;
  phoneNumber?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  onboardingStarted: boolean;
  onboardingCompleted: boolean;
  reviewer?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export default function RegistrationApprovalsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequestIds, setSelectedRequestIds] = useState<number[]>([]);
  const [showOnboardingDialog, setShowOnboardingDialog] = useState(false);

  const { data: requests = [], isLoading } = useQuery<RegistrationRequest[]>({
    queryKey: ['/api/registration-requests', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'all' ? '/api/registration-requests' : `/api/registration-requests?status=${statusFilter}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch registration requests');
      return response.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const response = await apiRequest('POST', `/api/registration-requests/${id}/approve`, { notes });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/registration-requests'] });
      toast({
        title: "Request Approved",
        description: `User account created for ${data.user.firstName} ${data.user.lastName}. They can now login with onboarding status.`,
      });
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [generatedLinks, setGeneratedLinks] = useState<Record<number, { link: string; token: string }>>({});
  const [showLinkDialog, setShowLinkDialog] = useState<{ requestId: number; data: any } | null>(null);

  const generateOnboardingLinkMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest('POST', `/api/generate-onboarding-link/${requestId}`, {});
      return response.json();
    },
    onSuccess: (data, requestId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/registration-requests'] });
      setGeneratedLinks(prev => ({
        ...prev,
        [requestId]: { link: data.onboardingLink, token: data.onboardingToken }
      }));
      setShowLinkDialog({ requestId, data });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Generate Onboarding Link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateBulkLinksMutation = useMutation({
    mutationFn: async (requestIds: number[]) => {
      const results = await Promise.all(
        requestIds.map(async (requestId) => {
          try {
            const response = await apiRequest('POST', `/api/generate-onboarding-link/${requestId}`, {});
            const data = await response.json();
            return { requestId, success: true, data };
          } catch (error) {
            return { requestId, success: false, error };
          }
        })
      );
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['/api/registration-requests'] });
      const newLinks = {};
      results.forEach(result => {
        if (result.success) {
          newLinks[result.requestId] = { 
            link: result.data.onboardingLink, 
            token: result.data.onboardingToken 
          };
        }
      });
      setGeneratedLinks(prev => ({ ...prev, ...newLinks }));
      
      const successCount = results.filter(r => r.success).length;
      toast({
        title: "Bulk Links Generated",
        description: `Successfully generated ${successCount} out of ${results.length} onboarding links.`,
      });
      setSelectedRequestIds([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Generate Bulk Links",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const response = await apiRequest('POST', `/api/registration-requests/${id}/reject`, { notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/registration-requests'] });
      toast({
        title: "Request Rejected",
        description: "Registration request has been rejected and the applicant will be notified.",
      });
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleSelection = (requestId: number) => {
    setSelectedRequestIds(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = () => {
    const approvedIds = requests
      .filter(r => r.status === 'approved' && !r.onboardingStarted)
      .map(r => r.id);
    setSelectedRequestIds(prev => 
      prev.length === approvedIds.length ? [] : approvedIds
    );
  };

  const handleApprove = () => {
    if (selectedRequest) {
      approveMutation.mutate({ id: selectedRequest.id, notes: reviewNotes });
    }
  };

  const handleReject = () => {
    if (selectedRequest && reviewNotes.trim()) {
      rejectMutation.mutate({ id: selectedRequest.id, notes: reviewNotes });
    } else {
      toast({
        title: "Notes Required",
        description: "Please provide rejection notes before rejecting a request.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registration Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve new user registration requests
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Users className="w-3 h-3 mr-1" />
            {requests.length} Total Requests
          </Badge>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <Clock className="w-3 h-3 mr-1" />
              {pendingCount} Pending
            </Badge>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status === 'all' ? 'All' : status}
            </Button>
          ))}
        </div>

        {/* Bulk Actions for Approved Employees */}
        {statusFilter === 'approved' && selectedRequestIds.length > 0 && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {selectedRequestIds.length} selected
            </Badge>
            <Button
              size="sm"
              onClick={() => generateBulkLinksMutation.mutate(selectedRequestIds)}
              disabled={generateBulkLinksMutation.isPending}
            >
              <Link2 className="w-4 h-4 mr-1" />
              Generate All Links ({selectedRequestIds.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedRequestIds([])}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Select All for Approved */}
      {statusFilter === 'approved' && (
        <div className="flex justify-between items-center py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            {selectedRequestIds.length > 0 ? 'Deselect All' : 'Select All Pending Onboarding'}
          </Button>
        </div>
      )}

      {/* Registration Requests */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No {statusFilter} registration requests found.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {request.firstName} {request.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">@{request.username}</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{request.email}</span>
                      </div>
                      {request.position && (
                        <div className="flex items-center space-x-2">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <span>{request.position}</span>
                        </div>
                      )}
                      {request.requestedDepartment && (
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span>{request.requestedDepartment}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Submitted {format(new Date(request.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {request.requestedRole}
                        </Badge>
                      </div>
                    </div>

                    {request.status !== 'pending' && request.reviewNotes && (
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Review Notes:</p>
                            <p className="text-sm text-muted-foreground">{request.reviewNotes}</p>
                            {request.reviewer && request.reviewedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                By {request.reviewer.firstName} {request.reviewer.lastName} on{' '}
                                {format(new Date(request.reviewedAt), 'MMM d, yyyy h:mm a')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {request.status === 'approved' && !request.onboardingStarted && (
                      <>
                        <Checkbox
                          checked={selectedRequestIds.includes(request.id)}
                          onCheckedChange={() => handleToggleSelection(request.id)}
                        />
                        {generatedLinks[request.id] ? (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(generatedLinks[request.id].link);
                                toast({ title: "Link Copied", description: "Onboarding link copied to clipboard" });
                              }}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy Link
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowLinkDialog({ requestId: request.id, data: { onboardingLink: generatedLinks[request.id].link, employeeName: `${request.firstName} ${request.lastName}`, employeeEmail: request.email } })}
                            >
                              <Link2 className="w-4 h-4 mr-1" />
                              View Link
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateOnboardingLinkMutation.mutate(request.id)}
                            disabled={generateOnboardingLinkMutation.isPending}
                          >
                            <Link2 className="w-4 h-4 mr-1" />
                            Generate Link
                          </Button>
                        )}
                      </>
                    )}
                    {request.status === 'approved' && request.onboardingStarted && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <UserPlus className="w-3 h-3 mr-1" />
                        Onboarding Started
                      </Badge>
                    )}
                    {request.status === 'pending' && (
                        <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setReviewNotes("");
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Review Registration Request</DialogTitle>
                          </DialogHeader>
                          
                          {selectedRequest && (
                            <div className="space-y-4">
                              <div className="bg-muted p-4 rounded-lg">
                                <h4 className="font-medium mb-2">Applicant Details:</h4>
                                <div className="space-y-2 text-sm">
                                  <p><strong>Name:</strong> {selectedRequest.firstName} {selectedRequest.lastName}</p>
                                  <p><strong>Email:</strong> {selectedRequest.email}</p>
                                  <p><strong>Username:</strong> {selectedRequest.username}</p>
                                  <p><strong>Position:</strong> {selectedRequest.position || 'Not specified'}</p>
                                  <p><strong>Requested Role:</strong> {selectedRequest.requestedRole}</p>
                                  <p><strong>Department:</strong> {selectedRequest.requestedDepartment || 'Not specified'}</p>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Review Notes (optional for approval, required for rejection):
                                </label>
                                <Textarea
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  placeholder="Add any notes about this approval/rejection..."
                                  className="min-h-[80px]"
                                />
                              </div>
                            </div>
                          )}

                          <DialogFooter className="space-x-2">
                            <Button
                              variant="outline"
                              onClick={handleReject}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                            </Button>
                            <Button
                              onClick={handleApprove}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {approveMutation.isPending ? "Approving..." : "Approve"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                        </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Onboarding Link Display Dialog */}
      {showLinkDialog && (
        <Dialog open={!!showLinkDialog} onOpenChange={() => setShowLinkDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Onboarding Link Generated</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-900">Link Successfully Generated</h4>
                </div>
                <p className="text-sm text-green-700">
                  Onboarding link created for <strong>{showLinkDialog.data.employeeName}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Employee Details:</label>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p><strong>Name:</strong> {showLinkDialog.data.employeeName}</p>
                  <p><strong>Email:</strong> {showLinkDialog.data.employeeEmail}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Onboarding Link:</label>
                <div className="flex space-x-2">
                  <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                    {showLinkDialog.data.onboardingLink}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(showLinkDialog.data.onboardingLink);
                      toast({
                        title: "Link Copied",
                        description: "Onboarding link copied to clipboard"
                      });
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">How to Send:</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Copy the link above and send it to the employee via email or your preferred communication method. 
                      The employee will use this link to access their onboarding portal and complete all required tasks.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLinkDialog(null)}>
                Close
              </Button>
              <Button onClick={() => {
                navigator.clipboard.writeText(showLinkDialog.data.onboardingLink);
                toast({
                  title: "Link Copied",
                  description: "Onboarding link copied to clipboard"
                });
                setShowLinkDialog(null);
              }}>
                <Copy className="w-4 h-4 mr-2" />
                Copy & Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}