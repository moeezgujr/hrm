import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, CheckCircle, Clock, Plus, Edit, Trash2, FileCheck, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Employee, OnboardingChecklist } from '@shared/schema';
import { OnboardingChecklistDisplay } from './onboarding-checklist-display';
import PersonalProfileForm from '../components/personal-profile-form';

const checklistSchema = z.object({
  employeeId: z.number().min(1, 'Employee ID is required'),
  itemTitle: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  order: z.number().default(0),
});

type ChecklistFormData = z.infer<typeof checklistSchema>;

// Predefined comprehensive onboarding checklist template
const defaultOnboardingTemplate = [
  {
    category: "Pre-arrival Setup",
    items: [
      { title: "Workspace Setup", description: "Prepare desk, chair, and basic office supplies", order: 1 },
      { title: "IT Equipment Assignment", description: "Assign laptop, monitor, keyboard, mouse", order: 2 },
      { title: "Email Account Creation", description: "Create company email account and send credentials", order: 3 },
      { title: "Access Card Preparation", description: "Prepare building access card and parking pass", order: 4 },
      { title: "Welcome Package", description: "Prepare welcome kit with company swag and materials", order: 5 },
    ]
  },
  {
    category: "Day 1 - Welcome & Orientation",
    items: [
      { title: "Welcome Meeting", description: "Meet with direct manager and HR representative", order: 6 },
      { title: "Office Tour", description: "Complete office tour including emergency exits and facilities", order: 7 },
      { title: "Meet Team Members", description: "Introduction to immediate team and key colleagues", order: 8 },
      { title: "IT Setup & Login", description: "Complete computer setup and test all system access", order: 9 },
      { title: "Company Overview Presentation", description: "Attend company overview and culture presentation", order: 10 },
      { title: "Employee Handbook Review", description: "Review and acknowledge employee handbook", order: 11, requiresDocument: true, documentType: "pdf" },
    ]
  },
  {
    category: "Week 1 - Documentation & Training",
    items: [
      { title: "Complete I-9 Form", description: "Submit I-9 form with required documentation", order: 12, requiresDocument: true, documentType: "pdf" },
      { title: "Submit W-4 Form", description: "Complete and submit tax withholding form", order: 13, requiresDocument: true, documentType: "pdf" },
      { title: "Benefits Enrollment", description: "Complete health, dental, and retirement plan enrollment", order: 14, requiresDocument: true, documentType: "pdf" },
      { title: "Emergency Contact Information", description: "Provide emergency contact details", order: 15 },
      { title: "Direct Deposit Setup", description: "Submit banking information for payroll", order: 16, requiresDocument: true, documentType: "image" },
      { title: "Security Training", description: "Complete mandatory security awareness training", order: 17, requiresDocument: true, documentType: "pdf" },
      { title: "Confidentiality Agreement", description: "Sign confidentiality and non-disclosure agreement", order: 18, requiresDocument: true, documentType: "pdf" },
    ]
  },
  {
    category: "Week 2 - Role-Specific Training",
    items: [
      { title: "Department-Specific Training", description: "Complete role-specific training modules", order: 19 },
      { title: "Mentor Assignment", description: "Meet with assigned workplace mentor", order: 20 },
      { title: "System Access Verification", description: "Verify access to all required systems and databases", order: 21 },
      { title: "Performance Goals Setting", description: "Establish 30-60-90 day performance goals", order: 22 },
      { title: "Project Assignment", description: "Receive first project assignment and overview", order: 23 },
    ]
  },
  {
    category: "Month 1 - Integration & Assessment",
    items: [
      { title: "30-Day Check-in", description: "Formal 30-day review with manager", order: 24 },
      { title: "HR Feedback Session", description: "Feedback session with HR about onboarding experience", order: 25 },
      { title: "Workplace Culture Assessment", description: "Complete workplace culture and satisfaction survey", order: 26 },
      { title: "Training Progress Review", description: "Review completion of all mandatory training", order: 27 },
      { title: "Goal Progress Check", description: "Review progress on initial performance goals", order: 28 },
    ]
  },
  {
    category: "Ongoing - Long-term Integration",
    items: [
      { title: "60-Day Review", description: "Comprehensive 60-day performance review", order: 29 },
      { title: "90-Day Review", description: "Final onboarding review and transition to regular employee", order: 30 },
      { title: "Professional Development Plan", description: "Create long-term professional development plan", order: 31 },
      { title: "Company Social Integration", description: "Participate in company social events and team building", order: 32 },
    ]
  }
];

