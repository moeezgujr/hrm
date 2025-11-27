import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Video, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { OnboardingChecklist } from '@shared/schema';

interface MeetingContentProps {
  item: OnboardingChecklist | null;
  onComplete: () => void;
}

export function MeetingContent({ item, onComplete }: MeetingContentProps) {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [meetingType, setMeetingType] = useState<'in-person' | 'virtual'>('virtual');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState('');

  const availableTimeSlots = [
    { id: '1', date: 'Today', time: '2:00 PM - 2:30 PM', available: true },
    { id: '2', date: 'Today', time: '3:00 PM - 3:30 PM', available: false },
    { id: '3', date: 'Tomorrow', time: '9:00 AM - 9:30 PM', available: true },
    { id: '4', date: 'Tomorrow', time: '11:00 AM - 11:30 AM', available: true },
    { id: '5', date: 'Tomorrow', time: '2:00 PM - 2:30 PM', available: true },
    { id: '6', date: 'Day After', time: '10:00 AM - 10:30 AM', available: true },
    { id: '7', date: 'Day After', time: '1:00 PM - 1:30 PM', available: true },
    { id: '8', date: 'Day After', time: '4:00 PM - 4:30 PM', available: true },
  ];

  const meetingAgenda = [
    'Welcome and introductions',
    'Review role expectations and responsibilities',
    'Discuss team structure and reporting lines',
    'Overview of current projects and priorities',
    'Address any questions or concerns',
    'Set goals for the first 30/60/90 days',
    'Next steps and follow-up actions'
  ];

  const handleScheduleMeeting = () => {
    if (selectedTimeSlot && meetingType) {
      setIsScheduled(true);
    }
  };

  const handleCompleteMeeting = () => {
    if (meetingNotes.trim()) {
      onComplete();
    }
  };

  if (isScheduled) {
    return (
      <div className="space-y-6">
        {/* Meeting Scheduled Confirmation */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">Meeting Scheduled Successfully!</h3>
            </div>
            <div className="space-y-2 text-green-700">
              <p><strong>Time:</strong> {availableTimeSlots.find(slot => slot.id === selectedTimeSlot)?.date} at {availableTimeSlots.find(slot => slot.id === selectedTimeSlot)?.time}</p>
              <p><strong>Type:</strong> {meetingType === 'virtual' ? 'Virtual Meeting (Teams/Zoom)' : 'In-Person Meeting'}</p>
              <p><strong>Duration:</strong> 30 minutes</p>
              <p><strong>Organizer:</strong> HR Team / Direct Manager</p>
            </div>
          </CardContent>
        </Card>

        {/* Meeting Agenda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Meeting Agenda</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {meetingAgenda.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pre-Meeting Information */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <AlertCircle className="w-5 h-5" />
              <span>Before Your Meeting</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-blue-700">
              <div className="flex items-start space-x-2">
                <span className="font-medium">📝</span>
                <span>Prepare any questions about your role, team, or company policies</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">💻</span>
                <span>Test your camera/microphone if attending virtually</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">📋</span>
                <span>Review your job description and any materials sent by HR</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">🎯</span>
                <span>Think about your goals and expectations for the first few months</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Post-Meeting Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Meeting Notes & Follow-up</CardTitle>
            <p className="text-sm text-gray-600">
              After your meeting, please add notes about key discussion points and next steps.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="meeting-notes">Meeting Summary & Key Points</Label>
                <Textarea
                  id="meeting-notes"
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="Summarize the key points discussed, any action items assigned, and your overall impressions..."
                  className="mt-2 h-32"
                />
              </div>
              
              <Button
                onClick={handleCompleteMeeting}
                disabled={!meetingNotes.trim()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Meeting Requirements
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Meeting Overview */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-800">
            <User className="w-5 h-5" />
            <span>Schedule Your Onboarding Meeting</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-purple-700">
            This meeting is an important part of your onboarding process. You'll meet with your direct manager 
            and/or HR representative to discuss your role, answer questions, and set expectations for your first few months.
          </p>
        </CardContent>
      </Card>

      {/* Meeting Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Meeting Type</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    meetingType === 'virtual' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setMeetingType('virtual')}
                >
                  <Video className="w-6 h-6 mb-2 text-purple-600" />
                  <h4 className="font-medium">Virtual Meeting</h4>
                  <p className="text-sm text-gray-600">Teams/Zoom call</p>
                </div>
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    meetingType === 'in-person' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setMeetingType('in-person')}
                >
                  <MapPin className="w-6 h-6 mb-2 text-purple-600" />
                  <h4 className="font-medium">In-Person Meeting</h4>
                  <p className="text-sm text-gray-600">Office conference room</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Slot Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Available Time Slots</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableTimeSlots.map((slot) => (
              <div
                key={slot.id}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  !slot.available 
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                    : selectedTimeSlot === slot.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => slot.available && setSelectedTimeSlot(slot.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{slot.date}</p>
                    <p className="text-sm text-gray-600">{slot.time}</p>
                  </div>
                  <Badge variant={slot.available ? "secondary" : "outline"}>
                    {slot.available ? "Available" : "Booked"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Special Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Special Requests or Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="special-requests">Additional Notes (Optional)</Label>
              <Textarea
                id="special-requests"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Any specific topics you'd like to discuss, accessibility needs, or other requests..."
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Button */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <Calendar className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">Ready to Schedule</h3>
          <p className="text-green-700 mb-4">
            {selectedTimeSlot && meetingType 
              ? "Review your selections and confirm your meeting booking."
              : "Please select a time slot and meeting type to continue."
            }
          </p>
          <Button
            onClick={handleScheduleMeeting}
            disabled={!selectedTimeSlot || !meetingType}
            className="bg-green-600 hover:bg-green-700"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Meeting
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}