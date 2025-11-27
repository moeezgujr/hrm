import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Plus, 
  Users, 
  MapPin, 
  DollarSign,
  Edit,
  Trash2,
  UserCheck,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const departmentOptions = [
  { value: 'human_resources', label: 'Human Resources' },
  { value: 'information_technology', label: 'Information Technology' },
  { value: 'finance_accounting', label: 'Finance & Accounting' },
  { value: 'sales_marketing', label: 'Sales & Marketing' },
  { value: 'operations', label: 'Operations' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'research_development', label: 'Research & Development' },
  { value: 'legal_compliance', label: 'Legal & Compliance' },
  { value: 'executive_management', label: 'Executive Management' },
  { value: 'facilities_maintenance', label: 'Facilities & Maintenance' }
];

export default function Departments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

  const [newDepartment, setNewDepartment] = useState({
    code: '',
    name: '',
    description: '',
    managerId: '',
    budgetAllocated: '',
    location: '',
    headcount: 0
  });

  // Fetch departments
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['/api/departments'],
  });

  // Fetch employees for department details
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Create department mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/departments', 'POST', {
        ...data,
        budgetAllocated: data.budgetAllocated ? parseFloat(data.budgetAllocated) : null,
        managerId: data.managerId || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setIsCreateModalOpen(false);
      setNewDepartment({
        code: '',
        name: '',
        description: '',
        managerId: '',
        budgetAllocated: '',
        location: '',
        headcount: 0
      });
      toast({
        title: "Success",
        description: "Department created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create department",
        variant: "destructive",
      });
    },
  });

  // Update department mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      return await apiRequest(`/api/departments/${id}`, 'PUT', {
        ...data,
        budgetAllocated: data.budgetAllocated ? parseFloat(data.budgetAllocated) : null,
        managerId: data.managerId || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setIsEditModalOpen(false);
      toast({
        title: "Success",
        description: "Department updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update department",
        variant: "destructive",
      });
    },
  });

  // Delete department mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/departments/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      toast({
        title: "Success",
        description: "Department deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete department",
        variant: "destructive",
      });
    },
  });

  // Assign employees to department mutation
  const assignEmployeesMutation = useMutation({
    mutationFn: async ({ departmentCode, employeeIds }: { departmentCode: string, employeeIds: number[] }) => {
      const promises = employeeIds.map(employeeId => 
        apiRequest(`/api/employees/${employeeId}`, 'PUT', { department: departmentCode })
      );
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setIsAssignModalOpen(false);
      setSelectedEmployees([]);
      toast({
        title: "Success",
        description: "Employees assigned to department successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign employees to department",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!newDepartment.code || !newDepartment.name) {
      toast({
        title: "Missing Information",
        description: "Please provide department code and name",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newDepartment);
  };

  const handleEdit = (department: any) => {
    setSelectedDepartment(department);
    setNewDepartment({
      code: department.code,
      name: department.name,
      description: department.description || '',
      managerId: department.managerId || '',
      budgetAllocated: department.budgetAllocated || '',
      location: department.location || '',
      headcount: department.headcount || 0
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedDepartment) return;
    updateMutation.mutate({
      id: selectedDepartment.id,
      data: newDepartment
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this department?')) {
      deleteMutation.mutate(id);
    }
  };

  const getDepartmentEmployeeCount = (departmentCode: string) => {
    return (employees as any[]).filter((emp: any) => emp.department === departmentCode).length;
  };

  const getDepartmentEmployees = (departmentCode: string) => {
    return (employees as any[]).filter((emp: any) => emp.department === departmentCode);
  };

  const getUnassignedEmployees = () => {
    return (employees as any[]).filter((emp: any) => !emp.department);
  };

  const handleAssignEmployees = (department: any) => {
    setSelectedDepartment(department);
    setSelectedEmployees([]);
    setIsAssignModalOpen(true);
  };

  const handleEmployeeSelection = (employeeId: number) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const submitAssignments = () => {
    if (!selectedDepartment || selectedEmployees.length === 0) return;
    assignEmployeesMutation.mutate({
      departmentCode: selectedDepartment.code,
      employeeIds: selectedEmployees
    });
  };

  const getManagerName = (managerId: string) => {
    if (!managerId) return null;
    const manager = (employees as any[]).find((emp: any) => emp.user?.id === managerId);
    return manager ? `${manager.user?.firstName} ${manager.user?.lastName}` : null;
  };

  const canManageDepartments = user?.role === 'hr_admin' || user?.role === 'branch_manager';
  const isDepartmentHead = user?.role === 'department_head';
  const canViewDepartments = canManageDepartments || isDepartmentHead;

  if (!user || !canViewDepartments) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">Only HR administrators, branch managers, and department heads can access department management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Department Management</h2>
          <p className="text-gray-600 mt-1">Manage organizational departments and structure</p>
        </div>
        {canManageDepartments && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Department Code</Label>
                  <Select 
                    value={newDepartment.code}
                    onValueChange={(value) => {
                      const option = departmentOptions.find(opt => opt.value === value);
                      setNewDepartment(prev => ({ 
                        ...prev, 
                        code: value,
                        name: option?.label || value
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department type" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Department Name</Label>
                  <Input
                    id="name"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Human Resources"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of department responsibilities..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newDepartment.location}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Main Office - Floor 2"
                  />
                </div>
                <div>
                  <Label htmlFor="budgetAllocated">Budget Allocated</Label>
                  <Input
                    id="budgetAllocated"
                    type="number"
                    step="0.01"
                    value={newDepartment.budgetAllocated}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, budgetAllocated: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Department'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Department Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Departments</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{departments.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{employees.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Managers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {departments.filter(d => d.manager).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Avg Team Size</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {departments.length > 0 ? Math.round(employees.length / departments.length) : 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments List */}
      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading departments...</p>
          </div>
        ) : (departments as any[]).length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Departments</h3>
              <p className="text-gray-600 mb-4">Create your first department to get started with organizational structure.</p>
            </CardContent>
          </Card>
        ) : (
          (departments as any[]).map((department: any) => {
            const employeeCount = getDepartmentEmployeeCount(department.code);
            const managerName = getManagerName(department.managerId);
            
            return (
              <Card key={department.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                        <Badge variant="secondary">
                          {department.code.replace('_', ' ')}
                        </Badge>
                        <Badge variant={department.isActive ? "default" : "secondary"}>
                          {department.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {department.description && (
                        <p className="text-gray-600 mb-4">{department.description}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{employeeCount} employees</span>
                        </div>
                        {department.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{department.location}</span>
                          </div>
                        )}
                        {department.budgetAllocated && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4" />
                            <span>${department.budgetAllocated}</span>
                          </div>
                        )}
                        {managerName && (
                          <div className="flex items-center space-x-1">
                            <UserCheck className="h-4 w-4" />
                            <span>Mgr: {managerName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isDepartmentHead && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => {
                            // Navigate to task request with department context
                            window.location.href = `/task-requests?departmentId=${department.id}&action=request`;
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Request Task
                        </Button>
                      )}
                      {canManageDepartments && (
                        <>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleAssignEmployees(department)}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            Assign Employees
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(department)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(department.id)}
                            disabled={employeeCount > 0}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Assign Employees Modal */}
      {canManageDepartments && (
        <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Assign Employees to {selectedDepartment?.name}</DialogTitle>
              <DialogDescription>
                Select employees to assign to this department from the available list below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto">
              <div className="text-sm text-gray-600">
                Select employees to assign to {selectedDepartment?.name} department:
              </div>
              
              {/* Current Department Employees */}
              {selectedDepartment && getDepartmentEmployees(selectedDepartment.code).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Current Department Employees</h4>
                  <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                    {getDepartmentEmployees(selectedDepartment.code).map((emp: any) => (
                      <div key={emp.id} className="flex items-center justify-between text-sm">
                        <span>{emp.user?.firstName} {emp.user?.lastName} (#{emp.employeeId})</span>
                        <Badge variant="secondary">Current</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Employees */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Available Employees</h4>
                {getUnassignedEmployees().length === 0 ? (
                  <p className="text-gray-500 text-sm">No unassigned employees available</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {getUnassignedEmployees().map((emp: any) => (
                      <div key={emp.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`emp-${emp.id}`}
                          checked={selectedEmployees.includes(emp.id)}
                          onChange={() => handleEmployeeSelection(emp.id)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`emp-${emp.id}`} className="text-sm cursor-pointer flex-1">
                          {emp.user?.firstName} {emp.user?.lastName} (#{emp.employeeId})
                          {emp.position && <span className="text-gray-500"> - {emp.position}</span>}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setIsAssignModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={submitAssignments}
                disabled={selectedEmployees.length === 0 || assignEmployeesMutation.isPending}
              >
                {assignEmployeesMutation.isPending ? 'Assigning...' : `Assign ${selectedEmployees.length} Employee${selectedEmployees.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Department Modal */}
      {canManageDepartments && (
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update the department information using the form below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editCode">Department Code</Label>
                <Select 
                  value={newDepartment.code}
                  onValueChange={(value) => {
                    const option = departmentOptions.find(opt => opt.value === value);
                    setNewDepartment(prev => ({ 
                      ...prev, 
                      code: value,
                      name: option?.label || value
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editName">Department Name</Label>
                <Input
                  id="editName"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Human Resources"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={newDepartment.description}
                onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of department responsibilities..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editLocation">Location</Label>
                <Input
                  id="editLocation"
                  value={newDepartment.location}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Main Office - Floor 2"
                />
              </div>
              <div>
                <Label htmlFor="editBudgetAllocated">Budget Allocated</Label>
                <Input
                  id="editBudgetAllocated"
                  type="number"
                  step="0.01"
                  value={newDepartment.budgetAllocated}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, budgetAllocated: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Updating...' : 'Update Department'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}