import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MessageCircle,
  FileText,
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Task } from '@shared/schema';
import { useState } from 'react';
import { Link } from 'wouter';

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  // Fetch task details
  const { data: task, isLoading } = useQuery<Task & { assignedToUser?: any; assignedByUser?: any }>({
    queryKey: ['/api/tasks', id],
    enabled: !!id,
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Task Not Found</h2>
            <p className="text-gray-600 mb-4">The task you're looking for doesn't exist or has been deleted.</p>
            <Link href="/tasks">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tasks
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canUpdateStatus = user?.role === 'hr_admin' || user?.role === 'branch_manager' || task.assignedTo === user?.id?.toString();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/tasks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Task Details</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(task.status)}>
            {task.status.replace('_', ' ').toUpperCase()}
          </Badge>
          <Badge className={getPriorityColor(task.priority)}>
            {task.priority.toUpperCase()} PRIORITY
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                {task.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {task.description || 'No description provided.'}
                </p>
              </div>
              
              {task.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{task.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {canUpdateStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Task Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {task.status !== 'in_progress' && (
                    <Button
                      onClick={() => updateTaskMutation.mutate('in_progress')}
                      disabled={updateTaskMutation.isPending}
                      variant="outline"
                    >
                      Start Task
                    </Button>
                  )}
                  {task.status !== 'completed' && (
                    <Button
                      onClick={() => updateTaskMutation.mutate('completed')}
                      disabled={updateTaskMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark Complete
                    </Button>
                  )}
                  {task.status !== 'pending' && (
                    <Button
                      onClick={() => updateTaskMutation.mutate('pending')}
                      disabled={updateTaskMutation.isPending}
                      variant="outline"
                    >
                      Reset to Pending
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Comments & Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Add a comment or update..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <Button disabled={!comment.trim()}>
                  Add Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Info */}
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Assigned To</div>
                  <div className="font-medium">
                    {task.assignedToUser ? 
                      `${task.assignedToUser.firstName} ${task.assignedToUser.lastName}` : 
                      'Unassigned'
                    }
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Created By</div>
                  <div className="font-medium">
                    {task.assignedByUser ? 
                      `${task.assignedByUser.firstName} ${task.assignedByUser.lastName}` : 
                      'System'
                    }
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Due Date</div>
                  <div className="font-medium">
                    {task.dueDate ? 
                      new Date(task.dueDate).toLocaleDateString() : 
                      'No due date'
                    }
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="font-medium">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Priority</div>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Information */}
          <Card>
            <CardHeader>
              <CardTitle>Related</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">
                No related items found.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}