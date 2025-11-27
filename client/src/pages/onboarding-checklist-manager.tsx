import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  Clock, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Calendar,
  Brain,
  Link,
  Copy,
  Eye,
  Target,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { OnboardingChecklist, Employee } from '@shared/schema';

interface ChecklistTemplate {
  id?: number;
  itemTitle: string;
  description: string;
  category: string;
  order: number;
  dueDate?: number; // Days from start (negative for pre-arrival)
  requiresDocument: boolean;
  documentType?: string;
  requiresPsychometricTest: boolean;
  psychometricTestId?: number;
}

const defaultCategories = [
  "Pre-arrival Setup",
  "Day 1 - Welcome & Orientation", 
  "Week 1 - Documentation & Training",
  "Week 2-4 - Department Integration",
  "Month 2-3 - Skills Development",
  "90-Day Review"
];

const defaultOnboardingTemplate: ChecklistTemplate[] = [
  // Pre-arrival Setup (-7 to -1 days)
  {
    itemTitle: "Workspace Setup",
    description: "Prepare desk, chair, and basic office supplies for new employee",
    category: "Pre-arrival Setup",
    order: 1,
    dueDate: -7,
    requiresDocument: false,
    requiresPsychometricTest: false
  },
  {
    itemTitle: "IT Equipment Assignment", 
    description: "Assign laptop, monitor, keyboard, mouse, and necessary software licenses",
    category: "Pre-arrival Setup",
    order: 2,
    dueDate: -5,
    requiresDocument: true,
    documentType: "pdf",
    requiresPsychometricTest: false
  },
  {
    itemTitle: "Email Account Creation",
    description: "Create company email account and send login credentials securely",
    category: "Pre-arrival Setup", 
    order: 3,
    dueDate: -3,
    requiresDocument: false,
    requiresPsychometricTest: false
  },
  {
    itemTitle: "Psychometric Assessment",
    description: "Complete personality, cognitive, and integrity assessments",
    category: "Pre-arrival Setup",
    order: 4,
    dueDate: -2,
    requiresDocument: false,
    requiresPsychometricTest: true,
    psychometricTestId: 1 // Big Five Personality
  },
  // Day 1 - Welcome & Orientation
  {
    itemTitle: "Welcome Meeting",
    description: "Meet with direct manager and HR representative for formal welcome",
    category: "Day 1 - Welcome & Orientation",
    order: 5,
    dueDate: 1,
    requiresDocument: false,
    requiresPsychometricTest: false
  },
  {
    itemTitle: "Office Tour",
    description: "Complete office tour including emergency exits, facilities, and key locations",
    category: "Day 1 - Welcome & Orientation",
    order: 6,
    dueDate: 1,
    requiresDocument: false,
    requiresPsychometricTest: false
  },
  {
    itemTitle: "Employee Handbook Acknowledgment",
    description: "Review and acknowledge understanding of employee handbook",
    category: "Day 1 - Welcome & Orientation",
    order: 7,
    dueDate: 1,
    requiresDocument: true,
    documentType: "pdf",
    requiresPsychometricTest: false
  },
  // Week 1 - Documentation & Training
  {
    itemTitle: "I-9 Form Completion",
    description: "Complete Form I-9 for employment eligibility verification",
    category: "Week 1 - Documentation & Training",
    order: 8,
    dueDate: 3,
    requiresDocument: true,
    documentType: "pdf",
    requiresPsychometricTest: false
  },
  {
    itemTitle: "W-4 Form Submission",
    description: "Complete and submit W-4 form for tax withholding",
    category: "Week 1 - Documentation & Training",
    order: 9,
    dueDate: 3,
    requiresDocument: true,
    documentType: "pdf",
    requiresPsychometricTest: false
  },
  {
    itemTitle: "Benefits Enrollment",
    description: "Review and enroll in health, dental, vision, and retirement benefits",
    category: "Week 1 - Documentation & Training", 
    order: 10,
    dueDate: 5,
    requiresDocument: true,
    documentType: "pdf",
    requiresPsychometricTest: false
  },
  {
    itemTitle: "Direct Deposit Setup",
    description: "Provide banking information for direct deposit setup",
    category: "Week 1 - Documentation & Training",
    order: 11,
    dueDate: 5,
    requiresDocument: true,
    documentType: "pdf",
    requiresPsychometricTest: false
  },
  {
    itemTitle: "Security Training",
    description: "Complete mandatory cybersecurity and data protection training",
    category: "Week 1 - Documentation & Training",
    order: 12,
    dueDate: 7,
    requiresDocument: true,
    documentType: "pdf",
    requiresPsychometricTest: false
  },
  // Week 2-4 - Department Integration
  {
    itemTitle: "Team Introduction Meetings",
    description: "Schedule and complete one-on-one meetings with key team members",
    category: "Week 2-4 - Department Integration",
    order: 13,
    dueDate: 14,
    requiresDocument: false,
    requiresPsychometricTest: false
  },
  {
    itemTitle: "Department Goals Overview",
    description: "Review department objectives, KPIs, and current projects",
    category: "Week 2-4 - Department Integration",
    order: 14,
    dueDate: 21,
    requiresDocument: false,
    requiresPsychometricTest: false
  },
  {
    itemTitle: "First Project Assignment",
    description: "Receive and begin work on first assigned project or task",
    category: "Week 2-4 - Department Integration",
    order: 15,
    dueDate: 28,
    requiresDocument: false,
    requiresPsychometricTest: false
  },
  // Month 2-3 - Skills Development  
  {
    itemTitle: "Role-Specific Training",
    description: "Complete specialized training relevant to position",
    category: "Month 2-3 - Skills Development",
    order: 16,
    dueDate: 45,
    requiresDocument: true,
    documentType: "pdf",
    requiresPsychometricTest: false
  },
  {
    itemTitle: "Performance Goal Setting",
    description: "Establish 90-day, 6-month, and annual performance goals",
    category: "Month 2-3 - Skills Development",
    order: 17,
    dueDate: 60,
    requiresDocument: false,
    requiresPsychometricTest: false
  },
  // 90-Day Review
  {
    itemTitle: "90-Day Performance Review",
    description: "Complete formal 90-day performance evaluation",
    category: "90-Day Review",
    order: 18,
    dueDate: 90,
    requiresDocument: true,
    documentType: "pdf",
    requiresPsychometricTest: false
  }
];

