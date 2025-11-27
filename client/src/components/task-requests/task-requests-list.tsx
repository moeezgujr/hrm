import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Clock, FileText, HelpCircle, AlertCircle, Check, X, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface TaskRequest {
  id: number;
  taskId: number;
  requesterId: string;
  requestType: string;
  requestTitle: string;
  requestDescription: string;
  requestedExtension?: number;
  urgencyLevel: string;
  status: string;
  responseMessage?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
  requester: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  task?: {
    id: number;
    title: string;
  } | null;
  responder?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

interface TaskRequestsListProps {
  taskId?: number;
  requesterId?: string;
  showActions?: boolean;
  currentUserId?: string;
}

export function TaskRequestsList({ taskId, requesterId, showActions = false, currentUserId }: TaskRequestsListProps) {
  const [responseMessages, setResponseMessages] = useState<Record<number, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['/api/task-requests', taskId, requesterId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (taskId) params.append('taskId', taskId.toString());
      if (requesterId) params.append('requesterId', requesterId);
      const queryString = params.toString();
      return apiRequest(`/api/task-requests${queryString ? `?${queryString}` : ''}`);
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, responseMessage }: { id: number; status: string; responseMessage?: string }) => {
      return apiRequest('PUT', `/api/task-requests/${id}`, {
        status,
        responseMessage,
        respondedBy: currentUserId,
        respondedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Request updated",
        description: "The request has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/task-requests'] });
      setResponseMessages({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'time_extension':
        return <Clock className="h-4 w-4" />;
      case 'document_request':
        return <FileText className="h-4 w-4" />;
      case 'help_request':
        return <HelpCircle className="h-4 w-4" />;
      case 'clarification':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'time_extension':
        return 'Time Extension';
      case 'document_request':
        return 'Document Request';
      case 'help_request':
        return 'Help Request';
      case 'clarification':
        return 'Clarification';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'in_review':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleApprove = (request: TaskRequest) => {
    const responseMessage = responseMessages[request.id] || '';
    updateRequestMutation.mutate({
      id: request.id,
      status: 'approved',
      responseMessage,
    });
  };

  const handleReject = (request: TaskRequest) => {
    const responseMessage = responseMessages[request.id] || '';
    if (!responseMessage.trim()) {
      toast({
        title: "Response required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }
    updateRequestMutation.mutate({
      id: request.id,
      status: 'rejected',
      responseMessage,
    });
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No requests found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request: TaskRequest) => (
        <Card key={request.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getRequestTypeIcon(request.requestType)}
                <CardTitle className="text-base">{request.requestTitle}</CardTitle>
              </div>
              <div className="flex gap-2">
                <Badge className={getUrgencyColor(request.urgencyLevel)}>
                  {request.urgencyLevel}
                </Badge>
                <Badge className={getStatusColor(request.status)}>
                  {request.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Type: {getRequestTypeLabel(request.requestType)}</span>
              {request.requestedExtension && (
                <span>Extension: {request.requestedExtension} days</span>
              )}
              <span>
                Requested {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
              </span>
            </div>
            {!taskId && request.task && (
              <div className="text-sm text-muted-foreground">
                Task: {request.task.title}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              By: {request.requester?.firstName || 'Unknown'} {request.requester?.lastName || 'User'}
              {request.requester?.email && ` (${request.requester?.email})`}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Description:</p>
                <p className="text-sm text-muted-foreground">{request.requestDescription}</p>
              </div>

              {request.status !== 'pending' && request.responseMessage && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Response:
                    </p>
                    <p className="text-sm text-muted-foreground">{request.responseMessage}</p>
                    {request.responder && (
                      <p className="text-xs text-muted-foreground mt-1">
                        By: {request.responder.firstName} {request.responder.lastName}
                        {request.respondedAt && 
                          ` • ${formatDistanceToNow(new Date(request.respondedAt), { addSuffix: true })}`
                        }
                      </p>
                    )}
                  </div>
                </>
              )}

              {showActions && request.status === 'pending' && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Response Message:</label>
                      <Textarea
                        value={responseMessages[request.id] || ''}
                        onChange={(e) => setResponseMessages(prev => ({
                          ...prev,
                          [request.id]: e.target.value
                        }))}
                        placeholder="Provide feedback or explanation for your decision..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request)}
                        disabled={updateRequestMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(request)}
                        disabled={updateRequestMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}