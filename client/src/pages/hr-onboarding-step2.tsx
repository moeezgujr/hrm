import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users,
  User, 
  CheckCircle, 
  Clock,
  AlertCircle,
  FileText,
  Shield,
  Monitor,
  CreditCard,
  Building,
  Key,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface EmployeeSubmission {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  position: string;
  department: string;
  startDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  submittedAt: string;
  completedSteps: string[];
  allDetails: any;
}

interface HROnboardingStep {
  id: string;
  title: string;
  description: string;
  category: 'pre_arrival' | 'documentation' | 'it_setup' | 'access_permissions' | 'orientation';
  estimatedTime: number; // in minutes
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
  notes?: string;
  requiresDocument?: boolean;
  documentUploaded?: boolean;
}

const hrOnboardingSteps: HROnboardingStep[] = [
  // Pre-arrival Setup
  {
    id: 'workspace_setup',
    title: 'Workspace Setup',
    description: 'Prepare desk, chair, and basic office supplies for new employee',
    category: 'pre_arrival',
    estimatedTime: 30,
    isCompleted: false
  },
  {
    id: 'welcome_kit',
    title: 'Welcome Kit Preparation',
    description: 'Prepare welcome package with company swag, handbook, and materials',
    category: 'pre_arrival',
    estimatedTime: 15,
    isCompleted: false
  },
  
  // IT Setup
  {
    id: 'laptop_assignment',
    title: 'Laptop & Equipment Assignment',
    description: 'Assign laptop, monitor, keyboard, mouse, and necessary peripherals',
    category: 'it_setup',
    estimatedTime: 45,
    isCompleted: false,
    requiresDocument: true
  },
  {
    id: 'email_creation',
    title: 'Email Account Creation',
    description: 'Create company email account and send login credentials securely',
    category: 'it_setup',
    estimatedTime: 20,
    isCompleted: false
  },
  {
    id: 'software_licenses',
    title: 'Software Licenses & Tools',
    description: 'Assign necessary software licenses and development tools',
    category: 'it_setup',
    estimatedTime: 25,
    isCompleted: false
  },
  
  // Access & Permissions
  {
    id: 'building_access',
    title: 'Building Access Card',
    description: 'Create building access card and parking pass',
    category: 'access_permissions',
    estimatedTime: 15,
    isCompleted: false
  },
  {
    id: 'system_permissions',
    title: 'System Access Permissions',
    description: 'Configure access permissions for company systems and databases',
    category: 'access_permissions',
    estimatedTime: 30,
    isCompleted: false
  },
  {
    id: 'team_introductions',
    title: 'Team Introduction Setup',
    description: 'Schedule introductory meetings with team members and stakeholders',
    category: 'access_permissions',
    estimatedTime: 20,
    isCompleted: false
  },
  
  // Documentation
  {
    id: 'contract_preparation',
    title: 'Employment Contract',
    description: 'Prepare and finalize employment contract based on submitted details',
    category: 'documentation',
    estimatedTime: 60,
    isCompleted: false,
    requiresDocument: true
  },
  {
    id: 'i9_verification',
    title: 'I-9 Form Verification',
    description: 'Verify I-9 form completion and document eligibility',
    category: 'documentation',
    estimatedTime: 20,
    isCompleted: false,
    requiresDocument: true
  },
  {
    id: 'benefits_setup',
    title: 'Benefits Enrollment Setup',
    description: 'Set up health, dental, vision, and retirement benefits enrollment',
    category: 'documentation',
    estimatedTime: 40,
    isCompleted: false
  },
  {
    id: 'payroll_setup',
    title: 'Payroll System Setup',
    description: 'Add employee to payroll system with salary and tax information',
    category: 'documentation',
    estimatedTime: 35,
    isCompleted: false
  },
  
  // Orientation
  {
    id: 'orientation_schedule',
    title: 'Orientation Schedule',
    description: 'Create comprehensive first-day and first-week orientation schedule',
    category: 'orientation',
    estimatedTime: 25,
    isCompleted: false
  },
  {
    id: 'mentor_assignment',
    title: 'Mentor Assignment',
    description: 'Assign an experienced team member as mentor for first 90 days',
    category: 'orientation',
    estimatedTime: 15,
    isCompleted: false
  },
  {
    id: 'training_enrollment',
    title: 'Training Program Enrollment',
    description: 'Enroll in mandatory and role-specific training programs',
    category: 'orientation',
    estimatedTime: 30,
    isCompleted: false
  }
];

