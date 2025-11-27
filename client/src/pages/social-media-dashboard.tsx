import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  BarChart3,
  Users,
  User,
  MessageSquare,
  Camera,
  TrendingUp,
  Clock,
  Target,
  FileText,
  Palette,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Heart,
  Share2,
  Activity,
  Zap,
  Award,
  Settings,
  Download,
  Upload,
  Trash2,
  Video,
  Briefcase,
  Image,
  CheckCircle,
  BarChart,
  Sparkles,
  AlertCircle,
  List,
  ListTodo,
  Tag,
  Link,
  ExternalLink,
  History,
  Lightbulb
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CampaignDialog } from '@/components/social-media/campaign-dialog';
import { ContentDialog } from '@/components/social-media/content-dialog';
import { ContentCalendarView } from '@/components/social-media/content-calendar-view';
import { ContentProductionTimeline } from '@/components/social-media/content-production-timeline';
import { AnalyticsDashboard } from '@/components/social-media/analytics-dashboard';
import { TeamCollaboration } from '@/components/social-media/team-collaboration';
import { BrandGuidelines } from '@/components/social-media/brand-guidelines';
import { SocialAccountsConnection } from '@/components/social-media/social-accounts-connection';
import { PostMeetingOutcomesTab } from '@/components/social-media/PostMeetingOutcomesTab';
import { MeetingDialog } from '@/components/social-media/meeting-dialog';
import { CreativeBriefDialog } from '@/components/social-media/creative-brief-dialog';
import { AnalyticsEntryDialog } from '@/components/social-media/analytics-entry-dialog';
import { AssetLibraryTab } from '@/components/social-media/AssetLibraryTab';
import { ApprovalWorkflowsTab } from '@/components/social-media/ApprovalWorkflowsTab';

