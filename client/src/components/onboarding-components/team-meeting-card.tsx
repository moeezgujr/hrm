import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Calendar, MapPin, Video, Users, Clock, Bell } from 'lucide-react';
import { OnboardingChecklist } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TeamMeetingCardProps {
  item: OnboardingChecklist;
  employeeId: number;
  onToggleComplete: (id: number, isCompleted: boolean) => void;
}

export function TeamMeetingCard({ item, employeeId, onToggleComplete }: TeamMeetingCardProps) {
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch team meeting for this employee
  const { data: meeting } = useQuery({
    queryKey: ['/api/team-meetings', 'employee', employeeId],
    enabled: !!employeeId,
  });

  // Fetch meeting notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/meeting-notifications', employeeId],
    enabled: !!employeeId,
  });

  // Confirm attendance
  const confirmAttendanceMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/team-meetings/${meeting?.id}/confirm-attendance`, {
        employeeId
      });
    },
    onSuccess: () => {
      toast({
        title: "Attendance Confirmed",
        description: "Your attendance has been confirmed for the team introduction meeting",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/team-meetings'] });
      onToggleComplete(item.id, true);
    },
    onError: (error: any) => {
      toast({
        title: "Confirmation Failed",
        description: error.message || "Failed to confirm attendance",
        variant: "destructive",
      });
    },
  });

  // Mark notification as read
  const markNotificationRead = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest('PUT', `/api/meeting-notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meeting-notifications'] });
    }
  });

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const unreadNotifications = notifications.filter((n: any) => !n.isRead);

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 hover:border-blue-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              <div className={`mt-1 ${item.isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                {item.isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Calendar className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.itemTitle}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                
                {unreadNotifications.length > 0 && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Bell className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-orange-600 font-medium">
                      {unreadNotifications.length} new notification{unreadNotifications.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {item.isCompleted ? (
                <Badge className="bg-green-100 text-green-800">Completed</Badge>
              ) : (
                <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
              )}
            </div>
          </div>

          {meeting ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-blue-900">{meeting.meetingTitle}</h4>
                <Badge className={getStatusColor(meeting.status)}>
                  {meeting.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    {formatDateTime(meeting.scheduledDate)}
                  </span>
                </div>
                
                {meeting.meetingLocation && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700">{meeting.meetingLocation}</span>
                  </div>
                )}
                
                {meeting.meetingType === 'virtual' && meeting.meetingLink && (
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-blue-600" />
                    <a 
                      href={meeting.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Join Virtual Meeting
                    </a>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    {meeting.attendees?.length || 0} team members invited
                  </span>
                </div>
              </div>

              {meeting.meetingDescription && (
                <p className="text-sm text-blue-700 mt-3 bg-white bg-opacity-60 p-2 rounded">
                  {meeting.meetingDescription}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <h4 className="font-medium text-yellow-900">Meeting Pending</h4>
                  <p className="text-sm text-yellow-700">
                    Your team introduction meeting will be scheduled by HR. You'll receive a notification once it's set up.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notifications List */}
          {notifications.length > 0 && (
            <div className="space-y-2 mb-4">
              <h5 className="text-sm font-medium text-gray-900">Recent Notifications:</h5>
              {notifications.slice(0, 3).map((notification: any) => (
                <div 
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.isRead 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-gray-700">{notification.message}</p>
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markNotificationRead.mutate(notification.id)}
                        className="text-xs px-2 py-1"
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.sentAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={() => setShowMeetingModal(true)}
              variant="outline"
              size="sm"
            >
              <Calendar className="w-4 h-4 mr-2" />
              View Details
            </Button>
            
            {meeting && meeting.status === 'scheduled' && !item.isCompleted && (
              <Button
                onClick={() => confirmAttendanceMutation.mutate()}
                disabled={confirmAttendanceMutation.isPending}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {confirmAttendanceMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Attendance
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Meeting Details Modal */}
      <Dialog open={showMeetingModal} onOpenChange={setShowMeetingModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Team Introduction Meeting Details</DialogTitle>
          </DialogHeader>
          
          {meeting ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Meeting Information</h4>
                  <div className="space-y-2">
                    <p><strong>Title:</strong> {meeting.meetingTitle}</p>
                    <p><strong>Status:</strong> 
                      <Badge className={`ml-2 ${getStatusColor(meeting.status)}`}>
                        {meeting.status}
                      </Badge>
                    </p>
                    <p><strong>Type:</strong> {meeting.meetingType}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Schedule</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{formatDateTime(meeting.scheduledDate)}</span>
                    </div>
                    
                    {meeting.meetingLocation && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{meeting.meetingLocation}</span>
                      </div>
                    )}
                    
                    {meeting.meetingLink && (
                      <div className="flex items-center space-x-2">
                        <Video className="w-4 h-4 text-gray-500" />
                        <a 
                          href={meeting.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          Join Meeting
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {meeting.meetingDescription && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {meeting.meetingDescription}
                  </p>
                </div>
              )}

              {meeting.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Additional Notes</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {meeting.notes}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Attendees</h4>
                <p className="text-sm text-gray-600">
                  {meeting.attendees?.length || 0} team members have been invited to this meeting.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Meeting Not Yet Scheduled</h3>
              <p className="text-gray-600">
                Your team introduction meeting will be scheduled by HR. You'll receive a notification once it's ready.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}