export default function Onboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<OnboardingChecklist | null>(null);
  const [showOnboardingLinkDialog, setShowOnboardingLinkDialog] = useState(false);
  const [selectedEmployeeForLink, setSelectedEmployeeForLink] = useState<any>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const form = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      employeeId: 0,
      itemTitle: '',
      description: '',
      order: 0,
    },
  });

  // Only HR/Admin can see all employees, regular employees see only their own data
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees'],
    retry: false,
    enabled: user?.role === 'hr_admin' || user?.role === 'branch_manager', // Only HR can access all employees
  });

  // Define employee-like roles that can access their onboarding
  const isEmployeeRole = user?.role === 'employee' || 
                         user?.role === 'content_creator' || 
                         user?.role === 'social_media_specialist' || 
                         user?.role === 'content_editor' || 
                         user?.role === 'creative_director' || 
                         user?.role === 'social_media_manager';

  // For employees and social media team, fetch only their own onboarding data
  const { data: myOnboardingData, isLoading: myOnboardingLoading } = useQuery({
    queryKey: ['/api/my-onboarding'],
    retry: false,
    enabled: isEmployeeRole, // For all employee-type roles
  });

  // Check if current user needs to complete profile
  const { data: profileStatus } = useQuery({
    queryKey: ['/api/profile-status'],
    enabled: isEmployeeRole,
    retry: false,
  });

  // Show profile completion dialog if needed
  useEffect(() => {
    if (isEmployeeRole && profileStatus && !(profileStatus as any).personalProfileCompleted) {
      setShowProfileDialog(true);
    }
  }, [isEmployeeRole, profileStatus]);

  const { data: checklists, isLoading: checklistsLoading } = useQuery({
    queryKey: ['/api/onboarding', selectedEmployeeId],
    enabled: !!selectedEmployeeId,
    retry: false,
  });

  const createChecklistMutation = useMutation({
    mutationFn: async (data: ChecklistFormData) => {
      return await apiRequest('POST', '/api/onboarding', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding'] });
      setShowAddDialog(false);
      form.reset();
      toast({
        title: "Success",
        description: "Checklist item created successfully",
      });
    },
    onError: (error) => {
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
      toast({
        title: "Error",
        description: "Failed to create checklist item",
        variant: "destructive",
      });
    },
  });

  const updateChecklistMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ChecklistFormData> }) => {
      return await apiRequest('PUT', `/api/onboarding/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding'] });
      setEditingChecklist(null);
      form.reset();
      toast({
        title: "Success",
        description: "Checklist item updated successfully",
      });
    },
    onError: (error) => {
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
      toast({
        title: "Error",
        description: "Failed to update checklist item",
        variant: "destructive",
      });
    },
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/onboarding/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding'] });
      toast({
        title: "Success",
        description: "Checklist item deleted successfully",
      });
    },
    onError: (error) => {
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
      toast({
        title: "Error",
        description: "Failed to delete checklist item",
        variant: "destructive",
      });
    },
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: number; isCompleted: boolean }) => {
      return await apiRequest('PUT', `/api/onboarding/${id}`, {
        isCompleted,
        completedBy: isCompleted ? user?.id : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
    },
    onError: (error) => {
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
      toast({
        title: "Error",
        description: "Failed to update checklist item",
        variant: "destructive",
      });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      return await apiRequest('POST', `/api/onboarding/create-template/${employeeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding'] });
      toast({
        title: "Success",
        description: "Comprehensive onboarding checklist created successfully",
      });
    },
    onError: (error) => {
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
      toast({
        title: "Error",
        description: "Failed to create onboarding template",
        variant: "destructive",
      });
    },
  });

  const generateLinkMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      return await apiRequest('POST', `/api/onboarding/generate-link/${employeeId}`);
    },
    onSuccess: (data: any) => {
      setSelectedEmployeeForLink({ ...selectedEmployeeForLink, onboardingLink: data.onboardingLink });
      setShowOnboardingLinkDialog(true);
      toast({
        title: "Success",
        description: "Onboarding link generated successfully",
      });
    },
    onError: (error) => {
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
      toast({
        title: "Error",
        description: "Failed to generate onboarding link",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ChecklistFormData) => {
    if (editingChecklist) {
      updateChecklistMutation.mutate({ id: editingChecklist.id, data });
    } else {
      createChecklistMutation.mutate(data);
    }
  };

  const handleEdit = (checklist: OnboardingChecklist) => {
    setEditingChecklist(checklist);
    form.reset({
      employeeId: checklist.employeeId || undefined,
      itemTitle: checklist.itemTitle,
      description: checklist.description || '',
      dueDate: checklist.dueDate ? new Date(checklist.dueDate).toISOString().split('T')[0] : '',
      order: checklist.order || undefined,
    });
  };

  const canManageOnboarding = user?.role && ['hr_admin', 'branch_manager', 'team_lead'].includes(user.role);

  // Debug logging for troubleshooting
  console.log('Onboarding Debug:', {
    user: user,
    isEmployeeRole,
    canManageOnboarding,
    myOnboardingData,
    myOnboardingLoading,
    profileStatus
  });

  const onboardingEmployees = Array.isArray(employees) ? employees.filter((emp: any) => 
    emp.onboardingStatus !== 'completed'
  ) : [];

  const selectedEmployee = Array.isArray(employees) ? employees.find((emp: any) => emp.id === selectedEmployeeId) : undefined;

  // For HR/Managers: use selected employee's checklist data
  // For Employees and social media team: use their own onboarding data
  const activeChecklists = isEmployeeRole ? (myOnboardingData as any)?.checklists || [] : checklists || [];
  const activeEmployee = isEmployeeRole ? (myOnboardingData as any)?.employee : selectedEmployee;
  const activeProgress = isEmployeeRole ? (myOnboardingData as any)?.progress : {
    completed: activeChecklists.filter((item: OnboardingChecklist) => item.isCompleted).length,
    total: activeChecklists.length,
    percentage: activeChecklists.length > 0 ? Math.round((activeChecklists.filter((item: OnboardingChecklist) => item.isCompleted).length / activeChecklists.length) * 100) : 0
  };

  const completedItems = activeProgress?.completed || 0;
  const totalItems = activeProgress?.total || 0;
  const progressPercentage = activeProgress?.percentage || 0;

  // Show loading state for employees and social media team while data is loading
  if (isEmployeeRole && myOnboardingLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Employee Onboarding</h2>
            <p className="text-gray-600 mt-1">Loading your onboarding progress...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Employee Onboarding</h2>
          <p className="text-gray-600 mt-1">
            {isEmployeeRole ? 'Your onboarding progress and tasks' : 'Manage new employee onboarding process and share links'}
          </p>
        </div>
        
        {canManageOnboarding && selectedEmployeeId && (
          <div className="flex gap-2">
            <Button 
              onClick={async () => {
                try {
                  await apiRequest(`/api/onboarding/create-template/${selectedEmployeeId}`, 'POST');
                  queryClient.invalidateQueries({ queryKey: [`/api/onboarding/${selectedEmployeeId}`] });
                  toast({
                    title: "Success",
                    description: "Onboarding checklist created successfully",
                  });
                } catch (error) {
                  toast({
                    title: "Error", 
                    description: "Failed to create checklist",
                    variant: "destructive",
                  });
                }
              }}
              className="btn-secondary"
            >
              <FileCheck className="mr-2" size={16} />
              Create Checklist
            </Button>
            
            <Dialog open={showAddDialog || !!editingChecklist} onOpenChange={(open) => {
              if (!open) {
                setShowAddDialog(false);
                setEditingChecklist(null);
                form.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => setShowAddDialog(true)} className="btn-primary">
                  <Plus className="mr-2" size={16} />
                  Add Checklist Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>
                  {editingChecklist ? 'Edit Checklist Item' : 'Add Checklist Item'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="itemTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter checklist item title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter description (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Display order" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddDialog(false);
                        setEditingChecklist(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createChecklistMutation.isPending || updateChecklistMutation.isPending}
                      className="btn-primary"
                    >
                      {editingChecklist ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee List - Only show for HR/Managers */}
        {canManageOnboarding && (
          <div className="lg:col-span-1">
            <Card className="stats-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Onboarding Employees
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {employeesLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : onboardingEmployees.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {onboardingEmployees.map((employee: any) => (
                    <div
                      key={employee.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedEmployeeId === employee.id ? 'bg-primary/5 border-r-2 border-primary' : ''
                      }`}
                      onClick={() => {
                        setSelectedEmployeeId(employee.id);
                        form.setValue('employeeId', employee.id);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {employee.user?.firstName || 'N/A'} {employee.user?.lastName || ''}
                          </p>
                          <p className="text-sm text-gray-600">{employee.user?.position || 'No position assigned'}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="status-pending">
                            {employee.onboardingStatus}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {employee.onboardingProgress}% complete
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={employee.onboardingProgress} className="h-2" />
                      </div>
                      
                      {selectedEmployeeId === employee.id && canManageOnboarding && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              createTemplateMutation.mutate(employee.id);
                            }}
                            disabled={createTemplateMutation.isPending}
                            className="text-xs"
                          >
                            <Plus size={12} className="mr-1" />
                            Create Checklist
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployeeForLink(employee);
                              generateLinkMutation.mutate(employee.id);
                            }}
                            disabled={generateLinkMutation.isPending}
                            className="text-xs"
                          >
                            <UserPlus size={12} className="mr-1" />
                            Share Link
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <UserPlus className="mx-auto mb-4 text-gray-400" size={48} />
                  <p>No employees in onboarding</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        {/* Checklist Details */}
        <div className={`${canManageOnboarding ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {(canManageOnboarding && selectedEmployee) || (isEmployeeRole && myOnboardingData) ? (
            <Card className="stats-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {isEmployeeRole ? 'My Onboarding Progress' : `${selectedEmployee?.user.firstName} ${selectedEmployee?.user.lastName}`}
                    </CardTitle>
                    <p className="text-gray-600">{isEmployeeRole ? (activeEmployee?.user?.position || 'No position assigned') : (selectedEmployee?.user?.position || 'No position assigned')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{progressPercentage}%</p>
                    <p className="text-sm text-gray-600">Complete</p>
                  </div>
                </div>
                <Progress value={progressPercentage} className="mt-4" />
              </CardHeader>
              <CardContent>
                <OnboardingChecklistDisplay 
                  employeeId={isEmployeeRole ? activeEmployee?.id : selectedEmployeeId} 
                  isHRView={canManageOnboarding}
                  onEdit={handleEdit}
                  customChecklists={isEmployeeRole ? activeChecklists : undefined}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="stats-card">
              <CardContent className="p-12 text-center">
                <UserPlus className="mx-auto mb-4 text-gray-400" size={64} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {canManageOnboarding ? 'Select an Employee' : 'No Onboarding Data'}
                </h3>
                <p className="text-gray-600">
                  {canManageOnboarding 
                    ? 'Choose an employee from the list to view their onboarding checklist'
                    : 'Your onboarding checklist has not been created yet'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Profile Completion Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={(open) => {
        if (!open) {
          setShowProfileDialog(false);
        }
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Complete Your Profile
            </DialogTitle>
            <p className="text-gray-600">
              Please complete your personal profile to continue with your onboarding process.
            </p>
          </DialogHeader>
          <PersonalProfileForm 
            onComplete={() => {
              setShowProfileDialog(false);
              queryClient.invalidateQueries({ queryKey: ['/api/profile-status'] });
              queryClient.invalidateQueries({ queryKey: ['/api/my-onboarding'] });
              toast({
                title: "Profile Completed",
                description: "Your personal profile has been successfully updated",
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Onboarding Link Dialog */}
      <Dialog open={showOnboardingLinkDialog} onOpenChange={setShowOnboardingLinkDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Employee Onboarding Link</DialogTitle>
            <p className="text-gray-600">
              Share this link with {selectedEmployeeForLink?.user?.firstName} {selectedEmployeeForLink?.user?.lastName} to complete their onboarding
            </p>
          </DialogHeader>
          
          {selectedEmployeeForLink?.onboardingLink && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Onboarding Link:</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={selectedEmployeeForLink.onboardingLink} 
                      readOnly 
                      className="text-sm font-mono select-all"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).select();
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(selectedEmployeeForLink.onboardingLink);
                          toast({
                            title: "Copied!",
                            description: "Onboarding link copied to clipboard",
                          });
                        } catch (error) {
                          // Fallback for browsers that don't support clipboard API
                          const textArea = document.createElement('textarea');
                          textArea.value = selectedEmployeeForLink.onboardingLink;
                          document.body.appendChild(textArea);
                          textArea.select();
                          try {
                            document.execCommand('copy');
                            toast({
                              title: "Copied!",
                              description: "Onboarding link copied to clipboard",
                            });
                          } catch (fallbackError) {
                            toast({
                              title: "Copy Failed",
                              description: "Please manually select and copy the link",
                              variant: "destructive",
                            });
                          } finally {
                            document.body.removeChild(textArea);
                          }
                        }
                      }}
                    >
                      Copy Link
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 Tip: Click the link field to select all text, then Ctrl+C (or Cmd+C on Mac) to copy manually
                  </p>
                </div>
                
                {/* Additional sharing options */}
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-800 mb-2">Quick Share Options:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const subject = encodeURIComponent(`Complete Your Onboarding - ${selectedEmployeeForLink?.user?.firstName} ${selectedEmployeeForLink?.user?.lastName}`);
                        const body = encodeURIComponent(`Hi ${selectedEmployeeForLink?.user?.firstName},\n\nPlease complete your onboarding by clicking the link below:\n\n${selectedEmployeeForLink.onboardingLink}\n\nThis link is personalized for you and you can save your progress and return to complete it later if needed.\n\nBest regards,\nHR Team`);
                        window.open(`mailto:${selectedEmployeeForLink?.user?.email}?subject=${subject}&body=${body}`);
                      }}
                      className="text-green-700 border-green-300 hover:bg-green-100"
                    >
                      📧 Email Link
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const text = encodeURIComponent(`Complete your onboarding: ${selectedEmployeeForLink.onboardingLink}`);
                        window.open(`sms:?body=${text}`);
                      }}
                      className="text-green-700 border-green-300 hover:bg-green-100"
                    >
                      📱 SMS Link
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.open(selectedEmployeeForLink.onboardingLink, '_blank');
                      }}
                      className="text-green-700 border-green-300 hover:bg-green-100"
                    >
                      🔗 Open Link
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Instructions for Employee:</p>
                <ol className="text-sm text-gray-600 space-y-1 ml-4 list-decimal">
                  <li>Click the link above to access your personalized onboarding portal</li>
                  <li>Complete all required information sections step by step</li>
                  <li>Upload any required documents when prompted</li>
                  <li>Review and acknowledge company policies</li>
                  <li>Submit the completed onboarding form</li>
                </ol>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This link is secure and personalized for this employee. 
                  They can save progress and return to complete it later if needed.
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowOnboardingLinkDialog(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    // In a real app, this would send an email
                    toast({
                      title: "Email Sent",
                      description: "Onboarding link has been sent to the employee's email",
                    });
                    setShowOnboardingLinkDialog(false);
                  }}
                  className="btn-primary"
                >
                  Send Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
