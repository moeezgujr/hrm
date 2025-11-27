import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Search, Plus, Filter, Edit, Mail, Phone, MapPin, CreditCard, Eye, Table, Grid3X3, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import EmployeeCard from '@/components/employees/employee-card';
import { Employee, User } from '@shared/schema';
import { ResponsibilityDocumentUpload } from '@/components/ResponsibilityDocumentUpload';
import { PermissionManagementDialog } from '@/components/permissions/PermissionManagementDialog';

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  userId: z.string().optional(), // Make optional since we'll generate it
  employeeId: z.string().optional(), // Make optional since we'll auto-generate
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.any().optional(),
  role: z.enum(['hr_admin', 'branch_manager', 'team_lead', 'employee', 'logistics_manager', 'studio_manager', 'content_creator', 'content_editor', 'creative_director', 'social_media_specialist']).default('employee'),
  department: z.string().optional(),
  position: z.string().optional(),
  designation: z.string().optional(), // Organizational designation (CEO, Clinic Director, etc.)
  responsibilities: z.string().optional(), // Job responsibilities description
  reportingManager: z.string().optional(), // Reports to (select from employees list)
  companyId: z.string().min(1, 'Company selection is required'), // Required company assignment
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function Employees() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showBankingDetails, setShowBankingDetails] = useState(false);
  const [managingPermissionsEmployee, setManagingPermissionsEmployee] = useState<(Employee & { user: User }) | null>(null);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      userId: '',
      employeeId: '',
      phoneNumber: '',
      address: '',
      role: 'employee',
      department: '',
      position: '',
      designation: '',
      responsibilities: '',
      reportingManager: '',
      companyId: '',
    },
  });

  const { data: employees, isLoading } = useQuery({
    queryKey: ['/api/employees'],
    retry: false,
  });

  const { data: companies = [], isLoading: isCompaniesLoading } = useQuery({
    queryKey: ['/api/companies'],
    retry: false,
  });

  const { data: bankingData, isLoading: isBankingLoading } = useQuery({
    queryKey: ['/api/employees/banking/all'],
    retry: false,
    enabled: user?.role === 'hr_admin' || user?.role === 'branch_manager',
  });

  // Fetch tasks for the editing employee
  const { data: employeeTasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: editingEmployee?.userId ? [`/api/tasks?assignedTo=${editingEmployee.userId}`] : ['/api/tasks/disabled'],
    retry: false,
    enabled: !!editingEmployee?.userId,
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      // Try to create/update user and employee in a single request
      return await apiRequest('POST', '/api/employees/create-with-user', {
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        department: data.department,
        position: data.position,
        designation: data.designation,
        responsibilities: data.responsibilities,
        companyId: parseInt(data.companyId), // Always required now
        employeeId: data.employeeId || `EMP${Date.now().toString().slice(-6)}`,
        phoneNumber: data.phoneNumber,
        address: data.address,
        emergencyContact: data.emergencyContact,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setShowAddDialog(false);
      form.reset();
      toast({
        title: "Employee Created Successfully",
        description: "The employee has been added and an onboarding email has been sent to their email address.",
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
      
      // Show specific error message if available
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create employee";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<EmployeeFormData> }) => {
      return await apiRequest('PUT', `/api/employees/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setEditingEmployee(null);
      form.reset();
      toast({
        title: "Success",
        description: "Employee updated successfully",
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
        description: "Failed to update employee",
        variant: "destructive",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/employees/${id}`);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Employee Deleted",
        description: "Employee has been successfully deleted along with all associated records.",
      });
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      
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
      
      let errorMessage = "Failed to delete employee";
      
      // Handle different error formats
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 503) {
        errorMessage = "Service temporarily unavailable. Please try again.";
      }
      
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  // Handle form validation errors
  const handleFormError = (errors: any) => {
    console.log('Form validation errors:', errors);
    
    // Get the first error message
    const firstErrorField = Object.keys(errors)[0];
    const firstErrorMessage = errors[firstErrorField]?.message;
    
    // Show toast with validation error
    toast({
      title: 'Form Validation Error',
      description: firstErrorMessage || 'Please fill in all required fields correctly',
      variant: 'destructive',
    });
  };

  const handleEdit = (employee: Employee & { user: User; company?: any }) => {
    setEditingEmployee(employee);
    form.reset({
      userId: employee.userId.toString(),
      employeeId: employee.employeeId,
      phoneNumber: employee.phoneNumber || '',
      address: employee.address || '',
      firstName: employee.user.firstName || '',
      lastName: employee.user.lastName || '',
      email: employee.user.email,
      username: employee.user.username,
      role: employee.user.role as any,
      department: employee.user.department || '',
      position: employee.user.position || '',
      designation: employee.designation || '',
      responsibilities: employee.responsibilities || '',
      reportingManager: employee.reportingManager || '',
      companyId: employee.companyId?.toString() || '',
    });
  };

  const handleDelete = (employee: Employee & { user: User }) => {
    if (window.confirm(`Are you sure you want to delete ${employee.user.firstName} ${employee.user.lastName}? This action cannot be undone and will remove all associated data including tasks, projects, and onboarding records.`)) {
      deleteEmployeeMutation.mutate(employee.id);
    }
  };

  const handleManagePermissions = (employee: Employee & { user: User }) => {
    setManagingPermissionsEmployee(employee);
  };

  const canManageEmployees = user?.role && ['hr_admin', 'branch_manager'].includes(user.role);

  const filteredEmployees = (employees || []).filter((employee: Employee & { user: User; company?: any }) => {
    const matchesSearch = !searchTerm || 
      `${employee.user.firstName} ${employee.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || employee.user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || employee.user.role === roleFilter;
    const matchesDepartment = departmentFilter === 'all' || employee.user.department === departmentFilter;
    const matchesCompany = companyFilter === 'all' || (employee.company && employee.company.id.toString() === companyFilter);

    return matchesSearch && matchesStatus && matchesRole && matchesDepartment && matchesCompany;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Employee Management</h2>
          <p className="text-gray-600 mt-1">Manage and view employee information</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {(user?.role === 'hr_admin' || user?.role === 'branch_manager') && (
            <>
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4 mr-1" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-l-none"
                >
                  <Table className="w-4 h-4 mr-1" />
                  Table
                </Button>
              </div>
              {viewMode === 'table' && (
                <Button
                  variant={showBankingDetails ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowBankingDetails(!showBankingDetails)}
                >
                  <CreditCard className="w-4 h-4 mr-1" />
                  Banking Info
                </Button>
              )}
            </>
          )}
          
          {canManageEmployees && (
          <Dialog open={showAddDialog || !!editingEmployee} onOpenChange={(open) => {
            if (!open) {
              setShowAddDialog(false);
              setEditingEmployee(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowAddDialog(true)} className="btn-primary">
                <Plus className="mr-2" size={16} />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </DialogTitle>
              </DialogHeader>
              
              {/* Validation Error Alert */}
              {Object.keys(form.formState.errors).length > 0 && (
                <div className="mx-6 mb-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-900 mb-1">Please fix the following errors:</h4>
                      <ul className="text-sm text-red-800 space-y-1">
                        {Object.entries(form.formState.errors).map(([field, error]: [string, any]) => (
                          <li key={field} className="flex items-start gap-1">
                            <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span>{error.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                {editingEmployee ? (
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="details">Employee Details</TabsTrigger>
                      <TabsTrigger value="tasks">Assigned Tasks ({employeeTasks?.length || 0})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="mt-0">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit, handleFormError)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Minimum 6 characters" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User ID (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Auto-generated if empty" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee ID (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Auto-generated if empty" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">General Roles</div>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="team_lead">Team Lead</SelectItem>
                              <SelectItem value="branch_manager">Branch Manager</SelectItem>
                              <SelectItem value="hr_admin">HR Admin</SelectItem>
                              <SelectItem value="logistics_manager">Logistics Manager</SelectItem>
                              <div className="px-2 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 mt-2">Meeting Matters Studio</div>
                              <SelectItem value="studio_manager">Studio Manager</SelectItem>
                              <SelectItem value="content_creator">Content Creator</SelectItem>
                              <SelectItem value="content_editor">Content Editor</SelectItem>
                              <SelectItem value="creative_director">Creative Director</SelectItem>
                              <SelectItem value="social_media_specialist">Social Media Specialist</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company *</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger data-testid="select-company">
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                            <SelectContent>
                              {isCompaniesLoading ? (
                                <div className="p-2 text-sm text-gray-500">Loading companies...</div>
                              ) : companies.length > 0 ? (
                                companies.map((company: any) => (
                                  <SelectItem key={company.id} value={company.id.toString()}>
                                    {company.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="p-2 text-sm text-gray-500">No companies available</div>
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Human Resources">Human Resources</SelectItem>
                              <SelectItem value="IT">IT</SelectItem>
                              <SelectItem value="Sales">Sales</SelectItem>
                              <SelectItem value="Marketing">Marketing</SelectItem>
                              <SelectItem value="Finance">Finance</SelectItem>
                              <SelectItem value="Operations">Operations</SelectItem>
                              <SelectItem value="Customer Service">Customer Service</SelectItem>
                              <SelectItem value="Legal">Legal</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Software Engineer, HR Specialist" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation (Meeting Matters Hierarchy)</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger data-testid="select-designation">
                              <SelectValue placeholder="Select designation" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ceo">CEO</SelectItem>
                              <SelectItem value="clinic_director">Clinic Director</SelectItem>
                              <SelectItem value="business_development_manager">Business Development Manager (BDM)</SelectItem>
                              <SelectItem value="administrative_manager">Administrative Manager</SelectItem>
                              <SelectItem value="administrative_assistant">Administrative Assistant</SelectItem>
                              <SelectItem value="client_relation_manager">Client Relation Manager</SelectItem>
                              <SelectItem value="accounts_manager">Accounts Manager</SelectItem>
                              <SelectItem value="it_manager">IT Manager</SelectItem>
                              <SelectItem value="hr_manager">HR Manager</SelectItem>
                              <SelectItem value="documentation_manager">Documentation Manager</SelectItem>
                              <SelectItem value="psychologist">Psychologist</SelectItem>
                              <SelectItem value="therapist">Therapist</SelectItem>
                              <SelectItem value="counsellor">Counsellor</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="responsibilities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Responsibilities</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter job responsibilities and duties for this role..." 
                            className="resize-none min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <ResponsibilityDocumentUpload
                    employeeId={editingEmployee?.id}
                    documents={editingEmployee?.responsibilityDocuments as any[] || []}
                    isEditing={true}
                  />

                  <FormField
                    control={form.control}
                    name="reportingManager"
                    render={({ field }) => {
                      const selectedCompanyId = form.watch('companyId');
                      const availableManagers = (employees || []).filter((emp: Employee & { user: User }) => 
                        emp.id !== editingEmployee?.id && 
                        (!selectedCompanyId || emp.companyId?.toString() === selectedCompanyId)
                      );

                      return (
                        <FormItem>
                          <FormLabel>Reports To (Reporting Manager)</FormLabel>
                          <FormControl>
                            <Select value={field.value || 'none'} onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}>
                              <SelectTrigger data-testid="select-reporting-manager">
                                <SelectValue placeholder="Select reporting manager" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Manager (Top Level)</SelectItem>
                                {availableManagers.map((emp: Employee & { user: User }) => (
                                  <SelectItem key={`manager-edit-${emp.id}`} value={emp.user.username}>
                                    {emp.user.firstName && emp.user.lastName 
                                      ? `${emp.user.firstName} ${emp.user.lastName}` 
                                      : emp.user.username} - {emp.user.position || emp.user.department || emp.user.role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  
                    <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddDialog(false);
                          setEditingEmployee(null);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                        className="btn-primary"
                      >
                        {editingEmployee ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="tasks" className="mt-0">
                {isTasksLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : employeeTasks && employeeTasks.length > 0 ? (
                  <div className="space-y-3">
                    {employeeTasks.map((task: any) => (
                      <div key={task.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {task.priority && (
                                <Badge variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'default' : 'secondary'}>
                                  {task.priority}
                                </Badge>
                              )}
                              {task.dueDate && (
                                <span className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            {task.status === 'completed' ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            ) : task.status === 'in_progress' ? (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                <Clock className="w-3 h-3 mr-1" />
                                In Progress
                              </Badge>
                            ) : task.status === 'overdue' ? (
                              <Badge variant="destructive">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Overdue
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No tasks assigned to this employee
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, handleFormError)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Minimum 6 characters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User ID (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-generated if empty" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee ID (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-generated if empty" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">General Roles</div>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="team_lead">Team Lead</SelectItem>
                          <SelectItem value="branch_manager">Branch Manager</SelectItem>
                          <SelectItem value="hr_admin">HR Admin</SelectItem>
                          <SelectItem value="logistics_manager">Logistics Manager</SelectItem>
                          <div className="px-2 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 mt-2">Meeting Matters Studio</div>
                          <SelectItem value="studio_manager">Studio Manager</SelectItem>
                          <SelectItem value="content_creator">Content Creator</SelectItem>
                          <SelectItem value="content_editor">Content Editor</SelectItem>
                          <SelectItem value="creative_director">Creative Director</SelectItem>
                          <SelectItem value="social_media_specialist">Social Media Specialist</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-company-create">
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {isCompaniesLoading ? (
                            <div className="p-2 text-sm text-gray-500">Loading companies...</div>
                          ) : companies.length > 0 ? (
                            companies.map((company: any) => (
                              <SelectItem key={company.id} value={company.id.toString()}>
                                {company.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-gray-500">No companies available</div>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Human Resources">Human Resources</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Customer Service">Customer Service</SelectItem>
                          <SelectItem value="Legal">Legal</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Software Engineer, HR Specialist" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation (Meeting Matters Hierarchy)</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-designation-add">
                          <SelectValue placeholder="Select designation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ceo">CEO</SelectItem>
                          <SelectItem value="clinic_director">Clinic Director</SelectItem>
                          <SelectItem value="business_development_manager">Business Development Manager (BDM)</SelectItem>
                          <SelectItem value="administrative_manager">Administrative Manager</SelectItem>
                          <SelectItem value="administrative_assistant">Administrative Assistant</SelectItem>
                          <SelectItem value="client_relation_manager">Client Relation Manager</SelectItem>
                          <SelectItem value="accounts_manager">Accounts Manager</SelectItem>
                          <SelectItem value="it_manager">IT Manager</SelectItem>
                          <SelectItem value="hr_manager">HR Manager</SelectItem>
                          <SelectItem value="documentation_manager">Documentation Manager</SelectItem>
                          <SelectItem value="psychologist">Psychologist</SelectItem>
                          <SelectItem value="therapist">Therapist</SelectItem>
                          <SelectItem value="counsellor">Counsellor</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsibilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Responsibilities</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter job responsibilities and duties for this role..." 
                        className="resize-none min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ResponsibilityDocumentUpload
                employeeId={editingEmployee?.id}
                documents={editingEmployee?.responsibilityDocuments as any[] || []}
                isEditing={true}
              />

              <FormField
                control={form.control}
                name="reportingManager"
                render={({ field }) => {
                  const selectedCompanyId = form.watch('companyId');
                  const availableManagers = (employees || []).filter((emp: Employee & { user: User }) => 
                    (!selectedCompanyId || emp.companyId?.toString() === selectedCompanyId)
                  );

                  return (
                    <FormItem>
                      <FormLabel>Reports To (Reporting Manager)</FormLabel>
                      <FormControl>
                        <Select value={field.value || 'none'} onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}>
                          <SelectTrigger data-testid="select-reporting-manager-add">
                            <SelectValue placeholder="Select reporting manager" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Manager (Top Level)</SelectItem>
                            {availableManagers.map((emp: Employee & { user: User }) => (
                              <SelectItem key={`manager-add-${emp.id}`} value={emp.user.username}>
                                {emp.user.firstName && emp.user.lastName 
                                  ? `${emp.user.firstName} ${emp.user.lastName}` 
                                  : emp.user.username} - {emp.user.position || emp.user.department || emp.user.role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              
                <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false);
                      setEditingEmployee(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                    className="btn-primary"
                  >
                    {editingEmployee ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-employees"
              />
            </div>
            
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger data-testid="filter-company">
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map((company: any) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="filter-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger data-testid="filter-role">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="hr_admin">HR Admin</SelectItem>
                <SelectItem value="branch_manager">Branch Manager</SelectItem>
                <SelectItem value="team_lead">Team Lead</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="logistics_manager">Logistics Manager</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger data-testid="filter-department">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Human Resources">Human Resources</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="stats-card animate-pulse">
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee: Employee & { user: User }) => (
            <EmployeeCard 
              key={employee.id} 
              employee={employee} 
              onEdit={canManageEmployees ? handleEdit : undefined}
              onDelete={canManageEmployees ? handleDelete : undefined}
              onManagePermissions={user?.role === 'hr_admin' ? handleManagePermissions : undefined}
              canDelete={canManageEmployees && ['hr_admin', 'branch_manager'].includes(user?.role || '')}
              canManagePermissions={user?.role === 'hr_admin'}
            />
          ))}
        </div>
      ) : (
        <Card className="stats-card">
          <CardContent className="p-12 text-center">
            <Users className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter || roleFilter || departmentFilter 
                ? "Try adjusting your filters or search terms" 
                : "No employees have been added yet"}
            </p>
            {canManageEmployees && (
              <Button onClick={() => setShowAddDialog(true)} className="btn-primary">
                <Plus className="mr-2" size={16} />
                Add First Employee
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Permission Management Dialog */}
      {managingPermissionsEmployee && (
        <PermissionManagementDialog
          open={!!managingPermissionsEmployee}
          onOpenChange={(open) => {
            if (!open) setManagingPermissionsEmployee(null);
          }}
          userId={managingPermissionsEmployee.user.id}
          userName={`${managingPermissionsEmployee.user.firstName} ${managingPermissionsEmployee.user.lastName}`}
          userRole={managingPermissionsEmployee.user.role}
        />
      )}
    </div>
  );
}
