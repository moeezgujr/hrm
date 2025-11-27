import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, FileText, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

type CreativeBriefFormData = {
  title: string;
  description: string;
  objective: string;
  targetAudience: string;
  keyMessage: string;
  toneAndStyle: string;
  deadline: string;
  status: string;
  assignedTo: number | null;
  campaignId: number | null;
};

interface CreativeBriefDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CreativeBriefFormData;
  setFormData: (data: CreativeBriefFormData | ((prev: CreativeBriefFormData) => CreativeBriefFormData)) => void;
  onSubmit: (e: React.FormEvent) => void;
  users: any[];
  campaigns: any[];
  isPending: boolean;
  editingBriefId?: number | null;
}

export function CreativeBriefDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  users,
  campaigns,
  isPending,
  editingBriefId,
}: CreativeBriefDialogProps) {
  const isEditing = !!editingBriefId;
  const [showPreviousMeeting, setShowPreviousMeeting] = useState(true);

  // Fetch latest meeting for selected campaign
  const { data: latestMeeting } = useQuery({
    queryKey: ['/api/studio/meetings/latest', formData.campaignId],
    queryFn: () => 
      formData.campaignId 
        ? fetch(`/api/studio/meetings?campaignId=${formData.campaignId}`).then(res => res.json()).then(meetings => meetings[0]) 
        : Promise.resolve(null),
    enabled: !!formData.campaignId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            {isEditing ? 'Edit Creative Brief' : 'New Creative Brief'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isEditing 
              ? 'Update the creative brief details and requirements' 
              : 'Define your creative project from concept to completion'}
          </p>
        </DialogHeader>

        {/* Previous Meeting Context */}
        {latestMeeting && (latestMeeting.meetingSummary || latestMeeting.keyDiscussionPoints || latestMeeting.presentationNotes) && (
          <div className="mt-4 mb-2 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
            <button
              type="button"
              onClick={() => setShowPreviousMeeting(!showPreviousMeeting)}
              className="w-full flex items-center justify-between text-left mb-2"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-blue-900">Previous Meeting Context</h3>
              </div>
              {showPreviousMeeting ? (
                <ChevronUp className="h-5 w-5 text-blue-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-blue-600" />
              )}
            </button>
            
            {showPreviousMeeting && (
              <div className="space-y-3 mt-3">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Calendar className="h-4 w-4" />
                  <span className="font-semibold">{latestMeeting.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {new Date(latestMeeting.scheduledStartTime).toLocaleDateString()}
                  </Badge>
                </div>

                {latestMeeting.meetingSummary && (
                  <div>
                    <p className="text-xs font-semibold text-blue-800 mb-1">Meeting Summary</p>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border border-blue-100">
                      {latestMeeting.meetingSummary}
                    </p>
                  </div>
                )}

                {latestMeeting.keyDiscussionPoints && (
                  <div>
                    <p className="text-xs font-semibold text-blue-800 mb-1">Key Discussion Points</p>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border border-blue-100">
                      {latestMeeting.keyDiscussionPoints}
                    </p>
                  </div>
                )}

                {latestMeeting.presentationNotes && (
                  <div>
                    <p className="text-xs font-semibold text-blue-800 mb-1">Presentation Notes</p>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border border-blue-100">
                      {latestMeeting.presentationNotes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="brief-title">Project Title *</Label>
            <Input
              id="brief-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Summer Campaign Video Series"
              data-testid="brief-title-input"
              required
            />
          </div>

          <div>
            <Label htmlFor="brief-description">Description</Label>
            <Textarea
              id="brief-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief overview of the project"
              className="h-20"
              data-testid="brief-description-input"
            />
          </div>

          <div>
            <Label htmlFor="brief-objective">Creative Objective *</Label>
            <Textarea
              id="brief-objective"
              value={formData.objective}
              onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
              placeholder="What do you want to achieve with this creative project?"
              className="h-20"
              data-testid="brief-objective-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brief-target-audience">Target Audience</Label>
              <Input
                id="brief-target-audience"
                value={formData.targetAudience}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                placeholder="e.g., Young professionals 25-35"
                data-testid="brief-target-audience-input"
              />
            </div>

            <div>
              <Label htmlFor="brief-deadline">Deadline</Label>
              <Input
                id="brief-deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                data-testid="brief-deadline-input"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="brief-key-message">Key Message</Label>
            <Textarea
              id="brief-key-message"
              value={formData.keyMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, keyMessage: e.target.value }))}
              placeholder="What is the core message you want to communicate?"
              className="h-16"
              data-testid="brief-key-message-input"
            />
          </div>

          <div>
            <Label htmlFor="brief-tone-style">Tone & Style</Label>
            <Textarea
              id="brief-tone-style"
              value={formData.toneAndStyle}
              onChange={(e) => setFormData(prev => ({ ...prev, toneAndStyle: e.target.value }))}
              placeholder="e.g., Professional yet friendly, energetic, inspiring"
              className="h-16"
              data-testid="brief-tone-style-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brief-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="brief-status" data-testid="brief-status-select">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_production">In Production</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="brief-assigned-to">Assigned To</Label>
              <Select
                value={formData.assignedTo?.toString() || ''}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  assignedTo: value ? parseInt(value) : null 
                }))}
              >
                <SelectTrigger id="brief-assigned-to" data-testid="brief-assigned-to-select">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="brief-campaign">Related Campaign</Label>
            <Select
              value={formData.campaignId?.toString() || ''}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                campaignId: value ? parseInt(value) : null 
              }))}
            >
              <SelectTrigger id="brief-campaign" data-testid="brief-campaign-select">
                <SelectValue placeholder="Select campaign (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No campaign</SelectItem>
                {campaigns.map((campaign: any) => (
                  <SelectItem key={campaign.id} value={campaign.id.toString()}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              data-testid="cancel-brief-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="submit-brief-button"
            >
              {isPending ? 'Saving...' : isEditing ? 'Update Brief' : 'Create Brief'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
