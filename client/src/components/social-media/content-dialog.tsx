import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CalendarIcon, X, Plus, Hash, AtSign, Upload, FileText, Video, Image } from 'lucide-react';
import { format } from 'date-fns';

interface ContentDialogProps {
  children: React.ReactNode;
  editContent?: any;
  onContentSaved?: () => void;
}

export function ContentDialog({ children, editContent, onContentSaved }: ContentDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    contentType: '',
    platform: '',
    scheduledDate: undefined as Date | undefined,
    scheduledTime: '09:00',
    campaignId: null as number | null,
    hashtags: '',
    mentions: '',
    mediaUrls: [] as string[],
    status: 'draft'
  });

  // Update form data when editContent changes
  React.useEffect(() => {
    if (editContent) {
      const existingDate = editContent.scheduledDate ? new Date(editContent.scheduledDate) : undefined;
      const timeString = existingDate ? 
        `${existingDate.getHours().toString().padStart(2, '0')}:${existingDate.getMinutes().toString().padStart(2, '0')}` : 
        '09:00';
      
      setFormData({
        title: editContent.title || '',
        description: editContent.description || '',
        content: editContent.content || '',
        contentType: editContent.contentType || '',
        platform: editContent.platform || '',
        scheduledDate: existingDate,
        scheduledTime: timeString,
        campaignId: editContent.campaignId || null,
        hashtags: editContent.hashtags || '',
        mentions: editContent.mentions || '',
        mediaUrls: editContent.mediaUrls || [],
        status: editContent.status || 'draft'
      });
      setOpen(true);
    }
  }, [editContent]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [newHashtag, setNewHashtag] = useState('');
  const [newMention, setNewMention] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch campaigns for dropdown
  const { data: campaigns = [] } = useQuery({
    queryKey: ['/api/social-media/campaigns'],
    queryFn: () => fetch('/api/social-media/campaigns').then(res => res.json()),
  });

  const contentTypes = [
    { value: 'social_media_post', label: 'Social Media Post', icon: FileText },
    { value: 'video_content', label: 'Video Content', icon: Video },
    { value: 'graphic_design', label: 'Graphic Design', icon: Image },
    { value: 'blog_article', label: 'Blog Article', icon: FileText },
    { value: 'campaign_material', label: 'Campaign Material', icon: FileText },
    { value: 'newsletter', label: 'Newsletter', icon: FileText },
    { value: 'advertisement', label: 'Advertisement', icon: FileText }
  ];

  const platforms = [
    'Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube',
    'TikTok', 'Pinterest', 'Snapchat', 'Reddit', 'Discord'
  ];

  const createContentMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = editContent 
        ? `/api/social-media/content/${editContent.id}` 
        : '/api/social-media/content';
      const method = editContent ? 'PUT' : 'POST';
      return await apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/content'] });
      toast({
        title: "Success",
        description: editContent ? "Content updated successfully" : "Content created successfully",
      });
      setOpen(false);
      resetForm();
      onContentSaved?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: editContent ? "Failed to update content" : "Failed to create content",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    if (!editContent) {
      setFormData({
        title: '',
        description: '',
        content: '',
        contentType: '',
        platform: '',
        scheduledDate: undefined,
        scheduledTime: '09:00',
        campaignId: null,
        hashtags: '',
        mentions: '',
        mediaUrls: [],
        status: 'draft'
      });
    }
    setNewHashtag('');
    setNewMention('');
  };

  const addHashtag = () => {
    if (newHashtag && !formData.hashtags.includes(newHashtag)) {
      const currentHashtags = formData.hashtags ? formData.hashtags.split(' ') : [];
      const hashtagToAdd = newHashtag.startsWith('#') ? newHashtag : `#${newHashtag}`;
      setFormData(prev => ({
        ...prev,
        hashtags: [...currentHashtags, hashtagToAdd].join(' ')
      }));
      setNewHashtag('');
    }
  };

  const addMention = () => {
    if (newMention && !formData.mentions.includes(newMention)) {
      const currentMentions = formData.mentions ? formData.mentions.split(' ') : [];
      const mentionToAdd = newMention.startsWith('@') ? newMention : `@${newMention}`;
      setFormData(prev => ({
        ...prev,
        mentions: [...currentMentions, mentionToAdd].join(' ')
      }));
      setNewMention('');
    }
  };

  const removeHashtag = (hashtag: string) => {
    const hashtags = formData.hashtags.split(' ').filter(h => h !== hashtag);
    setFormData(prev => ({ ...prev, hashtags: hashtags.join(' ') }));
  };

  const removeMention = (mention: string) => {
    const mentions = formData.mentions.split(' ').filter(m => m !== mention);
    setFormData(prev => ({ ...prev, mentions: mentions.join(' ') }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.contentType || !formData.platform) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time into a single Date object
    let combinedDateTime = formData.scheduledDate;
    if (formData.scheduledDate && formData.scheduledTime) {
      const [hours, minutes] = formData.scheduledTime.split(':').map(Number);
      combinedDateTime = new Date(formData.scheduledDate);
      combinedDateTime.setHours(hours, minutes, 0, 0);
    }

    // Exclude scheduledTime from the data sent to backend
    const { scheduledTime, ...dataToSend } = formData;
    
    createContentMutation.mutate({
      ...dataToSend,
      scheduledDate: combinedDateTime,
      campaignId: formData.campaignId || undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editContent ? 'Edit Content' : 'Create New Content'}
          </DialogTitle>
          <DialogDescription>
            {editContent 
              ? 'Update the content details below and save your changes.' 
              : 'Fill in the details below to create new content for your social media campaigns.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter content title"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="contentType">Content Type *</Label>
              <Select 
                value={formData.contentType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="platform">Platform *</Label>
              <Select 
                value={formData.platform} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map(platform => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="campaign">Campaign (Optional)</Label>
              <Select 
                value={formData.campaignId?.toString() || 'none'} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  campaignId: value === 'none' ? null : parseInt(value) 
                }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Campaign</SelectItem>
                  {campaigns.map((campaign: any) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      Draft
                    </div>
                  </SelectItem>
                  <SelectItem value="in_review">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      In Review
                    </div>
                  </SelectItem>
                  <SelectItem value="approved">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      Approved
                    </div>
                  </SelectItem>
                  <SelectItem value="scheduled">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      Scheduled
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="scheduledDate">Scheduled Date & Time</Label>
              <div className="flex gap-2 mt-1">
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.scheduledDate ? format(formData.scheduledDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.scheduledDate}
                      onSelect={(date) => {
                        setFormData(prev => ({ ...prev, scheduledDate: date }));
                        setShowCalendar(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  className="w-32"
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter content description"
                className="mt-1 h-20"
              />
            </div>

            <div>
              <Label htmlFor="content">Content/Copy</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter the actual content/copy"
                className="mt-1 h-32"
              />
            </div>

            {/* Hashtags */}
            <div>
              <Label>Hashtags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  placeholder="Add hashtag"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                />
                <Button type="button" size="sm" onClick={addHashtag}>
                  <Hash className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.hashtags.split(' ').filter(h => h).map((hashtag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {hashtag}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => removeHashtag(hashtag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Mentions */}
            <div>
              <Label>Mentions</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newMention}
                  onChange={(e) => setNewMention(e.target.value)}
                  placeholder="Add mention"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMention())}
                />
                <Button type="button" size="sm" onClick={addMention}>
                  <AtSign className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.mentions.split(' ').filter(m => m).map((mention, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {mention}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => removeMention(mention)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createContentMutation.isPending}>
              {createContentMutation.isPending 
                ? (editContent ? 'Updating...' : 'Creating...') 
                : (editContent ? 'Update Content' : 'Create Content')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}