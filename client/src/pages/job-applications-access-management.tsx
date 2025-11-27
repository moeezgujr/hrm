import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Search, Users, CheckCircle2, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

type User = {
  id: number;
  username: string;
  email?: string;
  role: string;
  hasJobApplicationsAccess?: boolean;
};

type Employee = {
  id: number;
  userId: number;
  fullName: string;
  position?: string;
  department?: string;
};

export default function JobApplicationsAccessManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const toggleJobApplicationsAccessMutation = useMutation({
    mutationFn: async ({ userId, hasJobApplicationsAccess }: { userId: number; hasJobApplicationsAccess: boolean }) => {
      return await apiRequest('POST', `/api/users/${userId}/toggle-job-applications-access`, {
        hasJobApplicationsAccess
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Success',
        description: 'Job applications access updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update job applications access',
        variant: 'destructive'
      });
    }
  });

  const usersWithEmployeeInfo = users.map(user => {
    const employee = employees.find(emp => emp.userId === user.id);
    return {
      ...user,
      employeeName: employee?.fullName || 'N/A',
      position: employee?.position || 'N/A',
      department: employee?.department || 'N/A'
    };
  });

  const filteredUsers = usersWithEmployeeInfo.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.employeeName.toLowerCase().includes(searchLower) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      user.position.toLowerCase().includes(searchLower)
    );
  });

  const handleToggleJobApplicationsAccess = (userId: number, currentAccess: boolean) => {
    toggleJobApplicationsAccessMutation.mutate({
      userId,
      hasJobApplicationsAccess: !currentAccess
    });
  };

  const usersWithAccess = users.filter(u => u.hasJobApplicationsAccess).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Applications Access Management</h1>
          <p className="text-gray-600 mt-1">Grant or revoke job applications viewing access for users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users with Access</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{usersWithAccess}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users without Access</CardTitle>
            <XCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{users.length - usersWithAccess}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search by name, username, email, or position..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-users-job-applications"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            User Job Applications Access Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-8 text-gray-500">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Position</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Job Applications Access</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50" data-testid={`row-user-job-applications-${user.id}`}>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{user.username}</div>
                        {user.email && (
                          <div className="text-sm text-gray-500">{user.email}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-900">{user.employeeName}</td>
                      <td className="py-3 px-4 text-gray-600">{user.position}</td>
                      <td className="py-3 px-4 text-gray-600">{user.department}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={user.hasJobApplicationsAccess || false}
                            onCheckedChange={() => handleToggleJobApplicationsAccess(user.id, user.hasJobApplicationsAccess || false)}
                            disabled={toggleJobApplicationsAccessMutation.isPending || user.role === 'hr_admin'}
                            data-testid={`switch-job-applications-access-${user.id}`}
                          />
                          <span className={`text-sm font-medium ${user.hasJobApplicationsAccess ? 'text-green-600' : 'text-gray-400'}`}>
                            {user.role === 'hr_admin' ? 'Always' : user.hasJobApplicationsAccess ? 'Granted' : 'Denied'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Briefcase className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">About Job Applications Access</h4>
              <p className="text-sm text-blue-800">
                Job applications access allows users to view and manage candidate job applications. HR Admins always have access by default. 
                Use the toggles above to grant or revoke access for other users. Changes take effect immediately.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
