import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TaskRequest {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  justification?: string;
  createdAt: string;
  reviewedAt?: string;
  notes?: string;
}

export default function MyTaskRequests() {
  const { data: taskRequests, isLoading } = useQuery({
    queryKey: ['/api/employee/task-requests'],
    queryFn: async (): Promise<TaskRequest[]> => {
      const response = await fetch('/api/employee/task-requests');
      if (!response.ok) throw new Error('Failed to fetch task requests');
      return await response.json();
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Task Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading task requests...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Task Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {taskRequests && taskRequests.length > 0 ? (
          <div className="space-y-4">
            {taskRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{request.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{request.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(request.status)}
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {request.justification && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Justification:</p>
                    <p className="text-sm text-gray-700">{request.justification}</p>
                  </div>
                )}

                {request.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <p className="text-xs text-gray-500 mb-1">HR Notes:</p>
                    <p className="text-gray-700">{request.notes}</p>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                  <span>
                    Requested {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                  </span>
                  {request.reviewedAt && (
                    <span>
                      Reviewed {formatDistanceToNow(new Date(request.reviewedAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No task requests yet. Click "Request Task from HR" to submit your first request.
          </p>
        )}
      </CardContent>
    </Card>
  );
}