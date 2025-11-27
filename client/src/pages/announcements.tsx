import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BellRing, Plus, Edit, Trash2, Users, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Announcement } from '@shared/schema';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  isPublished: z.boolean().default(false),
  targetRoles: z.array(z.string()).optional(),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

const roleOptions = [
  { id: 'hr_admin', label: 'HR Admin' },
  { id: 'branch_manager', label: 'Branch Manager' },
  { id: 'team_lead', label: 'Team Lead' },
  { id: 'employee', label: 'Employee' },
  { id: 'logistics_manager', label: 'Logistics Manager' },
];

export default function Announcements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      isPublished: false,
      targetRoles: [],
    },
  });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['/api/announcements'],
    retry: false,
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      return await apiRequest('POST', '/api/announcements', {
        ...data,
        authorId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      setShowAddDialog(false);
      form.reset();
      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      if (error.status === 403) {
        toast({
          title: "Access Denied",
          description: "Only HR Administrators and Branch Managers can create announcements.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AnnouncementFormData> }) => {
      return await apiRequest('PUT', `/api/announcements/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      setEditingAnnouncement(null);
      form.reset();
      toast({
        title: "Success",
        description: "Announcement updated successfully",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      if (error.status === 403) {
        toast({
          title: "Access Denied", 
          description: "Only HR Administrators and Branch Managers can edit announcements.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      if (error.status === 403) {
        toast({
          title: "Access Denied",
          description: "Only HR Administrators and Branch Managers can delete announcements.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AnnouncementFormData) => {
    if (editingAnnouncement) {
      updateAnnouncementMutation.mutate({ id: editingAnnouncement.id, data });
    } else {
      createAnnouncementMutation.mutate(data);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    form.reset({
      title: announcement.title,
      content: announcement.content,
      isPublished: announcement.isPublished,
      targetRoles: announcement.targetRoles || [],
    });
  };

  const canManageAnnouncements = user?.role && ['hr_admin', 'branch_manager'].includes(user.role);
  
  // If user doesn't have permission to manage announcements, show read-only view
  if (!canManageAnnouncements) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <BellRing className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Only HR Administrators and Branch Managers can access the announcements management system.
          </p>
        </div>
      </div>
    );
  }

  const getRoleDisplayName = (role: string) => {
    const roleMap = {
      hr_admin: 'HR Admin',
      branch_manager: 'Branch Manager',
      team_lead: 'Team Lead',
      employee: 'Employee',
      logistics_manager: 'Logistics Manager'
    };
    return roleMap[role] || role;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Announcements</h2>
          <p className="text-gray-600 mt-1">Manage company announcements and communications</p>
        </div>
        
        {canManageAnnouncements && (
          <Dialog open={showAddDialog || !!editingAnnouncement} onOpenChange={(open) => {
            if (!open) {
              setShowAddDialog(false);
              setEditingAnnouncement(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowAddDialog(true)} className="btn-primary">
                <Plus className="mr-2" size={16} />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter announcement title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter announcement content" 
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="targetRoles"
                    render={() => (
                      <FormItem>
                        <FormLabel>Target Roles (leave empty for all roles)</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {roleOptions.map((role) => (
                            <FormField
                              key={role.id}
                              control={form.control}
                              name="targetRoles"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(role.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([...(field.value || []), role.id]);
                                        } else {
                                          field.onChange(
                                            field.value?.filter((value) => value !== role.id)
                                          );
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {role.label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Publish immediately
                          </FormLabel>
                          <p className="text-sm text-gray-600">
                            Uncheck to save as draft
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddDialog(false);
                        setEditingAnnouncement(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending}
                      className="btn-primary"
                    >
                      {editingAnnouncement ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="stats-card animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : announcements && announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement: Announcement) => (
            <Card key={announcement.id} className="stats-card hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <BellRing className="text-primary" size={20} />
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      <Badge className={announcement.isPublished ? 'status-active' : 'status-inactive'}>
                        {announcement.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Users className="mr-1" size={14} />
                        By: {announcement.author.firstName} {announcement.author.lastName}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="mr-1" size={14} />
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {canManageAnnouncements && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(announcement)}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                  {announcement.content}
                </p>
                
                {announcement.targetRoles && announcement.targetRoles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-600">Target roles:</span>
                    {announcement.targetRoles.map((role) => (
                      <Badge key={role} variant="outline" className="text-xs">
                        {getRoleDisplayName(role)}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="stats-card">
          <CardContent className="p-12 text-center">
            <BellRing className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
            <p className="text-gray-600 mb-4">No announcements have been posted yet</p>
            {canManageAnnouncements && (
              <Button onClick={() => setShowAddDialog(true)} className="btn-primary">
                <Plus className="mr-2" size={16} />
                Create First Announcement
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
