import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, XCircle, Clock, AlertTriangle, Sparkles } from 'lucide-react';

interface ApprovalWorkflow {
  id: number;
  itemTitle: string;
  itemType: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  priority: string;
  dueDate: string | null;
  context: string | null;
  requester: number;
  currentApprover: number | null;
  approvedBy: number | null;
  rejectedBy: number | null;
  rejectionReason: string | null;
  revisionNotes: string | null;
  createdAt: string;
}

export function ApprovalWorkflowsTab() {
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalWorkflow | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [formData, setFormData] = useState({
    itemTitle: '',
    itemType: 'content',
    priority: 'medium',
    dueDate: '',
    context: '',
    currentApprover: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all approval workflows
  const { data: approvals = [], isLoading } = useQuery<ApprovalWorkflow[]>({
    queryKey: ['/api/studio/approvals'],
  });

  // Fetch users for approver selection
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  // Calculate counts
  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const approvedCount = approvals.filter(a => a.status === 'approved').length;
  const rejectedCount = approvals.filter(a => a.status === 'rejected').length;
  const needsRevisionCount = approvals.filter(a => a.status === 'needs_revision').length;

  // Create approval mutation
  const createApprovalMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        currentApprover: data.currentApprover ? parseInt(data.currentApprover) : null,
        dueDate: data.dueDate || null
      };
      return await apiRequest('POST', '/api/studio/approvals', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/approvals'] });
      toast({ title: 'Approval request created successfully' });
      setCreateDialogOpen(false);
      setFormData({
        itemTitle: '',
        itemType: 'content',
        priority: 'medium',
        dueDate: '',
        context: '',
        currentApprover: ''
      });
    },
    onError: () => {
      toast({ title: 'Failed to create approval request', variant: 'destructive' });
    }
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('POST', `/api/studio/approvals/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/approvals'] });
      toast({ title: 'Approval submitted successfully', description: 'The item has been approved' });
      setApprovalDialogOpen(false);
      setSelectedApproval(null);
    },
    onError: () => {
      toast({ title: 'Failed to approve', variant: 'destructive' });
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return await apiRequest('POST', `/api/studio/approvals/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/approvals'] });
      toast({ title: 'Rejection submitted', description: 'The item has been rejected' });
      setRejectDialogOpen(false);
      setSelectedApproval(null);
      setRejectionReason('');
    },
    onError: () => {
      toast({ title: 'Failed to reject', variant: 'destructive' });
    }
  });

  const handleApprove = (approval: ApprovalWorkflow) => {
    setSelectedApproval(approval);
    setApprovalDialogOpen(true);
  };

  const handleReject = (approval: ApprovalWorkflow) => {
    setSelectedApproval(approval);
    setRejectDialogOpen(true);
  };

  const handleSubmitApproval = () => {
    if (selectedApproval) {
      approveMutation.mutate(selectedApproval.id);
    }
  };

  const handleSubmitRejection = () => {
    if (selectedApproval && rejectionReason.trim()) {
      rejectMutation.mutate({ id: selectedApproval.id, reason: rejectionReason });
    } else {
      toast({ title: 'Please provide a rejection reason', variant: 'destructive' });
    }
  };

  const handleCreateApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemTitle.trim()) {
      toast({ title: 'Please provide an item title', variant: 'destructive' });
      return;
    }
    createApprovalMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'needs_revision': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'needs_revision': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            Approval Workflows
          </h2>
          <p className="text-gray-600 mt-1">Review and approve content before publishing</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
          onClick={() => setCreateDialogOpen(true)}
          data-testid="button-new-approval-request"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          New Approval Request
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending', count: pendingCount, color: 'yellow' },
          { label: 'Approved', count: approvedCount, color: 'green' },
          { label: 'Rejected', count: rejectedCount, color: 'red' },
          { label: 'Needs Revision', count: needsRevisionCount, color: 'orange' }
        ].map(({ label, count, color }) => (
          <Card key={label} className={`border-${color}-200`} data-testid={`card-status-${label.toLowerCase().replace(' ', '-')}`}>
            <CardContent className="p-4">
              <div className="text-center">
                <p className={`text-3xl font-bold text-${color}-600`} data-testid={`count-${label.toLowerCase().replace(' ', '-')}`}>
                  {count}
                </p>
                <p className="text-sm text-gray-600">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Approvals List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading approvals...</p>
            </div>
          ) : approvals.filter(a => a.status === 'pending').length > 0 ? (
            <div className="space-y-4">
              {approvals.filter(a => a.status === 'pending').map((approval) => (
                <Card key={approval.id} className="border-yellow-200" data-testid={`approval-item-${approval.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(approval.status)}
                          <h3 className="font-semibold" data-testid={`approval-title-${approval.id}`}>
                            {approval.itemTitle}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full bg-${getStatusColor(approval.priority)}-100 text-${getStatusColor(approval.priority)}-700`}>
                            {approval.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Type: {approval.itemType}</p>
                        {approval.context && (
                          <p className="text-sm text-gray-500 line-clamp-2">{approval.context}</p>
                        )}
                        {approval.dueDate && (
                          <p className="text-xs text-gray-500 mt-2">
                            Due: {new Date(approval.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-600 hover:bg-green-50"
                          onClick={() => handleApprove(approval)}
                          data-testid={`button-approve-${approval.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => handleReject(approval)}
                          data-testid={`button-reject-${approval.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
              <p className="font-semibold mb-2">No pending approvals</p>
              <p className="text-sm">All caught up! No items require your approval</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Approval Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Create Approval Request
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateApproval}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="item-title">Item Title *</Label>
                <Input
                  id="item-title"
                  value={formData.itemTitle}
                  onChange={(e) => setFormData({ ...formData, itemTitle: e.target.value })}
                  placeholder="Enter item title"
                  required
                  data-testid="input-approval-title"
                />
              </div>
              <div>
                <Label htmlFor="item-type">Item Type</Label>
                <Select value={formData.itemType} onValueChange={(value) => setFormData({ ...formData, itemType: value })}>
                  <SelectTrigger id="item-type" data-testid="select-approval-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="campaign">Campaign</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="creative_brief">Creative Brief</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger id="priority" data-testid="select-approval-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="due-date">Due Date</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  data-testid="input-approval-due-date"
                />
              </div>
              <div>
                <Label htmlFor="approver">Assign to Approver</Label>
                <Select value={formData.currentApprover} onValueChange={(value) => setFormData({ ...formData, currentApprover: value })}>
                  <SelectTrigger id="approver" data-testid="select-approval-approver">
                    <SelectValue placeholder="Select an approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="context">Context / Description</Label>
                <Textarea
                  id="context"
                  value={formData.context}
                  onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                  placeholder="Provide additional context"
                  rows={4}
                  data-testid="textarea-approval-context"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-yellow-600 to-orange-600"
                disabled={createApprovalMutation.isPending}
                data-testid="button-submit-approval"
              >
                {createApprovalMutation.isPending ? 'Creating...' : 'Create Approval Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Approval</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to approve "{selectedApproval?.itemTitle}"?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSubmitApproval}
              disabled={approveMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Approval</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Please provide a reason for rejecting "{selectedApproval?.itemTitle}":</p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              data-testid="textarea-rejection-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleSubmitRejection}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
