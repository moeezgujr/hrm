import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, Users, Clock, MapPin, Video, Plus, Edit, 
  Trash2, Bell, CheckCircle, UserPlus, Send
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

const meetingSchema = z.object({
  employeeId: z.number().min(1, 'Please select an employee'),
  meetingTitle: z.string().min(5, 'Meeting title must be at least 5 characters'),
  meetingDescription: z.string().optional(),
  scheduledDate: z.string().min(1, 'Please select a date and time'),
  meetingLocation: z.string().optional(),
  meetingType: z.enum(['in_person', 'virtual', 'hybrid']),
  meetingLink: z.string().optional(),
  attendees: z.array(z.number()).min(1, 'Please select at least one team member'),
  notes: z.string().optional()
});

type MeetingData = z.infer<typeof meetingSchema>;

export default function TeamMeetings() {
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<any>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch meetings
  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['/api/team-meetings'],
  });

  // Fetch employees for selection
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Fetch team members/users for attendee selection
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  const meetingForm = useForm<MeetingData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      employeeId: 0,
      meetingTitle: 'Team Introduction Meeting',
      meetingDescription: '',
      scheduledDate: '',
      meetingLocation: '',
      meetingType: 'in_person',
      meetingLink: '',
      attendees: [],
      notes: ''
    }
  });

  // Create/Update meeting
  const createMeetingMutation = useMutation({
    mutationFn: async (data: MeetingData) => {
      if (editingMeeting) {
        return await apiRequest('PUT', `/api/team-meetings/${editingMeeting.id}`, data);
      }
      return await apiRequest('POST', '/api/team-meetings', data);
    },
    onSuccess: () => {
      toast({
        title: "Meeting Scheduled",
        description: editingMeeting 
          ? "Meeting updated and notifications sent to team members"
          : "Team introduction meeting scheduled and notifications sent to all attendees",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/team-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setShowMeetingModal(false);
      setEditingMeeting(null);
      setSelectedEmployees([]);
      meetingForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Scheduling Failed",
        description: error.message || "Failed to schedule meeting",
        variant: "destructive",
      });
    },
  });

  // Delete meeting
  const deleteMeetingMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/team-meetings/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Meeting Cancelled",
        description: "Meeting cancelled and notifications sent to all attendees",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/team-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel meeting",
        variant: "destructive",
      });
    },
  });

  // Mark meeting as completed
  const completeMeetingMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('PUT', `/api/team-meetings/${id}/complete`);
    },
    onSuccess: () => {
      toast({
        title: "Meeting Completed",
        description: "Meeting marked as completed in the system",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/team-meetings'] });
    },
  });

  const handleEditMeeting = (meeting: any) => {
    setEditingMeeting(meeting);
    setSelectedEmployees(meeting.attendees || []);
    meetingForm.reset({
      employeeId: meeting.employeeId,
      meetingTitle: meeting.meetingTitle,
      meetingDescription: meeting.meetingDescription || '',
      scheduledDate: new Date(meeting.scheduledDate).toISOString().slice(0, 16),
      meetingLocation: meeting.meetingLocation || '',
      meetingType: meeting.meetingType,
      meetingLink: meeting.meetingLink || '',
      attendees: meeting.attendees || [],
      notes: meeting.notes || ''
    });
    setShowMeetingModal(true);
  };

  const handleDeleteMeeting = (meeting: any) => {
    if (window.confirm(`Are you sure you want to cancel "${meeting.meetingTitle}"? This will notify all attendees.`)) {
      deleteMeetingMutation.mutate(meeting.id);
    }
  };

  const handleAttendeeToggle = (userId: number) => {
    setSelectedEmployees(prev => {
      const updated = prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      meetingForm.setValue('attendees', updated);
      return updated;
    });
  };

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

  const getMeetingStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Introduction Meetings</h1>
          <p className="text-gray-600">Schedule and manage team introduction meetings for new employees</p>
        </div>
        <Button onClick={() => setShowMeetingModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      {/* Meetings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meetings.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Meetings Scheduled</h3>
              <p className="text-gray-600 text-center mb-4">
                Schedule your first team introduction meeting to get started.
              </p>
              <Button onClick={() => setShowMeetingModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
            </CardContent>
          </Card>
        ) : (
          meetings.map((meeting: any) => (
            <Card key={meeting.id} className="border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-medium text-gray-900">
                      {meeting.meetingTitle}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      For: {meeting.employee?.firstName} {meeting.employee?.lastName}
                    </p>
                  </div>
                  <Badge className={getMeetingStatusColor(meeting.status)}>
                    {meeting.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {formatDateTime(meeting.scheduledDate)}
                    </span>
                  </div>
                  
                  {meeting.meetingLocation && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{meeting.meetingLocation}</span>
                    </div>
                  )}
                  
                  {meeting.meetingType === 'virtual' && meeting.meetingLink && (
                    <div className="flex items-center space-x-2">
                      <Video className="w-4 h-4 text-gray-500" />
                      <a 
                        href={meeting.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Join Meeting
                      </a>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {meeting.attendees?.length || 0} attendees
                    </span>
                  </div>
                </div>

                {meeting.meetingDescription && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {meeting.meetingDescription}
                  </p>
                )}

                <div className="flex space-x-2">
                  {meeting.status === 'scheduled' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditMeeting(meeting)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => completeMeetingMutation.mutate(meeting.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteMeeting(meeting)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Schedule Meeting Modal */}
      <Dialog open={showMeetingModal} onOpenChange={setShowMeetingModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMeeting ? 'Edit Team Introduction Meeting' : 'Schedule Team Introduction Meeting'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...meetingForm}>
            <form onSubmit={meetingForm.handleSubmit((data) => createMeetingMutation.mutate(data))} className="space-y-4">
              <FormField
                control={meetingForm.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Employee</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee for introduction meeting" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.firstName} {emp.lastName} - {emp.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={meetingForm.control}
                name="meetingTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Team Introduction Meeting" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={meetingForm.control}
                name="meetingDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the meeting agenda and objectives..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={meetingForm.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          min={new Date().toISOString().slice(0, 16)}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={meetingForm.control}
                  name="meetingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select meeting type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="in_person">In Person</SelectItem>
                          <SelectItem value="virtual">Virtual</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={meetingForm.control}
                name="meetingLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Conference Room A, Building 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={meetingForm.control}
                name="meetingLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Link (for virtual/hybrid meetings)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://zoom.us/j/..." 
                        type="url"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label className="text-sm font-medium">Team Members to Invite</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-3">
                  {teamMembers.map((member: any) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`attendee-${member.id}`}
                        checked={selectedEmployees.includes(member.id)}
                        onCheckedChange={() => handleAttendeeToggle(member.id)}
                      />
                      <Label 
                        htmlFor={`attendee-${member.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {member.firstName} {member.lastName} ({member.role})
                      </Label>
                    </div>
                  ))}
                </div>
                {meetingForm.formState.errors.attendees && (
                  <p className="text-sm text-red-600 mt-1">
                    {meetingForm.formState.errors.attendees.message}
                  </p>
                )}
              </div>
              
              <FormField
                control={meetingForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional information or preparation instructions..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowMeetingModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMeetingMutation.isPending}>
                  {createMeetingMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {editingMeeting ? 'Update' : 'Schedule'} Meeting
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}