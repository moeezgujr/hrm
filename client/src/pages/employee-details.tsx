import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import type { Employee, User, OnboardingChecklist, PsychometricTestAttempt, Task } from '@shared/schema';
import { 
  UserIcon, 
  Briefcase, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Eye,
  Calendar,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Award,
  Languages,
  Heart,
  CreditCard,
  ListTodo
} from 'lucide-react';

export default function EmployeeDetails() {
  const [match, params] = useRoute('/employees/:id');
  const { user } = useAuth();
  const employeeId = params?.id;

  // Fetch employee data
  const { data: employee, isLoading: employeeLoading } = useQuery<Employee>({
    queryKey: ['/api/employees', employeeId],
    enabled: !!employeeId
  });

  // Fetch onboarding checklist
  const { data: onboardingItems = [], isLoading: onboardingLoading } = useQuery<OnboardingChecklist[]>({
    queryKey: ['/api/onboarding', employeeId],
    enabled: !!employeeId
  });

  // Fetch psychometric test results
  const { data: testResults = [], isLoading: testLoading } = useQuery<PsychometricTestAttempt[]>({
    queryKey: ['/api/psychometric-tests/results', employeeId],
    enabled: !!employeeId
  });

  const { data: bankingInfo, isLoading: bankingLoading } = useQuery({
    queryKey: ['/api/employees', employeeId, 'banking'],
    enabled: !!employeeId
  });

  // Fetch leave balance
  const { data: leaveBalance } = useQuery({
    queryKey: ['/api/leave-balances', employeeId],
    enabled: !!employeeId
  });

  // Fetch leave requests
  const { data: leaveRequests = [] } = useQuery<any[]>({
    queryKey: ['/api/leave-requests'],
    enabled: !!employeeId
  });

  // Filter leave requests for this employee
  const employeeLeaveRequests = leaveRequests.filter((req: any) => req.employeeId === parseInt(employeeId || '0'));

  // Fetch standalone tasks for the employee
  const { data: standaloneTasks = [], isLoading: standaloneTasksLoading } = useQuery<Task[]>({
    queryKey: employee?.userId ? [`/api/tasks?assignedTo=${employee.userId}`] : ['/api/tasks/disabled'],
    retry: false,
    enabled: !!employee?.userId,
  });

  // Fetch project tasks for the employee
  const { data: projectTasks = [], isLoading: projectTasksLoading } = useQuery<any[]>({
    queryKey: employee?.userId ? [`/api/users/${employee.userId}/project-tasks`] : ['/api/users/disabled/project-tasks'],
    retry: false,
    enabled: !!employee?.userId,
  });

  // Combine all tasks
  const employeeTasks = [...standaloneTasks, ...projectTasks];
  const tasksLoading = standaloneTasksLoading || projectTasksLoading;

  if (!match || employeeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Not Found</h3>
          <p className="text-gray-600">The requested employee could not be found.</p>
        </div>
      </div>
    );
  }

  const completedItems = onboardingItems.filter((item) => item.isCompleted).length;
  const totalItems = onboardingItems.length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getDesignationLabel = (designation: string | null | undefined) => {
    if (!designation) return null;
    
    const labels: Record<string, string> = {
      ceo: 'CEO',
      clinic_director: 'Clinic Director',
      bdm: 'Business Development Manager',
      admin_manager: 'Administrative Manager',
      admin_assistant: 'Administrative Assistant',
      client_relation_manager: 'Client Relation Manager',
      accounts_manager: 'Accounts Manager',
      it_manager: 'IT Manager',
      hr_manager: 'HR Manager',
      documentation_manager: 'Documentation Manager',
      psychologist: 'Psychologist',
      therapist: 'Therapist',
      counsellor: 'Counsellor'
    };
    
    return labels[designation] || designation;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto pb-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {employee.preferredName || 'Unknown Employee'}
              </h1>
              <p className="text-gray-600 mt-1">
                Employee ID: {employee.employeeId} • {employee.position || 'No position set'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {employee.designation && (
                <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                  {getDesignationLabel(employee.designation)}
                </Badge>
              )}
              <Badge variant={employee.onboardingStatus === 'completed' ? 'default' : 'secondary'}>
                {employee.onboardingStatus}
              </Badge>
              {employee.department && (
                <Badge variant="outline">{employee.department}</Badge>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6 w-full">
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="leave">Leave</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="tests">Test Results</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({employeeTasks.length})</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserIcon className="mr-2 h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {employee.company && (
                    <div className="pb-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-500">Company</p>
                      <div className="flex items-center mt-1">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {employee.company.name}
                        </Badge>
                      </div>
                      {employee.company.industry && (
                        <p className="text-xs text-gray-500 mt-1">{employee.company.industry}</p>
                      )}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="text-gray-900">{employee.preferredName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Position</p>
                    <p className="text-gray-900">{employee.position || 'Not assigned'}</p>
                  </div>
                  {employee.designation && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Designation (MM Hierarchy)</p>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {getDesignationLabel(employee.designation)}
                      </Badge>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Department</p>
                    <p className="text-gray-900">{employee.department || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{employee.personalEmail || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-gray-900">{employee.phoneNumber || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Onboarding Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="mr-2 h-5 w-5" />
                    Onboarding Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-500">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{completedItems}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Total Items</p>
                      <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Test Results Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.length === 0 ? (
                    <p className="text-gray-500 text-sm">No test results available</p>
                  ) : (
                    <div className="space-y-2">
                      {testResults.slice(0, 3).map((test) => (
                        <div key={test.id} className="flex justify-between items-center">
                          <span className="text-sm">Test {test.id}</span>
                          <Badge variant="outline">{test.percentageScore || 0}%</Badge>
                        </div>
                      ))}
                      {testResults.length > 3 && (
                        <p className="text-xs text-gray-500">+{testResults.length - 3} more tests</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Preferred Name</p>
                      <p className="text-gray-900">{employee.preferredName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                      <p className="text-gray-900">{employee.dateOfBirth || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Gender</p>
                      <p className="text-gray-900">{employee.gender || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Marital Status</p>
                      <p className="text-gray-900">{employee.maritalStatus || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nationality</p>
                      <p className="text-gray-900">{employee.nationality || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Personal Email</p>
                      <p className="text-gray-900">{employee.personalEmail || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="mr-2 h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Current Address</p>
                    <p className="text-gray-900">{employee.currentAddress || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Permanent Address</p>
                    <p className="text-gray-900">{employee.permanentAddress || 'Not provided'}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">City</p>
                      <p className="text-gray-900">{employee.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">State</p>
                      <p className="text-gray-900">{employee.state || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">ZIP Code</p>
                      <p className="text-gray-900">{employee.zipCode || 'Not provided'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Country</p>
                    <p className="text-gray-900">{employee.country || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-gray-900">{employee.emergencyContactName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Relation</p>
                      <p className="text-gray-900">{employee.emergencyContactRelation || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-gray-900">{employee.emergencyContactPhone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-gray-900">{employee.emergencyContactAddress || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Banking Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Banking Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Bank Name</p>
                      <p className="text-gray-900">{employee.bankName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Account Holder Name</p>
                      <p className="text-gray-900">{employee.accountHolderName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Account Type</p>
                      <p className="text-gray-900">{employee.accountType || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Routing Number</p>
                      <p className="text-gray-900">{employee.routingNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Account Number</p>
                      <p className="text-gray-900 font-mono">
                        {employee.accountNumber || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">IBAN</p>
                      <p className="text-gray-900">{employee.iban || 'Not provided'}</p>
                    </div>
                  </div>
                  {employee.bankName && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-sm text-green-800 font-medium">
                          Direct Deposit Information Submitted
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Education & Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Education & Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Highest Education</p>
                      <p className="text-gray-900">{employee.highestEducation || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">University</p>
                      <p className="text-gray-900">{employee.university || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Graduation Year</p>
                      <p className="text-gray-900">{employee.graduationYear || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Major Subject</p>
                      <p className="text-gray-900">{employee.majorSubject || 'Not provided'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Skills</p>
                    <p className="text-gray-900">{employee.skills || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Certifications</p>
                    <p className="text-gray-900">{employee.certifications || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Languages Spoken</p>
                    <p className="text-gray-900">{employee.languagesSpoken || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onboarding Tab */}
          <TabsContent value="onboarding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Checklist</CardTitle>
                <CardDescription>
                  Track progress through all onboarding items and requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-none overflow-visible">
                {onboardingItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No onboarding items found</p>
                ) : (
                  <div className="space-y-4 pb-8">
                    {onboardingItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 mb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {getStatusIcon(item.isCompleted ? 'completed' : 'pending')}
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.itemTitle}</h4>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>Order: {item.order}</span>
                                {item.completedAt && (
                                  <span>Completed: {new Date(item.completedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                              {/* Banking Information Display - Special handling for banking info */}
                              {item.itemTitle === "Complete Banking Information" && item.isCompleted && (
                                <div className={`mt-3 p-3 border rounded-lg ${
                                  bankingInfo?.isComplete 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-amber-50 border-amber-200'
                                }`}>
                                  <div className="flex items-center space-x-2 mb-2">
                                    <CreditCard className={`h-4 w-4 ${
                                      bankingInfo?.isComplete ? 'text-green-600' : 'text-amber-600'
                                    }`} />
                                    <span className={`text-sm font-medium ${
                                      bankingInfo?.isComplete ? 'text-green-900' : 'text-amber-900'
                                    }`}>
                                      Banking Information Status
                                    </span>
                                    <Badge variant="outline" className={
                                      bankingInfo?.isComplete 
                                        ? 'text-green-600 border-green-300' 
                                        : 'text-amber-600 border-amber-300'
                                    }>
                                      {bankingInfo?.isComplete ? '✓ Complete' : '⚠ Incomplete'}
                                    </Badge>
                                  </div>
                                  <div className={`text-xs space-y-1 ${
                                    bankingInfo?.isComplete ? 'text-green-700' : 'text-amber-700'
                                  }`}>
                                    <div>✓ Employee marked this step as completed</div>
                                    {bankingInfo?.isComplete ? (
                                      <>
                                        <div>✓ Banking details verified in employee profile</div>
                                        <div className="font-medium">
                                          {bankingInfo.bankName && `Bank: ${bankingInfo.bankName}`}
                                          {bankingInfo.accountHolderName && ` • Account Holder: ${bankingInfo.accountHolderName}`}
                                          {bankingInfo.accountType && ` • Type: ${bankingInfo.accountType}`}
                                          {bankingInfo.accountNumber && ` • Account: ${bankingInfo.accountNumber}`}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div>⚠ Banking details missing in employee profile</div>
                                        <div className="font-medium">Required: Bank name, account number, routing number</div>
                                      </>
                                    )}
                                  </div>
                                  {!bankingInfo?.isComplete && (user?.role === 'hr_admin') && (
                                    <div className="mt-2 pt-2 border-t border-amber-200">
                                      <div className="text-xs text-amber-800">
                                        <strong>HR Action Required:</strong> Contact employee to complete banking information in their profile
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Document Display for single documents */}
                              {item.documentUrl && item.documentName && item.itemTitle !== "Upload Required Documents" && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <FileText className="h-4 w-4 text-blue-600" />
                                      <span className="text-sm font-medium text-blue-900">
                                        {item.documentName}
                                      </span>
                                      {!item.isDocumentVerified && (
                                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                                          Pending Verification
                                        </Badge>
                                      )}
                                      {item.isDocumentVerified && (
                                        <Badge variant="outline" className="text-green-600 border-green-300">
                                          Verified
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={async () => {
                                          try {
                                            const response = await fetch(`/api/onboarding/document/${item.id}`);
                                            if (response.ok) {
                                              const blob = await response.blob();
                                              const url = window.URL.createObjectURL(blob);
                                              const link = document.createElement('a');
                                              link.href = url;
                                              link.download = item.documentName || 'document.pdf';
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                              window.URL.revokeObjectURL(url);
                                            } else {
                                              alert('Error downloading document');
                                            }
                                          } catch (error) {
                                            console.error('Download error:', error);
                                            alert('Error downloading document');
                                          }
                                        }}
                                      >
                                        <Download className="mr-1 h-3 w-3" />
                                        Download
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={async () => {
                                          try {
                                            const url = `/api/onboarding/document/${item.id}`;
                                            window.open(url, '_blank');
                                          } catch (error) {
                                            console.error('View error:', error);
                                            alert('Error viewing document');
                                          }
                                        }}
                                      >
                                        <Eye className="mr-1 h-3 w-3" />
                                        View
                                      </Button>
                                      {(user?.role === 'hr_admin') && !item.isDocumentVerified && (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          className="bg-green-600 hover:bg-green-700"
                                          onClick={async () => {
                                            try {
                                              await fetch(`/api/onboarding/verify-document`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                  itemId: item.id,
                                                  verified: true,
                                                  notes: 'Document verified by HR'
                                                })
                                              });
                                              window.location.reload();
                                            } catch (error) {
                                              console.error('Error verifying document:', error);
                                            }
                                          }}
                                        >
                                          <CheckCircle className="mr-1 h-3 w-3" />
                                          Verify
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  {item.verificationNotes && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                      <strong>Verification Notes:</strong> {item.verificationNotes}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Multiple Documents Display for "Upload Required Documents" */}
                              {item.itemTitle === "Upload Required Documents" && item.isCompleted && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-center space-x-2 mb-3">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">
                                      Required Documents Uploaded
                                    </span>
                                    <Badge variant="outline" className="text-green-600 border-green-300">
                                      ✓ Completed
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-blue-700 mb-2">
                                    Expected: CV, CNIC copy, and profile picture
                                  </div>
                                  
                                  {/* Show actual uploaded document */}
                                  {item.documentUrl && item.documentName && (
                                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                                      <div className="flex items-center space-x-2">
                                        <FileText className="h-3 w-3 text-blue-600" />
                                        <span className="text-xs font-medium text-blue-900">
                                          {item.documentName}
                                        </span>
                                        {!item.isDocumentVerified ? (
                                          <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                                            Pending Verification
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                            Verified
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={async () => {
                                            try {
                                              const response = await fetch(`/api/onboarding/document/${item.id}`);
                                              if (response.ok) {
                                                const blob = await response.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.download = item.documentName || 'document.pdf';
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                                window.URL.revokeObjectURL(url);
                                              } else {
                                                alert('Error downloading document');
                                              }
                                            } catch (error) {
                                              console.error('Download error:', error);
                                              alert('Error downloading document');
                                            }
                                          }}
                                        >
                                          <Download className="mr-1 h-2 w-2" />
                                          Download
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={async () => {
                                            try {
                                              const url = `/api/onboarding/document/${item.id}`;
                                              window.open(url, '_blank');
                                            } catch (error) {
                                              console.error('View error:', error);
                                              alert('Error viewing document');
                                            }
                                          }}
                                        >
                                          <Eye className="mr-1 h-2 w-2" />
                                          View
                                        </Button>
                                        {(user?.role === 'hr_admin') && !item.isDocumentVerified && (
                                          <Button
                                            size="sm"
                                            variant="default"
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={async () => {
                                              try {
                                                await fetch(`/api/onboarding/verify-document`, {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({
                                                    itemId: item.id,
                                                    verified: true,
                                                    notes: 'Document verified by HR'
                                                  })
                                                });
                                                window.location.reload();
                                              } catch (error) {
                                                console.error('Error verifying document:', error);
                                              }
                                            }}
                                          >
                                            <CheckCircle className="mr-1 h-2 w-2" />
                                            Verify
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}


                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(item.isCompleted ? 'completed' : 'pending')}>
                              {item.isCompleted ? 'Completed' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Results Tab */}
          <TabsContent value="tests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Psychometric Test Results</CardTitle>
                <CardDescription>
                  View detailed results from all psychometric assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No test results available</p>
                ) : (
                  <div className="space-y-4">
                    {testResults.map((test) => (
                      <div key={test.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">Test Attempt #{test.id}</h4>
                            <p className="text-sm text-gray-600">
                              Completed: {test.completedAt ? new Date(test.completedAt).toLocaleDateString() : 'In Progress'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{test.percentageScore || 0}% Score</Badge>
                            <Button size="sm" variant="outline">
                              <Eye className="mr-1 h-4 w-4" />
                              View Details
                            </Button>
                          </div>
                        </div>
                        {test.results ? (
                          <div className="bg-gray-50 rounded p-3 text-sm">
                            <pre className="whitespace-pre-wrap">
                              {(() => {
                                try {
                                  if (typeof test.results === 'object' && test.results !== null) {
                                    return JSON.stringify(test.results, null, 2);
                                  }
                                  return String(test.results);
                                } catch (error) {
                                  return 'Error displaying results';
                                }
                              })()}
                            </pre>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6 pb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ListTodo className="mr-2 h-5 w-5" />
                  Assigned Tasks
                </CardTitle>
                <CardDescription>
                  View all tasks assigned to this employee
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading tasks...</span>
                  </div>
                ) : employeeTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <ListTodo className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-600">No tasks assigned to this employee</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {employeeTasks.map((task) => (
                      <div
                        key={task.id}
                        className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                        data-testid={`task-card-${task.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900" data-testid={`task-title-${task.id}`}>
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1" data-testid={`task-description-${task.id}`}>
                                {task.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {task.priority && (
                              <Badge 
                                variant={
                                  task.priority === 'urgent' ? 'destructive' :
                                  task.priority === 'high' ? 'default' :
                                  task.priority === 'normal' ? 'secondary' :
                                  'outline'
                                }
                                data-testid={`task-priority-${task.id}`}
                              >
                                {task.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            {task.status === 'completed' ? (
                              <Badge variant="default" className="bg-green-600" data-testid={`task-status-${task.id}`}>
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Completed
                              </Badge>
                            ) : task.status === 'in_progress' ? (
                              <Badge variant="default" className="bg-blue-600" data-testid={`task-status-${task.id}`}>
                                <Clock className="mr-1 h-3 w-3" />
                                In Progress
                              </Badge>
                            ) : task.status === 'overdue' ? (
                              <Badge variant="destructive" data-testid={`task-status-${task.id}`}>
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Overdue
                              </Badge>
                            ) : (
                              <Badge variant="outline" data-testid={`task-status-${task.id}`}>
                                Pending
                              </Badge>
                            )}
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center text-sm text-gray-600" data-testid={`task-due-date-${task.id}`}>
                              <Calendar className="mr-1 h-4 w-4" />
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave & Attendance Tab */}
          <TabsContent value="leave" className="space-y-6 pb-16">
            {/* Leave Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Sick Leave</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-blue-600">
                      {leaveBalance?.sickPaid || 0} paid / {leaveBalance?.sickUnpaid || 0} unpaid
                    </div>
                    <p className="text-xs text-gray-500">Annual entitlement: 15 paid + 15 unpaid days</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Casual Leave</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">
                      {leaveBalance?.casualPaid || 0} days
                    </div>
                    <p className="text-xs text-gray-500">Annual entitlement: 5 paid days</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Other Leave</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bereavement:</span>
                      <span className="font-semibold">{leaveBalance?.bereavementUsed || 0} used</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Public Holidays:</span>
                      <span className="font-semibold">{leaveBalance?.publicHolidaysUsed || 0} used</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unpaid:</span>
                      <span className="font-semibold">{leaveBalance?.unpaidUsed || 0} used</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leave Request History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2" size={20} />
                  Leave Request History
                </CardTitle>
                <CardDescription>All leave requests for this employee</CardDescription>
              </CardHeader>
              <CardContent>
                {employeeLeaveRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No leave requests found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {employeeLeaveRequests.map((request: any) => (
                      <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50" data-testid={`leave-request-${request.id}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900">
                                {request.leaveType === 'sick' ? 'Sick Leave' :
                                 request.leaveType === 'casual' ? 'Casual Leave' :
                                 request.leaveType === 'bereavement' ? 'Bereavement Leave' :
                                 request.leaveType === 'public_holiday' ? 'Public Holiday' :
                                 'Unpaid Leave'}
                              </span>
                              <Badge variant={
                                request.status === 'approved' ? 'default' :
                                request.status === 'rejected' ? 'destructive' :
                                request.status === 'processed' ? 'secondary' :
                                'outline'
                              }>
                                {request.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4" />
                                {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                              </div>
                              <p className="mt-2"><strong>Reason:</strong> {request.reason}</p>
                              {request.coveringEmployeeName && (
                                <p className="mt-1 text-purple-700">
                                  <strong>Duties covered by:</strong> {request.coveringEmployeeName}
                                </p>
                              )}
                              {request.status === 'rejected' && request.rejectionReason && (
                                <p className="text-red-600 mt-1">
                                  <strong>Rejection Reason:</strong> {request.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            Submitted: {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Responsibilities Section */}
            {employee.responsibilities && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ListTodo className="mr-2" size={20} />
                    Job Responsibilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{employee.responsibilities}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documents & Consents</CardTitle>
                <CardDescription>
                  View document uploads and consent status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Consent Status */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Consent Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Privacy Policy</span>
                        <Badge variant={employee.privacyPolicyAgreed ? 'default' : 'destructive'}>
                          {employee.privacyPolicyAgreed ? 'Agreed' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Terms & Conditions</span>
                        <Badge variant={employee.termsAndConditionsAgreed ? 'default' : 'destructive'}>
                          {employee.termsAndConditionsAgreed ? 'Agreed' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Background Check</span>
                        <Badge variant={employee.backgroundCheckConsent ? 'default' : 'destructive'}>
                          {employee.backgroundCheckConsent ? 'Consented' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Data Processing</span>
                        <Badge variant={employee.dataProcessingConsent ? 'default' : 'destructive'}>
                          {employee.dataProcessingConsent ? 'Consented' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Profile Completion */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Profile Completion</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Personal Profile</span>
                        <Badge variant={employee.personalProfileCompleted ? 'default' : 'secondary'}>
                          {employee.personalProfileCompleted ? 'Complete' : 'Incomplete'}
                        </Badge>
                      </div>
                      {employee.personalProfileCompletedAt && (
                        <p className="text-xs text-gray-500">
                          Completed: {new Date(employee.personalProfileCompletedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}