export default function OnboardingChecklistManager() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [newItemDialog, setNewItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Fetch onboarding checklists
  const { data: checklists = [] } = useQuery({
    queryKey: ['/api/onboarding-checklists'],
  });

  // Fetch psychometric tests for assignment
  const { data: psychometricTests = [] } = useQuery({
    queryKey: ['/api/psychometric-tests'],
  });

  // Create onboarding template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      return await apiRequest(`/api/onboarding/create-template/${employeeId}`, {
        method: 'POST',
        body: JSON.stringify(defaultOnboardingTemplate)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding-checklists'] });
      toast({
        title: "Success",
        description: "Onboarding checklist created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: "Failed to create onboarding checklist",
        variant: "destructive",
      });
    }
  });

  // Generate onboarding link mutation
  const generateLinkMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      const response = await fetch(`/api/onboarding/generate-link/${employeeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to generate onboarding link');
      }
      return response.json();
    },
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.link);
      toast({
        title: "Success",
        description: "Onboarding link copied to clipboard",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate onboarding link",
        variant: "destructive",
      });
    }
  });

  // Calculate progress for employee
  const calculateProgress = (employeeId: number) => {
    const employeeChecklists = checklists.filter((item: OnboardingChecklist) => 
      item.employeeId === employeeId
    );
    
    if (employeeChecklists.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = employeeChecklists.filter((item: OnboardingChecklist) => 
      item.isCompleted
    ).length;
    
    return {
      completed,
      total: employeeChecklists.length,
      percentage: Math.round((completed / employeeChecklists.length) * 100)
    };
  };

  const handleCreateTemplate = (employeeId: number) => {
    createTemplateMutation.mutate(employeeId);
  };

  const handleGenerateLink = (employeeId: number) => {
    generateLinkMutation.mutate(employeeId);
  };

  const groupedChecklists = checklists.reduce((acc: any, item: OnboardingChecklist) => {
    if (!acc[item.employeeId]) {
      acc[item.employeeId] = [];
    }
    acc[item.employeeId].push(item);
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Onboarding Checklist Manager</h1>
        <p className="text-gray-600 mt-2">
          Create and manage comprehensive onboarding checklists for new employees
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employee Progress</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employees.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active employees in system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Onboardings</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(groupedChecklists).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Employees with checklists
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Items</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {checklists.filter((item: OnboardingChecklist) => item.isCompleted).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total completed checklist items
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {checklists.filter((item: OnboardingChecklist) => !item.isCompleted).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Items awaiting completion
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <p className="text-sm text-gray-600">
                Common onboarding management tasks
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="h-20 flex-col space-y-2">
                      <Plus className="h-6 w-6" />
                      <span>Create New Checklist</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Onboarding Checklist</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="employee-select">Select Employee</Label>
                        <Select value={selectedEmployee?.toString() || ""} onValueChange={(value) => setSelectedEmployee(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((employee: Employee) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.firstName} {employee.lastName} - {employee.position}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={() => selectedEmployee && handleCreateTemplate(selectedEmployee)}
                        disabled={!selectedEmployee || createTemplateMutation.isPending}
                        className="w-full"
                      >
                        {createTemplateMutation.isPending ? "Creating..." : "Create Comprehensive Checklist"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => setActiveTab("templates")}
                >
                  <FileText className="h-6 w-6" />
                  <span>Manage Templates</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => setActiveTab("analytics")}
                >
                  <Target className="h-6 w-6" />
                  <span>View Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employee Progress Tab */}
        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Onboarding Progress</CardTitle>
              <p className="text-sm text-gray-600">
                Track onboarding completion for all employees
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map((employee: Employee) => {
                  const progress = calculateProgress(employee.id);
                  const hasChecklist = groupedChecklists[employee.id];
                  
                  return (
                    <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-semibold">
                              {employee.firstName} {employee.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {employee.position} • {employee.department}
                            </p>
                          </div>
                          <Badge variant={
                            progress.percentage === 100 ? "default" :
                            progress.percentage > 50 ? "secondary" : "outline"
                          }>
                            {progress.percentage}% Complete
                          </Badge>
                        </div>
                        
                        {hasChecklist && (
                          <div className="mt-3 space-y-2">
                            <Progress value={progress.percentage} className="w-full" />
                            <p className="text-xs text-gray-500">
                              {progress.completed} of {progress.total} items completed
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!hasChecklist ? (
                          <Button 
                            onClick={() => handleCreateTemplate(employee.id)}
                            disabled={createTemplateMutation.isPending}
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Create Checklist
                          </Button>
                        ) : (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleGenerateLink(employee.id)}
                            >
                              <Link className="h-4 w-4 mr-1" />
                              Share Link
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Navigate to checklist view
                                window.location.href = `/onboarding-checklist/${employee.id}`;
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Template</CardTitle>
              <p className="text-sm text-gray-600">
                Default comprehensive onboarding checklist with {defaultOnboardingTemplate.length} items
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {defaultCategories.map((category) => {
                  const categoryItems = defaultOnboardingTemplate.filter(item => item.category === category);
                  
                  return (
                    <div key={category} className="space-y-3">
                      <h3 className="font-semibold text-lg flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        {category}
                        <Badge variant="outline" className="ml-2">
                          {categoryItems.length} items
                        </Badge>
                      </h3>
                      
                      <div className="grid gap-3 ml-7">
                        {categoryItems.map((item) => (
                          <div key={item.order} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">{item.itemTitle}</h4>
                                {item.requiresDocument && (
                                  <Badge variant="secondary" className="text-xs">
                                    <FileText className="h-3 w-3 mr-1" />
                                    Document
                                  </Badge>
                                )}
                                {item.requiresPsychometricTest && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Brain className="h-3 w-3 mr-1" />
                                    Assessment
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">
                                Day {Math.abs(item.dueDate || 0)}
                              </Badge>
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
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Completion Rates by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {defaultCategories.map((category) => {
                    const categoryItems = checklists.filter((item: OnboardingChecklist) => 
                      defaultOnboardingTemplate.find(template => 
                        template.itemTitle === item.itemTitle && template.category === category
                      )
                    );
                    
                    const completed = categoryItems.filter((item: OnboardingChecklist) => item.isCompleted).length;
                    const total = categoryItems.length;
                    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                    
                    return (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-2">
                          <span>{category}</span>
                          <span>{completed}/{total} ({percentage}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {checklists
                    .filter((item: OnboardingChecklist) => item.isCompleted)
                    .slice(0, 10)
                    .map((item: OnboardingChecklist) => {
                      const employee = employees.find((emp: Employee) => emp.id === item.employeeId);
                      return (
                        <div key={item.id} className="flex items-center space-x-3 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="flex-1">
                            <strong>{employee?.firstName} {employee?.lastName}</strong> completed "{item.itemTitle}"
                          </span>
                          <span className="text-gray-500">
                            {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Recently'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}