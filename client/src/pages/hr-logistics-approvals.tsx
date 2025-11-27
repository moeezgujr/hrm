import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Package, Clock, User, Banknote, Calendar, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const approvalSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

type ApprovalFormData = z.infer<typeof approvalSchema>;

export default function HRLogisticsApprovals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingRequests, isLoading } = useQuery<any[]>({
    queryKey: ["/api/logistics/requests", { status: "pending" }],
  });

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      action: "approve",
      notes: "",
      rejectionReason: "",
    },
  });

  const processRequestMutation = useMutation({
    mutationFn: async (data: { requestId: number; action: string; notes?: string; rejectionReason?: string }) => {
      return await apiRequest("POST", `/api/logistics/requests/${data.requestId}/process`, data);
    },
    onSuccess: () => {
      toast({
        title: "Request Processed",
        description: "The logistics request has been processed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/requests"] });
      setIsDialogOpen(false);
      setSelectedRequest(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ApprovalFormData) => {
    if (!selectedRequest) return;
    
    processRequestMutation.mutate({
      requestId: selectedRequest.id,
      action: data.action,
      notes: data.notes,
      rejectionReason: data.action === "reject" ? data.rejectionReason : undefined,
    });
  };

  const openApprovalDialog = (request: any, action: "approve" | "reject") => {
    setSelectedRequest(request);
    form.setValue("action", action);
    setIsDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(amount);
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      low: "bg-green-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      urgent: "bg-red-500",
    };
    return (
      <Badge className={`${priorityColors[priority as keyof typeof priorityColors]} text-white`}>
        {priority}
      </Badge>
    );
  };

  const filteredRequests = pendingRequests?.filter(request =>
    request.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.requester?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logistics Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve pending logistics requests
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting HR approval</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Banknote className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                pendingRequests?.reduce((sum, req) => sum + (parseFloat(req.estimatedCost) || 0), 0) || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Estimated total cost</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Requests</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingRequests?.filter(req => req.priority === 'urgent').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">High priority items</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Logistics Requests</CardTitle>
          <CardDescription>
            Review requests and approve or reject them to continue the workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">No pending requests</h3>
              <p className="text-muted-foreground">All logistics requests have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request: any) => (
                <div key={request.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-lg">{request.itemName}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {request.requester?.username}
                        </span>
                        <span>Qty: {request.quantity}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {getPriorityBadge(request.priority)}
                      {request.estimatedCost && (
                        <p className="text-sm font-medium mt-1">
                          {formatCurrency(parseFloat(request.estimatedCost))}
                        </p>
                      )}
                    </div>
                  </div>

                  {request.reason && (
                    <div className="mb-3 p-3 bg-muted/50 rounded">
                      <p className="text-sm">
                        <strong>Reason:</strong> {request.reason}
                      </p>
                    </div>
                  )}

                  {request.description && (
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground">
                        <strong>Description:</strong> {request.description}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openApprovalDialog(request, "reject")}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openApprovalDialog(request, "approve")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.watch("action") === "approve" ? "Approve" : "Reject"} Request
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>Processing request for: {selectedRequest.itemName}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {form.watch("action") === "reject" && (
                <FormField
                  control={form.control}
                  name="rejectionReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rejection Reason *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please provide a reason for rejection..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any additional notes..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={processRequestMutation.isPending}
                  className={
                    form.watch("action") === "approve" 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-red-600 hover:bg-red-700"
                  }
                >
                  {processRequestMutation.isPending ? "Processing..." : 
                   form.watch("action") === "approve" ? "Approve Request" : "Reject Request"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}