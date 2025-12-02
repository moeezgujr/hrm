import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle, Users, TrendingUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';

// Schema for leave request form
const leaveRequestSchema = z.object({
  leaveType: z.string().min(1, 'Leave type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  coveringEmployeeId: z.string().min(1, 'Please select an employee to cover your duties'),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate']
});

type LeaveRequest = {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
};

type LeaveBalance = {
  employeeId: number;
  sickPaid: number;
  sickUnpaid: number;
  casualPaid: number;
  bereavementUsed: number;
  publicHolidaysUsed: number;
  unpaidUsed: number;
};

// Schema for historical leave form (admin only)
const historicalLeaveSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  leaveType: z.string().min(1, 'Leave type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate']
});

// Schema for leave balance adjustment form (HR Admin/HR Personnel only)
const leaveBalanceAdjustmentSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  leaveType: z.string().min(1, 'Leave type is required'),
  adjustment: z.string().min(1, 'Adjustment amount is required').refine((val) => !isNaN(Number(val)), {
    message: 'Must be a valid number'
  }),
  reason: z.string().optional(),
});

export default function LeaveManagement() {
  const { toast } = useToast();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showHistoricalDialog, setShowHistoricalDialog] = useState(false);
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user']
  });

  // Fetch employee data
  const { data: employees } = useQuery<any[]>({
    queryKey: ['/api/employees']
  });

  const currentEmployee: any = employees?.find(emp => emp.userId === currentUser?.id);

  // Fetch leave balance
  const { data: leaveBalance, isLoading: balanceLoading } = useQuery<LeaveBalance>({
    queryKey: ['/api/leave-balances', currentEmployee?.id || 0],
    enabled: !!currentEmployee
  });

  // Fetch leave requests
  const { data: leaveRequests = [], isLoading: requestsLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/leave-requests'],
    enabled: !!currentEmployee?.id
  });

  // Check if user has HR access (HR Admin OR HR Personnel)
  const hasHRAccess = currentUser && (
    (currentUser as any).role === 'hr_admin' || 
    (currentUser as any).isHRPersonnel === true
  );

  // Check if user has manage permission for leave management
  const hasManagePermission = currentUser && (
    (currentUser as any).role === 'hr_admin' || 
    (currentUser as any).isHRPersonnel === true ||
    (currentUser as any).permissions?.leave_management === 'manage'
  );

  // Check if user can approve leave requests (includes both view and manage)
  const canApproveLeave = currentUser && (
    (currentUser as any).role === 'hr_admin' || 
    (currentUser as any).isHRPersonnel === true ||
    (currentUser as any).permissions?.leave_management === 'manage' ||
    (currentUser as any).permissions?.leave_management === 'view'
  );

  // Fetch pending leave requests for approval
  const { data: pendingLeaveRequests = [], isLoading: pendingLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/leave-requests', 'pending'],
    queryFn: () => fetch('/api/leave-requests?status=pending').then(res => res.json()),
    enabled: !!canApproveLeave
  });

  // Fetch all employees' leave balances (only for users with manage permission)
  const { data: allEmployeeBalances = [], isLoading: allBalancesLoading, error: allBalancesError } = useQuery<any[]>({
    queryKey: ['/api/leave-balances'],
    enabled: !!hasManagePermission
  });

  // Form setup
  const form = useForm({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: '',
      coveringEmployeeId: ''
    }
  });

  // Create leave request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof leaveRequestSchema>) => {
      if (!currentEmployee) {
        throw new Error('Employee data not found');
      }

      // Calculate total days
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      return await apiRequest('POST', '/api/leave-requests', {
        employeeId: currentEmployee.id,
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        totalDays,
        coveringEmployeeId: parseInt(data.coveringEmployeeId)
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Leave request submitted successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leave-balances', currentEmployee?.id] });
      setShowRequestDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit leave request',
        variant: 'destructive'
      });
    }
  });

  const handleSubmitRequest = (data: z.infer<typeof leaveRequestSchema>) => {
    createRequestMutation.mutate(data);
  };

  // Historical leave form (admin only)
  const historicalForm = useForm({
    resolver: zodResolver(historicalLeaveSchema),
    defaultValues: {
      employeeId: '',
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: '',
      notes: ''
    }
  });

  // Create historical leave mutation (admin only)
  const createHistoricalLeaveMutation = useMutation({
    mutationFn: async (data: z.infer<typeof historicalLeaveSchema>) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      return await apiRequest('POST', '/api/leave-requests/admin/add-historical', {
        employeeId: parseInt(data.employeeId),
        leaveType: data.leaveType,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        totalDays,
        reason: data.reason,
        notes: data.notes
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Historical leave added successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests'] });
      setShowHistoricalDialog(false);
      historicalForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add historical leave',
        variant: 'destructive'
      });
    }
  });

  const handleSubmitHistoricalLeave = (data: z.infer<typeof historicalLeaveSchema>) => {
    createHistoricalLeaveMutation.mutate(data);
  };

  // Leave balance adjustment form (HR Admin/HR Personnel only)
  const adjustmentForm = useForm({
    resolver: zodResolver(leaveBalanceAdjustmentSchema),
    defaultValues: {
      employeeId: '',
      leaveType: '',
      adjustment: '',
      reason: ''
    }
  });

  // Adjust leave balance mutation (HR Admin/HR Personnel only)
  const adjustLeaveBalanceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof leaveBalanceAdjustmentSchema>) => {
      return await apiRequest('POST', '/api/leave-balances/adjust', {
        employeeId: parseInt(data.employeeId),
        leaveType: data.leaveType,
        adjustment: parseFloat(data.adjustment),
        reason: data.reason
      });
    },
    onSuccess: (response) => {
      toast({
        title: 'Success',
        description: response.message || 'Leave balance adjusted successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leave-balances'] });
      setShowAdjustmentDialog(false);
      adjustmentForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to adjust leave balance',
        variant: 'destructive'
      });
    }
  });

  const handleSubmitAdjustment = (data: z.infer<typeof leaveBalanceAdjustmentSchema>) => {
    adjustLeaveBalanceMutation.mutate(data);
  };

  // Approve leave request mutation
  const approveLeaveRequestMutation = useMutation({
    mutationFn: async (leaveRequestId: number) => {
      return await apiRequest('POST', `/api/leave-requests/${leaveRequestId}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Leave request approved successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve leave request',
        variant: 'destructive'
      });
    }
  });

  // Reject leave request mutation
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingLeaveId, setRejectingLeaveId] = useState<number | null>(null);

  const rejectLeaveRequestMutation = useMutation({
    mutationFn: async ({ leaveRequestId, reason }: { leaveRequestId: number; reason: string }) => {
      return await apiRequest('POST', `/api/leave-requests/${leaveRequestId}/reject`, { reason });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Leave request rejected'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setRejectingLeaveId(null);
      setRejectReason('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject leave request',
        variant: 'destructive'
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock size={14} className="mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle size={14} className="mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle size={14} className="mr-1" /> Rejected</Badge>;
      case 'processed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800"><CheckCircle size={14} className="mr-1" /> Processed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'sick': return 'Sick Leave';
      case 'casual': return 'Casual Leave';
      case 'bereavement': return 'Bereavement Leave';
      case 'public_holiday': return 'Public Holiday';
      case 'unpaid': return 'Unpaid Leave';
      default: return type;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leave Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your leave requests and view your leave balance
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="button-new-leave-request">
                <Plus size={16} className="mr-2" />
                New Leave Request
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto pb-16">
            <DialogHeader>
              <DialogTitle>Submit Leave Request</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmitRequest)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="leaveType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave Type</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-leave-type">
                            <SelectValue placeholder="Select leave type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sick">Sick Leave (Paid: {leaveBalance?.sickPaid || 0} days, Unpaid: {leaveBalance?.sickUnpaid || 0} days)</SelectItem>
                            <SelectItem value="casual">Casual Leave (Paid: {leaveBalance?.casualPaid || 0} days)</SelectItem>
                            <SelectItem value="bereavement">Bereavement Leave</SelectItem>
                            <SelectItem value="public_holiday">Public Holiday</SelectItem>
                            <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-start-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-end-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="coveringEmployeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Covering Your Duties</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-covering-employee">
                            <SelectValue placeholder="Select employee to cover your duties" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees?.filter(emp => emp.id !== currentEmployee?.id).map((emp: any) => (
                              <SelectItem key={emp.id} value={emp.id.toString()}>
                                {emp.preferredName || emp.firstName + ' ' + emp.lastName} - {emp.position || 'No Position'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide a detailed reason for your leave request..."
                          className="resize-none min-h-[100px]"
                          {...field}
                          data-testid="textarea-leave-reason"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowRequestDialog(false);
                      form.reset();
                    }}
                    data-testid="button-cancel-leave-request"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createRequestMutation.isPending}
                    className="btn-primary"
                    data-testid="button-submit-leave-request"
                  >
                    {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

          {/* Admin/HR Personnel Historical Leave Dialog */}
          {hasHRAccess && (
            <Dialog open={showHistoricalDialog} onOpenChange={setShowHistoricalDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-add-historical-leave">
                  <Calendar size={16} className="mr-2" />
                  Add Historical Leave
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto pb-16">
                <DialogHeader>
                  <DialogTitle>Add Historical Leave Record</DialogTitle>
                </DialogHeader>
                <Form {...historicalForm}>
                  <form onSubmit={historicalForm.handleSubmit(handleSubmitHistoricalLeave)} className="space-y-4">
                    <FormField
                      control={historicalForm.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger data-testid="select-historical-employee">
                                <SelectValue placeholder="Select employee" />
                              </SelectTrigger>
                              <SelectContent>
                                {employees?.map((emp: any) => (
                                  <SelectItem key={emp.id} value={emp.id.toString()}>
                                    {emp.preferredName || emp.firstName + ' ' + emp.lastName} - {emp.position || 'No Position'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={historicalForm.control}
                      name="leaveType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Leave Type</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger data-testid="select-historical-leave-type">
                                <SelectValue placeholder="Select leave type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sick">Sick Leave</SelectItem>
                                <SelectItem value="casual">Casual Leave</SelectItem>
                                <SelectItem value="bereavement">Bereavement Leave</SelectItem>
                                <SelectItem value="public_holiday">Public Holiday</SelectItem>
                                <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={historicalForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-historical-start-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={historicalForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-historical-end-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={historicalForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Reason for the historical leave..."
                              className="resize-none min-h-[80px]"
                              {...field}
                              data-testid="textarea-historical-reason"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={historicalForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Internal notes about this historical leave entry..."
                              className="resize-none min-h-[60px]"
                              {...field}
                              data-testid="textarea-historical-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowHistoricalDialog(false);
                          historicalForm.reset();
                        }}
                        data-testid="button-cancel-historical-leave"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createHistoricalLeaveMutation.isPending}
                        className="btn-primary"
                        data-testid="button-submit-historical-leave"
                      >
                        {createHistoricalLeaveMutation.isPending ? 'Adding...' : 'Add Historical Leave'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}

          {/* Admin/HR Personnel Leave Balance Adjustment Dialog */}
          {hasHRAccess && (
            <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-adjust-leave-balance">
                  <TrendingUp size={16} className="mr-2" />
                  Adjust Leave Balance
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto pb-16">
                <DialogHeader>
                  <DialogTitle>Adjust Employee Leave Balance</DialogTitle>
                </DialogHeader>
                <Form {...adjustmentForm}>
                  <form onSubmit={adjustmentForm.handleSubmit(handleSubmitAdjustment)} className="space-y-4">
                    <FormField
                      control={adjustmentForm.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger data-testid="select-adjustment-employee">
                                <SelectValue placeholder="Select employee" />
                              </SelectTrigger>
                              <SelectContent>
                                {employees?.map((emp: any) => (
                                  <SelectItem key={emp.id} value={emp.id.toString()}>
                                    {emp.preferredName || emp.firstName + ' ' + emp.lastName} - {emp.position || 'No Position'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={adjustmentForm.control}
                      name="leaveType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Leave Type</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger data-testid="select-adjustment-leave-type">
                                <SelectValue placeholder="Select leave type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sick_paid">Sick Leave (Paid)</SelectItem>
                                <SelectItem value="sick_unpaid">Sick Leave (Unpaid)</SelectItem>
                                <SelectItem value="casual_paid">Casual Leave (Paid)</SelectItem>
                                <SelectItem value="bereavement">Bereavement Leave</SelectItem>
                                <SelectItem value="public_holidays">Public Holidays</SelectItem>
                                <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={adjustmentForm.control}
                      name="adjustment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adjustment Amount (Days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.5"
                              placeholder="e.g., 5 to add, -3 to subtract"
                              {...field}
                              data-testid="input-adjustment-amount"
                            />
                          </FormControl>
                          <FormDescription>
                            Enter a positive number to add days, or a negative number to subtract days
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={adjustmentForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Explain the reason for this adjustment..."
                              className="resize-none min-h-[60px]"
                              {...field}
                              data-testid="textarea-adjustment-reason"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAdjustmentDialog(false);
                          adjustmentForm.reset();
                        }}
                        data-testid="button-cancel-adjustment"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={adjustLeaveBalanceMutation.isPending}
                        className="btn-primary"
                        data-testid="button-submit-adjustment"
                      >
                        {adjustLeaveBalanceMutation.isPending ? 'Adjusting...' : 'Adjust Balance'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="stats-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Sick Leave</CardTitle>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="text-2xl font-bold text-gray-400">Loading...</div>
            ) : (
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {leaveBalance?.sickPaid || 0} paid / {leaveBalance?.sickUnpaid || 0} unpaid
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Annual entitlement: 15 paid + 15 unpaid days
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Casual Leave</CardTitle>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="text-2xl font-bold text-gray-400">Loading...</div>
            ) : (
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {leaveBalance?.casualPaid || 0} days
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Annual entitlement: 5 paid days
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Other Leave</CardTitle>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="text-2xl font-bold text-gray-400">Loading...</div>
            ) : (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Bereavement:</span>
                  <span className="font-semibold">{leaveBalance?.bereavementUsed || 0} used</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Public Holidays:</span>
                  <span className="font-semibold">{leaveBalance?.publicHolidaysUsed || 0} used</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Unpaid:</span>
                  <span className="font-semibold">{leaveBalance?.unpaidUsed || 0} used</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Leave Approvals (for approvers) */}
      {canApproveLeave && Array.isArray(pendingLeaveRequests) && pendingLeaveRequests.length > 0 && (
        <Card className="stats-card border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-700">
              <AlertCircle className="mr-2" size={20} />
              Pending Leave Approvals ({pendingLeaveRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLeaveRequests.map((request) => (
                    <TableRow key={request.id} data-testid={`row-pending-leave-${request.id}`}>
                      <TableCell className="font-medium">
                        {request.employeeName || 'Unknown Employee'}
                      </TableCell>
                      <TableCell>
                        {getLeaveTypeLabel(request.leaveType)}
                      </TableCell>
                      <TableCell>{format(new Date(request.startDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(request.endDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {Math.ceil((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={request.reason}>
                          {request.reason}
                        </div>
                      </TableCell>
                      <TableCell>
                        {rejectingLeaveId === request.id ? (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Enter rejection reason..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="min-h-[60px] resize-none"
                              data-testid={`textarea-reject-reason-${request.id}`}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (rejectReason.trim()) {
                                    rejectLeaveRequestMutation.mutate({
                                      leaveRequestId: request.id,
                                      reason: rejectReason
                                    });
                                  } else {
                                    toast({
                                      title: 'Error',
                                      description: 'Please provide a rejection reason',
                                      variant: 'destructive'
                                    });
                                  }
                                }}
                                disabled={rejectLeaveRequestMutation.isPending || !rejectReason.trim()}
                                data-testid={`button-confirm-reject-${request.id}`}
                              >
                                Confirm Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRejectingLeaveId(null);
                                  setRejectReason('');
                                }}
                                data-testid={`button-cancel-reject-${request.id}`}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              onClick={() => approveLeaveRequestMutation.mutate(request.id)}
                              disabled={approveLeaveRequestMutation.isPending}
                              data-testid={`button-approve-${request.id}`}
                            >
                              <CheckCircle size={14} className="mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              onClick={() => setRejectingLeaveId(request.id)}
                              data-testid={`button-reject-${request.id}`}
                            >
                              <XCircle size={14} className="mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Employees Leave Balances (for managers with manage permission only) */}
      {hasManagePermission && (
        <Card className="stats-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users size={20} className="mr-2" />
              Employee Leave Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allBalancesLoading ? (
              <div className="text-center py-8 text-gray-500">Loading employee balances...</div>
            ) : allEmployeeBalances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No employees found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead className="text-right">Sick Leave (Paid)</TableHead>
                      <TableHead className="text-right">Sick Leave (Unpaid)</TableHead>
                      <TableHead className="text-right">Casual Leave</TableHead>
                      <TableHead className="text-right">Other Leave</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allEmployeeBalances.map((item: any) => (
                      <TableRow key={item.employee.id} data-testid={`row-employee-balance-${item.employee.id}`}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{item.employee.name}</div>
                            <div className="text-xs text-gray-500">{item.employee.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.employee.department || 'N/A'}</TableCell>
                        <TableCell>{item.employee.designation || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm">
                            <span className="font-semibold text-blue-600">{item.balance.sickLeavePaidRemaining}</span>
                            <span className="text-gray-500"> / {item.balance.sickLeavePaidTotal}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            ({item.balance.sickLeavePaidUsed} used)
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm">
                            <span className="font-semibold text-blue-600">{item.balance.sickLeaveUnpaidRemaining}</span>
                            <span className="text-gray-500"> / {item.balance.sickLeaveUnpaidTotal}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            ({item.balance.sickLeaveUnpaidUsed} used)
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm">
                            <span className="font-semibold text-green-600">{item.balance.casualLeavePaidRemaining}</span>
                            <span className="text-gray-500"> / {item.balance.casualLeavePaidTotal}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            ({item.balance.casualLeavePaidUsed} used)
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-xs space-y-1">
                            <div>Bereavement: {item.balance.bereavementLeaveUsed}</div>
                            <div>Pub. Holidays: {item.balance.publicHolidaysUsed}</div>
                            <div>Unpaid: {item.balance.unpaidLeaveUsed}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leave Requests Table */}
      <Card className="stats-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2" size={20} />
            My Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading leave requests...</div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No leave requests found</p>
              <p className="text-sm mt-2">Click "New Leave Request" to submit your first request</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.map((request) => (
                    <TableRow key={request.id} data-testid={`row-leave-request-${request.id}`}>
                      <TableCell className="font-medium">
                        {getLeaveTypeLabel(request.leaveType)}
                      </TableCell>
                      <TableCell>{format(new Date(request.startDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(request.endDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={request.reason}>
                          {request.reason}
                        </div>
                        {request.coveringEmployeeName && (
                          <div className="text-xs text-purple-700 mt-1">
                            Duties covered by: {request.coveringEmployeeName}
                          </div>
                        )}
                        {request.status === 'rejected' && request.rejectionReason && (
                          <div className="text-xs text-red-600 mt-1">
                            Rejection reason: {request.rejectionReason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