export default function HROnboardingStep2() {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSubmission | null>(null);
  const [onboardingSteps, setOnboardingSteps] = useState<HROnboardingStep[]>(hrOnboardingSteps);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch employee submissions
  const { data: employeeSubmissions = [] } = useQuery({
    queryKey: ['/api/onboarding/employee-submissions'],
  });

  // Update step completion mutation
  const updateStepMutation = useMutation({
    mutationFn: async ({ stepId, isCompleted, notes }: { stepId: string; isCompleted: boolean; notes?: string }) => {
      return await apiRequest(`/api/onboarding/hr-step/${stepId}`, {
        method: 'PUT',
        body: JSON.stringify({
          employeeId: selectedEmployee?.id,
          isCompleted,
          notes,
          completedAt: isCompleted ? new Date().toISOString() : null
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/employee-submissions'] });
      toast({
        title: "Success",
        description: "Step updated successfully",
      });
    }
  });

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      return await apiRequest(`/api/onboarding/complete/${employeeId}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/employee-submissions'] });
      toast({
        title: "Success",
        description: "Employee onboarding completed successfully",
      });
      setSelectedEmployee(null);
    }
  });

  const handleStepToggle = (stepId: string) => {
    const step = onboardingSteps.find(s => s.id === stepId);
    if (!step) return;

    const newCompletionStatus = !step.isCompleted;
    const notes = stepNotes[stepId] || '';

    // Update local state
    setOnboardingSteps(prev => prev.map(s => 
      s.id === stepId 
        ? { 
            ...s, 
            isCompleted: newCompletionStatus,
            completedAt: newCompletionStatus ? new Date().toISOString() : undefined,
            notes: notes || undefined
          }
        : s
    ));

    // Update server
    updateStepMutation.mutate({ stepId, isCompleted: newCompletionStatus, notes });
  };

  const handleNotesUpdate = (stepId: string, notes: string) => {
    setStepNotes(prev => ({ ...prev, [stepId]: notes }));
  };

  const handleCompleteOnboarding = () => {
    if (!selectedEmployee) return;
    
    const incompleteSteps = onboardingSteps.filter(step => !step.isCompleted);
    
    if (incompleteSteps.length > 0) {
      toast({
        title: "Incomplete Steps",
        description: `Please complete all ${incompleteSteps.length} remaining steps before finalizing onboarding.`,
        variant: "destructive",
      });
      return;
    }

    completeOnboardingMutation.mutate(selectedEmployee.id);
  };

  const getProgressStats = () => {
    const completed = onboardingSteps.filter(step => step.isCompleted).length;
    const total = onboardingSteps.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pre_arrival': return <Building className="h-4 w-4" />;
      case 'it_setup': return <Monitor className="h-4 w-4" />;
      case 'access_permissions': return <Key className="h-4 w-4" />;
      case 'documentation': return <FileText className="h-4 w-4" />;
      case 'orientation': return <UserCheck className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pre_arrival': return 'bg-purple-100 text-purple-700';
      case 'it_setup': return 'bg-blue-100 text-blue-700';
      case 'access_permissions': return 'bg-green-100 text-green-700';
      case 'documentation': return 'bg-orange-100 text-orange-700';
      case 'orientation': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!selectedEmployee) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">HR Onboarding Management</h1>
          <p className="text-gray-600 mt-2">
            Step 2: Complete administrative onboarding process for new employees
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Employee Submissions Awaiting HR Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employeeSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Submissions</h3>
                <p className="text-gray-600">
                  No new employee details have been submitted yet. 
                  Employees will appear here after completing Step 1 of the onboarding process.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {employeeSubmissions.map((employee: EmployeeSubmission) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-semibold">
                            {employee.firstName} {employee.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {employee.position} • {employee.department}
                          </p>
                          <p className="text-xs text-gray-500">
                            Submitted: {new Date(employee.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          employee.status === 'completed' ? "default" :
                          employee.status === 'in_progress' ? "secondary" : "outline"
                        }>
                          {employee.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => setSelectedEmployee(employee)}
                        disabled={employee.status === 'completed'}
                      >
                        {employee.status === 'completed' ? 'Completed' : 'Process Onboarding'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressStats = getProgressStats();
  const groupedSteps = onboardingSteps.reduce((acc, step) => {
    if (!acc[step.category]) {
      acc[step.category] = [];
    }
    acc[step.category].push(step);
    return acc;
  }, {} as Record<string, HROnboardingStep[]>);

  const categoryNames = {
    pre_arrival: 'Pre-arrival Setup',
    it_setup: 'IT Setup & Equipment',
    access_permissions: 'Access & Permissions',
    documentation: 'Documentation & Legal',
    orientation: 'Orientation & Training'
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Button variant="ghost" onClick={() => setSelectedEmployee(null)}>
              <X className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Processing: {selectedEmployee.firstName} {selectedEmployee.lastName}
          </h1>
          <p className="text-gray-600">
            {selectedEmployee.position} • {selectedEmployee.department} • Starts {new Date(selectedEmployee.startDate).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{progressStats.percentage}%</div>
          <div className="text-sm text-gray-600">
            {progressStats.completed} of {progressStats.total} completed
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Employee Details */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Employee Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{selectedEmployee.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{selectedEmployee.phoneNumber}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{selectedEmployee.position}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{selectedEmployee.department}</span>
                </div>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    View Full Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Complete Employee Information</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Display all submitted details */}
                    <div className="grid gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900">Personal Information</h4>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p><strong>Name:</strong> {selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                          <p><strong>Email:</strong> {selectedEmployee.email}</p>
                          <p><strong>Phone:</strong> {selectedEmployee.phoneNumber}</p>
                        </div>
                      </div>
                      {/* Add more sections as needed */}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{progressStats.percentage}%</span>
                  </div>
                  <Progress value={progressStats.percentage} />
                </div>
                
                {Object.entries(categoryNames).map(([category, name]) => {
                  const categorySteps = groupedSteps[category] || [];
                  const completed = categorySteps.filter(step => step.isCompleted).length;
                  const total = categorySteps.length;
                  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(category)}
                        <span className="text-sm">{name}</span>
                      </div>
                      <Badge variant="outline">
                        {completed}/{total}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onboarding Steps */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>HR Onboarding Checklist</span>
                <Button
                  onClick={handleCompleteOnboarding}
                  disabled={progressStats.percentage < 100 || completeOnboardingMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {completeOnboardingMutation.isPending ? 'Finalizing...' : 'Complete Onboarding'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(categoryNames).map(([category, name]) => {
                  const categorySteps = groupedSteps[category] || [];
                  
                  return (
                    <div key={category}>
                      <div className={`flex items-center space-x-2 mb-4 p-3 rounded-lg ${getCategoryColor(category)}`}>
                        {getCategoryIcon(category)}
                        <h3 className="font-semibold">{name}</h3>
                        <Badge variant="outline" className="ml-auto">
                          {categorySteps.filter(s => s.isCompleted).length}/{categorySteps.length}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 ml-4">
                        {categorySteps.map((step) => (
                          <div
                            key={step.id}
                            className={`flex items-start space-x-3 p-4 border rounded-lg ${
                              step.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                            }`}
                          >
                            <Checkbox
                              checked={step.isCompleted}
                              onCheckedChange={() => handleStepToggle(step.id)}
                              className="mt-1"
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className={`font-medium ${step.isCompleted ? 'text-green-800' : 'text-gray-900'}`}>
                                  {step.title}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  {step.requiresDocument && (
                                    <Badge variant="secondary" className="text-xs">
                                      <FileText className="h-3 w-3 mr-1" />
                                      Document Required
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {step.estimatedTime}min
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className={`text-sm mt-1 ${step.isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                                {step.description}
                              </p>
                              
                              {step.isCompleted && step.completedAt && (
                                <p className="text-xs text-green-600 mt-2">
                                  <CheckCircle className="h-3 w-3 inline mr-1" />
                                  Completed on {new Date(step.completedAt).toLocaleDateString()}
                                </p>
                              )}
                              
                              {/* Notes section */}
                              <div className="mt-3">
                                {editingStep === step.id ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={stepNotes[step.id] || step.notes || ''}
                                      onChange={(e) => handleNotesUpdate(step.id, e.target.value)}
                                      placeholder="Add notes about this step..."
                                      rows={2}
                                      className="text-sm"
                                    />
                                    <div className="flex space-x-2">
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          updateStepMutation.mutate({
                                            stepId: step.id,
                                            isCompleted: step.isCompleted,
                                            notes: stepNotes[step.id] || ''
                                          });
                                          setEditingStep(null);
                                        }}
                                      >
                                        <Save className="h-3 w-3 mr-1" />
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingStep(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    {step.notes && (
                                      <p className="text-xs text-gray-600 italic">"{step.notes}"</p>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingStep(step.id)}
                                      className="text-xs"
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      {step.notes ? 'Edit Note' : 'Add Note'}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}