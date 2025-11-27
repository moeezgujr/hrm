import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, DollarSignIcon, UsersIcon, TrendingUpIcon, CreditCardIcon, AlertTriangleIcon } from 'lucide-react';
import { format } from 'date-fns';

interface Customer {
  id: number;
  companyName: string;
  contactName: string;
  contactEmail: string;
  status: string;
  planId: string;
  billingCycle: string;
  trialStartDate?: string;
  trialEndDate?: string;
  subscriptionStartDate?: string;
  createdAt: string;
}

interface Subscription {
  id: number;
  customerId: number;
  planId: string;
  status: string;
  billingCycle: string;
  amount: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  customer: Customer;
}

interface Payment {
  id: number;
  customerId: number;
  amount: string;
  currency: string;
  status: string;
  description?: string;
  paidAt?: string;
  createdAt: string;
  customer: Customer;
}

interface Analytics {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  canceledSubscriptions: number;
  avgRevenuePerCustomer: number;
}

export default function SubscriptionManagement() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Fetch analytics
  const { data: analytics } = useQuery<Analytics>({
    queryKey: ['/api/analytics/subscriptions'],
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  // Fetch subscriptions
  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions'],
  });

  // Fetch payments
  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ['/api/payments'],
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trial':
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getPlanName = (planId: string) => {
    switch (planId) {
      case 'starter':
        return 'Starter';
      case 'professional':
        return 'Professional';
      case 'enterprise':
        return 'Enterprise';
      default:
        return planId;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage customer subscriptions, payments, and billing
        </p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">All time revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.monthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground">Current month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">
                +{analytics.trialSubscriptions} in trial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Revenue Per Customer</CardTitle>
              <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.avgRevenuePerCustomer)}</div>
              <p className="text-xs text-muted-foreground">Lifetime value</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Management</CardTitle>
              <CardDescription>
                View and manage all customers and their subscription status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trial Ends</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.companyName}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{customer.contactName}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.contactEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getPlanName(customer.planId)} ({customer.billingCycle})
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(customer.status)}>
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {customer.trialEndDate ? (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {formatDate(customer.trialEndDate)}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{customer.companyName}</DialogTitle>
                              <DialogDescription>
                                Customer details and subscription information
                              </DialogDescription>
                            </DialogHeader>
                            {selectedCustomer && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Contact Person</Label>
                                    <div>{selectedCustomer.contactName}</div>
                                  </div>
                                  <div>
                                    <Label>Email</Label>
                                    <div>{selectedCustomer.contactEmail}</div>
                                  </div>
                                  <div>
                                    <Label>Plan</Label>
                                    <div>{getPlanName(selectedCustomer.planId)}</div>
                                  </div>
                                  <div>
                                    <Label>Billing Cycle</Label>
                                    <div>{selectedCustomer.billingCycle}</div>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <Badge className={getStatusColor(selectedCustomer.status)}>
                                      {selectedCustomer.status}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label>Created</Label>
                                    <div>{formatDate(selectedCustomer.createdAt)}</div>
                                  </div>
                                </div>
                                {selectedCustomer.trialStartDate && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Trial Started</Label>
                                      <div>{formatDate(selectedCustomer.trialStartDate)}</div>
                                    </div>
                                    <div>
                                      <Label>Trial Ends</Label>
                                      <div>{formatDate(selectedCustomer.trialEndDate)}</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Subscriptions</CardTitle>
              <CardDescription>
                Monitor subscription status and billing cycles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Current Period</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">
                        {subscription.customer?.companyName || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getPlanName(subscription.planId)} ({subscription.billingCycle})
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(subscription.status)}>
                          {subscription.status}
                        </Badge>
                        {subscription.cancelAtPeriodEnd && (
                          <Badge variant="outline" className="ml-2">
                            <AlertTriangleIcon className="h-3 w-3 mr-1" />
                            Canceling
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(subscription.amount)}
                      </TableCell>
                      <TableCell>
                        {subscription.currentPeriodStart && subscription.currentPeriodEnd ? (
                          <div className="text-sm">
                            {formatDate(subscription.currentPeriodStart)} -{' '}
                            {formatDate(subscription.currentPeriodEnd)}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                            <Button variant="outline" size="sm">
                              Cancel
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Track all payment transactions and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.customer?.companyName || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(payment.amount)} {payment.currency.toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.description || 'Payment'}
                      </TableCell>
                      <TableCell>
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}