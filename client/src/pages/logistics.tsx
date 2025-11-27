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
import { 
  Boxes, 
  Plus, 
  Package, 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Upload,
  FileText,
  DollarSign,
  Eye,
  Edit
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';

// Schemas
const requestSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(1, 'Reason is required'),
  priority: z.string().default('medium'),
  estimatedCost: z.number().min(0, 'Cost must be positive').optional(),
});

const purchaseSchema = z.object({
  actualCost: z.number().min(0, 'Cost must be positive'),
  vendor: z.string().min(1, 'Vendor is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  notes: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;
type PurchaseFormData = z.infer<typeof purchaseSchema>;

export default function Logistics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const requestForm = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      itemName: '',
      description: '',
      quantity: 1,
      reason: '',
      priority: 'medium',
      estimatedCost: 0,
    },
  });

  const purchaseForm = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      actualCost: 0,
      vendor: '',
      purchaseDate: '',
      notes: '',
    },
  });

  // Fetch logistics requests
  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/logistics/requests'],
    retry: false,
  });

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      return await apiRequest('POST', '/api/logistics/requests', {
        ...data,
        requesterId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/requests'] });
      setShowRequestDialog(false);
      requestForm.reset();
      toast({
        title: "Success",
        description: "Request submitted for HR approval",
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
        description: "Failed to create request",
        variant: "destructive",
      });
    },
  });

  // Approve/Reject mutations
  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return await apiRequest('PUT', `/api/logistics/requests/${requestId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/requests'] });
      toast({
        title: "Success",
        description: "Request approved successfully",
      });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: number; reason: string }) => {
      return await apiRequest('PUT', `/api/logistics/requests/${requestId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/requests'] });
      toast({
        title: "Success",
        description: "Request rejected",
      });
    },
  });

  // Purchase completion mutation
  const completePurchaseMutation = useMutation({
    mutationFn: async (data: PurchaseFormData & { requestId: number }) => {
      return await apiRequest('PUT', `/api/logistics/requests/${data.requestId}/purchase`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/requests'] });
      setShowPurchaseDialog(false);
      purchaseForm.reset();
      setSelectedRequest(null);
      toast({
        title: "Success",
        description: "Purchase completed successfully",
      });
    },
  });

  // Receipt upload mutation
  const uploadReceiptMutation = useMutation({
    mutationFn: async ({ requestId, file }: { requestId: number; file: File }) => {
      const formData = new FormData();
      formData.append('receipt', file);
      
      const response = await fetch(`/api/logistics/requests/${requestId}/receipt`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload receipt');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/requests'] });
      setShowReceiptDialog(false);
      setReceiptFile(null);
      setSelectedRequest(null);
      toast({
        title: "Success",
        description: "Receipt uploaded successfully",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
      purchased: { label: 'Purchased', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800' },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      low: { label: 'Low', color: 'bg-blue-100 text-blue-800' },
      medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800' },
    };
    const priorityInfo = priorityMap[priority] || priorityMap.medium;
    return <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>;
  };

  const filteredRequests = requests.filter(request => 
    statusFilter === 'all' || request.status === statusFilter
  );

  const canRequestItems = user?.role === 'logistics_manager';
  const canApproveRequests = user?.role === 'hr_admin';
  const canPurchase = user?.role === 'logistics_manager';

  if (requestsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logistics Management</h1>
          <p className="text-gray-600">Request → HR Approval → Purchase → Receipt → Complete</p>
        </div>
        {canRequestItems && (
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus size={16} />
                <span>New Request</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Logistics Request</DialogTitle>
              </DialogHeader>
              <Form {...requestForm}>
                <form onSubmit={requestForm.handleSubmit((data) => createRequestMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={requestForm.control}
                    name="itemName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter item name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={requestForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Item description..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={requestForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={requestForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={requestForm.control}
                    name="estimatedCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Cost ($)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={requestForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Why is this item needed?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createRequestMutation.isPending}>
                    {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="purchased">Purchased</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No logistics requests</h3>
              <p className="text-gray-500">
                {canRequestItems ? "Create your first logistics request to get started." : "No requests to display."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{request.itemName || 'Unnamed Item'}</h3>
                      {getStatusBadge(request.status)}
                      {getPriorityBadge(request.priority)}
                    </div>
                    <p className="text-gray-600 mb-2">{request.description || 'No description'}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Quantity:</span>
                        <p>{request.quantity}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Requested by:</span>
                        <p>{request.requester?.firstName} {request.requester?.lastName}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Estimated Cost:</span>
                        <p>${request.estimatedCost || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date:</span>
                        <p>{new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {request.reason && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-700">Reason:</span>
                        <p className="text-gray-600">{request.reason}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    {/* HR Admin Actions */}
                    {canApproveRequests && request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => approveRequestMutation.mutate(request.id)}
                          disabled={approveRequestMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => rejectRequestMutation.mutate({ 
                            requestId: request.id, 
                            reason: 'Rejected by HR' 
                          })}
                          disabled={rejectRequestMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {/* Logistics Manager Actions */}
                    {canPurchase && request.status === 'approved' && (
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowPurchaseDialog(true);
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Complete Purchase
                      </Button>
                    )}

                    {canPurchase && request.status === 'purchased' && !request.receiptUrl && (
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowReceiptDialog(true);
                        }}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Upload Receipt
                      </Button>
                    )}

                    {request.receiptUrl && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(request.receiptUrl, '_blank')}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        View Receipt
                      </Button>
                    )}
                  </div>
                </div>

                {/* Purchase Details */}
                {request.status === 'purchased' || request.status === 'completed' ? (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Purchase Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-700">Vendor:</span>
                        <p>{request.vendor || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Actual Cost:</span>
                        <p>${request.actualCost || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Purchase Date:</span>
                        <p>{request.purchaseDate ? new Date(request.purchaseDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Receipt:</span>
                        <p>{request.receiptUrl ? 'Uploaded' : 'Pending'}</p>
                      </div>
                    </div>
                    {request.notes && (
                      <div className="mt-2">
                        <span className="font-medium text-blue-700">Notes:</span>
                        <p className="text-blue-600">{request.notes}</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Purchase</DialogTitle>
          </DialogHeader>
          <Form {...purchaseForm}>
            <form onSubmit={purchaseForm.handleSubmit((data) => 
              completePurchaseMutation.mutate({ ...data, requestId: selectedRequest?.id })
            )} className="space-y-4">
              <FormField
                control={purchaseForm.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter vendor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={purchaseForm.control}
                name="actualCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Cost ($)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={purchaseForm.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={purchaseForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional purchase notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={completePurchaseMutation.isPending}>
                {completePurchaseMutation.isPending ? "Processing..." : "Complete Purchase"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Receipt Upload Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt File
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: PDF, JPG, PNG (max 10MB)
              </p>
            </div>
            <Button 
              onClick={() => {
                if (receiptFile && selectedRequest) {
                  uploadReceiptMutation.mutate({ 
                    requestId: selectedRequest.id, 
                    file: receiptFile 
                  });
                }
              }}
              className="w-full" 
              disabled={!receiptFile || uploadReceiptMutation.isPending}
            >
              {uploadReceiptMutation.isPending ? "Uploading..." : "Upload Receipt"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}