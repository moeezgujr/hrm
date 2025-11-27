import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CampaignDialogProps {
  children: React.ReactNode;
  editCampaign?: any;
  onCampaignSaved?: () => void;
}

export function CampaignDialog({ children, editCampaign, onCampaignSaved }: CampaignDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objective: '',
    targetAudience: '',
    budget: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    platforms: [] as string[]
  });
  const [newPlatform, setNewPlatform] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update form data when editCampaign changes
  React.useEffect(() => {
    if (editCampaign) {
      setFormData({
        name: editCampaign.name || '',
        description: editCampaign.description || '',
        objective: editCampaign.objective || '',
        targetAudience: editCampaign.targetAudience || '',
        budget: editCampaign.budget || '',
        startDate: editCampaign.startDate ? new Date(editCampaign.startDate) : undefined,
        endDate: editCampaign.endDate ? new Date(editCampaign.endDate) : undefined,
        platforms: editCampaign.platforms || []
      });
      setOpen(true);
    }
  }, [editCampaign]);

  const availablePlatforms = [
    'Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube', 
    'TikTok', 'Pinterest', 'Snapchat', 'Reddit'
  ];

  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/social-media/campaigns', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/campaigns'] });
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
      setOpen(false);
      resetForm();
      onCampaignSaved?.();
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', `/api/social-media/campaigns/${editCampaign.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/campaigns'] });
      toast({
        title: "Success",
        description: "Campaign updated successfully",
      });
      setOpen(false);
      resetForm();
      onCampaignSaved?.();
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to update campaign",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      objective: '',
      targetAudience: '',
      budget: '',
      startDate: undefined,
      endDate: undefined,
      platforms: []
    });
    setNewPlatform('');
  };

  const addPlatform = (platform: string) => {
    if (platform && !formData.platforms.includes(platform)) {
      setFormData(prev => ({
        ...prev,
        platforms: [...prev.platforms, platform]
      }));
    }
    setNewPlatform('');
  };

  const removePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.filter(p => p !== platform)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.objective) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const dataToSubmit = {
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      platforms: JSON.stringify(formData.platforms)
    };

    if (editCampaign) {
      updateCampaignMutation.mutate(dataToSubmit);
    } else {
      createCampaignMutation.mutate(dataToSubmit);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editCampaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter campaign name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="objective">Objective *</Label>
              <Select value={formData.objective} onValueChange={(value) => setFormData(prev => ({ ...prev, objective: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select objective" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="lead_generation">Lead Generation</SelectItem>
                  <SelectItem value="conversions">Conversions</SelectItem>
                  <SelectItem value="traffic">Website Traffic</SelectItem>
                  <SelectItem value="app_installs">App Installs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your campaign goals and strategy"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                placeholder="e.g., HR professionals, 25-45 years"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.platforms.map(platform => (
                <Badge key={platform} variant="secondary" className="flex items-center gap-1">
                  {platform}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-red-500" 
                    onClick={() => removePlatform(platform)}
                  />
                </Badge>
              ))}
            </div>
            <Select value={newPlatform} onValueChange={addPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Add platform" />
              </SelectTrigger>
              <SelectContent>
                {availablePlatforms
                  .filter(platform => !formData.platforms.includes(platform))
                  .map(platform => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCampaignMutation.isPending || updateCampaignMutation.isPending}>
              {editCampaign 
                ? (updateCampaignMutation.isPending ? 'Updating...' : 'Update Campaign')
                : (createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}