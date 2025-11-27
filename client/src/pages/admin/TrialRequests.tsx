import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle, Building2, User, Mail, Phone, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  approvedBy?: number;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  approvedAt?: string;
  trialStartDate?: string;
  trialEndDate?: string;
  createdUserId?: number;
}

export default function TrialRequests() {
  const [selectedRequest, setSelectedRequest] = useState<TrialRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch trial requests
  const { data: allRequests = [], isLoading } = useQuery<TrialRequest[]>({
    queryKey: ['/api/trial-requests'],
  });

  // Filter requests by status
  const pendingRequests = allRequests.filter((req) => req.status === 'pending');
  const approvedRequests = allRequests.filter((req) => req.status === 'approved');
  const rejectedRequests = allRequests.filter((req) => req.status === 'rejected');

  // Approve trial request mutation
  const approveRequestMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      return await apiRequest('POST', `/api/trial-requests/${id}/approve`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trial-requests'] });
      setIsApprovalDialogOpen(false);
      setApprovalNotes('');
      setSelectedRequest(null);
      toast({
        title: "Trial Approved",
        description: "The trial request has been approved and the user has been notified.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve trial request",
        variant: "destructive",
      });
    },
  });

  // Reject trial request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return await apiRequest('POST', `/api/trial-requests/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trial-requests'] });
      setIsRejectionDialogOpen(false);
      setRejectionReason('');
      setSelectedRequest(null);
      toast({
        title: "Trial Rejected",
        description: "The trial request has been rejected and the user has been notified.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject trial request",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (request: TrialRequest) => {
    setSelectedRequest(request);
    setIsApprovalDialogOpen(true);
  };

  const handleReject = (request: TrialRequest) => {
    setSelectedRequest(request);
    setIsRejectionDialogOpen(true);
  };

  const confirmApproval = () => {
    if (selectedRequest) {
      approveRequestMutation.mutate({
        id: selectedRequest.id,
        notes: approvalNotes
      });
    }
  };

  const confirmRejection = () => {
    if (selectedRequest && rejectionReason.trim()) {
      rejectRequestMutation.mutate({
        id: selectedRequest.id,
        reason: rejectionReason.trim()
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-700 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-700 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-700 border-red-300"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const RequestCard: React.FC<{ request: TrialRequest }> = ({ request }) => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {request.company}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <User className="w-4 h-4" />
              {request.name} - {request.jobTitle}
            </CardDescription>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>{request.email}</span>
            </div>
            {request.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{request.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span>Team Size: {request.teamSize}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{new Date(request.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="secondary">{request.planId} Plan</Badge>
            <Badge variant="outline">{request.billingCycle}</Badge>
          </div>

          {request.notes && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm"><strong>Notes:</strong> {request.notes}</p>
            </div>
          )}

          {request.rejectionReason && (
            <div className="bg-red-50 p-3 rounded-md">
              <p className="text-sm text-red-700"><strong>Rejection Reason:</strong> {request.rejectionReason}</p>
            </div>
          )}

          {request.status === 'approved' && request.trialStartDate && request.trialEndDate && (
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm text-green-700">
                <strong>Trial Period:</strong> {new Date(request.trialStartDate).toLocaleDateString()} - {new Date(request.trialEndDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {request.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => handleApprove(request)}
                className="flex-1"
                disabled={approveRequestMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleReject(request)}
                className="flex-1"
                disabled={rejectRequestMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trial Request Management</h1>
        <p className="text-gray-600 mt-2">
          Review and manage trial requests from potential customers
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Approved ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Rejected ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No pending trial requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-6">
          {approvedRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No approved trial requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {approvedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-6">
          {rejectedRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No rejected trial requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rejectedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Trial Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this trial request for {selectedRequest?.company}?
              This will create a trial account and send approval notification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approval-notes">Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Add any notes about this approval..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmApproval}
              disabled={approveRequestMutation.isPending}
            >
              {approveRequestMutation.isPending ? 'Approving...' : 'Approve Trial'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Trial Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this trial request from {selectedRequest?.company}.
              This will be sent to the requestor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please explain why this trial request is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmRejection}
              disabled={rejectRequestMutation.isPending || !rejectionReason.trim()}
            >
              {rejectRequestMutation.isPending ? 'Rejecting...' : 'Reject Trial'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}