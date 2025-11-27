import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { Approval } from '@shared/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PendingApprovalsProps {
  approvals: Approval[];
  isLoading: boolean;
}

export default function PendingApprovals({ approvals, isLoading }: PendingApprovalsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const approveMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      const endpoint = type === 'logistics' ? `/api/logistics/requests/${id}` : `/api/documents/${id}`;
      return await apiRequest('PUT', endpoint, { 
        status: 'approved',
        isApproved: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/approvals'] });
      toast({
        title: "Success",
        description: "Request approved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      const endpoint = type === 'logistics' ? `/api/logistics/requests/${id}` : `/api/documents/${id}`;
      return await apiRequest('PUT', endpoint, { 
        status: 'rejected',
        isApproved: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/approvals'] });
      toast({
        title: "Success",
        description: "Request rejected successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  });

  const handleApprove = (type: string, id: number) => {
    approveMutation.mutate({ type, id });
  };

  const handleReject = (type: string, id: number) => {
    rejectMutation.mutate({ type, id });
  };

  return (
    <Card className="stats-card">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Pending Approvals</CardTitle>
          <Badge className="bg-warning/10 text-warning">
            {approvals.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-6 h-6 bg-gray-200 rounded"></div>
                  <div className="w-6 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : approvals.length > 0 ? (
          <>
            {approvals.map((approval) => (
              <div key={`${approval.type}-${approval.id}`} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-900 font-medium text-sm">{approval.title}</p>
                  <p className="text-gray-500 text-xs">{approval.requester}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleApprove(approval.type, approval.id)}
                    disabled={approveMutation.isPending}
                    className="p-1 text-accent hover:bg-accent/10 rounded"
                  >
                    <Check size={12} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReject(approval.type, approval.id)}
                    disabled={rejectMutation.isPending}
                    className="p-1 text-destructive hover:bg-destructive/10 rounded"
                  >
                    <X size={12} />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button 
              variant="ghost" 
              className="w-full text-primary hover:text-primary/80 text-sm font-medium mt-4 py-2"
            >
              View All Approvals
            </Button>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Check className="mx-auto mb-4 text-gray-400" size={48} />
            <p>No pending approvals</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
