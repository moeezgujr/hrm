import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Users, Check, X, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import TrialRequestNotifications from '@/components/notifications/TrialRequestNotifications';
import LeaveApprovalNotifications from '@/components/notifications/LeaveApprovalNotifications';

export default function Header() {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch notifications instead of approvals
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['/api/notifications'],
    queryFn: () => fetch('/api/notifications?limit=20').then(res => res.json()),
  });

  const { data: unreadData } = useQuery<{count: number}>({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: () => fetch('/api/notifications/unread-count').then(res => res.json()),
  });

  const unreadCount = unreadData?.count || 0;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest('PUT', `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PUT', '/api/notifications/mark-all-read', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest('DELETE', `/api/notifications/${notificationId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  return (
    <header className="bg-surface shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Welcome back, here's what's happening today</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Trial Request Notifications */}
          <TrialRequestNotifications />
          
          {/* Leave Approval Notifications */}
          <LeaveApprovalNotifications />
          
          {/* General Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowNotifications(false)}
                />
                <Card className="absolute right-0 top-12 w-80 z-20 shadow-lg border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell size={18} />
                      Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-y-auto">
                    {Array.isArray(notifications) && notifications.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm text-gray-500">
                            {unreadCount} unread notifications
                          </span>
                          {unreadCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2"
                              onClick={() => markAllAsReadMutation.mutate()}
                              disabled={markAllAsReadMutation.isPending}
                            >
                              Mark all read
                            </Button>
                          )}
                        </div>
                        {notifications.map((notification: any) => (
                          <div key={notification.id} className={`border rounded-lg p-3 ${!notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-gray-900 flex items-center">
                                  {notification.priority === 'high' && <AlertCircle size={12} className="mr-1 text-red-500" />}
                                  {notification.title}
                                  {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />}
                                </h4>
                                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                  <Clock size={12} />
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3 justify-end">
                              {notification.actionRequired && notification.actionUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setShowNotifications(false);
                                    window.location.href = notification.actionUrl;
                                  }}
                                  className="h-7 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                >
                                  <ExternalLink size={12} className="mr-1" />
                                  View
                                </Button>
                              )}
                              {!notification.isRead ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsReadMutation.mutate(notification.id)}
                                  disabled={markAsReadMutation.isPending}
                                  className="h-7 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                >
                                  <Check size={12} className="mr-1" />
                                  Mark as Read
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                  disabled={deleteNotificationMutation.isPending}
                                  className="h-7 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <X size={12} className="mr-1" />
                                  Dismiss
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Check className="mx-auto mb-4 text-gray-400" size={48} />
                        <p className="text-sm">No notifications</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Users className="text-white" size={16} />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
