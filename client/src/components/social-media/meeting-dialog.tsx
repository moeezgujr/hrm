import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Plus, List, Trash2, Sparkles } from 'lucide-react';
import { PostMeetingOutcomesTab } from './PostMeetingOutcomesTab';

type MeetingFormData = {
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  location: string;
  meetingLink: string;
  meetingType: string;
  attendees: number[];
  isRecurring: boolean;
  recurrencePattern: string;
  recurrenceInterval: number;
  recurrenceEndDate: string;
  recurrenceCount: number;
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
  previousWeekAccomplishments: string;
  nextWeekPlans: string;
  keyDiscussionPoints: string;
  meetingSummary: string;
  challenges: string;
  solutions: string;
  teamFeedback: string;
  presentationNotes: string;
};

interface MeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingFormData: MeetingFormData;
  setMeetingFormData: (data: MeetingFormData | ((prev: MeetingFormData) => MeetingFormData)) => void;
  agendaItems: Array<{ id: string; content: string; duration: number }>;
  setAgendaItems: (items: Array<{ id: string; content: string; duration: number }> | ((prev: Array<{ id: string; content: string; duration: number }>) => Array<{ id: string; content: string; duration: number }>)) => void;
  onSubmit: (e: React.FormEvent) => void;
  users: any[];
  usersLoading: boolean;
  isPending: boolean;
  editingMeetingId?: number | null;
}

