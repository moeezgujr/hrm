import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, DollarSign, MapPin, Plus, Edit, Trash2, UserCheck, Eye } from "lucide-react";

const departmentSchema = z.object({
  code: z.string().min(2, "Department code must be at least 2 characters").max(10, "Code too long"),
  name: z.string().min(3, "Department name must be at least 3 characters"),
  description: z.string().optional(),
  managerId: z.string().optional(),
  budgetAllocated: z.string().optional(),
  headcount: z.string().optional(),
  location: z.string().optional(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface Department {
  id: number;
  code: string;
  name: string;
  description?: string;
  managerId?: number;
  budgetAllocated?: string;
  headcount?: number;
  location?: string;
  isActive: boolean;
  managerName?: string;
  managerEmail?: string;
  employeeCount?: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export default function DepartmentManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { toast } = useToast();

  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ['/api/departments/detailed'],
    queryFn: () => apiRequest('/api/departments/detailed'),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users/managers'],
    queryFn: () => apiRequest('/api/users/managers'),
  });

  const createForm = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      managerId: "none",
      budgetAllocated: "",
      headcount: "",
      location: "",
    },
  });

  const editForm = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: DepartmentFormData) => {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          managerId: data.managerId && data.managerId !== "none" ? parseInt(data.managerId) : null,
          budgetAllocated: data.budgetAllocated || null,
          headcount: data.headcount ? parseInt(data.headcount) : 0,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create department');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Department created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/departments/detailed'] });
      setShowCreateModal(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create department",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: DepartmentFormData & { id: number }) => {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          managerId: data.managerId && data.managerId !== "none" ? parseInt(data.managerId) : null,
          budgetAllocated: data.budgetAllocated || null,
          headcount: data.headcount ? parseInt(data.headcount) : 0,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update department');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Department updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/departments/detailed'] });
      setShowEditModal(false);
      setSelectedDepartment(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update department",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete department');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Department deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/departments/detailed'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete department",
        variant: "destructive" 
      });
    },
  });

  const onCreateSubmit = (data: DepartmentFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: DepartmentFormData) => {
    if (selectedDepartment) {
      updateMutation.mutate({ ...data, id: selectedDepartment.id });
    }
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    editForm.reset({
      code: department.code,
      name: department.name,
      description: department.description || "",
      managerId: department.managerId?.toString() || "none",
      budgetAllocated: department.budgetAllocated || "",
      headcount: department.headcount?.toString() || "",
      location: department.location || "",
    });
    setShowEditModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this department?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetails = (department: Department) => {
    setSelectedDepartment(department);
    setShowDetailsModal(true);
  };

  if (departmentsLoading || usersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Department Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Department Management</h1>
          <p className="text-gray-600 mt-1">Manage departments and assign managers</p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Department
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., IT, HR, FIN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Information Technology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Department description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Manager</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Manager</SelectItem>
                          {users.map((user: User) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.username} ({user.email}) - {user.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="budgetAllocated"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget</FormLabel>
                        <FormControl>
                          <Input placeholder="50000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="headcount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Headcount</FormLabel>
                        <FormControl>
                          <Input placeholder="10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Building A, Floor 2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Department"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Department Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With Managers</p>
                <p className="text-2xl font-bold">{departments.filter((d: Department) => d.managerId).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold">{departments.reduce((sum: number, d: Department) => sum + (d.employeeCount || 0), 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold">
                  ${departments.reduce((sum: number, d: Department) => sum + parseFloat(d.budgetAllocated || '0'), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((department: Department) => (
          <Card key={department.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{department.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">{department.code}</Badge>
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => handleViewDetails(department)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(department)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(department.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {department.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{department.description}</p>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <UserCheck className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600">Manager:</span>
                    <span className="ml-1 font-medium">
                      {department.managerName || "Not assigned"}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Users className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600">Employees:</span>
                    <span className="ml-1 font-medium">{department.employeeCount || 0}</span>
                  </div>
                  
                  {department.location && (
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">{department.location}</span>
                    </div>
                  )}
                  
                  {department.budgetAllocated && (
                    <div className="flex items-center text-sm">
                      <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">Budget:</span>
                      <span className="ml-1 font-medium">${parseFloat(department.budgetAllocated).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Department Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Manager</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a manager" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Manager</SelectItem>
                        {users.map((user: User) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username} ({user.email}) - {user.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="budgetAllocated"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="headcount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Headcount</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Department"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Department Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Department Details</DialogTitle>
          </DialogHeader>
          {selectedDepartment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedDepartment.name}</div>
                    <div><strong>Code:</strong> {selectedDepartment.code}</div>
                    <div><strong>Status:</strong> {selectedDepartment.isActive ? 'Active' : 'Inactive'}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Management</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Manager:</strong> {selectedDepartment.managerName || 'Not assigned'}</div>
                    {selectedDepartment.managerEmail && (
                      <div><strong>Email:</strong> {selectedDepartment.managerEmail}</div>
                    )}
                    <div><strong>Employees:</strong> {selectedDepartment.employeeCount || 0}</div>
                  </div>
                </div>
              </div>
              
              {selectedDepartment.description && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-600">{selectedDepartment.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-4">
                {selectedDepartment.budgetAllocated && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Budget</h3>
                    <p className="text-lg font-semibold text-green-600">
                      ${parseFloat(selectedDepartment.budgetAllocated).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Headcount</h3>
                  <p className="text-lg font-semibold text-blue-600">{selectedDepartment.headcount || 0}</p>
                </div>
                {selectedDepartment.location && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Location</h3>
                    <p className="text-sm text-gray-600">{selectedDepartment.location}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}