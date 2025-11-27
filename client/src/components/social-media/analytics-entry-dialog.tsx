import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3 } from 'lucide-react';

type AnalyticsEntryFormData = {
  platform: string;
  postTitle: string;
  postDescription: string;
  postUrl: string;
  postDate: string;
  reach: number;
  impressions: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  videoViews: number;
  saves: number;
  profileVisits: number;
  followers: number;
  campaignId: number | null;
  notes: string;
};

interface AnalyticsEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: AnalyticsEntryFormData;
  setFormData: (data: AnalyticsEntryFormData | ((prev: AnalyticsEntryFormData) => AnalyticsEntryFormData)) => void;
  onSubmit: (e: React.FormEvent) => void;
  campaigns: any[];
  isPending: boolean;
  editingEntryId?: number | null;
}

export function AnalyticsEntryDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  campaigns,
  isPending,
  editingEntryId,
}: AnalyticsEntryDialogProps) {
  const isEditing = !!editingEntryId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            {isEditing ? 'Edit Analytics Entry' : 'Add Analytics Entry'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isEditing 
              ? 'Update your analytics data and performance metrics' 
              : 'Manually add analytics data for your social media posts'}
          </p>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          {/* Post Information Section */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Post Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entry-platform">Platform *</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger data-testid="entry-platform-select">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">Twitter / X</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="entry-post-date">Post Date *</Label>
                  <Input
                    id="entry-post-date"
                    type="date"
                    value={formData.postDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, postDate: e.target.value }))}
                    data-testid="entry-post-date-input"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="entry-post-title">Post Title *</Label>
                <Input
                  id="entry-post-title"
                  value={formData.postTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, postTitle: e.target.value }))}
                  placeholder="e.g., Product Launch Announcement"
                  data-testid="entry-post-title-input"
                  required
                />
              </div>

              <div>
                <Label htmlFor="entry-post-description">Post Description</Label>
                <Textarea
                  id="entry-post-description"
                  value={formData.postDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, postDescription: e.target.value }))}
                  placeholder="Brief description of the post content"
                  className="h-16"
                  data-testid="entry-post-description-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entry-post-url">Post URL</Label>
                  <Input
                    id="entry-post-url"
                    type="url"
                    value={formData.postUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, postUrl: e.target.value }))}
                    placeholder="https://..."
                    data-testid="entry-post-url-input"
                  />
                </div>

                <div>
                  <Label htmlFor="entry-campaign">Campaign (Optional)</Label>
                  <Select
                    value={formData.campaignId?.toString() || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, campaignId: value ? parseInt(value) : null }))}
                  >
                    <SelectTrigger data-testid="entry-campaign-select">
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id.toString()}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics Section */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Performance Metrics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="entry-reach">Reach</Label>
                <Input
                  id="entry-reach"
                  type="number"
                  min="0"
                  value={formData.reach}
                  onChange={(e) => setFormData(prev => ({ ...prev, reach: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  data-testid="entry-reach-input"
                />
                <p className="text-xs text-muted-foreground mt-1">Unique users who saw the post</p>
              </div>

              <div>
                <Label htmlFor="entry-impressions">Impressions</Label>
                <Input
                  id="entry-impressions"
                  type="number"
                  min="0"
                  value={formData.impressions}
                  onChange={(e) => setFormData(prev => ({ ...prev, impressions: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  data-testid="entry-impressions-input"
                />
                <p className="text-xs text-muted-foreground mt-1">Total times the post was displayed</p>
              </div>

              <div>
                <Label htmlFor="entry-engagement">Total Engagement</Label>
                <Input
                  id="entry-engagement"
                  type="number"
                  min="0"
                  value={formData.engagement}
                  onChange={(e) => setFormData(prev => ({ ...prev, engagement: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  data-testid="entry-engagement-input"
                />
                <p className="text-xs text-muted-foreground mt-1">All interactions combined</p>
              </div>

              <div>
                <Label htmlFor="entry-likes">Likes</Label>
                <Input
                  id="entry-likes"
                  type="number"
                  min="0"
                  value={formData.likes}
                  onChange={(e) => setFormData(prev => ({ ...prev, likes: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  data-testid="entry-likes-input"
                />
              </div>

              <div>
                <Label htmlFor="entry-comments">Comments</Label>
                <Input
                  id="entry-comments"
                  type="number"
                  min="0"
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  data-testid="entry-comments-input"
                />
              </div>

              <div>
                <Label htmlFor="entry-shares">Shares</Label>
                <Input
                  id="entry-shares"
                  type="number"
                  min="0"
                  value={formData.shares}
                  onChange={(e) => setFormData(prev => ({ ...prev, shares: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  data-testid="entry-shares-input"
                />
              </div>

              <div>
                <Label htmlFor="entry-clicks">Clicks</Label>
                <Input
                  id="entry-clicks"
                  type="number"
                  min="0"
                  value={formData.clicks}
                  onChange={(e) => setFormData(prev => ({ ...prev, clicks: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  data-testid="entry-clicks-input"
                />
              </div>

              <div>
                <Label htmlFor="entry-video-views">Video Views</Label>
                <Input
                  id="entry-video-views"
                  type="number"
                  min="0"
                  value={formData.videoViews}
                  onChange={(e) => setFormData(prev => ({ ...prev, videoViews: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  data-testid="entry-video-views-input"
                />
              </div>

              <div>
                <Label htmlFor="entry-saves">Saves</Label>
                <Input
                  id="entry-saves"
                  type="number"
                  min="0"
                  value={formData.saves}
                  onChange={(e) => setFormData(prev => ({ ...prev, saves: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  data-testid="entry-saves-input"
                />
              </div>

              <div>
                <Label htmlFor="entry-profile-visits">Profile Visits</Label>
                <Input
                  id="entry-profile-visits"
                  type="number"
                  min="0"
                  value={formData.profileVisits}
                  onChange={(e) => setFormData(prev => ({ ...prev, profileVisits: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  data-testid="entry-profile-visits-input"
                />
              </div>

              <div>
                <Label htmlFor="entry-followers">Followers</Label>
                <Input
                  id="entry-followers"
                  type="number"
                  min="0"
                  value={formData.followers}
                  onChange={(e) => setFormData(prev => ({ ...prev, followers: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  data-testid="entry-followers-input"
                />
                <p className="text-xs text-muted-foreground mt-1">Follower count at post time</p>
              </div>
            </div>
          </div>

          {/* Additional Notes Section */}
          <div>
            <Label htmlFor="entry-notes">Notes (Optional)</Label>
            <Textarea
              id="entry-notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes or observations about this post's performance"
              className="h-20"
              data-testid="entry-notes-input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              data-testid="cancel-entry-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={isPending}
              data-testid="submit-entry-button"
            >
              {isPending ? 'Saving...' : isEditing ? 'Update Entry' : 'Add Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
