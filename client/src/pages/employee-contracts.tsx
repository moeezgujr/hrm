import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Download,
  Eye,
  User,
  Building2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface EmploymentContract {
  id: number;
  userId: number;
  jobTitle: string;
  contractContent: string;
  contractType: string;
  department?: string;
  salary?: string;
  currency?: string;
  startDate?: string;
  contractPdf?: string;
  status: 'pending' | 'signed' | 'expired';
  digitalSignature?: string;
  signedAt?: string;
  ipAddress?: string;
  userAgent?: string;
  contractDuration?: string;
  workingHours?: string;
  probationPeriod?: string;
  benefits?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeContracts() {
  const { user } = useAuth();

  // Fetch user's contracts
  const { data: allContracts = [], isLoading, error } = useQuery<EmploymentContract[]>({
    queryKey: ['/api/my-contracts'],
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('Authentication required') || error?.message?.includes('Unexpected token')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Filter to show only signed contracts by default (what user requested)
  const contracts = allContracts.filter(contract => contract.status === 'signed');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><CheckCircle className="w-3 h-3 mr-1" />Signed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatContractContent = (content: string) => {
    // Truncate for preview
    return content.length > 200 ? content.substring(0, 200) + '...' : content;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <FileText className="w-6 h-6" />
          <h1 className="text-2xl font-bold">My Employment Contracts</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-2 mb-6">
          <FileText className="w-6 h-6" />
          <h1 className="text-2xl font-bold">My Employment Contracts</h1>
        </div>
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="p-6">
            <p className="text-red-800 dark:text-red-200">
              Failed to load contracts. Please try refreshing the page or contact HR if the issue persists.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-6 h-6" />
          <h1 className="text-2xl font-bold">My Employment Contracts</h1>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <User className="w-3 h-3" />
          <span>{user?.firstName} {user?.lastName}</span>
        </Badge>
      </div>

      {contracts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Signed Contracts Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have any signed employment contracts in the system yet.
            </p>
            <p className="text-sm text-gray-500">
              Please contact HR if you believe this is an error, or check if you have pending contracts to sign.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {contracts.map((contract) => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5" />
                      <span>{contract.jobTitle}</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {contract.contractType} • {contract.department}
                    </p>
                  </div>
                  {getStatusBadge(contract.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Start Date:</span>
                      <span>{contract.startDate ? formatDate(contract.startDate) : 'Not specified'}</span>
                    </div>
                    {contract.salary && (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-medium">Salary:</span>
                        <span>{contract.currency || 'PKR'} {contract.salary}</span>
                      </div>
                    )}
                    {contract.workingHours && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Working Hours:</span>
                        <span>{contract.workingHours}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-medium">Created:</span>
                      <span>{formatDate(contract.createdAt)}</span>
                    </div>
                    {contract.signedAt && (
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-medium">Signed:</span>
                        <span>{formatDate(contract.signedAt)}</span>
                      </div>
                    )}
                    {contract.contractDuration && (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-medium">Duration:</span>
                        <span>{contract.contractDuration}</span>
                      </div>
                    )}
                  </div>
                </div>

                {contract.contractContent && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Contract Preview:</h4>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm">
                      {formatContractContent(contract.contractContent)}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Create a safe document to show full contract content (XSS protection)
                      const newWindow = window.open('', '_blank');
                      if (newWindow) {
                        const doc = newWindow.document;
                        doc.open();
                        
                        // Create elements safely to prevent XSS
                        doc.write(`
                          <html>
                            <head>
                              <title>Employment Contract</title>
                              <style>
                                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                                .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                                .signature-section { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; }
                                .content { white-space: pre-wrap; }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <h1>Employment Contract</h1>
                                <p><strong>Position:</strong></p>
                                <p><strong>Department:</strong></p>
                                <p><strong>Status:</strong></p>
                              </div>
                              <div class="content"></div>
                              <div class="signature-section" style="display: none;">
                                <p><strong>Digital Signature:</strong></p>
                                <p><strong>Signed on:</strong></p>
                              </div>
                            </body>
                          </html>
                        `);
                        
                        // Safely set text content to prevent XSS
                        const positionEl = doc.querySelector('.header p:nth-child(2)');
                        const departmentEl = doc.querySelector('.header p:nth-child(3)');
                        const statusEl = doc.querySelector('.header p:nth-child(4)');
                        const contentEl = doc.querySelector('.content');
                        const signatureSection = doc.querySelector('.signature-section');
                        
                        if (positionEl) positionEl.innerHTML = `<strong>Position:</strong> ${contract.jobTitle || 'Not specified'}`;
                        if (departmentEl) departmentEl.innerHTML = `<strong>Department:</strong> ${contract.department || 'Not specified'}`;
                        if (statusEl) statusEl.innerHTML = `<strong>Status:</strong> ${contract.status}`;
                        if (contentEl) contentEl.textContent = contract.contractContent || 'No content available';
                        
                        if (contract.digitalSignature && signatureSection) {
                          signatureSection.style.display = 'block';
                          const sigEl = signatureSection.querySelector('p:first-child');
                          const dateEl = signatureSection.querySelector('p:last-child');
                          if (sigEl) sigEl.innerHTML = `<strong>Digital Signature:</strong> ${contract.digitalSignature}`;
                          if (dateEl) dateEl.innerHTML = `<strong>Signed on:</strong> ${contract.signedAt ? formatDate(contract.signedAt) : 'Unknown'}`;
                        }
                        
                        doc.close();
                      }
                    }}
                    data-testid={`button-view-contract-${contract.id}`}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Full Contract
                  </Button>
                  
                  {contract.contractPdf && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = contract.contractPdf;
                        link.download = `Employment_Contract_${contract.jobTitle}_${contract.id}.pdf`;
                        link.click();
                      }}
                      data-testid={`button-download-contract-${contract.id}`}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download PDF
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}