export default function SocialMediaDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  
  // State for content dialog
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<any>(null);
  
  // State for Studio Meetings
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<number | null>(null);
  const [agendaItems, setAgendaItems] = useState<Array<{id: string, content: string, duration: number}>>([]);
  const [meetingFormData, setMeetingFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60,
    location: '',
    meetingLink: '',
    meetingType: 'team_sync',
    attendees: [] as number[],
    // Recurring meeting fields
    isRecurring: false,
    recurrencePattern: 'weekly',
    recurrenceInterval: 1,
    recurrenceEndDate: '',
    recurrenceCount: 10,
    // Reminder fields
    reminderEnabled: true,
    reminderMinutesBefore: 15,
    // CEO Presentation fields
    previousWeekAccomplishments: '',
    nextWeekPlans: '',
    keyDiscussionPoints: '',
    meetingSummary: '',
    challenges: '',
    solutions: '',
    teamFeedback: '',
    presentationNotes: ''
  });

  // Creative Brief default values
  const CREATIVE_BRIEF_DEFAULT = {
    title: '',
    description: '',
    objective: '',
    targetAudience: '',
    keyMessage: '',
    toneAndStyle: '',
    deadline: '',
    status: 'draft',
    assignedTo: null as number | null,
    campaignId: null as number | null,
  };

  // State for Creative Briefs
  const [briefDialogOpen, setBriefDialogOpen] = useState(false);
  const [editingBriefId, setEditingBriefId] = useState<number | null>(null);
  const [briefFormData, setBriefFormData] = useState(CREATIVE_BRIEF_DEFAULT);

  // Reset brief form helper
  const resetBriefForm = () => {
    setBriefFormData(CREATIVE_BRIEF_DEFAULT);
    setEditingBriefId(null);
  };

  // Analytics Entry default values
  const ANALYTICS_ENTRY_DEFAULT = {
    platform: '',
    postTitle: '',
    postDescription: '',
    postUrl: '',
    postDate: '',
    reach: 0,
    impressions: 0,
    engagement: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    clicks: 0,
    videoViews: 0,
    saves: 0,
    profileVisits: 0,
    followers: 0,
    campaignId: null as number | null,
    notes: '',
  };

  // State for Analytics Entries
  const [analyticsEntryDialogOpen, setAnalyticsEntryDialogOpen] = useState(false);
  const [editingAnalyticsEntryId, setEditingAnalyticsEntryId] = useState<number | null>(null);
  const [analyticsEntryFormData, setAnalyticsEntryFormData] = useState(ANALYTICS_ENTRY_DEFAULT);

  // Reset analytics entry form helper
  const resetAnalyticsEntryForm = () => {
    setAnalyticsEntryFormData(ANALYTICS_ENTRY_DEFAULT);
    setEditingAnalyticsEntryId(null);
  };

  // State for showing all analytics entries
  const [showAllAnalyticsEntries, setShowAllAnalyticsEntries] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for campaign editing
  const [editingCampaign, setEditingCampaign] = useState<any>(null);

  // State for Dashboard Sections Management
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [sectionFormData, setSectionFormData] = useState({
    title: '',
    description: '',
    layout: 'cards' as 'cards' | 'timeline' | 'table' | 'stats',
    dataSource: 'content_calendar' as 'content_calendar' | 'campaigns' | 'analytics' | 'briefs' | 'assets',
    queryConfig: {
      limit: 10,
      status: [] as string[],
      contentType: '',
      dateRange: '',
      sortBy: ''
    }
  });

  // Handle editing content
  const handleEditContent = (content: any) => {
    setEditingContent(content);
  };

  // Handle editing campaign
  const handleEditCampaign = (campaign: any) => {
    setEditingCampaign(campaign);
  };

  // Clear editing content when needed
  const clearEditingContent = () => {
    setEditingContent(null);
  };

  // Clear editing campaign when needed
  const clearEditingCampaign = () => {
    setEditingCampaign(null);
  };

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      return await apiRequest('DELETE', `/api/social-media/campaigns/${campaignId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/campaigns'] });
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    }
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: number) => {
      return await apiRequest('DELETE', `/api/social-media/content/${contentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/content'] });
      toast({
        title: "Success",
        description: "Content deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive",
      });
    }
  });

  // Create studio meeting mutation
  // Helper function to reset meeting form
  const resetMeetingForm = () => {
    setMeetingFormData({
      title: '',
      description: '',
      scheduledAt: '',
      duration: 60,
      location: '',
      meetingLink: '',
      meetingType: 'team_sync',
      attendees: [],
      isRecurring: false,
      recurrencePattern: 'weekly',
      recurrenceInterval: 1,
      recurrenceEndDate: '',
      recurrenceCount: 10,
      reminderEnabled: true,
      reminderMinutesBefore: 15,
      previousWeekAccomplishments: '',
      nextWeekPlans: '',
      keyDiscussionPoints: '',
      meetingSummary: '',
      challenges: '',
      solutions: '',
      teamFeedback: '',
      presentationNotes: ''
    });
    setAgendaItems([]);
    setEditingMeetingId(null);
    setMeetingDialogOpen(false);
  };

  const createMeetingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/studio/meetings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/meetings'] });
      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      });
      resetMeetingForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule meeting",
        variant: "destructive",
      });
    }
  });

  const updateMeetingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PUT', `/api/studio/meetings/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/meetings'] });
      toast({
        title: "Success",
        description: "Meeting updated successfully",
      });
      resetMeetingForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update meeting",
        variant: "destructive",
      });
    }
  });

  // Handle meeting form submit
  const handleMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!meetingFormData.title || !meetingFormData.scheduledAt) {
      toast({
        title: "Validation Error",
        description: "Please fill in title and scheduled time",
        variant: "destructive",
      });
      return;
    }

    // Prepare the meeting payload with all new fields
    const meetingPayload = {
      ...meetingFormData,
      // Format the scheduled time properly
      scheduledStartTime: new Date(meetingFormData.scheduledAt).toISOString(),
      // Serialize agenda items as JSON string
      agenda: agendaItems.length > 0 ? JSON.stringify(agendaItems) : null,
      // Set attendee IDs for backend email notifications
      attendeeIds: meetingFormData.attendees,
      // Set reminder minutes (convert to integer or null)
      reminderMinutes: meetingFormData.reminderEnabled ? meetingFormData.reminderMinutesBefore : null,
      // Include recurring settings
      isRecurring: meetingFormData.isRecurring,
      recurrencePattern: meetingFormData.isRecurring ? meetingFormData.recurrencePattern : null,
      recurrenceInterval: meetingFormData.isRecurring ? meetingFormData.recurrenceInterval : null,
      recurrenceEndDate: meetingFormData.isRecurring && meetingFormData.recurrenceEndDate ? new Date(meetingFormData.recurrenceEndDate).toISOString() : null,
      recurrenceDays: meetingFormData.isRecurring && meetingFormData.recurrencePattern === 'weekly' ? null : null, // Can be enhanced later for day selection
    };

    // Branch between create and update based on editingMeetingId
    if (editingMeetingId) {
      updateMeetingMutation.mutate({ id: editingMeetingId, data: meetingPayload });
    } else {
      createMeetingMutation.mutate(meetingPayload);
    }
  };

  // Creative Brief mutations
  const createBriefMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/studio/creative-briefs', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/creative-briefs'] });
      toast({
        title: "Success",
        description: "Creative brief created successfully",
      });
      resetBriefForm();
      setBriefDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create creative brief",
        variant: "destructive",
      });
    }
  });

  const updateBriefMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PUT', `/api/studio/creative-briefs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/creative-briefs'] });
      toast({
        title: "Success",
        description: "Creative brief updated successfully",
      });
      resetBriefForm();
      setBriefDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update creative brief",
        variant: "destructive",
      });
    }
  });

  const deleteBriefMutation = useMutation({
    mutationFn: async (briefId: number) => {
      return await apiRequest('DELETE', `/api/studio/creative-briefs/${briefId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/creative-briefs'] });
      toast({
        title: "Success",
        description: "Creative brief deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete creative brief",
        variant: "destructive",
      });
    }
  });

  // Handle brief form submit
  const handleBriefSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!briefFormData.title || !briefFormData.objective) {
      toast({
        title: "Validation Error",
        description: "Please fill in title and creative objective",
        variant: "destructive",
      });
      return;
    }

    const briefPayload = {
      ...briefFormData,
      deadline: briefFormData.deadline ? new Date(briefFormData.deadline).toISOString() : null,
    };

    if (editingBriefId) {
      updateBriefMutation.mutate({ id: editingBriefId, data: briefPayload });
    } else {
      createBriefMutation.mutate(briefPayload);
    }
  };

  // Analytics Entry mutations
  const createAnalyticsEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/analytics/manual', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/manual'] });
      toast({
        title: "Success",
        description: "Analytics entry added successfully",
      });
      resetAnalyticsEntryForm();
      setAnalyticsEntryDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add analytics entry",
        variant: "destructive",
      });
    }
  });

  const updateAnalyticsEntryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PUT', `/api/analytics/manual/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/manual'] });
      toast({
        title: "Success",
        description: "Analytics entry updated successfully",
      });
      resetAnalyticsEntryForm();
      setAnalyticsEntryDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update analytics entry",
        variant: "destructive",
      });
    }
  });

  const deleteAnalyticsEntryMutation = useMutation({
    mutationFn: async (entryId: number) => {
      return await apiRequest('DELETE', `/api/analytics/manual/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/manual'] });
      toast({
        title: "Success",
        description: "Analytics entry deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete analytics entry",
        variant: "destructive",
      });
    }
  });

  // Handle analytics entry form submit
  const handleAnalyticsEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!analyticsEntryFormData.platform || !analyticsEntryFormData.postTitle || !analyticsEntryFormData.postDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in platform, post title, and post date",
        variant: "destructive",
      });
      return;
    }

    const entryPayload = {
      ...analyticsEntryFormData,
      postDate: analyticsEntryFormData.postDate ? new Date(analyticsEntryFormData.postDate).toISOString() : null,
    };

    if (editingAnalyticsEntryId) {
      updateAnalyticsEntryMutation.mutate({ id: editingAnalyticsEntryId, data: entryPayload });
    } else {
      createAnalyticsEntryMutation.mutate(entryPayload);
    }
  };

  // Handle delete campaign
  const handleDeleteCampaign = (campaignId: number) => {
    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      deleteCampaignMutation.mutate(campaignId);
    }
  };

  // Handle delete content
  const handleDeleteContent = (contentId: number) => {
    if (window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      deleteContentMutation.mutate(contentId);
    }
  };

  // Handle delete analytics entry
  const handleDeleteAnalyticsEntry = (entryId: number) => {
    if (window.confirm('Are you sure you want to delete this analytics entry? This action cannot be undone.')) {
      deleteAnalyticsEntryMutation.mutate(entryId);
    }
  };

  // Fetch real data from API
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/social-media/campaigns'],
    queryFn: () => fetch('/api/social-media/campaigns').then(res => res.json()),
  });

  const { data: contentSchedule = [], isLoading: contentLoading } = useQuery({
    queryKey: ['/api/social-media/content'],
    queryFn: () => fetch('/api/social-media/content').then(res => res.json()),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/social-media/projects'],
    queryFn: () => fetch('/api/social-media/projects').then(res => res.json()),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/social-media/tasks'],
    queryFn: () => fetch('/api/social-media/tasks').then(res => res.json()),
  });

  const { data: brandGuidelines = [], isLoading: guidelinesLoading } = useQuery({
    queryKey: ['/api/social-media/brand-guidelines'],
    queryFn: () => fetch('/api/social-media/brand-guidelines').then(res => res.json()),
  });

  // State for presentation view (declared early so queries can reference it)
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [presentationMode, setPresentationMode] = useState(false);

  // Fetch users for meeting attendees
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => fetch('/api/users').then(res => res.json()),
  });

  // Fetch studio meetings
  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ['/api/studio/meetings'],
    queryFn: () => fetch('/api/studio/meetings').then(res => res.json()),
  });

  // Fetch creative briefs
  const { data: creativeBriefs = [], isLoading: briefsLoading } = useQuery({
    queryKey: ['/api/studio/creative-briefs'],
    queryFn: () => fetch('/api/studio/creative-briefs').then(res => res.json()),
  });

  // Fetch analytics entries
  const { data: analyticsEntries = [], isLoading: analyticsEntriesLoading } = useQuery({
    queryKey: ['/api/analytics/manual'],
    queryFn: () => fetch('/api/analytics/manual').then(res => res.json()),
  });

  // Studio Overview query
  const { data: studioOverview, isLoading: overviewLoading, isError: overviewError } = useQuery({
    queryKey: ['/api/studio/overview'],
    queryFn: () => fetch('/api/studio/overview').then(res => res.json()),
  });

  // Dashboard Sections queries
  const { data: dashboardSections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['/api/studio/dashboard-sections'],
    queryFn: () => fetch('/api/studio/dashboard-sections').then(res => res.json()),
  });

  // Post-meeting work items for presentation view (only when selectedMeeting exists)
  const { data: presentationWorkItems = [] } = useQuery({
    queryKey: ['/api/studio/post-meeting/work-items', selectedMeeting?.id],
    queryFn: () => selectedMeeting?.id ? fetch(`/api/studio/post-meeting/work-items?meetingId=${selectedMeeting.id}`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!selectedMeeting?.id,
  });

  // Post-meeting links for presentation view (only when selectedMeeting exists)
  const { data: presentationLinks = [] } = useQuery({
    queryKey: ['/api/studio/post-meeting/links', selectedMeeting?.id],
    queryFn: () => selectedMeeting?.id ? fetch(`/api/studio/post-meeting/links?meetingId=${selectedMeeting.id}`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!selectedMeeting?.id,
  });

  // Previous meeting work items for showing continuity
  const { data: previousMeetingWork = { previousMeeting: null, workItems: [] } } = useQuery({
    queryKey: ['/api/studio/meetings/previous-work', selectedMeeting?.id],
    queryFn: () => selectedMeeting?.id ? fetch(`/api/studio/meetings/${selectedMeeting.id}/previous-work`).then(res => res.json()) : Promise.resolve({ previousMeeting: null, workItems: [] }),
    enabled: !!selectedMeeting?.id,
  });

  // Create dashboard section mutation
  const createSectionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/studio/dashboard-sections', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/dashboard-sections'] });
      toast({
        title: "Success",
        description: "Dashboard section created successfully",
      });
      setSectionDialogOpen(false);
      resetSectionForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create dashboard section",
        variant: "destructive",
      });
    }
  });

  // Update dashboard section mutation
  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return await apiRequest('PATCH', `/api/studio/dashboard-sections/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/dashboard-sections'] });
      toast({
        title: "Success",
        description: "Dashboard section updated successfully",
      });
      setSectionDialogOpen(false);
      setEditingSection(null);
      resetSectionForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update dashboard section",
        variant: "destructive",
      });
    }
  });

  // Delete dashboard section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: number) => {
      return await apiRequest('DELETE', `/api/studio/dashboard-sections/${sectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/dashboard-sections'] });
      toast({
        title: "Success",
        description: "Dashboard section deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete dashboard section",
        variant: "destructive",
      });
    }
  });

  // Helper function to reset section form
  const resetSectionForm = () => {
    setSectionFormData({
      title: '',
      description: '',
      layout: 'cards',
      dataSource: 'content_calendar',
      queryConfig: {
        limit: 10,
        status: [] as string[],
        contentType: '',
        dateRange: '',
        sortBy: ''
      }
    });
  };

  // Handle edit section
  const handleEditSection = (section: any) => {
    setEditingSection(section);
    setSectionFormData({
      title: section.title || '',
      description: section.description || '',
      layout: section.layout || 'cards',
      dataSource: section.dataSource || 'content_calendar',
      queryConfig: section.queryConfig || {
        limit: 10,
        status: [],
        contentType: '',
        dateRange: '',
        sortBy: ''
      }
    });
    setSectionDialogOpen(true);
  };

  // Handle delete section
  const handleDeleteSection = (sectionId: number) => {
    if (window.confirm('Are you sure you want to delete this dashboard section?')) {
      deleteSectionMutation.mutate(sectionId);
    }
  };

  // Handle submit section form
  const handleSubmitSection = () => {
    // Validate required fields
    if (!sectionFormData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Section title is required",
        variant: "destructive",
      });
      return;
    }

    const data = {
      ...sectionFormData,
      queryConfig: sectionFormData.queryConfig
    };

    if (editingSection) {
      updateSectionMutation.mutate({ id: editingSection.id, data });
    } else {
      createSectionMutation.mutate(data);
    }
  };

  // Calculate metrics from real data
  const totalReach = campaigns.reduce((sum: number, campaign: any) => sum + (campaign.impressions || 0), 0);
  const totalEngagements = campaigns.reduce((sum: number, campaign: any) => sum + (campaign.engagements || 0), 0);
  const engagementRate = totalReach > 0 ? ((totalEngagements / totalReach) * 100).toFixed(1) : '0.0';
  const activeCampaigns = campaigns.filter((campaign: any) => campaign.status === 'active').length;
  const weeklyContent = contentSchedule.filter((content: any) => {
    if (!content.scheduledDate) return false;
    const scheduledDate = new Date(content.scheduledDate);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return scheduledDate <= weekFromNow && scheduledDate >= new Date();
  }).length;

  // Mock data for fallback when no real data is available
  const mockCampaigns = [
    {
      id: 1,
      name: "Summer Campaign 2025",
      description: "Engaging summer content to boost brand awareness",
      status: "active",
      platforms: ["Instagram", "Facebook", "Twitter"],
      budget: 5000,
      startDate: "2025-08-01",
      endDate: "2025-08-31",
      impressions: 125000,
      engagements: 8500,
      clicks: 1200
    },
    {
      id: 2,
      name: "Brand Awareness Drive",
      description: "Increase brand visibility across social platforms",
      status: "planning",
      platforms: ["LinkedIn", "Instagram"],
      budget: 3000,
      startDate: "2025-08-15",
      endDate: "2025-09-15",
      impressions: 0,
      engagements: 0,
      clicks: 0
    }
  ];

  const mockContentSchedule = [
    {
      id: 1,
      title: "Monday Motivation Post",
      contentType: "social_media_post",
      platform: "Instagram",
      scheduledDate: "2025-08-13T09:00:00Z",
      status: "approved"
    },
    {
      id: 2,
      title: "New Product Launch Video",
      contentType: "video_content", 
      platform: "Facebook",
      scheduledDate: "2025-08-13T14:00:00Z",
      status: "in_review"
    },
    {
      id: 3,
      title: "Customer Success Story",
      contentType: "blog_article",
      platform: "LinkedIn",
      scheduledDate: "2025-08-14T10:00:00Z",
      status: "draft"
    }
  ];

  const mockProjects = [
    {
      id: 1,
      name: "Q3 Brand Refresh",
      projectType: "brand_awareness",
      priority: "high",
      status: "active",
      description: "Complete brand identity refresh for Q3"
    },
    {
      id: 2,
      name: "Influencer Collaboration",
      projectType: "campaign",
      priority: "medium",
      status: "planning",
      description: "Partner with key industry influencers"
    }
  ];

  const mockBrandGuidelines = [
    {
      id: 1,
      brandName: "Meeting Matters",
      description: "Official brand guidelines for Meeting Matters",
      colorPalette: ["#3B82F6", "#10B981", "#8B5CF6", "#EA580C"],
      fonts: ["Inter", "Roboto", "Open Sans"],
      toneOfVoice: "Professional, friendly, and approachable"
    }
  ];

  // Use real data if available, fallback to mock data
  const displayCampaigns = campaigns.length > 0 ? campaigns : mockCampaigns;
  const displayContent = contentSchedule.length > 0 ? contentSchedule : mockContentSchedule;
  const displayProjects = projects.length > 0 ? projects : mockProjects;
  const displayBrandGuidelines = brandGuidelines.length > 0 ? brandGuidelines : mockBrandGuidelines;

  // Custom Dashboard Section Renderer Component
  const CustomDashboardSection = ({ section }: { section: any }) => {
    // Fetch data for this section
    const { data: sectionData, isLoading, isError } = useQuery({
      queryKey: ['/api/studio/dashboard-sections', section.id, 'data'],
      queryFn: async () => {
        const res = await fetch(`/api/studio/dashboard-sections/${section.id}/data`);
        if (!res.ok) {
          throw new Error(`Failed to fetch section data: ${res.statusText}`);
        }
        return res.json();
      },
    });

    // Loading state
    if (isLoading) {
      return (
        <Card className="border-indigo-200">
          <CardContent className="p-8">
            <div className="text-center py-4 text-gray-500">
              <Activity className="h-8 w-8 mx-auto mb-2 text-indigo-400 animate-pulse" />
              <p className="text-sm">Loading {section.title}...</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Error state
    if (isError) {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="font-semibold">Failed to load {section.title}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/studio/dashboard-sections', section.id, 'data'] })}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Handle both array and { section, data } response formats
    const data = Array.isArray(sectionData) ? sectionData : (sectionData?.data || []);

    // Empty state
    if (data.length === 0) {
      return (
        <Card className="border-indigo-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="text-indigo-700">{section.title}</CardTitle>
            {section.description && <p className="text-sm text-gray-600 mt-1">{section.description}</p>}
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-indigo-300" />
              <p className="text-sm">No data available for this section</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Render based on layout type
    const renderContent = () => {
      switch (section.layout) {
        case 'cards':
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((item: any, index: number) => (
                <Card key={item.id || index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2">{item.title || item.name || item.campaignName || 'Item'}</h4>
                    {item.description && <p className="text-xs text-gray-600 mb-2">{item.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.status && <Badge variant="outline" className="text-xs">{item.status}</Badge>}
                      {item.scheduledDate && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.scheduledDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          );

        case 'timeline':
          return (
            <div className="space-y-3">
              {data.map((item: any, index: number) => (
                <div key={item.id || index} className="flex gap-4 items-start">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                  <div className="flex-1 pb-4 border-b last:border-0">
                    <h4 className="font-semibold text-sm">{item.title || item.name || 'Item'}</h4>
                    {item.scheduledDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.scheduledDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );

        case 'table':
          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    {data[0]?.scheduledDate && <th className="px-4 py-3 text-left font-semibold">Date</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: any, index: number) => (
                    <tr key={item.id || index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{item.title || item.name || item.campaignName || 'Item'}</td>
                      <td className="px-4 py-3">
                        {item.status && <Badge variant="outline" className="text-xs">{item.status}</Badge>}
                      </td>
                      {item.scheduledDate && (
                        <td className="px-4 py-3 text-gray-600">{new Date(item.scheduledDate).toLocaleDateString()}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

        case 'stats':
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.slice(0, 8).map((item: any, index: number) => (
                <div key={item.id || index} className="text-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-indigo-700">
                    {item.value || item.impressions || item.engagements || item.count || 0}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{item.label || item.name || 'Metric'}</p>
                </div>
              ))}
            </div>
          );

        default:
          return (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Layout type "{section.layout}" not yet implemented</p>
            </div>
          );
      }
    };

    return (
      <Card className="border-indigo-200">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200">
          <CardTitle className="text-indigo-700 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {section.title}
          </CardTitle>
          {section.description && <p className="text-xs text-gray-600 mt-1">{section.description}</p>}
          <p className="text-xs text-gray-500 mt-1">Data source: {section.dataSource.replace('_', ' ')} • Layout: {section.layout}</p>
        </CardHeader>
        <CardContent className="p-4">
          {renderContent()}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meeting Matters Studio</h1>
            <p className="text-gray-600 mt-1">Content creation and marketing management platform</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Search Content
            </Button>
            <Button variant="outline" onClick={() => setSelectedTab("accounts")}>
              <Plus className="mr-2 h-4 w-4" />
              Connect Account
            </Button>
            <CampaignDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </CampaignDialog>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reach</p>
                <p className="text-2xl font-bold">{totalReach > 1000 ? `${(totalReach/1000).toFixed(1)}K` : totalReach}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                <p className="text-2xl font-bold">{engagementRate}%</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2.1% from last month
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold">{activeCampaigns}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Target className="h-3 w-3 mr-1" />
                  2 ending this month
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Content Scheduled</p>
                <p className="text-2xl font-bold">{weeklyContent}</p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  This week
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search campaigns, content, or projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <div className="w-full overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span className="inline-flex items-center gap-1">
                Meetings <Sparkles className="h-3 w-3 text-emerald-500" />
              </span>
            </TabsTrigger>
            <TabsTrigger value="briefs" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="inline-flex items-center gap-1">
                Creative Briefs <Sparkles className="h-3 w-3 text-purple-500" />
              </span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span className="inline-flex items-center gap-1">
                Asset Library <Sparkles className="h-3 w-3 text-blue-500" />
              </span>
            </TabsTrigger>
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="inline-flex items-center gap-1">
                Approvals <Sparkles className="h-3 w-3 text-yellow-500" />
              </span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span className="inline-flex items-center gap-1">
                Studio Reports <Sparkles className="h-3 w-3 text-pink-500" />
              </span>
            </TabsTrigger>
            <TabsTrigger value="dashboard-settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="inline-flex items-center gap-1">
                Dashboard Settings <Sparkles className="h-3 w-3 text-indigo-500" />
              </span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="brand" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Brand
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Hidden ContentDialog for editing from overview */}
          <ContentDialog 
            editContent={editingContent}
            onContentSaved={clearEditingContent}
          >
            <div style={{ display: 'none' }} />
          </ContentDialog>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayCampaigns.slice(0, 3).map((campaign: any) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{campaign.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {campaign.platforms ? 
                              (typeof campaign.platforms === 'string' ? 
                                JSON.parse(campaign.platforms) : 
                                campaign.platforms
                              ).join(', ') : 
                              'No platforms'
                            }
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{campaign.impressions || 0} impressions</p>
                        <p className="text-xs text-gray-500">{campaign.engagements || 0} engagements</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayContent.slice(0, 4).map((content: any) => (
                    <div 
                      key={content.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{content.title}</h4>
                          <p className="text-sm text-gray-500">
                            {content.platform} • {content.scheduledDate ? 
                              new Date(content.scheduledDate).toLocaleDateString() : 
                              'Not scheduled'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={content.status === 'approved' ? 'default' : 'secondary'}>
                          {content.status}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditContent(content)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContent(content.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Active Campaigns</h2>
            <CampaignDialog 
              editCampaign={editingCampaign}
              onCampaignSaved={clearEditingCampaign}
            >
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </CampaignDialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayCampaigns.map((campaign: any) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                    </div>
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {(campaign.platforms ? 
                        (typeof campaign.platforms === 'string' ? 
                          JSON.parse(campaign.platforms) : 
                          campaign.platforms
                        ) : []
                      ).map((platform: string, index: number) => (
                        <Badge key={index} variant="outline">{platform}</Badge>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{campaign.impressions || 0}</p>
                        <p className="text-xs text-gray-500">Impressions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{campaign.engagements || 0}</p>
                        <p className="text-xs text-gray-500">Engagements</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">{campaign.clicks || 0}</p>
                        <p className="text-xs text-gray-500">Clicks</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="text-sm text-gray-500">
                        Budget: ${campaign.budget || 0}
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditCampaign(campaign)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCampaign(campaign.id);
                          }}
                          className="text-red-600 hover:text-red-700 hover:border-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Content Calendar</h2>
            <ContentDialog 
              editContent={editingContent}
              onContentSaved={clearEditingContent}
            >
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Content
              </Button>
            </ContentDialog>
          </div>
          
          <ContentCalendarView 
            contentItems={displayContent}
            onEditContent={handleEditContent}
            onDeleteContent={handleDeleteContent}
          />
        </TabsContent>

        <TabsContent value="dashboard-settings" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Dashboard Settings</h2>
              <p className="text-gray-600 mt-1">Customize your dashboard sections and layout</p>
            </div>
            <Button 
              onClick={() => {
                setEditingSection(null);
                resetSectionForm();
                setSectionDialogOpen(true);
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              data-testid="button-add-section"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </div>

          {sectionsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading dashboard sections...</p>
            </div>
          ) : dashboardSections.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Settings className="h-16 w-16 mx-auto mb-4 text-indigo-400" />
                <h3 className="text-xl font-semibold mb-2">No Dashboard Sections</h3>
                <p className="text-gray-500 mb-6">Get started by creating your first custom dashboard section</p>
                <Button 
                  onClick={() => {
                    setEditingSection(null);
                    resetSectionForm();
                    setSectionDialogOpen(true);
                  }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Section
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {dashboardSections.map((section: any) => (
                <Card key={section.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold" data-testid={`text-section-title-${section.id}`}>{section.title}</h3>
                          <Badge variant={section.isVisible ? 'default' : 'secondary'}>
                            {section.isVisible ? 'Visible' : 'Hidden'}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {section.layout}
                          </Badge>
                        </div>
                        {section.description && (
                          <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            Data: {section.dataSource.replace('_', ' ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            Order: {section.displayOrder}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSection(section)}
                          data-testid={`button-edit-section-${section.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSection(section.id)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                          data-testid={`button-delete-section-${section.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Dashboard Section Dialog */}
          <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSection ? 'Edit Dashboard Section' : 'Create Dashboard Section'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="section-title">Section Title *</Label>
                  <Input
                    id="section-title"
                    value={sectionFormData.title}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, title: e.target.value })}
                    placeholder="e.g., Upcoming Video Shoots"
                    data-testid="input-section-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="section-description">Description</Label>
                  <Textarea
                    id="section-description"
                    value={sectionFormData.description}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, description: e.target.value })}
                    placeholder="Brief description of this section"
                    rows={2}
                    data-testid="input-section-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="section-layout">Layout Type *</Label>
                    <Select
                      value={sectionFormData.layout}
                      onValueChange={(value: any) => setSectionFormData({ ...sectionFormData, layout: value })}
                    >
                      <SelectTrigger id="section-layout" data-testid="select-section-layout">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cards">Cards</SelectItem>
                        <SelectItem value="timeline">Timeline</SelectItem>
                        <SelectItem value="table">Table</SelectItem>
                        <SelectItem value="stats">Stats</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="section-datasource">Data Source *</Label>
                    <Select
                      value={sectionFormData.dataSource}
                      onValueChange={(value: any) => setSectionFormData({ ...sectionFormData, dataSource: value })}
                    >
                      <SelectTrigger id="section-datasource" data-testid="select-section-datasource">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content_calendar">Content Calendar</SelectItem>
                        <SelectItem value="campaigns">Campaigns</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="briefs">Creative Briefs</SelectItem>
                        <SelectItem value="assets">Asset Library</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3">Query Configuration</h4>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="query-limit">Result Limit</Label>
                      <Input
                        id="query-limit"
                        type="number"
                        value={sectionFormData.queryConfig.limit}
                        onChange={(e) => setSectionFormData({
                          ...sectionFormData,
                          queryConfig: { ...sectionFormData.queryConfig, limit: parseInt(e.target.value) || 10 }
                        })}
                        placeholder="10"
                        min="1"
                        max="100"
                        data-testid="input-query-limit"
                      />
                    </div>

                    {sectionFormData.dataSource === 'content_calendar' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="query-content-type">Content Type</Label>
                          <Select
                            value={sectionFormData.queryConfig.contentType}
                            onValueChange={(value) => setSectionFormData({
                              ...sectionFormData,
                              queryConfig: { ...sectionFormData.queryConfig, contentType: value }
                            })}
                          >
                            <SelectTrigger id="query-content-type">
                              <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Types</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="social_media_post">Social Media Post</SelectItem>
                              <SelectItem value="blog">Blog</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="query-date-range">Date Range</Label>
                          <Select
                            value={sectionFormData.queryConfig.dateRange}
                            onValueChange={(value) => setSectionFormData({
                              ...sectionFormData,
                              queryConfig: { ...sectionFormData.queryConfig, dateRange: value }
                            })}
                          >
                            <SelectTrigger id="query-date-range">
                              <SelectValue placeholder="Any Time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Any Time</SelectItem>
                              <SelectItem value="next_7_days">Next 7 Days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {sectionFormData.dataSource === 'campaigns' && (
                      <div className="space-y-2">
                        <Label>Campaign Status</Label>
                        <div className="flex gap-2 flex-wrap">
                          {['active', 'planning', 'completed'].map(status => (
                            <Button
                              key={status}
                              type="button"
                              size="sm"
                              variant={sectionFormData.queryConfig.status.includes(status) ? 'default' : 'outline'}
                              onClick={() => {
                                const currentStatus = sectionFormData.queryConfig.status;
                                const newStatus = currentStatus.includes(status)
                                  ? currentStatus.filter((s: string) => s !== status)
                                  : [...currentStatus, status];
                                setSectionFormData({
                                  ...sectionFormData,
                                  queryConfig: { ...sectionFormData.queryConfig, status: newStatus }
                                });
                              }}
                              className="capitalize"
                            >
                              {status}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSectionDialogOpen(false);
                      setEditingSection(null);
                      resetSectionForm();
                    }}
                    data-testid="button-cancel-section"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitSection}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600"
                    disabled={!sectionFormData.title}
                    data-testid="button-save-section"
                  >
                    {editingSection ? 'Update Section' : 'Create Section'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Manual Analytics Entry Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Manual Analytics Entries</h3>
                <p className="text-gray-600 text-sm">Manually track and log your social media post performance</p>
              </div>
              <Button
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                onClick={() => {
                  setEditingAnalyticsEntryId(null);
                  setAnalyticsEntryFormData(ANALYTICS_ENTRY_DEFAULT);
                  setAnalyticsEntryDialogOpen(true);
                }}
                data-testid="add-analytics-entry-button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </div>

            {analyticsEntriesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-white/60 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : analyticsEntries.length === 0 ? (
              <div className="text-center py-12 bg-white/60 rounded-lg">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                <p className="font-semibold mb-2">No manual entries yet</p>
                <p className="text-sm text-gray-600 mb-4">Start tracking your social media performance manually</p>
                <Button
                  onClick={() => {
                    setEditingAnalyticsEntryId(null);
                    setAnalyticsEntryFormData(ANALYTICS_ENTRY_DEFAULT);
                    setAnalyticsEntryDialogOpen(true);
                  }}
                  variant="outline"
                >
                  Add Your First Entry
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(showAllAnalyticsEntries ? analyticsEntries : analyticsEntries.slice(0, 6)).map((entry: any) => (
                  <Card key={entry.id} className="bg-white hover:shadow-lg transition-shadow" data-testid={`analytics-entry-card-${entry.id}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-blue-100 text-blue-700">{entry.platform}</Badge>
                            <span className="text-xs text-gray-500">{new Date(entry.postDate).toLocaleDateString()}</span>
                          </div>
                          <h4 className="font-semibold line-clamp-2">{entry.postTitle}</h4>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingAnalyticsEntryId(entry.id);
                              setAnalyticsEntryFormData({
                                platform: entry.platform || '',
                                postTitle: entry.postTitle || '',
                                postDescription: entry.postDescription || '',
                                postUrl: entry.postUrl || '',
                                postDate: entry.postDate ? new Date(entry.postDate).toISOString().split('T')[0] : '',
                                reach: entry.reach || 0,
                                impressions: entry.impressions || 0,
                                engagement: entry.engagement || 0,
                                likes: entry.likes || 0,
                                comments: entry.comments || 0,
                                shares: entry.shares || 0,
                                clicks: entry.clicks || 0,
                                videoViews: entry.videoViews || 0,
                                saves: entry.saves || 0,
                                profileVisits: entry.profileVisits || 0,
                                followers: entry.followers || 0,
                                campaignId: entry.campaignId || null,
                                notes: entry.notes || '',
                              });
                              setAnalyticsEntryDialogOpen(true);
                            }}
                            data-testid={`edit-analytics-entry-${entry.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAnalyticsEntry(entry.id)}
                            data-testid={`delete-analytics-entry-${entry.id}`}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-xs text-gray-600">Reach</p>
                          <p className="font-semibold text-blue-700">{entry.reach?.toLocaleString() || 0}</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <p className="text-xs text-gray-600">Engagement</p>
                          <p className="font-semibold text-green-700">{entry.engagement?.toLocaleString() || 0}</p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <p className="text-xs text-gray-600">Likes</p>
                          <p className="font-semibold text-purple-700">{entry.likes?.toLocaleString() || 0}</p>
                        </div>
                        <div className="bg-pink-50 p-2 rounded">
                          <p className="text-xs text-gray-600">Comments</p>
                          <p className="font-semibold text-pink-700">{entry.comments?.toLocaleString() || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {analyticsEntries.length > 6 && (
              <div className="text-center mt-4">
                <Button 
                  variant="outline"
                  onClick={() => setShowAllAnalyticsEntries(!showAllAnalyticsEntries)}
                  data-testid="button-toggle-analytics-entries"
                >
                  {showAllAnalyticsEntries ? 'Show Less' : `View All ${analyticsEntries.length} Entries`}
                </Button>
              </div>
            )}
          </div>

          {/* Connected Account Analytics Section */}
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <SocialAccountsConnection />
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <TeamCollaboration tasks={tasks} projects={projects} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <ContentProductionTimeline contentItems={displayContent} />
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Active Projects</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>

          <div className="space-y-4">
            {displayProjects.map((project: any) => (
              <Card key={project.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{project.name}</h3>
                      <p className="text-gray-600">{project.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={project.priority === 'high' ? 'destructive' : project.priority === 'medium' ? 'default' : 'secondary'}>
                        {project.priority} priority
                      </Badge>
                      <Badge variant="outline">{project.status}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">Type: {project.projectType}</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="brand" className="space-y-6">
          <BrandGuidelines brandGuidelines={brandGuidelines} />
        </TabsContent>

        {/* NEW: Studio Meetings Tab */}
        <TabsContent value="meetings" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Studio Meetings & CEO Presentations</h2>
              <p className="text-gray-600 mt-1">Weekly updates, presentations, and team collaboration</p>
            </div>
            <Button 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              onClick={() => {
                // Reset form for creating new meeting
                setEditingMeetingId(null);
                setMeetingFormData({
                  title: '',
                  description: '',
                  scheduledAt: '',
                  duration: 60,
                  location: '',
                  meetingLink: '',
                  meetingType: 'team_sync',
                  attendees: [],
                  isRecurring: false,
                  recurrencePattern: 'weekly',
                  recurrenceInterval: 1,
                  recurrenceEndDate: '',
                  recurrenceCount: 10,
                  reminderEnabled: true,
                  reminderMinutesBefore: 15,
                  previousWeekAccomplishments: '',
                  nextWeekPlans: '',
                  keyDiscussionPoints: '',
                  meetingSummary: '',
                  challenges: '',
                  solutions: '',
                  teamFeedback: '',
                  presentationNotes: ''
                });
                setAgendaItems([]);
                setMeetingDialogOpen(true);
              }}
              data-testid="schedule-meeting-btn"
            >
              <Video className="mr-2 h-4 w-4" />
              Create Meeting & Presentation
            </Button>
          </div>

          {/* Studio Overview Dashboard */}
          {overviewLoading ? (
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-8">
                <div className="text-center py-4 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-emerald-400 animate-pulse" />
                  <p className="text-sm">Loading studio overview...</p>
                </div>
              </CardContent>
            </Card>
          ) : overviewError ? (
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
              <CardContent className="p-8">
                <div className="text-center py-4 text-red-600">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-semibold">Failed to load studio overview</p>
                  <p className="text-sm text-gray-600 mt-1">Please refresh the page or try again later</p>
                </div>
              </CardContent>
            </Card>
          ) : studioOverview && (
            <div className="space-y-6 mb-6">
              {/* Overview Header */}
              <Card className="border-emerald-300 bg-gradient-to-r from-emerald-100 to-teal-100">
                <CardHeader>
                  <CardTitle className="text-emerald-800 flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Studio Overview - Current Status
                  </CardTitle>
                  <p className="text-sm text-gray-600">Real-time view of all studio activities and performance</p>
                </CardHeader>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <Card className="border-emerald-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Activity className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                      <p className="text-2xl font-bold text-emerald-600">{studioOverview.stats?.totalActiveCampaigns || 0}</p>
                      <p className="text-xs text-gray-600">Active Campaigns</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Target className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold text-blue-600">{studioOverview.stats?.totalPlannedCampaigns || 0}</p>
                      <p className="text-xs text-gray-600">Planned</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-purple-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Video className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold text-purple-600">{studioOverview.stats?.upcomingVideoShoots || 0}</p>
                      <p className="text-xs text-gray-600">Video Shoots</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-yellow-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Eye className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                      <p className="text-2xl font-bold text-yellow-600">{studioOverview.stats?.totalImpressions?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-600">Impressions</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-pink-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Heart className="h-6 w-6 mx-auto mb-2 text-pink-600" />
                      <p className="text-2xl font-bold text-pink-600">{studioOverview.stats?.totalEngagements?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-600">Engagements</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-green-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Zap className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold text-green-600">{studioOverview.stats?.totalConversions?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-600">Conversions</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Two Column Layout: Videos and Campaigns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Video Shoots */}
                <Card className="border-purple-200">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
                    <CardTitle className="text-purple-700 flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Upcoming Video Shoots
                    </CardTitle>
                    <p className="text-xs text-gray-600">Scheduled for the next 7 days</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    {studioOverview.upcomingVideos?.length > 0 ? (
                      <div className="space-y-3">
                        {studioOverview.upcomingVideos.map((video: any) => (
                          <div key={video.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm text-purple-900">{video.title}</h4>
                                {video.description && (
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{video.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(video.scheduledDate).toLocaleDateString()}
                                  </span>
                                  {video.platform && (
                                    <Badge variant="outline" className="text-xs">{video.platform}</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Video className="h-10 w-10 mx-auto mb-2 text-purple-300" />
                        <p className="text-sm">No video shoots scheduled for next 7 days</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Active Campaigns */}
                <Card className="border-emerald-200">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
                    <CardTitle className="text-emerald-700 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Active Campaigns
                    </CardTitle>
                    <p className="text-xs text-gray-600">Currently running and planned campaigns</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    {studioOverview.activeCampaigns?.length > 0 ? (
                      <div className="space-y-3">
                        {studioOverview.activeCampaigns.slice(0, 5).map((campaign: any) => (
                          <div key={campaign.id} className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-sm text-emerald-900">{campaign.name}</h4>
                                  <Badge 
                                    variant={campaign.status === 'active' ? 'default' : 'outline'}
                                    className={campaign.status === 'active' ? 'bg-emerald-500' : 'border-blue-500 text-blue-600'}
                                  >
                                    {campaign.status}
                                  </Badge>
                                </div>
                                {campaign.objective && (
                                  <p className="text-xs text-gray-600 mt-1">{campaign.objective}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  {campaign.platforms?.slice(0, 3).map((platform: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{platform}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="h-10 w-10 mx-auto mb-2 text-emerald-300" />
                        <p className="text-sm">No active campaigns</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Campaign Performance Table */}
              {studioOverview.campaignPerformance?.length > 0 && (
                <Card className="border-blue-200">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                    <CardTitle className="text-blue-700 flex items-center gap-2">
                      <BarChart className="h-5 w-5" />
                      Campaign Performance Metrics
                    </CardTitle>
                    <p className="text-xs text-gray-600">Top performing campaigns with engagement analytics</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Campaign</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Impressions</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Engagements</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Eng. Rate</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">CTR</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Conversions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studioOverview.campaignPerformance.map((campaign: any) => (
                            <tr key={campaign.id} className="border-b hover:bg-blue-50 transition-colors">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-semibold text-sm">{campaign.name}</p>
                                  <p className="text-xs text-gray-500">{campaign.status}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-sm">{campaign.impressions.toLocaleString()}</td>
                              <td className="px-4 py-3 text-center text-sm">{campaign.engagements.toLocaleString()}</td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                                  {campaign.engagementRate}%
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant="outline" className="text-blue-600 border-blue-300">
                                  {campaign.ctr}%
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">
                                {campaign.conversions}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Custom Dashboard Sections */}
          {dashboardSections.filter((s: any) => s.isVisible).length > 0 && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-indigo-600" />
                  Custom Dashboard Sections
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTab('dashboard-settings')}
                  className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                  data-testid="button-manage-sections"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Manage
                </Button>
              </div>
              
              {dashboardSections
                .filter((s: any) => s.isVisible)
                .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
                .map((section: any) => (
                  <CustomDashboardSection key={section.id} section={section} />
                ))}
            </div>
          )}

          <Separator className="my-6" />

          {/* Meetings Section Header */}
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Your Meetings & Presentations</h3>
            <p className="text-sm text-gray-600">Create and view weekly CEO presentations below</p>
          </div>

          {meetingsLoading ? (
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-8">
                <div className="text-center py-8 text-gray-500">
                  <Video className="h-12 w-12 mx-auto mb-4 text-emerald-400 animate-pulse" />
                  <p className="font-semibold mb-2">Loading meetings...</p>
                </div>
              </CardContent>
            </Card>
          ) : meetings.length === 0 ? (
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardHeader>
                <CardTitle className="text-emerald-700">No Meetings Yet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Video className="h-12 w-12 mx-auto mb-4 text-emerald-400" />
                  <p className="font-semibold mb-2">Start your first weekly meeting</p>
                  <p className="text-sm">Create comprehensive presentations to share team progress with leadership</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting: any) => (
                <Card key={meeting.id} className="border-emerald-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-emerald-700 flex items-center gap-2">
                          <Video className="h-5 w-5" />
                          {meeting.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{meeting.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(meeting.scheduledStartTime).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(meeting.scheduledStartTime).toLocaleTimeString()}
                          </span>
                          <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                            {meeting.meetingType?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Quick Preview of Presentation Content */}
                      {(meeting.previousWeekAccomplishments || meeting.nextWeekPlans) && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                          {meeting.previousWeekAccomplishments && (
                            <div>
                              <h4 className="font-semibold text-sm text-emerald-900 mb-2 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Last Week
                              </h4>
                              <p className="text-xs text-gray-700 line-clamp-2">{meeting.previousWeekAccomplishments}</p>
                            </div>
                          )}
                          {meeting.nextWeekPlans && (
                            <div>
                              <h4 className="font-semibold text-sm text-emerald-900 mb-2 flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                Next Week
                              </h4>
                              <p className="text-xs text-gray-700 line-clamp-2">{meeting.nextWeekPlans}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMeeting(meeting);
                            setPresentationMode(true);
                          }}
                          className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 hover:from-emerald-100 hover:to-teal-100"
                          data-testid={`view-presentation-${meeting.id}`}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Presentation
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Populate form with meeting data for editing
                            setEditingMeetingId(meeting.id);
                            setMeetingFormData({
                              title: meeting.title || '',
                              description: meeting.description || '',
                              scheduledAt: meeting.scheduledStartTime ? new Date(meeting.scheduledStartTime).toISOString().slice(0, 16) : '',
                              duration: meeting.duration || 60,
                              location: meeting.location || '',
                              meetingLink: meeting.meetingLink || '',
                              meetingType: meeting.meetingType || 'team_sync',
                              attendees: meeting.attendeeIds || [],
                              isRecurring: meeting.isRecurring || false,
                              recurrencePattern: meeting.recurrencePattern || 'weekly',
                              recurrenceInterval: meeting.recurrenceInterval || 1,
                              recurrenceEndDate: meeting.recurrenceEndDate || '',
                              recurrenceCount: meeting.recurrenceCount || 10,
                              reminderEnabled: meeting.reminderEnabled !== false,
                              reminderMinutesBefore: meeting.reminderMinutesBefore || 15,
                              previousWeekAccomplishments: meeting.previousWeekAccomplishments || '',
                              nextWeekPlans: meeting.nextWeekPlans || '',
                              keyDiscussionPoints: meeting.keyDiscussionPoints || '',
                              meetingSummary: meeting.meetingSummary || '',
                              challenges: meeting.challenges || '',
                              solutions: meeting.solutions || '',
                              teamFeedback: meeting.teamFeedback || '',
                              presentationNotes: meeting.presentationNotes || ''
                            });
                            // Parse agenda items if available
                            if (meeting.agenda) {
                              try {
                                const parsedAgenda = typeof meeting.agenda === 'string' ? JSON.parse(meeting.agenda) : meeting.agenda;
                                setAgendaItems(Array.isArray(parsedAgenda) ? parsedAgenda : []);
                              } catch (e) {
                                setAgendaItems([]);
                              }
                            } else {
                              setAgendaItems([]);
                            }
                            setMeetingDialogOpen(true);
                          }}
                          data-testid={`edit-meeting-${meeting.id}`}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* NEW: Creative Briefs Tab */}
        <TabsContent value="briefs" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Creative Briefs</h2>
              <p className="text-gray-600 mt-1">Manage creative projects from concept to completion</p>
            </div>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => {
                resetBriefForm();
                setBriefDialogOpen(true);
              }}
              data-testid="new-brief-button"
            >
              <Briefcase className="mr-2 h-4 w-4" />
              New Brief
            </Button>
          </div>

          {briefsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600" data-testid="draft-briefs-count">
                      {creativeBriefs.filter((b: any) => b.status === 'draft').length}
                    </p>
                    <p className="text-sm text-gray-600">Draft Briefs</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600" data-testid="in-production-briefs-count">
                      {creativeBriefs.filter((b: any) => b.status === 'in_production').length}
                    </p>
                    <p className="text-sm text-gray-600">In Production</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600" data-testid="completed-briefs-count">
                      {creativeBriefs.filter((b: any) => b.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Active Briefs</CardTitle>
            </CardHeader>
            <CardContent>
              {briefsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : creativeBriefs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                  <p className="font-semibold mb-2">No active briefs</p>
                  <p className="text-sm">Create your first creative brief to start your next project</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {creativeBriefs
                    .filter((brief: any) => brief.status !== 'completed')
                    .map((brief: any) => (
                      <Card key={brief.id} className="border-l-4 border-l-purple-500" data-testid={`brief-card-${brief.id}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{brief.title}</h3>
                              {brief.description && (
                                <p className="text-gray-600 text-sm mt-1">{brief.description}</p>
                              )}
                              <div className="flex gap-4 mt-3 text-sm text-gray-500">
                                {brief.deadline && (
                                  <span>📅 {new Date(brief.deadline).toLocaleDateString()}</span>
                                )}
                                {brief.status && (
                                  <span className={`px-2 py-1 rounded ${
                                    brief.status === 'draft' ? 'bg-purple-100 text-purple-700' :
                                    brief.status === 'in_production' ? 'bg-blue-100 text-blue-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {brief.status === 'in_production' ? 'In Production' : brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setEditingBriefId(brief.id);
                                  setBriefFormData({
                                    title: brief.title || '',
                                    description: brief.description || '',
                                    objective: brief.objective || '',
                                    targetAudience: brief.targetAudience || '',
                                    keyMessage: brief.keyMessage || '',
                                    toneAndStyle: brief.toneAndStyle || '',
                                    deadline: brief.deadline ? new Date(brief.deadline).toISOString().split('T')[0] : '',
                                    status: brief.status || 'draft',
                                    assignedTo: brief.assignedTo || null,
                                    campaignId: brief.campaignId || null,
                                  });
                                  setBriefDialogOpen(true);
                                }}
                                data-testid={`edit-brief-${brief.id}`}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Asset Library Tab */}
        <TabsContent value="assets">
          <AssetLibraryTab />
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals">
          <ApprovalWorkflowsTab />
        </TabsContent>

        {/* NEW: Studio Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Studio Reports</h2>
              <p className="text-gray-600 mt-1">Comprehensive analytics for admin and HR visibility</p>
            </div>
            <Button className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700">
              <BarChart className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Campaigns', value: '0', icon: Target, color: 'blue' },
              { label: 'Content Created', value: '0', icon: FileText, color: 'green' },
              { label: 'Meetings Held', value: '0', icon: Video, color: 'purple' },
              { label: 'Assets Created', value: '0', icon: Image, color: 'pink' }
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className={`border-${color}-200`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{label}</p>
                      <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
                    </div>
                    <Icon className={`h-8 w-8 text-${color}-400`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-pink-400" />
                  <p className="font-semibold mb-2">No data available</p>
                  <p className="text-sm">Team performance metrics will appear here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-rose-400" />
                  <p className="font-semibold mb-2">No data available</p>
                  <p className="text-sm">Content pipeline analytics will appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Meeting Scheduling Dialog */}
      <MeetingDialog
        open={meetingDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Reset form when dialog closes to prevent stale state
            resetMeetingForm();
          } else {
            setMeetingDialogOpen(open);
          }
        }}
        meetingFormData={meetingFormData}
        setMeetingFormData={setMeetingFormData}
        agendaItems={agendaItems}
        setAgendaItems={setAgendaItems}
        onSubmit={handleMeetingSubmit}
        users={users}
        usersLoading={usersLoading}
        isPending={createMeetingMutation.isPending || updateMeetingMutation.isPending}
        editingMeetingId={editingMeetingId}
      />

      {/* Creative Brief Dialog */}
      <CreativeBriefDialog
        open={briefDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetBriefForm();
          }
          setBriefDialogOpen(open);
        }}
        formData={briefFormData}
        setFormData={setBriefFormData}
        onSubmit={handleBriefSubmit}
        users={users}
        campaigns={campaigns}
        isPending={createBriefMutation.isPending || updateBriefMutation.isPending}
        editingBriefId={editingBriefId}
      />

      {/* Analytics Entry Dialog */}
      <AnalyticsEntryDialog
        open={analyticsEntryDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetAnalyticsEntryForm();
          }
          setAnalyticsEntryDialogOpen(open);
        }}
        formData={analyticsEntryFormData}
        setFormData={setAnalyticsEntryFormData}
        onSubmit={handleAnalyticsEntrySubmit}
        campaigns={campaigns}
        isPending={createAnalyticsEntryMutation.isPending || updateAnalyticsEntryMutation.isPending}
        editingEntryId={editingAnalyticsEntryId}
      />

      {/* CEO Presentation View Dialog */}
      <Dialog open={presentationMode} onOpenChange={setPresentationMode}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-emerald-50 via-white to-teal-50">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-emerald-600" />
                  {selectedMeeting?.title}
                </DialogTitle>
                <p className="text-gray-600 mt-2">{selectedMeeting?.description}</p>
              </div>
              <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-lg px-4 py-2">
                CEO Presentation
              </Badge>
            </div>
            <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {selectedMeeting && new Date(selectedMeeting.scheduledStartTime).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {selectedMeeting && new Date(selectedMeeting.scheduledStartTime).toLocaleTimeString()}
              </span>
            </div>
          </DialogHeader>

          {selectedMeeting && (
            <div className="space-y-6 py-6">
              {/* Executive Summary - Prominently displayed at top */}
              {selectedMeeting.meetingSummary && (
                <div className="p-8 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg border-2 border-emerald-300 shadow-lg">
                  <h3 className="text-2xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
                    <Award className="h-7 w-7" />
                    Executive Summary
                  </h3>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed font-medium">
                      {selectedMeeting.meetingSummary}
                    </p>
                  </div>
                </div>
              )}

              {/* Previous Meeting Notes - Show context from previous meeting */}
              {previousMeetingWork && previousMeetingWork.previousMeeting && (
                <div className="p-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border-2 border-purple-300 shadow-lg">
                  <h3 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                    <FileText className="h-7 w-7" />
                    Previous Meeting Notes
                  </h3>
                  <p className="text-sm text-purple-700 mb-6 font-semibold">
                    From: {previousMeetingWork.previousMeeting.title}
                    {' '}({new Date(previousMeetingWork.previousMeeting.scheduledStartTime).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })})
                  </p>

                  <div className="space-y-6">
                    {previousMeetingWork.previousMeeting.meetingSummary && (
                      <div>
                        <h4 className="text-lg font-bold text-purple-900 mb-2 flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          Meeting Summary
                        </h4>
                        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-lg border border-purple-200">
                          {previousMeetingWork.previousMeeting.meetingSummary}
                        </p>
                      </div>
                    )}

                    {previousMeetingWork.previousMeeting.keyDiscussionPoints && (
                      <div>
                        <h4 className="text-lg font-bold text-purple-900 mb-2 flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Key Discussion Points
                        </h4>
                        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-lg border border-purple-200">
                          {previousMeetingWork.previousMeeting.keyDiscussionPoints}
                        </p>
                      </div>
                    )}

                    {previousMeetingWork.previousMeeting.previousWeekAccomplishments && (
                      <div>
                        <h4 className="text-lg font-bold text-purple-900 mb-2 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Previous Week Accomplishments
                        </h4>
                        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-lg border border-purple-200">
                          {previousMeetingWork.previousMeeting.previousWeekAccomplishments}
                        </p>
                      </div>
                    )}

                    {previousMeetingWork.previousMeeting.challenges && (
                      <div>
                        <h4 className="text-lg font-bold text-purple-900 mb-2 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          Challenges
                        </h4>
                        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-lg border border-purple-200">
                          {previousMeetingWork.previousMeeting.challenges}
                        </p>
                      </div>
                    )}

                    {previousMeetingWork.previousMeeting.solutions && (
                      <div>
                        <h4 className="text-lg font-bold text-purple-900 mb-2 flex items-center gap-2">
                          <Lightbulb className="h-5 w-5" />
                          Solutions
                        </h4>
                        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-lg border border-purple-200">
                          {previousMeetingWork.previousMeeting.solutions}
                        </p>
                      </div>
                    )}

                    {previousMeetingWork.previousMeeting.presentationNotes && (
                      <div>
                        <h4 className="text-lg font-bold text-purple-900 mb-2 flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Presentation Notes
                        </h4>
                        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-lg border border-purple-200">
                          {previousMeetingWork.previousMeeting.presentationNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Last Meeting Work Done */}
              {previousMeetingWork && previousMeetingWork.workItems && previousMeetingWork.workItems.length > 0 && (
                <div className="p-8 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg border-2 border-blue-300 shadow-lg">
                  <h3 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <History className="h-7 w-7" />
                    Last Meeting Work Done
                  </h3>
                  {previousMeetingWork.previousMeeting && (
                    <p className="text-sm text-blue-700 mb-6">
                      From: <span className="font-semibold">{previousMeetingWork.previousMeeting.title}</span>
                      {' '}({new Date(previousMeetingWork.previousMeeting.scheduledStartTime).toLocaleDateString()})
                    </p>
                  )}
                  
                  <div className="space-y-3">
                    {previousMeetingWork.workItems.map((item: any) => (
                      <div key={item.id} className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm" data-testid={`previous-work-item-${item.id}`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{item.title}</div>
                            {item.description && (
                              <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                            )}
                          </div>
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            Completed
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Tag className="h-4 w-4" />
                            {item.category}
                          </span>
                          {item.assignedToUser && (
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {item.assignedToUser.username}
                            </span>
                          )}
                          {item.completionDate && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              {new Date(item.completionDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        
                        {item.progressPercentage !== null && item.progressPercentage > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>Progress</span>
                              <span className="font-semibold">{item.progressPercentage}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                style={{ width: `${item.progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Post-Meeting Work Analytics */}
              {(presentationWorkItems.length > 0 || presentationLinks.length > 0) && (
                <div className="p-8 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg border-2 border-purple-300 shadow-lg">
                  <h3 className="text-2xl font-bold text-purple-800 mb-6 flex items-center gap-2">
                    <TrendingUp className="h-7 w-7" />
                    Post-Meeting Work Analytics
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Work Items Column */}
                    {presentationWorkItems.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-purple-700 flex items-center gap-2">
                          <ListTodo className="h-5 w-5" />
                          Completed Work Items ({presentationWorkItems.length})
                        </h4>
                        <div className="space-y-3">
                          {presentationWorkItems.map((item: any) => (
                            <div key={item.id} className="p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">{item.title}</div>
                                  {item.description && (
                                    <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                                  )}
                                </div>
                                <Badge className={
                                  item.status === 'completed' ? 'bg-green-100 text-green-800 border-green-300' :
                                  item.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                  'bg-gray-100 text-gray-800 border-gray-300'
                                }>
                                  {item.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Tag className="h-4 w-4" />
                                  {item.category}
                                </span>
                                {item.assignedTo && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {users.find((u: any) => u.id === item.assignedTo)?.username || 'Unknown'}
                                  </span>
                                )}
                              </div>
                              
                              {item.progress !== null && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                    <span>Progress</span>
                                    <span className="font-semibold">{item.progress}%</span>
                                  </div>
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                                      style={{ width: `${item.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Links Column */}
                    {presentationLinks.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-purple-700 flex items-center gap-2">
                          <ExternalLink className="h-5 w-5" />
                          Shared Resources ({presentationLinks.length})
                        </h4>
                        <div className="space-y-3">
                          {presentationLinks.map((link: any) => (
                            <div key={link.id} className="p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Link className="h-4 w-4 text-purple-600" />
                                    {link.title}
                                  </div>
                                  {link.description && (
                                    <div className="text-sm text-gray-600 mt-1">{link.description}</div>
                                  )}
                                  <a 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-purple-600 hover:text-purple-800 hover:underline mt-1 inline-block break-all"
                                  >
                                    {link.url}
                                  </a>
                                </div>
                                <Badge className={
                                  link.linkType === 'documentation' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                  link.linkType === 'resource' ? 'bg-green-100 text-green-800 border-green-300' :
                                  link.linkType === 'tool' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                  'bg-gray-100 text-gray-800 border-gray-300'
                                }>
                                  {link.linkType}
                                </Badge>
                              </div>
                              
                              {link.clickCount > 0 && (
                                <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <BarChart3 className="h-3 w-3" />
                                    {link.clickCount} {link.clickCount === 1 ? 'click' : 'clicks'}
                                  </span>
                                  {link.lastAccessedAt && (
                                    <span>
                                      Last accessed: {new Date(link.lastAccessedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Social Media Analytics Performance */}
              <div className="p-8 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg border-2 border-pink-300 shadow-lg">
                <h3 className="text-2xl font-bold text-pink-800 mb-6 flex items-center gap-2">
                  <BarChart3 className="h-7 w-7" />
                  Social Media Performance Analytics
                </h3>
                
                {analyticsEntries && analyticsEntries.length > 0 ? (
                  <>
                    {/* Summary Metrics */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-white rounded-lg border border-pink-200 shadow-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pink-600">
                          {analyticsEntries.reduce((sum: number, entry: any) => sum + (entry.reach || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Total Reach</div>
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-pink-200 shadow-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-rose-600">
                          {analyticsEntries.reduce((sum: number, entry: any) => sum + (entry.impressions || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Total Impressions</div>
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-pink-200 shadow-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {analyticsEntries.reduce((sum: number, entry: any) => sum + (entry.engagement || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Total Engagement</div>
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-pink-200 shadow-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(() => {
                            const totalReach = analyticsEntries.reduce((sum: number, entry: any) => sum + (entry.reach || 0), 0);
                            const totalEngagement = analyticsEntries.reduce((sum: number, entry: any) => sum + (entry.engagement || 0), 0);
                            return totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(1) : '0.0';
                          })()}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Engagement Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Posts Performance */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-pink-700 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Recent Posts Performance (Last {Math.min(analyticsEntries.length, 5)})
                    </h4>
                    <div className="space-y-3">
                      {analyticsEntries.slice(0, 5).map((entry: any) => (
                        <div key={entry.id} className="p-4 bg-white rounded-lg border border-pink-200 shadow-sm">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 flex items-center gap-2">
                                {entry.postTitle}
                                {entry.postUrl && (
                                  <a 
                                    href={entry.postUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                    data-testid={`post-link-${entry.id}`}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={
                                  entry.platform === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                                  entry.platform === 'facebook' ? 'bg-blue-600 text-white' :
                                  entry.platform === 'twitter' ? 'bg-sky-500 text-white' :
                                  entry.platform === 'linkedin' ? 'bg-blue-700 text-white' :
                                  entry.platform === 'tiktok' ? 'bg-black text-white' :
                                  entry.platform === 'youtube' ? 'bg-red-600 text-white' :
                                  'bg-gray-600 text-white'
                                }>
                                  {entry.platform.charAt(0).toUpperCase() + entry.platform.slice(1)}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(entry.postDate).toLocaleDateString()}
                                </span>
                                {entry.postUrl && (
                                  <a 
                                    href={entry.postUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                  >
                                    View Post <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Metrics Grid */}
                          <div className="grid grid-cols-6 gap-3 mt-3 pt-3 border-t border-gray-200">
                            <div className="text-center">
                              <div className="text-sm font-bold text-pink-600">{entry.reach?.toLocaleString() || 0}</div>
                              <div className="text-xs text-gray-500">Reach</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold text-rose-600">{entry.impressions?.toLocaleString() || 0}</div>
                              <div className="text-xs text-gray-500">Impressions</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold text-purple-600">{entry.engagement?.toLocaleString() || 0}</div>
                              <div className="text-xs text-gray-500">Engagement</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold text-blue-600">{entry.likes?.toLocaleString() || 0}</div>
                              <div className="text-xs text-gray-500">Likes</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold text-green-600">{entry.comments?.toLocaleString() || 0}</div>
                              <div className="text-xs text-gray-500">Comments</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold text-orange-600">{entry.shares?.toLocaleString() || 0}</div>
                              <div className="text-xs text-gray-500">Shares</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Platform Performance Breakdown */}
                  <div className="mt-6 p-4 bg-white rounded-lg border border-pink-200 shadow-sm">
                    <h4 className="text-lg font-semibold text-pink-700 mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Platform Performance Breakdown
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube']
                        .map(platform => {
                          const platformEntries = analyticsEntries.filter((e: any) => e.platform === platform);
                          if (platformEntries.length === 0) return null;
                          const totalReach = platformEntries.reduce((sum: number, e: any) => sum + (e.reach || 0), 0);
                          const totalEngagement = platformEntries.reduce((sum: number, e: any) => sum + (e.engagement || 0), 0);
                          return (
                            <div key={platform} className="p-3 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200">
                              <div className="font-semibold text-gray-900 capitalize mb-2">{platform}</div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Posts:</span>
                                  <span className="font-semibold">{platformEntries.length}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Reach:</span>
                                  <span className="font-semibold text-pink-600">{totalReach.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Engagement:</span>
                                  <span className="font-semibold text-purple-600">{totalEngagement.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                        .filter(Boolean)
                      }
                    </div>
                  </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-white/60 rounded-lg">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-pink-400" />
                    <p className="font-semibold text-lg mb-2">No Analytics Data Yet</p>
                    <p className="text-sm text-gray-600 mb-4">
                      Add analytics entries in the Analytics tab to see performance metrics here
                    </p>
                    <Button
                      onClick={() => {
                        setPresentationMode(false);
                        setSelectedTab('analytics');
                      }}
                      className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Go to Analytics Tab
                    </Button>
                  </div>
                )}
              </div>

              {/* Previous Week Accomplishments */}
              {selectedMeeting.previousWeekAccomplishments && (
                <div className="p-6 bg-white rounded-lg border-2 border-green-200 shadow-sm">
                  <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-6 w-6" />
                    Previous Week Accomplishments
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {selectedMeeting.previousWeekAccomplishments}
                    </p>
                  </div>
                </div>
              )}

              {/* Next Week Plans */}
              {selectedMeeting.nextWeekPlans && (
                <div className="p-6 bg-white rounded-lg border-2 border-blue-200 shadow-sm">
                  <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Next Week Plans & Goals
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {selectedMeeting.nextWeekPlans}
                    </p>
                  </div>
                </div>
              )}

              {/* Key Discussion Points */}
              {selectedMeeting.keyDiscussionPoints && (
                <div className="p-6 bg-white rounded-lg border-2 border-purple-200 shadow-sm">
                  <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
                    <MessageSquare className="h-6 w-6" />
                    Key Discussion Points
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {selectedMeeting.keyDiscussionPoints}
                    </p>
                  </div>
                </div>
              )}

              {/* Challenges & Solutions */}
              {(selectedMeeting.challenges || selectedMeeting.solutions) && (
                <div className="grid grid-cols-2 gap-6">
                  {selectedMeeting.challenges && (
                    <div className="p-6 bg-white rounded-lg border-2 border-red-200 shadow-sm">
                      <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                        <AlertCircle className="h-6 w-6" />
                        Challenges Faced
                      </h3>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {selectedMeeting.challenges}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedMeeting.solutions && (
                    <div className="p-6 bg-white rounded-lg border-2 border-emerald-200 shadow-sm">
                      <h3 className="text-xl font-bold text-emerald-700 mb-4 flex items-center gap-2">
                        <Zap className="h-6 w-6" />
                        Solutions & Actions
                      </h3>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {selectedMeeting.solutions}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Team Feedback */}
              {selectedMeeting.teamFeedback && (
                <div className="p-6 bg-white rounded-lg border-2 border-yellow-200 shadow-sm">
                  <h3 className="text-xl font-bold text-yellow-700 mb-4 flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    Team Feedback & Insights
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {selectedMeeting.teamFeedback}
                    </p>
                  </div>
                </div>
              )}

              {/* Presentation Notes */}
              {selectedMeeting.presentationNotes && (
                <div className="p-6 bg-white rounded-lg border-2 border-gray-300 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <FileText className="h-6 w-6" />
                    Additional Notes
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {selectedMeeting.presentationNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t mt-6">
            <Button 
              variant="outline" 
              onClick={() => setPresentationMode(false)}
            >
              Close Presentation
            </Button>
            <Button 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              onClick={() => window.print()}
            >
              <Download className="mr-2 h-4 w-4" />
              Print/Export
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}