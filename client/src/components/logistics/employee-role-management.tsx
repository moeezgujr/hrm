import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, UserPlus, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: number;
  userId: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  profileImage?: string;
}

export default function EmployeeRoleManagement() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/employees"],
    select: (data: any[]) => {
      // Transform the data to match our interface
      return data?.map((emp: any) => ({
        id: emp.id,
        userId: emp.userId,
        employeeId: emp.employeeId,
        firstName: emp.user?.firstName || emp.firstName,
        lastName: emp.user?.lastName || emp.lastName,
        email: emp.user?.email || emp.email,
        department: emp.user?.department || emp.department,
        role: emp.user?.role || emp.role,
        profileImage: emp.user?.profileImage || emp.profileImage,
      })) || [];
    }
  });

  const { data: logisticsManagers, isLoading: managersLoading } = useQuery<Employee[]>({
    queryKey: ["/api/logistics/managers"],
  });

  const assignLogisticsRoleMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      return await apiRequest("POST", "/api/employees/assign-logistics-role", { employeeId });
    },
    onSuccess: () => {
      toast({
        title: "Role Assigned",
        description: "Employee has been assigned the logistics manager role successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/managers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setSelectedEmployee("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign logistics role",
        variant: "destructive",
      });
    },
  });

  const removeLogisticsRoleMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      return await apiRequest("POST", "/api/employees/remove-logistics-role", { employeeId });
    },
    onSuccess: () => {
      toast({
        title: "Role Removed",
        description: "Logistics manager role has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/managers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove logistics role",
        variant: "destructive",
      });
    },
  });

  const handleAssignRole = () => {
    if (selectedEmployee) {
      assignLogisticsRoleMutation.mutate(selectedEmployee);
    }
  };

  const handleRemoveRole = (employeeId: string) => {
    removeLogisticsRoleMutation.mutate(employeeId);
  };

  const getEmployeeInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Filter out employees who are already logistics managers
  const availableEmployees = employees?.filter(emp => 
    !logisticsManagers?.some(manager => manager.id === emp.id)
  ) || [];

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Employees data:', employees);
    console.log('Available employees for assignment:', availableEmployees);
    console.log('Current logistics managers:', logisticsManagers);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Employee Role Management
        </CardTitle>
        <CardDescription>
          Assign and manage logistics manager roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assign New Logistics Manager */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Assign Logistics Manager Role
          </h4>
          <div className="flex gap-2">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employeesLoading ? (
                  <div className="p-2 text-center">
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-1" />
                    <span className="text-sm text-muted-foreground">Loading employees...</span>
                  </div>
                ) : availableEmployees.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No employees available for assignment
                  </div>
                ) : (
                  availableEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={employee.profileImage} />
                          <AvatarFallback className="text-xs">
                            {getEmployeeInitials(employee.firstName, employee.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{employee.firstName} {employee.lastName}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {employee.department || 'No Dept'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAssignRole}
              disabled={!selectedEmployee || assignLogisticsRoleMutation.isPending}
              size="sm"
            >
              {assignLogisticsRoleMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Assign Role"
              )}
            </Button>
          </div>
        </div>

        {/* Current Logistics Managers */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Current Logistics Managers ({logisticsManagers?.length || 0})
          </h4>
          
          {managersLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading logistics managers...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logisticsManagers?.map((manager) => (
                <div 
                  key={manager.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={manager.profileImage} />
                      <AvatarFallback>
                        {getEmployeeInitials(manager.firstName, manager.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{manager.firstName} {manager.lastName}</p>
                      <p className="text-sm text-muted-foreground">
                        {manager.employeeId} • {manager.department}
                      </p>
                    </div>
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Logistics Manager
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveRole(manager.id.toString())}
                    disabled={removeLogisticsRoleMutation.isPending}
                  >
                    Remove Role
                  </Button>
                </div>
              ))}
              
              {(!logisticsManagers || logisticsManagers.length === 0) && (
                <div className="text-center py-6">
                  <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No logistics managers assigned yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Select an employee above to assign them the logistics manager role
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h5 className="font-medium text-blue-900 mb-1">About Logistics Manager Role</h5>
          <p className="text-sm text-blue-700">
            Logistics managers can process and approve requests, manage inventory, 
            track expenses, and oversee the entire logistics workflow. They have access 
            to the full logistics dashboard and management tools.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}