export function MeetingDialog({
  open,
  onOpenChange,
  meetingFormData,
  setMeetingFormData,
  agendaItems,
  setAgendaItems,
  onSubmit,
  users,
  usersLoading,
  isPending,
  editingMeetingId,
}: MeetingDialogProps) {
  const isEditing = !!editingMeetingId;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            {isEditing ? 'Edit Professional Meeting' : 'Schedule Professional Meeting'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isEditing 
              ? 'Update meeting details, schedule, agenda, and presentation materials' 
              : 'Create a comprehensive meeting with full scheduling, agenda, and presentation capabilities'}
          </p>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className={`grid w-full ${isEditing ? 'grid-cols-6' : 'grid-cols-5'}`}>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="schedule">Schedule & Recurring</TabsTrigger>
              <TabsTrigger value="attendees">Attendees</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="presentation">CEO Presentation</TabsTrigger>
              {isEditing && <TabsTrigger value="outcomes">Post-Meeting</TabsTrigger>}
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="meeting-title">Meeting Title *</Label>
                <Input
                  id="meeting-title"
                  value={meetingFormData.title}
                  onChange={(e) => setMeetingFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Weekly Content Review"
                  data-testid="meeting-title-input"
                  required
                />
              </div>

              <div>
                <Label htmlFor="meeting-description">Description</Label>
                <Textarea
                  id="meeting-description"
                  value={meetingFormData.description}
                  onChange={(e) => setMeetingFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the meeting agenda"
                  className="h-20"
                  data-testid="meeting-description-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="meeting-datetime">Scheduled Date & Time *</Label>
                  <Input
                    id="meeting-datetime"
                    type="datetime-local"
                    value={meetingFormData.scheduledAt}
                    onChange={(e) => setMeetingFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    data-testid="meeting-datetime-input"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="meeting-duration">Duration (minutes)</Label>
                  <Input
                    id="meeting-duration"
                    type="number"
                    value={meetingFormData.duration}
                    onChange={(e) => setMeetingFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    placeholder="60"
                    min="15"
                    step="15"
                    data-testid="meeting-duration-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="meeting-type">Meeting Type</Label>
                <Select
                  value={meetingFormData.meetingType}
                  onValueChange={(value) => setMeetingFormData(prev => ({ ...prev, meetingType: value }))}
                >
                  <SelectTrigger data-testid="meeting-type-select">
                    <SelectValue placeholder="Select meeting type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team_sync">Team Sync</SelectItem>
                    <SelectItem value="creative_review">Creative Review</SelectItem>
                    <SelectItem value="client_meeting">Client Meeting</SelectItem>
                    <SelectItem value="brainstorm">Brainstorming Session</SelectItem>
                    <SelectItem value="standup">Daily Standup</SelectItem>
                    <SelectItem value="retrospective">Retrospective</SelectItem>
                    <SelectItem value="planning">Planning Meeting</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="meeting-location">Physical Location</Label>
                  <Input
                    id="meeting-location"
                    value={meetingFormData.location}
                    onChange={(e) => setMeetingFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Conference Room A"
                    data-testid="meeting-location-input"
                  />
                </div>
                <div>
                  <Label htmlFor="meeting-link">Video Conference Link</Label>
                  <Input
                    id="meeting-link"
                    value={meetingFormData.meetingLink}
                    onChange={(e) => setMeetingFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                    placeholder="https://meet.google.com/xxx"
                    data-testid="meeting-link-input"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Schedule & Recurring Tab */}
            <TabsContent value="schedule" className="space-y-4 mt-4">
              {/* Recurring Meeting Toggle */}
              <div className="flex items-center space-x-2 p-4 bg-slate-50 rounded-lg">
                <input
                  type="checkbox"
                  id="is-recurring"
                  checked={meetingFormData.isRecurring}
                  onChange={(e) => setMeetingFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="h-4 w-4"
                  data-testid="is-recurring-checkbox"
                />
                <div className="flex-1">
                  <Label htmlFor="is-recurring" className="font-medium cursor-pointer">
                    Make this a recurring meeting
                  </Label>
                  <p className="text-xs text-muted-foreground">Schedule this meeting to repeat automatically</p>
                </div>
              </div>

              {/* Recurring Options (shown only if recurring is enabled) */}
              {meetingFormData.isRecurring && (
                <div className="p-4 border-2 border-emerald-200 rounded-lg bg-emerald-50/30 space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recurrence Settings
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recurrence-pattern">Repeat</Label>
                      <Select
                        value={meetingFormData.recurrencePattern}
                        onValueChange={(value) => setMeetingFormData(prev => ({ ...prev, recurrencePattern: value }))}
                      >
                        <SelectTrigger data-testid="recurrence-pattern-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="recurrence-interval">Every</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="recurrence-interval"
                          type="number"
                          min="1"
                          value={meetingFormData.recurrenceInterval}
                          onChange={(e) => setMeetingFormData(prev => ({ ...prev, recurrenceInterval: parseInt(e.target.value) || 1 }))}
                          className="w-20"
                          data-testid="recurrence-interval-input"
                        />
                        <span className="text-sm text-muted-foreground">
                          {meetingFormData.recurrencePattern}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="recurrence-count">Number of Occurrences</Label>
                      <Input
                        id="recurrence-count"
                        type="number"
                        min="1"
                        value={meetingFormData.recurrenceCount}
                        onChange={(e) => setMeetingFormData(prev => ({ ...prev, recurrenceCount: parseInt(e.target.value) || 1 }))}
                        placeholder="10"
                        data-testid="recurrence-count-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="recurrence-end">Or End Date</Label>
                      <Input
                        id="recurrence-end"
                        type="date"
                        value={meetingFormData.recurrenceEndDate}
                        onChange={(e) => setMeetingFormData(prev => ({ ...prev, recurrenceEndDate: e.target.value }))}
                        data-testid="recurrence-end-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Reminder Settings */}
              <div className="p-4 border rounded-lg bg-blue-50/30 space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="reminder-enabled"
                    checked={meetingFormData.reminderEnabled}
                    onChange={(e) => setMeetingFormData(prev => ({ ...prev, reminderEnabled: e.target.checked }))}
                    className="h-4 w-4"
                    data-testid="reminder-enabled-checkbox"
                  />
                  <Label htmlFor="reminder-enabled" className="font-medium cursor-pointer">
                    Send meeting reminders
                  </Label>
                </div>
                {meetingFormData.reminderEnabled && (
                  <div className="ml-6">
                    <Label htmlFor="reminder-minutes">Remind attendees</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="reminder-minutes"
                        type="number"
                        min="5"
                        step="5"
                        value={meetingFormData.reminderMinutesBefore}
                        onChange={(e) => setMeetingFormData(prev => ({ ...prev, reminderMinutesBefore: parseInt(e.target.value) || 15 }))}
                        className="w-24"
                        data-testid="reminder-minutes-input"
                      />
                      <span className="text-sm text-muted-foreground">minutes before the meeting</span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Attendees Tab */}
            <TabsContent value="attendees" className="space-y-4 mt-4">
              <div>
                <Label>Team Members (Attendees)</Label>
                <p className="text-xs text-muted-foreground mb-2">Select team members who should attend this meeting</p>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2 bg-gray-50">
                  {usersLoading ? (
                    <p className="text-sm text-gray-500">Loading team members...</p>
                  ) : users.length === 0 ? (
                    <p className="text-sm text-gray-500">No team members available</p>
                  ) : (
                    users.map((user: any) => (
                      <label 
                        key={user.id} 
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        data-testid={`attendee-${user.id}`}
                      >
                        <input
                          type="checkbox"
                          checked={meetingFormData.attendees.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMeetingFormData(prev => ({
                                ...prev,
                                attendees: [...prev.attendees, user.id]
                              }));
                            } else {
                              setMeetingFormData(prev => ({
                                ...prev,
                                attendees: prev.attendees.filter(id => id !== user.id)
                              }));
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.username}</p>
                          {user.email && (
                            <p className="text-xs text-gray-500">{user.email}</p>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {meetingFormData.attendees.length > 0 && (
                  <p className="text-xs text-gray-600 mt-2">
                    {meetingFormData.attendees.length} team member{meetingFormData.attendees.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Agenda Tab */}
            <TabsContent value="agenda" className="space-y-4 mt-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label>Meeting Agenda</Label>
                    <p className="text-xs text-muted-foreground">Add agenda items to structure your meeting</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newItem = { id: Date.now().toString(), content: '', duration: 10 };
                      setAgendaItems([...agendaItems, newItem]);
                    }}
                    data-testid="add-agenda-item-btn"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                {agendaItems.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <List className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-muted-foreground">No agenda items yet</p>
                    <p className="text-xs text-muted-foreground">Click "Add Item" to create the first agenda item</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agendaItems.map((item, index) => (
                      <div key={item.id} className="flex items-start gap-2 p-3 border rounded-lg bg-gray-50">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder={`Agenda item ${index + 1}`}
                            value={item.content}
                            onChange={(e) => {
                              const updated = agendaItems.map(a => 
                                a.id === item.id ? { ...a, content: e.target.value } : a
                              );
                              setAgendaItems(updated);
                            }}
                            data-testid={`agenda-content-${index}`}
                          />
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Duration:</Label>
                            <Input
                              type="number"
                              min="5"
                              step="5"
                              value={item.duration}
                              onChange={(e) => {
                                const updated = agendaItems.map(a => 
                                  a.id === item.id ? { ...a, duration: parseInt(e.target.value) || 5 } : a
                                );
                                setAgendaItems(updated);
                              }}
                              className="w-20"
                              data-testid={`agenda-duration-${index}`}
                            />
                            <span className="text-xs text-muted-foreground">mins</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setAgendaItems(agendaItems.filter(a => a.id !== item.id))}
                          data-testid={`remove-agenda-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* CEO Presentation Tab */}
            <TabsContent value="presentation" className="space-y-4 mt-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  CEO Presentation & Weekly Update
                </h3>
                <p className="text-xs text-muted-foreground mb-4">Prepare comprehensive presentation materials for leadership updates</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="meeting-summary">Executive Summary</Label>
                  <Textarea
                    id="meeting-summary"
                    value={meetingFormData.meetingSummary}
                    onChange={(e) => setMeetingFormData(prev => ({ ...prev, meetingSummary: e.target.value }))}
                    placeholder="High-level summary of the meeting for executive review - what's the overall status, key highlights, and main takeaways?"
                    className="h-24"
                    data-testid="meeting-summary-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be prominently displayed at the top of the presentation</p>
                </div>

                <div>
                  <Label htmlFor="previous-week">Previous Week Accomplishments</Label>
                  <Textarea
                    id="previous-week"
                    value={meetingFormData.previousWeekAccomplishments}
                    onChange={(e) => setMeetingFormData(prev => ({ ...prev, previousWeekAccomplishments: e.target.value }))}
                    placeholder="What did the marketing team accomplish last week? Include campaigns launched, content created, metrics achieved, etc."
                    className="h-24"
                    data-testid="previous-week-input"
                  />
                </div>

                <div>
                  <Label htmlFor="next-week">Next Week Plans</Label>
                  <Textarea
                    id="next-week"
                    value={meetingFormData.nextWeekPlans}
                    onChange={(e) => setMeetingFormData(prev => ({ ...prev, nextWeekPlans: e.target.value }))}
                    placeholder="What are the plans for the upcoming week? Include upcoming campaigns, content schedule, major initiatives, etc."
                    className="h-24"
                    data-testid="next-week-input"
                  />
                </div>

                <div>
                  <Label htmlFor="key-points">Key Discussion Points</Label>
                  <Textarea
                    id="key-points"
                    value={meetingFormData.keyDiscussionPoints}
                    onChange={(e) => setMeetingFormData(prev => ({ ...prev, keyDiscussionPoints: e.target.value }))}
                    placeholder="Main topics to discuss with CEO - decisions needed, strategic questions, budget requests, etc."
                    className="h-24"
                    data-testid="key-points-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="challenges">Challenges Faced</Label>
                    <Textarea
                      id="challenges"
                      value={meetingFormData.challenges}
                      onChange={(e) => setMeetingFormData(prev => ({ ...prev, challenges: e.target.value }))}
                      placeholder="Any obstacles or challenges encountered?"
                      className="h-20"
                      data-testid="challenges-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="solutions">Solutions & Actions</Label>
                    <Textarea
                      id="solutions"
                      value={meetingFormData.solutions}
                      onChange={(e) => setMeetingFormData(prev => ({ ...prev, solutions: e.target.value }))}
                      placeholder="Solutions implemented or proposed"
                      className="h-20"
                      data-testid="solutions-input"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="team-feedback">Team Feedback & Insights</Label>
                  <Textarea
                    id="team-feedback"
                    value={meetingFormData.teamFeedback}
                    onChange={(e) => setMeetingFormData(prev => ({ ...prev, teamFeedback: e.target.value }))}
                    placeholder="Feedback from team members, insights, or suggestions"
                    className="h-20"
                    data-testid="team-feedback-input"
                  />
                </div>

                <div>
                  <Label htmlFor="presentation-notes">Presentation Notes</Label>
                  <Textarea
                    id="presentation-notes"
                    value={meetingFormData.presentationNotes}
                    onChange={(e) => setMeetingFormData(prev => ({ ...prev, presentationNotes: e.target.value }))}
                    placeholder="Additional notes or talking points for the CEO presentation"
                    className="h-20"
                    data-testid="presentation-notes-input"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Post-Meeting Outcomes Tab - Only shown when editing */}
            {isEditing && (
              <TabsContent value="outcomes">
                <PostMeetingOutcomesTab meetingId={editingMeetingId!} />
              </TabsContent>
            )}
          </Tabs>

          {/* Form Actions - Outside Tabs */}
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              data-testid="meeting-cancel-btn"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              disabled={isPending}
              data-testid="meeting-submit-btn"
            >
              {isPending ? (isEditing ? 'Updating...' : 'Scheduling...') : (isEditing ? 'Update Meeting' : 'Schedule Meeting')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
