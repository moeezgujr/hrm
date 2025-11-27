import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Package, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import LogisticsRequestForm from "@/components/logistics/logistics-request-form";

export default function LogisticsEmployeeView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: myRequests, isLoading } = useQuery<any[]>({
    queryKey: ["/api/logistics/my-requests"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-500", icon: Clock },
      approved: { color: "bg-blue-500", icon: CheckCircle },
      rejected: { color: "bg-red-500", icon: XCircle },
      purchased: { color: "bg-purple-500", icon: Package },
      delivered: { color: "bg-green-500", icon: CheckCircle },
      completed: { color: "bg-emerald-500", icon: CheckCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getStatusDescription = (status: string) => {
    const descriptions = {
      pending: "Your request is waiting for approval",
      approved: "Request approved, waiting for procurement",
      rejected: "Request has been rejected",
      purchased: "Items have been purchased",
      delivered: "Items are ready for pickup",
      completed: "Request completed successfully",
    };
    return descriptions[status as keyof typeof descriptions] || "Status unknown";
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Logistics Requests</h1>
          <p className="text-muted-foreground">
            Submit and track your logistics requests
          </p>
        </div>
        <LogisticsRequestForm />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p>Loading your requests...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {myRequests?.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{request.itemName}</CardTitle>
                        <CardDescription>
                          Requested on {format(new Date(request.createdAt), 'PPP')} • Quantity: {request.quantity}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(request.status)}
                        {request.estimatedCost && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Est. Cost: {formatCurrency(parseFloat(request.estimatedCost))}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Reason:</p>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      </div>
                      
                      {request.description && (
                        <div>
                          <p className="text-sm font-medium">Details:</p>
                          <p className="text-sm text-muted-foreground">{request.description}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <span>Priority: <Badge variant="outline">{request.priority}</Badge></span>
                        {request.category && (
                          <span>Category: <Badge variant="secondary">{request.category}</Badge></span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          {getStatusDescription(request.status)}
                        </p>
                        {request.status === 'rejected' && request.rejectionReason && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-red-600">Rejection Reason:</p>
                            <p className="text-sm text-red-500">{request.rejectionReason}</p>
                          </div>
                        )}
                        {request.actualCost && (
                          <p className="text-sm font-medium">
                            Final Cost: {formatCurrency(parseFloat(request.actualCost))}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!myRequests || myRequests.length === 0) && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't submitted any logistics requests yet.
                    </p>
                    <LogisticsRequestForm />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {myRequests?.filter(r => r.status === 'pending').map((request) => (
            <Card key={request.id} className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{request.itemName}</CardTitle>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{request.reason}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span>Qty: {request.quantity}</span>
                  <span>Priority: {request.priority}</span>
                  {request.estimatedCost && (
                    <span>Est: {formatCurrency(parseFloat(request.estimatedCost))}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {myRequests?.filter(r => ['approved', 'purchased', 'delivered'].includes(r.status)).map((request) => (
            <Card key={request.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{request.itemName}</CardTitle>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{request.reason}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span>Qty: {request.quantity}</span>
                  {request.actualCost && (
                    <span>Cost: {formatCurrency(parseFloat(request.actualCost))}</span>
                  )}
                  {request.vendor && <span>Vendor: {request.vendor}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {myRequests?.filter(r => r.status === 'completed').map((request) => (
            <Card key={request.id} className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{request.itemName}</CardTitle>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{request.reason}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span>Qty: {request.quantity}</span>
                  {request.actualCost && (
                    <span>Final Cost: {formatCurrency(parseFloat(request.actualCost))}</span>
                  )}
                  <span>Completed: {format(new Date(request.completedAt || request.updatedAt), 'PP')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}