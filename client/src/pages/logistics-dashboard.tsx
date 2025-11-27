import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, TrendingUp, Package, AlertTriangle, Banknote, Calendar, BarChart3, FileText, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
// Import logistics components
import LogisticsRequestForm from "@/components/logistics/logistics-request-form";
import EmployeeRoleManagement from "@/components/logistics/employee-role-management";

const expenseSchema = z.object({
  expenseType: z.string().min(1, "Expense type is required"),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().default("PKR"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  vendor: z.string().optional(),
  invoiceNumber: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentStatus: z.string().default("pending"),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export default function LogisticsDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [dateFilter, setDateFilter] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  // Queries
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<{
    totalRequests: number;
    pendingRequests: number;
    monthlyExpenses: number;
    monthlyTransactions: number;
    lowStockItems: any[];
  }>({
    queryKey: ["/api/logistics/dashboard"],
  });

  const { data: expenses, isLoading: expensesLoading } = useQuery<any[]>({
    queryKey: ["/api/logistics/expenses", dateFilter],
  });

  const { data: monthlyReport, isLoading: monthlyLoading } = useQuery<any[]>({
    queryKey: ["/api/logistics/reports/monthly", new Date().getFullYear(), new Date().getMonth() + 1],
  });

  const { data: categoryReport, isLoading: categoryLoading } = useQuery<any[]>({
    queryKey: ["/api/logistics/reports/categories", dateFilter],
  });

  const { data: vendorReport, isLoading: vendorLoading } = useQuery<any[]>({
    queryKey: ["/api/logistics/reports/vendors", dateFilter],
  });

  const { data: requests, isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/logistics/requests"],
  });

  // Form
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expenseType: "",
      amount: "",
      currency: "PKR",
      description: "",
      date: format(new Date(), 'yyyy-MM-dd'),
      vendor: "",
      invoiceNumber: "",
      paymentMethod: "",
      paymentStatus: "pending",
      notes: "",
    },
  });

  // Mutations
  const createExpenseMutation = useMutation({
    mutationFn: (data: ExpenseFormData) => apiRequest("POST", "/api/logistics/expenses", {
      ...data,
      amount: parseFloat(data.amount),
      date: new Date(data.date).toISOString(),
      recordedBy: "admin", // This should come from auth context
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/reports/monthly"] });
      setIsExpenseDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record expense",
        variant: "destructive",
      });
    },
  });

  const onSubmitExpense = (data: ExpenseFormData) => {
    createExpenseMutation.mutate(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-500",
      approved: "bg-blue-500",
      rejected: "bg-red-500",
      purchased: "bg-purple-500",
      delivered: "bg-green-500",
      completed: "bg-emerald-500",
    };
    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors]} text-white`}>
        {status}
      </Badge>
    );
  };

  if (statsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logistics Management</h1>
          <p className="text-muted-foreground">
            Request → HR Approval → Purchase → Receipt → Complete
          </p>
        </div>
        <div className="flex items-center gap-4">
          <LogisticsRequestForm />
          <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record New Expense</DialogTitle>
                <DialogDescription>
                  Add a new logistics expense record
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitExpense)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="expenseType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expense Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select expense type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="purchase">Purchase</SelectItem>
                            <SelectItem value="shipping">Shipping</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="storage">Storage</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="vendor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor</FormLabel>
                        <FormControl>
                          <Input placeholder="Vendor name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Expense description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createExpenseMutation.isPending}>
                      {createExpenseMutation.isPending ? "Recording..." : "Record Expense"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalRequests || 0}</div>
            <p className="text-xs text-muted-foreground">All time logistics requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.pendingRequests || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <Banknote className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardStats?.monthlyExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.monthlyTransactions || 0} transactions this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats?.lowStockItems?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Items below minimum stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>Latest logistics expenses</CardDescription>
                </CardHeader>
              <CardContent>
                {expensesLoading ? (
                  <div className="text-center py-4">Loading expenses...</div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(expenses) ? expenses.slice(0, 5).map((expense: any) => (
                      <div key={expense.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{expense.description || expense.expenseType}</p>
                          <p className="text-sm text-muted-foreground">
                            {expense.vendor} • {format(new Date(expense.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(parseFloat(expense.amount))}</p>
                          <Badge variant="outline" className="text-xs">
                            {expense.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    )) : null}
                    {(!expenses || !Array.isArray(expenses) || expenses.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">No expenses recorded</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                  <CardTitle>Recent Requests</CardTitle>
                  <CardDescription>Latest logistics requests</CardDescription>
                </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="text-center py-4">Loading requests...</div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(requests) ? requests.slice(0, 5).map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{request.itemName}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {request.quantity} • {request.requester?.username}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(request.status)}
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(request.createdAt), 'MMM dd')}
                          </p>
                        </div>
                      </div>
                    )) : null}
                    {(!requests || !Array.isArray(requests) || requests.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">No requests found</p>
                    )}
                  </div>
                )}
              </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <EmployeeRoleManagement />
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Logistics management tools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <LogisticsRequestForm />
                  <Button variant="outline" className="w-full">
                    <Package className="w-4 h-4 mr-2" />
                    Manage Inventory
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <Input
                type="date"
                value={dateFilter.from}
                onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                className="w-40"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={dateFilter.to}
                onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                className="w-40"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Expense Records</CardTitle>
              <CardDescription>
                Detailed view of all logistics expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <div className="text-center py-8">Loading expenses...</div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(expenses) ? expenses.map((expense: any) => (
                    <div key={expense.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{expense.description || expense.expenseType}</h4>
                          <p className="text-sm text-muted-foreground">
                            {expense.vendor} • Invoice: {expense.invoiceNumber || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(parseFloat(expense.amount))}</p>
                          <Badge variant={expense.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                            {expense.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Type: {expense.expenseType}</span>
                        <span>Date: {format(new Date(expense.date), 'MMM dd, yyyy')}</span>
                      </div>
                      {expense.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">{expense.notes}</p>
                      )}
                    </div>
                  )) : null}
                  {(!expenses || !Array.isArray(expenses) || expenses.length === 0) && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No expenses found for the selected period</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logistics Requests</CardTitle>
              <CardDescription>
                Track your requests through the approval workflow: Request → HR Approval → Purchase → Receipt → Complete
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="text-center py-8">Loading requests...</div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(requests) ? requests.map((request: any) => (
                    <div key={request.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-lg">{request.itemName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Request ID: #{request.id} • Quantity: {request.quantity} • Priority: {request.priority}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(request.status)}
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      
                      {/* Workflow Progress */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>Workflow Progress:</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-3 h-3 rounded-full ${request.status === 'pending' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                          <div className="w-8 h-0.5 bg-gray-300"></div>
                          <div className={`w-3 h-3 rounded-full ${['approved', 'purchased', 'delivered', 'completed'].includes(request.status) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className="w-8 h-0.5 bg-gray-300"></div>
                          <div className={`w-3 h-3 rounded-full ${['purchased', 'delivered', 'completed'].includes(request.status) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className="w-8 h-0.5 bg-gray-300"></div>
                          <div className={`w-3 h-3 rounded-full ${['delivered', 'completed'].includes(request.status) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className="w-8 h-0.5 bg-gray-300"></div>
                          <div className={`w-3 h-3 rounded-full ${request.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Request</span>
                          <span>HR Approval</span>
                          <span>Purchase</span>
                          <span>Receipt</span>
                          <span>Complete</span>
                        </div>
                      </div>

                      {request.reason && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Reason:</strong> {request.reason}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {request.estimatedCost && (
                          <p className="text-muted-foreground">
                            <strong>Estimated Cost:</strong> {formatCurrency(parseFloat(request.estimatedCost))}
                          </p>
                        )}
                        {request.actualCost && (
                          <p className="text-muted-foreground">
                            <strong>Actual Cost:</strong> {formatCurrency(parseFloat(request.actualCost))}
                          </p>
                        )}
                        {request.vendor && (
                          <p className="text-muted-foreground">
                            <strong>Vendor:</strong> {request.vendor}
                          </p>
                        )}
                        {request.purchaseDate && (
                          <p className="text-muted-foreground">
                            <strong>Purchase Date:</strong> {format(new Date(request.purchaseDate), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                      
                      {request.status === 'rejected' && request.rejectionReason && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-800">
                            <strong>Rejection Reason:</strong> {request.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  )) : null}
                  {(!requests || !Array.isArray(requests) || requests.length === 0) && (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium text-lg mb-2">No logistics requests</h3>
                      <p className="text-muted-foreground mb-4">You haven't submitted any requests yet.</p>
                      <LogisticsRequestForm />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>Breakdown of spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryLoading ? (
                  <div className="text-center py-4">Loading category report...</div>
                ) : (
                  <div className="space-y-3">
                    {(categoryReport && Array.isArray(categoryReport) ? categoryReport : []).map((category: any) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <span className="font-medium">{category.category || 'Uncategorized'}</span>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(parseFloat(category.totalAmount))}</p>
                          <p className="text-xs text-muted-foreground">{category.count} transactions</p>
                        </div>
                      </div>
                    ))}
                    {(!categoryReport || !Array.isArray(categoryReport) || categoryReport.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">No category data</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Vendors</CardTitle>
                <CardDescription>Highest spending vendors</CardDescription>
              </CardHeader>
              <CardContent>
                {vendorLoading ? (
                  <div className="text-center py-4">Loading vendor report...</div>
                ) : (
                  <div className="space-y-3">
                    {(vendorReport && Array.isArray(vendorReport) ? vendorReport.slice(0, 10) : []).map((vendor: any) => (
                      <div key={vendor.vendor} className="flex items-center justify-between">
                        <span className="font-medium">{vendor.vendor}</span>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(parseFloat(vendor.totalAmount))}</p>
                          <p className="text-xs text-muted-foreground">
                            {vendor.count} orders • Avg: {formatCurrency(parseFloat(vendor.avgAmount))}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!vendorReport || !Array.isArray(vendorReport) || vendorReport.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">No vendor data</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Report</CardTitle>
              <CardDescription>
                Current month expense breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyLoading ? (
                <div className="text-center py-4">Loading monthly report...</div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(monthlyReport) ? monthlyReport.map((expense: any) => (
                    <div key={expense.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{expense.description || expense.expenseType}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.vendor} • {format(new Date(expense.date), 'MMM dd')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(parseFloat(expense.amount))}</p>
                        <Badge variant="outline" className="text-xs">
                          {expense.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  )) : null}
                  {(!monthlyReport || !Array.isArray(monthlyReport) || monthlyReport.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">No monthly data</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Key logistics metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Total Monthly Spending</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(dashboardStats?.monthlyExpenses || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Requests</span>
                  <span className="font-bold text-lg">{dashboardStats?.pendingRequests || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Low Stock Alerts</span>
                  <span className="font-bold text-lg text-red-600">
                    {dashboardStats?.lowStockItems?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Monthly Transactions</span>
                  <span className="font-bold text-lg">{dashboardStats?.monthlyTransactions || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Low Stock Items</CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardStats?.lowStockItems?.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="text-xs">
                          {item.quantity}/{item.minQuantity}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{item.location}</p>
                      </div>
                    </div>
                  ))}
                  {(!dashboardStats?.lowStockItems || dashboardStats.lowStockItems.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">All items adequately stocked</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}