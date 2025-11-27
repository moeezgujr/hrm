import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  Circle, 
  Link as LinkIcon,
  ExternalLink,
  Target,
  TrendingUp
} from 'lucide-react';

interface PostMeetingOutcomesTabProps {
  meetingId: number;
}

export function PostMeetingOutcomesTab({ meetingId }: PostMeetingOutcomesTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for forms
  const [showWorkItemForm, setShowWorkItemForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [editingWorkItem, setEditingWorkItem] = useState<any>(null);
  const [editingLink, setEditingLink] = useState<any>(null);
  
  // Form data state
  const [workItemData, setWorkItemData] = useState({
    title: '',
    description: '',
    category: 'feature',
    status: 'in_progress',
    progressPercentage: 0,
    hoursSpent: '',
    assignedTo: null as number | null
  });
  
  const [linkData, setLinkData] = useState({
    title: '',
    url: '',
    description: '',
    linkType: 'demo',
    workItemId: null as number | null
  });
  
  // Fetch work items
  const { data: workItems = [], isLoading: workItemsLoading } = useQuery({
    queryKey: ['/api/studio/meetings', meetingId, 'work-items'],
    enabled: !!meetingId
  });
  
  // Fetch links
  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ['/api/studio/meetings', meetingId, 'links'],
    enabled: !!meetingId
  });
  
  // Create work item mutation
  const createWorkItemMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/studio/meetings/${meetingId}/work-items`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/meetings', meetingId, 'work-items'] });
      toast({ title: 'Work item created successfully' });
      setShowWorkItemForm(false);
      resetWorkItemForm();
    },
    onError: () => {
      toast({ title: 'Failed to create work item', variant: 'destructive' });
    }
  });
  
  // Update work item mutation
  const updateWorkItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/studio/meetings/${meetingId}/work-items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/meetings', meetingId, 'work-items'] });
      toast({ title: 'Work item updated successfully' });
      setEditingWorkItem(null);
      resetWorkItemForm();
    },
    onError: () => {
      toast({ title: 'Failed to update work item', variant: 'destructive' });
    }
  });
  
  // Delete work item mutation
  const deleteWorkItemMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/studio/meetings/${meetingId}/work-items/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/meetings', meetingId, 'work-items'] });
      toast({ title: 'Work item deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete work item', variant: 'destructive' });
    }
  });
  
  // Create link mutation
  const createLinkMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/studio/meetings/${meetingId}/links`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/meetings', meetingId, 'links'] });
      toast({ title: 'Link created successfully' });
      setShowLinkForm(false);
      resetLinkForm();
    },
    onError: () => {
      toast({ title: 'Failed to create link', variant: 'destructive' });
    }
  });
  
  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/studio/meetings/${meetingId}/links/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/meetings', meetingId, 'links'] });
      toast({ title: 'Link deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete link', variant: 'destructive' });
    }
  });
  
  const resetWorkItemForm = () => {
    setWorkItemData({
      title: '',
      description: '',
      category: 'feature',
      status: 'in_progress',
      progressPercentage: 0,
      hoursSpent: '',
      assignedTo: null
    });
  };
  
  const resetLinkForm = () => {
    setLinkData({
      title: '',
      url: '',
      description: '',
      linkType: 'demo',
      workItemId: null
    });
  };
  
  const handleWorkItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWorkItem) {
      updateWorkItemMutation.mutate({ id: editingWorkItem.id, data: workItemData });
    } else {
      createWorkItemMutation.mutate(workItemData);
    }
  };
  
  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLinkMutation.mutate(linkData);
  };
  
  const handleEditWorkItem = (item: any) => {
    setEditingWorkItem(item);
    setWorkItemData({
      title: item.title,
      description: item.description || '',
      category: item.category,
      status: item.status,
      progressPercentage: item.progressPercentage || 0,
      hoursSpent: item.hoursSpent || '',
      assignedTo: item.assignedTo
    });
    setShowWorkItemForm(true);
  };
  
  return (
    <div className="space-y-6 mt-4">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600" />
          Post-Meeting Outcomes
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Track work completed after the meeting, progress on action items, and related resources
        </p>
      </div>
      
      {/* Work Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Work Items & Deliverables
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingWorkItem(null);
              resetWorkItemForm();
              setShowWorkItemForm(!showWorkItemForm);
            }}
            data-testid="add-work-item-btn"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Work Item
          </Button>
        </div>
        
        {/* Work Item Form */}
        {showWorkItemForm && (
          <Card className="border-purple-200 bg-purple-50/30">
            <CardContent className="pt-6">
              <form onSubmit={handleWorkItemSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="work-item-title">Title *</Label>
                  <Input
                    id="work-item-title"
                    value={workItemData.title}
                    onChange={(e) => setWorkItemData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Launch Campaign Landing Page"
                    required
                    data-testid="work-item-title-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="work-item-description">Description</Label>
                  <Textarea
                    id="work-item-description"
                    value={workItemData.description}
                    onChange={(e) => setWorkItemData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Details about this work item"
                    className="h-20"
                    data-testid="work-item-description-input"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="work-item-category">Category</Label>
                    <Select
                      value={workItemData.category}
                      onValueChange={(value) => setWorkItemData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger data-testid="work-item-category-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feature">Feature</SelectItem>
                        <SelectItem value="bug_fix">Bug Fix</SelectItem>
                        <SelectItem value="content">Content</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="documentation">Documentation</SelectItem>
                        <SelectItem value="optimization">Optimization</SelectItem>
                        <SelectItem value="testing">Testing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="work-item-status">Status</Label>
                    <Select
                      value={workItemData.status}
                      onValueChange={(value) => setWorkItemData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger data-testid="work-item-status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="work-item-progress">Progress %</Label>
                    <Input
                      id="work-item-progress"
                      type="number"
                      min="0"
                      max="100"
                      value={workItemData.progressPercentage}
                      onChange={(e) => setWorkItemData(prev => ({ ...prev, progressPercentage: parseInt(e.target.value) || 0 }))}
                      data-testid="work-item-progress-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="work-item-hours">Hours Spent</Label>
                    <Input
                      id="work-item-hours"
                      type="number"
                      step="0.5"
                      min="0"
                      value={workItemData.hoursSpent}
                      onChange={(e) => setWorkItemData(prev => ({ ...prev, hoursSpent: e.target.value }))}
                      placeholder="e.g., 4.5"
                      data-testid="work-item-hours-input"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowWorkItemForm(false);
                      setEditingWorkItem(null);
                      resetWorkItemForm();
                    }}
                    data-testid="cancel-work-item-btn"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createWorkItemMutation.isPending || updateWorkItemMutation.isPending}
                    data-testid="save-work-item-btn"
                  >
                    {editingWorkItem ? 'Update' : 'Create'} Work Item
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        {/* Work Items List */}
        {workItemsLoading ? (
          <p className="text-sm text-muted-foreground">Loading work items...</p>
        ) : workItems.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-muted-foreground">No work items yet</p>
              <p className="text-xs text-muted-foreground">Add work items to track progress on deliverables</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {workItems.map((item: any) => (
              <Card key={item.id} className="border-l-4 border-l-purple-500" data-testid={`work-item-${item.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{item.title}</h4>
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        <Badge 
                          variant={item.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {item.status === 'in_progress' ? 'In Progress' :
                           item.status === 'completed' ? 'Completed' :
                           item.status === 'blocked' ? 'Blocked' : 'Cancelled'}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          Progress: {item.progressPercentage || 0}%
                        </span>
                        {item.hoursSpent && (
                          <span>Hours: {item.hoursSpent}</span>
                        )}
                        {item.assignedToUser && (
                          <span>Assigned to: {item.assignedToUser.username}</span>
                        )}
                        {item.linkCount > 0 && (
                          <span className="flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" />
                            {item.linkCount} link{item.linkCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditWorkItem(item)}
                        data-testid={`edit-work-item-${item.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteWorkItemMutation.mutate(item.id)}
                        disabled={deleteWorkItemMutation.isPending}
                        data-testid={`delete-work-item-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <Separator />
      
      {/* Links Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Related Links & Resources
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              resetLinkForm();
              setShowLinkForm(!showLinkForm);
            }}
            data-testid="add-link-btn"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Link
          </Button>
        </div>
        
        {/* Link Form */}
        {showLinkForm && (
          <Card className="border-blue-200 bg-blue-50/30">
            <CardContent className="pt-6">
              <form onSubmit={handleLinkSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="link-title">Title *</Label>
                  <Input
                    id="link-title"
                    value={linkData.title}
                    onChange={(e) => setLinkData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Campaign Analytics Dashboard"
                    required
                    data-testid="link-title-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="link-url">URL *</Label>
                  <Input
                    id="link-url"
                    type="url"
                    value={linkData.url}
                    onChange={(e) => setLinkData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    required
                    data-testid="link-url-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="link-description">Description</Label>
                  <Textarea
                    id="link-description"
                    value={linkData.description}
                    onChange={(e) => setLinkData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this resource"
                    className="h-20"
                    data-testid="link-description-input"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="link-type">Type</Label>
                    <Select
                      value={linkData.linkType}
                      onValueChange={(value) => setLinkData(prev => ({ ...prev, linkType: value }))}
                    >
                      <SelectTrigger data-testid="link-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">Demo</SelectItem>
                        <SelectItem value="documentation">Documentation</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="repository">Repository</SelectItem>
                        <SelectItem value="campaign">Campaign</SelectItem>
                        <SelectItem value="social_post">Social Post</SelectItem>
                        <SelectItem value="landing_page">Landing Page</SelectItem>
                        <SelectItem value="report">Report</SelectItem>
                        <SelectItem value="presentation">Presentation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="link-work-item">Associated Work Item</Label>
                    <Select
                      value={linkData.workItemId?.toString() || ''}
                      onValueChange={(value) => setLinkData(prev => ({ ...prev, workItemId: value ? parseInt(value) : null }))}
                    >
                      <SelectTrigger data-testid="link-work-item-select">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {workItems.map((item: any) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowLinkForm(false);
                      resetLinkForm();
                    }}
                    data-testid="cancel-link-btn"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLinkMutation.isPending}
                    data-testid="save-link-btn"
                  >
                    Add Link
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        {/* Links List */}
        {linksLoading ? (
          <p className="text-sm text-muted-foreground">Loading links...</p>
        ) : links.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-center py-8">
              <LinkIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-muted-foreground">No links yet</p>
              <p className="text-xs text-muted-foreground">Add links to demos, documentation, analytics, etc.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {links.map((link: any) => (
              <Card key={link.id} className="hover:shadow-md transition-shadow" data-testid={`link-${link.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                          data-testid={`link-url-${link.id}`}
                        >
                          {link.title}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <Badge variant="outline" className="text-xs">
                          {link.linkType.replace('_', ' ')}
                        </Badge>
                      </div>
                      {link.description && (
                        <p className="text-sm text-muted-foreground mb-2">{link.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{link.url}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteLinkMutation.mutate(link.id)}
                      disabled={deleteLinkMutation.isPending}
                      data-testid={`delete-link-${link.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
