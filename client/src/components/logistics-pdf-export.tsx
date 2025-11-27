import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Package, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { useQuery } from '@tanstack/react-query';

interface LogisticsItem {
  id: number;
  name: string;
  description: string;
  category: string;
  quantity: number;
  minQuantity: number;
  location: string;
  lastUpdated: string;
  createdAt: string;
}

interface LogisticsRequest {
  id: number;
  requesterId: string;
  itemId?: number;
  itemName: string;
  description: string;
  quantity: number;
  reason: string;
  status: string;
  priority: string;
  estimatedCost: number;
  actualCost?: number;
  vendor?: string;
  purchaseDate?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  requester?: { firstName: string; lastName: string; email: string };
  item?: LogisticsItem;
}

export default function LogisticsPDFExport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: items = [], isLoading: itemsLoading } = useQuery<LogisticsItem[]>({
    queryKey: ['/api/logistics/items'],
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery<LogisticsRequest[]>({
    queryKey: ['/api/logistics/requests'],
  });

  const generateInventoryReportPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Logistics Inventory Report', 20, yPosition);
      yPosition += 20;

      // Subtitle and stats
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
      doc.text(`Total Items: ${items.length}`, 20, yPosition + 10);
      
      // Calculate low stock items
      const lowStockItems = items.filter(item => item.quantity <= item.minQuantity);
      doc.text(`Low Stock Items: ${lowStockItems.length}`, 20, yPosition + 20);
      yPosition += 40;

      // Categories summary
      const categoryCounts = items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Inventory by Category:', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      Object.entries(categoryCounts).forEach(([category, count]) => {
        doc.text(`${category}: ${count} items`, 25, yPosition);
        yPosition += 6;
      });

      yPosition += 15;

      // Low stock alerts
      if (lowStockItems.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38); // Red color
        doc.text('⚠️ LOW STOCK ALERTS', 20, yPosition);
        yPosition += 15;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0); // Reset to black
        lowStockItems.forEach((item) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`${item.name} - Current: ${item.quantity}, Min: ${item.minQuantity} (${item.location})`, 25, yPosition);
          yPosition += 6;
        });
        yPosition += 15;
      }

      // Complete inventory list
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Complete Inventory List:', 20, yPosition);
      yPosition += 15;

      // Table headers
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Item Name', 20, yPosition);
      doc.text('Category', 70, yPosition);
      doc.text('Qty', 110, yPosition);
      doc.text('Min', 130, yPosition);
      doc.text('Location', 150, yPosition);
      yPosition += 8;

      // Draw line under headers
      doc.line(20, yPosition - 2, 190, yPosition - 2);
      yPosition += 5;

      doc.setFont('helvetica', 'normal');
      items.forEach((item) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }

        doc.text(item.name.substring(0, 25), 20, yPosition);
        doc.text(item.category, 70, yPosition);
        doc.text(item.quantity.toString(), 110, yPosition);
        doc.text(item.minQuantity.toString(), 130, yPosition);
        doc.text(item.location || 'N/A', 150, yPosition);
        
        if (item.description) {
          yPosition += 5;
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(item.description.substring(0, 60), 25, yPosition);
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(9);
        }
        
        yPosition += 8;
      });

      doc.save('logistics-inventory-report.pdf');

      toast({
        title: "Inventory Report Generated",
        description: `Downloaded report with ${items.length} items`,
      });
    } catch (error) {
      console.error('Error generating inventory PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate inventory report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateRequestsReportPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Logistics Requests Report', 20, yPosition);
      yPosition += 20;

      // Subtitle and stats
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
      doc.text(`Total Requests: ${requests.length}`, 20, yPosition + 10);
      yPosition += 30;

      // Status summary
      const statusCounts = requests.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Requests by Status:', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      Object.entries(statusCounts).forEach(([status, count]) => {
        doc.text(`${status}: ${count} requests`, 25, yPosition);
        yPosition += 6;
      });

      // Total costs
      const totalEstimated = requests.reduce((sum, req) => sum + (req.estimatedCost || 0), 0);
      const totalActual = requests.reduce((sum, req) => sum + (req.actualCost || 0), 0);
      
      yPosition += 10;
      doc.text(`Total Estimated Cost: $${totalEstimated.toFixed(2)}`, 25, yPosition);
      yPosition += 6;
      doc.text(`Total Actual Cost: $${totalActual.toFixed(2)}`, 25, yPosition);
      yPosition += 20;

      // Priority breakdown
      const priorityCounts = requests.reduce((acc, req) => {
        acc[req.priority] = (acc[req.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Requests by Priority:', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      Object.entries(priorityCounts).forEach(([priority, count]) => {
        doc.text(`${priority}: ${count} requests`, 25, yPosition);
        yPosition += 6;
      });

      yPosition += 20;

      // Detailed requests list
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Detailed Requests List:', 20, yPosition);
      yPosition += 15;

      requests.forEach((request, index) => {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        // Request header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${request.itemName}`, 20, yPosition);
        yPosition += 10;

        // Request details
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        const requestDetails = [
          `Requester: ${request.requester?.firstName || 'N/A'} ${request.requester?.lastName || ''}`,
          `Quantity: ${request.quantity}`,
          `Status: ${request.status}`,
          `Priority: ${request.priority}`,
          `Estimated Cost: $${request.estimatedCost?.toFixed(2) || '0.00'}`,
          request.actualCost ? `Actual Cost: $${request.actualCost.toFixed(2)}` : '',
          request.vendor ? `Vendor: ${request.vendor}` : '',
          `Requested: ${new Date(request.createdAt).toLocaleDateString()}`,
          request.approvedAt ? `Approved: ${new Date(request.approvedAt).toLocaleDateString()}` : '',
        ].filter(Boolean);

        requestDetails.forEach((detail) => {
          doc.text(detail, 25, yPosition);
          yPosition += 5;
        });

        if (request.reason) {
          yPosition += 2;
          doc.text(`Reason: ${request.reason}`, 25, yPosition);
          yPosition += 5;
        }

        if (request.notes) {
          yPosition += 2;
          doc.text(`Notes: ${request.notes}`, 25, yPosition);
          yPosition += 5;
        }

        if (request.rejectionReason) {
          doc.setTextColor(220, 38, 38);
          doc.text(`Rejection Reason: ${request.rejectionReason}`, 25, yPosition);
          doc.setTextColor(0, 0, 0);
          yPosition += 5;
        }

        yPosition += 10;
      });

      doc.save('logistics-requests-report.pdf');

      toast({
        title: "Requests Report Generated",
        description: `Downloaded report with ${requests.length} requests`,
      });
    } catch (error) {
      console.error('Error generating requests PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate requests report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateComprehensiveReportPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Title page
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Comprehensive Logistics Report', 20, yPosition);
      yPosition += 30;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
      yPosition += 20;

      // Executive Summary
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', 20, yPosition);
      yPosition += 20;

      const lowStockItems = items.filter(item => item.quantity <= item.minQuantity);
      const pendingRequests = requests.filter(req => req.status === 'pending');
      const approvedRequests = requests.filter(req => req.status === 'approved');
      const totalEstimatedCost = requests.reduce((sum, req) => sum + (req.estimatedCost || 0), 0);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const summaryItems = [
        `• Total Inventory Items: ${items.length}`,
        `• Items Requiring Attention (Low Stock): ${lowStockItems.length}`,
        `• Total Requests: ${requests.length}`,
        `• Pending Requests: ${pendingRequests.length}`,
        `• Approved Requests: ${approvedRequests.length}`,
        `• Total Estimated Cost of All Requests: $${totalEstimatedCost.toFixed(2)}`,
      ];

      summaryItems.forEach((item) => {
        doc.text(item, 25, yPosition);
        yPosition += 8;
      });

      // Key insights
      yPosition += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Insights & Recommendations:', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const insights = [
        lowStockItems.length > 0 ? `• Immediate attention needed for ${lowStockItems.length} low-stock items` : '• All items adequately stocked',
        pendingRequests.length > 0 ? `• ${pendingRequests.length} requests await approval` : '• No pending requests requiring action',
        `• Most requested category: ${getMostRequestedCategory()}`,
        `• Average request processing time: ${getAverageProcessingTime()} days`,
      ];

      insights.forEach((insight) => {
        doc.text(insight, 25, yPosition);
        yPosition += 8;
      });

      // Add detailed sections
      doc.addPage();
      yPosition = 20;

      // Critical items section
      if (lowStockItems.length > 0) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text('🚨 CRITICAL: Items Requiring Immediate Attention', 20, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 20;

        lowStockItems.forEach((item) => {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`${item.name} - Current: ${item.quantity}, Minimum: ${item.minQuantity}`, 25, yPosition);
          doc.text(`Location: ${item.location || 'Not specified'}`, 25, yPosition + 5);
          yPosition += 15;
        });
      }

      doc.save('comprehensive-logistics-report.pdf');

      toast({
        title: "Comprehensive Report Generated",
        description: "Downloaded complete logistics analysis report",
      });
    } catch (error) {
      console.error('Error generating comprehensive PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate comprehensive report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getMostRequestedCategory = () => {
    const categoryRequests = requests.reduce((acc, req) => {
      const category = req.item?.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostRequested = Object.entries(categoryRequests).sort(([,a], [,b]) => b - a)[0];
    return mostRequested ? mostRequested[0] : 'N/A';
  };

  const getAverageProcessingTime = () => {
    const processedRequests = requests.filter(req => req.approvedAt);
    if (processedRequests.length === 0) return 'N/A';

    const totalDays = processedRequests.reduce((sum, req) => {
      const created = new Date(req.createdAt);
      const approved = new Date(req.approvedAt!);
      const days = Math.ceil((approved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return Math.round(totalDays / processedRequests.length);
  };

  if (itemsLoading || requestsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Logistics PDF Export Center</h1>
        <p className="text-gray-600">Download comprehensive logistics reports for inventory, requests, and analytics</p>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventory Report</TabsTrigger>
          <TabsTrigger value="requests">Requests Report</TabsTrigger>
          <TabsTrigger value="comprehensive">Comprehensive Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Management Report
              </CardTitle>
              <CardDescription>
                Download a detailed inventory report including stock levels, categories, locations, 
                and low stock alerts for all logistics items.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total Items: {items.length}</p>
                  <p className="text-sm text-gray-600">
                    Low Stock Alerts: {items.filter(item => item.quantity <= item.minQuantity).length}
                  </p>
                </div>
                <Button 
                  onClick={generateInventoryReportPDF}
                  disabled={isGenerating || items.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isGenerating ? 'Generating...' : 'Download Inventory PDF'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Logistics Requests Report
              </CardTitle>
              <CardDescription>
                Generate a comprehensive report of all logistics requests including status, costs, 
                approval workflow, and vendor information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total Requests: {requests.length}</p>
                  <p className="text-sm text-gray-600">
                    Pending: {requests.filter(req => req.status === 'pending').length} | 
                    Approved: {requests.filter(req => req.status === 'approved').length}
                  </p>
                </div>
                <Button 
                  onClick={generateRequestsReportPDF}
                  disabled={isGenerating || requests.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isGenerating ? 'Generating...' : 'Download Requests PDF'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comprehensive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Comprehensive Logistics Analysis
              </CardTitle>
              <CardDescription>
                Download an executive-level comprehensive report with insights, recommendations, 
                critical alerts, and complete logistics overview.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Complete Analysis Report</p>
                  <p className="text-sm text-gray-600">
                    Executive summary, insights, and recommendations
                  </p>
                </div>
                <Button 
                  onClick={generateComprehensiveReportPDF}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isGenerating ? 'Generating...' : 'Download Analysis PDF'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {items.length === 0 && requests.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">
                No logistics data found. Create some inventory items and requests to generate reports.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}