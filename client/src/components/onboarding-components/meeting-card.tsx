import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Users, Calendar, Clock, MapPin } from 'lucide-react';
import { OnboardingChecklist } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface MeetingCardProps {
  item: OnboardingChecklist;
  onToggleComplete: (id: number, isCompleted: boolean) => void;
}

export function MeetingCard({ item, onToggleComplete }: MeetingCardProps) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState({
    date: '',
    time: '',
    location: '',
    attendees: '',
    notes: ''
  });
  const { toast } = useToast();

  const handleScheduleMeeting = () => {
    if (!meetingDetails.date || !meetingDetails.time) {
      toast({
        title: "Missing Information",
        description: "Please provide date and time for the meeting.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would integrate with calendar systems
    toast({
      title: "Meeting Scheduled",
      description: `Meeting scheduled for ${meetingDetails.date} at ${meetingDetails.time}`,
    });
    
    onToggleComplete(item.id, true);
    setShowScheduleModal(false);
  };

  return (
    <>
      <Card className="border border-amber-200 bg-amber-50/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`mt-1 ${item.isCompleted ? 'text-green-600' : 'text-amber-600'}`}>
                {item.isCompleted ? <CheckCircle className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.itemTitle}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                
                {item.isCompleted ? (
                  <div className="mt-3 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Meeting Completed</span>
                    {item.completedAt && (
                      <span className="text-xs text-gray-500">
                        on {new Date(item.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="flex items-center space-x-4 mb-3 text-sm text-amber-700">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Duration: 30-60 min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>Face-to-face</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowScheduleModal(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Meeting
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <Badge variant={item.isCompleted ? "default" : "secondary"}>
              {item.isCompleted ? "Complete" : "Pending"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="max-w-2xl" aria-describedby="meeting-description">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <p id="meeting-description" className="text-sm text-gray-600 mt-2">
              Schedule this meeting to complete your onboarding requirement.
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-date">Date</Label>
                <Input
                  id="meeting-date"
                  type="date"
                  value={meetingDetails.date}
                  onChange={(e) => setMeetingDetails(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-time">Time</Label>
                <Input
                  id="meeting-time"
                  type="time"
                  value={meetingDetails.time}
                  onChange={(e) => setMeetingDetails(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meeting-location">Location</Label>
              <Input
                id="meeting-location"
                placeholder="Conference room, office, or virtual meeting link"
                value={meetingDetails.location}
                onChange={(e) => setMeetingDetails(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meeting-attendees">Attendees</Label>
              <Input
                id="meeting-attendees"
                placeholder="Manager, HR representative, team members..."
                value={meetingDetails.attendees}
                onChange={(e) => setMeetingDetails(prev => ({ ...prev, attendees: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meeting-notes">Notes (Optional)</Label>
              <Textarea
                id="meeting-notes"
                placeholder="Any specific topics to discuss or preparation needed..."
                value={meetingDetails.notes}
                onChange={(e) => setMeetingDetails(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleMeeting} className="bg-amber-600 hover:bg-amber-700">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule & Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}