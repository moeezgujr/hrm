import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  Clock, 
  Users, 
  FileText, 
  Plus, 
  Brain,
  AlertCircle,
  Calendar,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  status: string;
  userId: number;
}

interface OnboardingChecklist {
  id: number;
  employeeId: number;
  itemTitle: string;
  description: string;
  isCompleted: boolean;
  completedBy: string | null;
  dueDate: string;
  order: number;
  requiresDocument: boolean;
  documentType: string | null;
  documentUrl: string | null;
  documentName: string | null;
  isDocumentVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
  verificationNotes: string | null;
  requiresPsychometricTest: boolean;
  psychometricTestId: number | null;
  psychometricTestAttemptId: number | null;
  psychometricTestCompleted: boolean;
  psychometricTestScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function OnboardingChecklistViewer() {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const { toast } = useToast();


  // Fetch employees
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  // Fetch all onboarding checklists
  const { data: allChecklists = [] } = useQuery<OnboardingChecklist[]>({
    queryKey: ['/api/onboarding-checklists'],
  });

  // Create checklist mutation
  const createChecklistMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest('POST', `/api/users/${userId}/create-onboarding-checklist`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding-checklists'] });
      toast({
        title: "Success",
        description: "Onboarding checklist created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create onboarding checklist",
        variant: "destructive",
      });
    },
  });

  // Group checklists by employee
  const checklistsByEmployee = allChecklists.reduce((acc, checklist) => {
    if (!acc[checklist.employeeId]) {
      acc[checklist.employeeId] = [];
    }
    acc[checklist.employeeId].push(checklist);
    return acc;
  }, {} as Record<number, OnboardingChecklist[]>);

  // Calculate progress for each employee
  const getEmployeeProgress = (employeeId: number) => {
    const checklists = checklistsByEmployee[employeeId] || [];
    if (checklists.length === 0) return { total: 0, completed: 0, percentage: 0 };
    
    const completed = checklists.filter(item => item.isCompleted).length;
    const total = checklists.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { total, completed, percentage };
  };

  const getStatusBadge = (item: OnboardingChecklist) => {
    if (item.isCompleted) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
    
    if (item.requiresPsychometricTest && !item.psychometricTestCompleted) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <Brain className="w-3 h-3 mr-1" />
          Assessment Required
        </Badge>
      );
    }
    
    if (item.requiresDocument && !item.documentUrl) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Document Required
        </Badge>
      );
    }
    
    if (item.requiresDocument && item.documentUrl && !item.isDocumentVerified) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending Verification
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Onboarding Checklists</h1>
          <p className="text-gray-600 mt-1">Manage and track employee onboarding progress</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employee-details">Employee Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {employees.map((employee) => {
              const progress = getEmployeeProgress(employee.id);
              const hasChecklist = checklistsByEmployee[employee.id]?.length > 0;

              return (
                <Card key={employee.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {employee.firstName} {employee.lastName}
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          {employee.position} • {employee.department}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                          {employee.status}
                        </Badge>
                        {!hasChecklist && (
                          <Button
                            size="sm"
                            onClick={() => createChecklistMutation.mutate(employee.userId)}
                            disabled={createChecklistMutation.isPending}
                          >
                            {createChecklistMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4 mr-1" />
                            )}
                            Create Checklist
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {hasChecklist ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress: {progress.completed} of {progress.total} items completed</span>
                          <span className="font-medium">{progress.percentage}%</span>
                        </div>
                        <Progress value={progress.percentage} className="h-2" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEmployee(employee.id)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No onboarding checklist created yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="employee-details" className="space-y-4">
          {selectedEmployee ? (
            <div className="space-y-4">
              {(() => {
                const employee = employees.find(e => e.id === selectedEmployee);
                const checklists = checklistsByEmployee[selectedEmployee] || [];
                const progress = getEmployeeProgress(selectedEmployee);

                if (!employee) return <div>Employee not found</div>;

                return (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Users className="w-5 h-5 mr-2" />
                          {employee.firstName} {employee.lastName} - Onboarding Progress
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{employee.position}</span>
                          <span>•</span>
                          <span>{employee.department}</span>
                          <span>•</span>
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {employee.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span>Overall Progress</span>
                            <span className="font-medium">{progress.percentage}%</span>
                          </div>
                          <Progress value={progress.percentage} className="h-3" />
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{progress.completed} completed</span>
                            <span>{progress.total - progress.completed} remaining</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-3">
                      {checklists
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((item) => (
                          <Card key={item.id} className={`transition-all duration-200 ${item.isCompleted ? 'bg-green-50' : ''}`}>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-lg">{item.itemTitle}</h4>
                                    {getStatusBadge(item)}
                                  </div>
                                  
                                  {item.description && (
                                    <p className="text-gray-600 mb-3">{item.description}</p>
                                  )}
                                  
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    {item.dueDate && (
                                      <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        Due: {formatDate(item.dueDate)}
                                      </div>
                                    )}
                                    
                                    {item.requiresDocument && (
                                      <div className="flex items-center">
                                        <FileText className="w-4 h-4 mr-1" />
                                        Document Required
                                      </div>
                                    )}
                                    
                                    {item.requiresPsychometricTest && (
                                      <div className="flex items-center">
                                        <Brain className="w-4 h-4 mr-1" />
                                        Assessment Required
                                      </div>
                                    )}
                                  </div>
                                  
                                  {item.isCompleted && item.completedBy && (
                                    <div className="mt-2 text-sm text-green-600">
                                      ✓ Completed by {item.completedBy}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Select an Employee</h3>
                <p className="text-gray-600">Choose an employee from the overview to view their detailed checklist progress</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSelectedEmployee(employees[0]?.id || null)}
                  disabled={employees.length === 0}
                >
                  View First Employee
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}