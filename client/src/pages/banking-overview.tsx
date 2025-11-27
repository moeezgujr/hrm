import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function BankingOverview() {
  const { user } = useAuth();

  const { data: bankingData, isLoading } = useQuery({
    queryKey: ['/api/employees/banking/all'],
    retry: false,
    enabled: user?.role === 'hr_admin' || user?.role === 'branch_manager',
  });

  if (!user || !['hr_admin', 'branch_manager'].includes(user.role)) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Access denied. HR Admin or Branch Manager role required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const completedBanking = bankingData?.filter(emp => emp.isComplete) || [];
  const incompleteBanking = bankingData?.filter(emp => !emp.isComplete) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Banking Information Overview</h2>
          <p className="text-gray-600 mt-1">View employee banking details and completion status</p>
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 font-medium">
              🔒 Confidential Payroll Information - Full account numbers displayed for authorized payroll processing
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bankingData?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banking Complete</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedBanking.length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((completedBanking.length / (bankingData?.length || 1)) * 100)}% of employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banking Missing</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{incompleteBanking.length}</div>
            <p className="text-xs text-muted-foreground">
              Need to provide banking info
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((completedBanking.length / (bankingData?.length || 1)) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Banking Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completed Banking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Banking Information Complete</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedBanking.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No employees with complete banking information yet.</p>
              ) : (
                completedBanking.map((emp) => (
                  <div key={emp.employeeId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                      <Badge variant="default">Complete</Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Employee ID:</strong> {emp.employeeNumber}</div>
                      <div><strong>Bank:</strong> {emp.bankName}</div>
                      <div><strong>Account Holder:</strong> {emp.accountHolderName}</div>
                      <div><strong>Account Type:</strong> {emp.accountType}</div>
                      <div><strong>Account #:</strong> {emp.accountNumber}</div>
                      <div><strong>Routing #:</strong> {emp.routingNumber}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Incomplete Banking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Banking Information Missing</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incompleteBanking.length === 0 ? (
                <p className="text-gray-500 text-center py-4">All employees have provided banking information!</p>
              ) : (
                incompleteBanking.map((emp) => (
                  <div key={emp.employeeId} className="border rounded-lg p-4 border-red-200 bg-red-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                      <Badge variant="destructive">Missing</Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Employee ID:</strong> {emp.employeeNumber}</div>
                      {emp.bankName && <div><strong>Bank:</strong> {emp.bankName}</div>}
                      {emp.accountHolderName && <div><strong>Account Holder:</strong> {emp.accountHolderName}</div>}
                      {emp.accountType && <div><strong>Account Type:</strong> {emp.accountType}</div>}
                      {emp.accountNumber && <div><strong>Account #:</strong> {emp.accountNumber}</div>}
                      {emp.routingNumber && <div><strong>Routing #:</strong> {emp.routingNumber}</div>}
                      <div className="text-red-600 mt-2">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        Banking information required for payroll processing
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}