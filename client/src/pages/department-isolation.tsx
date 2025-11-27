import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, ShieldCheck, ShieldAlert, Users, Building2, MessageSquare, UserCheck } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DepartmentStats {
  code: string;
  name: string;
  employeeCount: number;
  isolationStatus: 'isolated' | 'hr_contact_only' | 'unrestricted';
  communicationEvents: number;
  violations: number;
}

interface CommunicationLog {
  id: number;
  fromUser: string;
  toUser: string;
  fromDepartment: string;
  toDepartment: string;
  type: string;
  timestamp: string;
  status: 'allowed' | 'blocked' | 'flagged';
  reason?: string;
}

export default function DepartmentIsolation() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch department isolation stats
  const { data: departmentStats = [], isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/department-isolation/stats'],
    queryFn: () => fetch('/api/department-isolation/stats').then(res => res.json()),
  });

  // Fetch communication logs
  const { data: communicationLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['/api/department-isolation/communication-logs'],
    queryFn: () => fetch('/api/department-isolation/communication-logs').then(res => res.json()),
  });

  // Test isolation controls mutation
  const testIsolationMutation = useMutation({
    mutationFn: async (data: { fromDepartment: string; toDepartment: string; type: string }) => {
      const response = await apiRequest('/api/department-isolation/test', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/department-isolation/communication-logs'] });
    },
  });

  const getIsolationStatusColor = (status: string) => {
    switch (status) {
      case 'isolated': return 'bg-red-100 text-red-800';
      case 'hr_contact_only': return 'bg-yellow-100 text-yellow-800';
      case 'unrestricted': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCommunicationStatusColor = (status: string) => {
    switch (status) {
      case 'allowed': return 'bg-green-100 text-green-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'flagged': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Department Isolation Control</h1>
          <p className="text-gray-600 mt-2">Monitor and manage inter-department communication restrictions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">Isolation Active</span>
        </div>
      </div>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription>
          Department isolation is active. Departments can only communicate with HR. 
          Same-department communication and HR communication are allowed.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Department Overview</TabsTrigger>
          <TabsTrigger value="communication">Communication Logs</TabsTrigger>
          <TabsTrigger value="testing">Isolation Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Department Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{departmentStats.length}</div>
                <p className="text-xs text-muted-foreground">Active departments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Isolated Departments</CardTitle>
                <ShieldAlert className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {departmentStats.filter((d: DepartmentStats) => d.isolationStatus === 'isolated').length}
                </div>
                <p className="text-xs text-muted-foreground">Full isolation active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">HR Contact Only</CardTitle>
                <UserCheck className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {departmentStats.filter((d: DepartmentStats) => d.isolationStatus === 'hr_contact_only').length}
                </div>
                <p className="text-xs text-muted-foreground">Can contact HR only</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Communication Events</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {departmentStats.reduce((sum: number, d: DepartmentStats) => sum + d.communicationEvents, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
          </div>

          {/* Department Details */}
          <Card>
            <CardHeader>
              <CardTitle>Department Isolation Status</CardTitle>
              <CardDescription>Current isolation configuration for each department</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="text-center py-4">Loading department data...</div>
              ) : (
                <div className="space-y-4">
                  {departmentStats.map((dept: DepartmentStats) => (
                    <div key={dept.code} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-5 w-5 text-gray-500" />
                          <div>
                            <h3 className="font-medium">{dept.name}</h3>
                            <p className="text-sm text-gray-500">{dept.code} • {dept.employeeCount} employees</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{dept.communicationEvents} events</p>
                          {dept.violations > 0 && (
                            <p className="text-sm text-red-600">{dept.violations} violations</p>
                          )}
                        </div>
                        
                        <Badge className={getIsolationStatusColor(dept.isolationStatus)}>
                          {dept.isolationStatus === 'isolated' && 'Full Isolation'}
                          {dept.isolationStatus === 'hr_contact_only' && 'HR Contact Only'}
                          {dept.isolationStatus === 'unrestricted' && 'Unrestricted'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Activity Log</CardTitle>
              <CardDescription>Recent communication attempts and their isolation status</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="text-center py-4">Loading communication logs...</div>
              ) : (
                <div className="space-y-3">
                  {communicationLogs.slice(0, 20).map((log: CommunicationLog) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">
                            {log.fromUser} → {log.toUser}
                          </p>
                          <p className="text-sm text-gray-500">
                            {log.fromDepartment} → {log.toDepartment} • {log.type}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge className={getCommunicationStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                        {log.reason && (
                          <p className="text-xs text-gray-500 mt-1">{log.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {communicationLogs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No communication logs available
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Isolation Controls</CardTitle>
              <CardDescription>Test communication scenarios to verify isolation settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription>
                    Use these test scenarios to verify department isolation is working correctly.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => testIsolationMutation.mutate({
                      fromDepartment: 'IT',
                      toDepartment: 'Finance',
                      type: 'task_assignment'
                    })}
                    disabled={testIsolationMutation.isPending}
                    variant="outline"
                    className="h-auto p-4 justify-start"
                  >
                    <div className="text-left">
                      <p className="font-medium">Test Cross-Department Task</p>
                      <p className="text-sm text-gray-500">IT → Finance (Should be blocked)</p>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => testIsolationMutation.mutate({
                      fromDepartment: 'IT',
                      toDepartment: 'HR',
                      type: 'task_request'
                    })}
                    disabled={testIsolationMutation.isPending}
                    variant="outline"
                    className="h-auto p-4 justify-start"
                  >
                    <div className="text-left">
                      <p className="font-medium">Test HR Communication</p>
                      <p className="text-sm text-gray-500">IT → HR (Should be allowed)</p>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => testIsolationMutation.mutate({
                      fromDepartment: 'IT',
                      toDepartment: 'IT',
                      type: 'internal_message'
                    })}
                    disabled={testIsolationMutation.isPending}
                    variant="outline"
                    className="h-auto p-4 justify-start"
                  >
                    <div className="text-left">
                      <p className="font-medium">Test Same Department</p>
                      <p className="text-sm text-gray-500">IT → IT (Should be allowed)</p>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => testIsolationMutation.mutate({
                      fromDepartment: 'Marketing',
                      toDepartment: 'Sales',
                      type: 'project_collaboration'
                    })}
                    disabled={testIsolationMutation.isPending}
                    variant="outline"
                    className="h-auto p-4 justify-start"
                  >
                    <div className="text-left">
                      <p className="font-medium">Test Project Collaboration</p>
                      <p className="text-sm text-gray-500">Marketing → Sales (Should be blocked)</p>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}