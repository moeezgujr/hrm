import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Search, 
  Download,
  Eye,
  Edit,
  Calendar,
  User,
  Briefcase,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface EmploymentContract {
  id: number;
  userId: number;
  username: string;
  email: string;
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

export default function ContractManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [contractForm, setContractForm] = useState({
    userId: '',
    contractType: 'employment_offer',
    jobTitle: '',
    department: '',
    salary: '',
    currency: 'PKR',
    startDate: '',
    contractDuration: 'permanent',
    workingHours: '9:00 AM to 5:00 PM (Monday to Friday)',
    probationPeriod: '3 months',
    benefits: 'Health insurance, Annual leave, Professional development opportunities',
    contractContent: ''
  });

  // Check if user has admin permissions
  const canManageContracts = user?.role && ['hr_admin', 'branch_manager'].includes(user.role);

  const { data: contracts, isLoading } = useQuery<EmploymentContract[]>({
    queryKey: ["/api/contracts/all"],
    enabled: canManageContracts,
  });

  // Fetch all employees for contract creation
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['/api/employees'],
    enabled: canManageContracts,
  });

  // Debug: Log employees data to see the structure
  console.log('Employees data:', employees);

  // Edit contract mutation
  const editContractMutation = useMutation({
    mutationFn: async ({ id, contractData }: { id: number; contractData: any }) => {
      return await apiRequest('PUT', `/api/contracts/${id}`, contractData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts/all'] });
      toast({
        title: "Success",
        description: "Contract updated successfully!",
      });
      setShowEditDialog(false);
      setEditingContract(null);
    },
    onError: (error: any) => {
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
        description: error.message || "Failed to update contract",
        variant: "destructive",
      });
    },
  });

  // Create contract mutation
  const createContractMutation = useMutation({
    mutationFn: async (contractData: any) => {
      return await apiRequest('POST', '/api/contracts', contractData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts/all'] });
      toast({
        title: "Success",
        description: "Contract created successfully! Employee will receive notification to sign it.",
      });
      setShowCreateDialog(false);
      setContractForm({
        userId: '',
        contractType: 'employment_offer',
        jobTitle: '',
        department: '',
        salary: '',
        currency: 'PKR',
        startDate: '',
        contractDuration: 'permanent',
        workingHours: '9:00 AM to 5:00 PM (Monday to Friday)',
        probationPeriod: '3 months',
        benefits: 'Health insurance, Annual leave, Professional development opportunities',
        contractContent: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create contract",
        variant: "destructive",
      });
    },
  });

  // Handle contract editing
  const handleEditContract = (contract: EmploymentContract) => {
    setEditingContract(contract);
    setContractForm({
      userId: contract.userId.toString(),
      contractType: contract.contractType || 'employment_offer',
      jobTitle: contract.jobTitle || '',
      department: contract.department || '',
      salary: contract.salary || '',
      currency: contract.currency || 'PKR',
      startDate: contract.startDate ? contract.startDate.split('T')[0] : '',
      contractDuration: contract.contractDuration || 'permanent',
      workingHours: contract.workingHours || '9:00 AM to 5:00 PM (Monday to Friday)',
      probationPeriod: contract.probationPeriod || '3 months',
      benefits: contract.benefits || 'Health insurance, Annual leave, Professional development opportunities',
      contractContent: contract.contractContent || ''
    });
    setShowEditDialog(true);
  };

  const handleSaveContract = () => {
    if (!editingContract) return;

    if (!contractForm.jobTitle || !contractForm.contractContent) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Job Title, Contract Content)",
        variant: "destructive",
      });
      return;
    }

    const contractData = {
      ...contractForm,
      startDate: contractForm.startDate ? new Date(contractForm.startDate).toISOString() : null,
    };

    editContractMutation.mutate({ id: editingContract.id, contractData });
  };

  const handleCreateContract = () => {
    if (!contractForm.userId || !contractForm.jobTitle || !contractForm.contractContent) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Employee, Job Title, Contract Content)",
        variant: "destructive",
      });
      return;
    }

    const contractData = {
      ...contractForm,
      userId: parseInt(contractForm.userId),
      startDate: contractForm.startDate ? new Date(contractForm.startDate).toISOString() : null,
    };

    console.log('Creating contract with data:', contractData);

    createContractMutation.mutate(contractData);
  };

  if (!canManageContracts) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <Alert>
          <AlertDescription>
            You don't have permission to access contract management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Clock className="h-6 w-6 animate-spin" />
          <span>Loading contracts...</span>
        </div>
      </div>
    );
  }

  const filteredContracts = contracts?.filter(contract => {
    const matchesSearch = 
      contract.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Signed
        </Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
          Expired
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const downloadContract = (contract: EmploymentContract) => {
    // Import jsPDF dynamically to avoid SSR issues
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      
      // Set up document styling
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      
      // Title
      doc.text('Employment Contract', 105, 20, { align: 'center' });
      
      // Contract details header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Employee: ${contract.username}`, 20, 40);
      doc.text(`Email: ${contract.email}`, 20, 50);
      doc.text(`Position: ${contract.jobTitle}`, 20, 60);
      if (contract.department) doc.text(`Department: ${contract.department}`, 20, 70);
      if (contract.salary) doc.text(`Salary: ${contract.currency || 'PKR'} ${contract.salary}`, 20, 80);
      
      // Contract content
      doc.setFontSize(12);
      const contentY = contract.salary ? 100 : 90;
      const lines = doc.splitTextToSize(contract.contractContent, 170);
      doc.text(lines, 20, contentY);
      
      // Add signature information if contract is signed
      if (contract.status === 'signed' && contract.digitalSignature) {
        const signatureY = contentY + lines.length * 5 + 20;
        
        // Check if we need a new page
        if (signatureY > 250) {
          doc.addPage();
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('Digital Signature Information', 20, 20);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.text(`Digital Signature: ${contract.digitalSignature}`, 20, 40);
          doc.text(`Signed At: ${new Date(contract.signedAt!).toLocaleString()}`, 20, 50);
          if (contract.ipAddress) doc.text(`IP Address: ${contract.ipAddress}`, 20, 60);
          doc.text(`Contract Status: ${contract.status.toUpperCase()}`, 20, 70);
        } else {
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('Digital Signature Information', 20, signatureY);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.text(`Digital Signature: ${contract.digitalSignature}`, 20, signatureY + 15);
          doc.text(`Signed At: ${new Date(contract.signedAt!).toLocaleString()}`, 20, signatureY + 25);
          if (contract.ipAddress) doc.text(`IP Address: ${contract.ipAddress}`, 20, signatureY + 35);
          doc.text(`Contract Status: ${contract.status.toUpperCase()}`, 20, signatureY + 45);
        }
      }
      
      // Save the PDF
      const fileName = `Employment_Contract_${contract.username}_${contract.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    }).catch(error => {
      console.error('Error generating PDF:', error);
      // Fallback: create a simple text file
      const content = `Employment Contract\n\nEmployee: ${contract.username}\nEmail: ${contract.email}\nPosition: ${contract.jobTitle}\n\nContract Content:\n${contract.contractContent}\n\n${contract.digitalSignature ? `Digital Signature: ${contract.digitalSignature}\nSigned At: ${new Date(contract.signedAt!).toLocaleString()}` : ''}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `contract-${contract.username}-${contract.id}.txt`;
      link.click();
    });
  };

  const viewContract = (contract: EmploymentContract) => {
    // Open contract content in a new window/modal
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Employment Contract - ${contract.username}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; }
              .content { white-space: pre-wrap; }
              .signature { margin-top: 30px; padding: 10px; background: #f5f5f5; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Employment Contract</h1>
              <h2>${contract.jobTitle}</h2>
              <p>Employee: ${contract.username} (${contract.email})</p>
            </div>
            <div class="content">${contract.contractContent}</div>
            ${contract.digitalSignature ? `
              <div class="signature">
                <h3>Digital Signature Information</h3>
                <p><strong>Signature:</strong> ${contract.digitalSignature}</p>
                <p><strong>Signed At:</strong> ${new Date(contract.signedAt!).toLocaleString()}</p>
                <p><strong>IP Address:</strong> ${contract.ipAddress || 'Not recorded'}</p>
              </div>
            ` : ''}
          </body>
        </html>
      `);
    }
  };

  const statsData = {
    total: contracts?.length || 0,
    signed: contracts?.filter(c => c.status === 'signed').length || 0,
    pending: contracts?.filter(c => c.status === 'pending').length || 0,
    expired: contracts?.filter(c => c.status === 'expired').length || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Contract Management
              </h1>
              <p className="text-muted-foreground">
                Manage and monitor employment contracts
              </p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Contract
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Employment Contract</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="employee">Employee *</Label>
                      <Select
                        value={contractForm.userId}
                        onValueChange={(value) => setContractForm(prev => ({ ...prev, userId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((employee: any) => (
                            <SelectItem key={employee.id} value={employee.userId.toString()}>
                              {employee.user?.firstName || 'N/A'} {employee.user?.lastName || 'N/A'} ({employee.user?.email || 'No email'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="contractType">Contract Type</Label>
                      <Select
                        value={contractForm.contractType}
                        onValueChange={(value) => setContractForm(prev => ({ ...prev, contractType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employment_offer">Employment Offer</SelectItem>
                          <SelectItem value="contract_renewal">Contract Renewal</SelectItem>
                          <SelectItem value="probationary">Probationary Contract</SelectItem>
                          <SelectItem value="freelance">Freelance Agreement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="jobTitle">Job Title *</Label>
                      <Input
                        id="jobTitle"
                        value={contractForm.jobTitle}
                        onChange={(e) => setContractForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                        placeholder="e.g., Software Engineer"
                      />
                    </div>

                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={contractForm.department}
                        onChange={(e) => setContractForm(prev => ({ ...prev, department: e.target.value }))}
                        placeholder="e.g., Engineering"
                      />
                    </div>

                    <div>
                      <Label htmlFor="salary">Salary</Label>
                      <Input
                        id="salary"
                        value={contractForm.salary}
                        onChange={(e) => setContractForm(prev => ({ ...prev, salary: e.target.value }))}
                        placeholder="e.g., 80000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={contractForm.currency}
                        onValueChange={(value) => setContractForm(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PKR">PKR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={contractForm.startDate}
                        onChange={(e) => setContractForm(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="contractDuration">Contract Duration</Label>
                      <Input
                        id="contractDuration"
                        value={contractForm.contractDuration}
                        onChange={(e) => setContractForm(prev => ({ ...prev, contractDuration: e.target.value }))}
                        placeholder="e.g., permanent, 1 year, 6 months"
                      />
                    </div>

                    <div>
                      <Label htmlFor="workingHours">Working Hours</Label>
                      <Input
                        id="workingHours"
                        value={contractForm.workingHours}
                        onChange={(e) => setContractForm(prev => ({ ...prev, workingHours: e.target.value }))}
                        placeholder="e.g., 9:00 AM to 5:00 PM"
                      />
                    </div>

                    <div>
                      <Label htmlFor="probationPeriod">Probation Period</Label>
                      <Input
                        id="probationPeriod"
                        value={contractForm.probationPeriod}
                        onChange={(e) => setContractForm(prev => ({ ...prev, probationPeriod: e.target.value }))}
                        placeholder="e.g., 3 months"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="benefits">Benefits</Label>
                    <Textarea
                      id="benefits"
                      value={contractForm.benefits}
                      onChange={(e) => setContractForm(prev => ({ ...prev, benefits: e.target.value }))}
                      placeholder="e.g., Health insurance, Annual leave, Professional development"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contractContent">Contract Content *</Label>
                    <Textarea
                      id="contractContent"
                      value={contractForm.contractContent}
                      onChange={(e) => setContractForm(prev => ({ ...prev, contractContent: e.target.value }))}
                      placeholder="Enter the full contract terms and conditions..."
                      rows={10}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateContract}
                      disabled={createContractMutation.isPending}
                    >
                      {createContractMutation.isPending ? 'Creating...' : 'Create Contract'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Contracts</p>
                  <p className="text-2xl font-bold">{statsData.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Signed</p>
                  <p className="text-2xl font-bold text-green-600">{statsData.signed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{statsData.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expired</p>
                  <p className="text-2xl font-bold text-red-600">{statsData.expired}</p>
                </div>
                <Calendar className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Contracts</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by name, email, or job title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Filter by Status</Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="signed">Signed</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        <div className="space-y-4">
          {filteredContracts.map((contract) => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{contract.username}</span>
                      </div>
                      {getStatusBadge(contract.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        <span>{contract.jobTitle}</span>
                      </div>
                      <div>
                        <span>Email: {contract.email}</span>
                      </div>
                      <div>
                        <span>Created: {new Date(contract.createdAt).toLocaleDateString()}</span>
                      </div>
                      {contract.signedAt && (
                        <div>
                          <span>Signed: {new Date(contract.signedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {contract.digitalSignature && (
                      <div className="mt-2 text-sm">
                        <span className="text-green-600 dark:text-green-400">
                          ✓ Digitally signed by: {contract.digitalSignature}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {contract.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditContract(contract)}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewContract(contract)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadContract(contract)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredContracts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No contracts found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
        
        {/* Edit Contract Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Employment Contract</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editJobTitle">Job Title *</Label>
                  <Input
                    id="editJobTitle"
                    value={contractForm.jobTitle}
                    onChange={(e) => setContractForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                <div>
                  <Label htmlFor="editDepartment">Department</Label>
                  <Input
                    id="editDepartment"
                    value={contractForm.department}
                    onChange={(e) => setContractForm(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g., Engineering"
                  />
                </div>

                <div>
                  <Label htmlFor="editSalary">Salary</Label>
                  <Input
                    id="editSalary"
                    value={contractForm.salary}
                    onChange={(e) => setContractForm(prev => ({ ...prev, salary: e.target.value }))}
                    placeholder="e.g., 80000"
                  />
                </div>

                <div>
                  <Label htmlFor="editCurrency">Currency</Label>
                  <Select
                    value={contractForm.currency}
                    onValueChange={(value) => setContractForm(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PKR">PKR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="editStartDate">Start Date</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={contractForm.startDate}
                    onChange={(e) => setContractForm(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="editContractDuration">Contract Duration</Label>
                  <Input
                    id="editContractDuration"
                    value={contractForm.contractDuration}
                    onChange={(e) => setContractForm(prev => ({ ...prev, contractDuration: e.target.value }))}
                    placeholder="e.g., permanent, 1 year, 6 months"
                  />
                </div>

                <div>
                  <Label htmlFor="editWorkingHours">Working Hours</Label>
                  <Input
                    id="editWorkingHours"
                    value={contractForm.workingHours}
                    onChange={(e) => setContractForm(prev => ({ ...prev, workingHours: e.target.value }))}
                    placeholder="e.g., 9:00 AM to 5:00 PM"
                  />
                </div>

                <div>
                  <Label htmlFor="editProbationPeriod">Probation Period</Label>
                  <Input
                    id="editProbationPeriod"
                    value={contractForm.probationPeriod}
                    onChange={(e) => setContractForm(prev => ({ ...prev, probationPeriod: e.target.value }))}
                    placeholder="e.g., 3 months"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="editBenefits">Benefits</Label>
                <Textarea
                  id="editBenefits"
                  value={contractForm.benefits}
                  onChange={(e) => setContractForm(prev => ({ ...prev, benefits: e.target.value }))}
                  placeholder="e.g., Health insurance, Annual leave, Professional development"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="editContractContent">Contract Content *</Label>
                <Textarea
                  id="editContractContent"
                  value={contractForm.contractContent}
                  onChange={(e) => setContractForm(prev => ({ ...prev, contractContent: e.target.value }))}
                  placeholder="Enter the full contract terms and conditions..."
                  rows={10}
                  className="resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveContract}
                  disabled={editContractMutation.isPending}
                >
                  {editContractMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}