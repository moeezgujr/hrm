import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, FileText, PenTool, Clock, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

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

export default function ContractSigning() {
  const [signature, setSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending contract
  const { data: contract, isLoading, error } = useQuery<EmploymentContract>({
    queryKey: ["/api/contracts/pending"],
    retry: false,
    meta: {
      errorHandler: (error: any) => {
        if (error.message.includes('403') && error.message.includes('Contract signing required')) {
          // This is expected for contract checking, don't show error
          return;
        }
        throw error;
      }
    }
  });

  // Sign contract mutation
  const signContractMutation = useMutation({
    mutationFn: async (data: { contractId: number; signature: string }) => {
      return await apiRequest("POST", `/api/contracts/${data.contractId}/sign`, {
        signature: data.signature
      });
    },
    onSuccess: () => {
      toast({
        title: "Contract Signed Successfully",
        description: "Your employment contract has been signed. You can now access the dashboard.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      // Redirect to dashboard after successful signing
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Signing Failed",
        description: error.message || "Failed to sign contract. Please try again.",
        variant: "destructive",
      });
    }
  });

  const formatContractContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.trim() === '') return <br key={index} />;
      
      // Main title styling
      if (line.includes('EMPLOYMENT OFFER LETTER')) {
        return (
          <h1 key={index} className="text-xl font-bold text-center text-blue-800 dark:text-blue-400 mb-4">
            {line}
          </h1>
        );
      }
      
      // Company name styling
      if (line.includes('Meeting Matters Clinic') && !line.includes('related to')) {
        return (
          <h2 key={index} className="text-lg font-semibold text-center text-gray-700 dark:text-gray-300 mb-4">
            {line}
          </h2>
        );
      }
      
      // Major section headings with colored backgrounds
      if (line.match(/^[A-Z\s&:]+$/) && line.length > 5 && !line.includes('.') && !line.includes(',') && 
          (line.includes('POSITION DETAILS') || line.includes('COMPENSATION') || line.includes('WORKING HOURS') || 
           line.includes('JOB RESPONSIBILITIES') || line.includes('TERMS AND CONDITIONS') || line.includes('BENEFITS') || 
           line.includes('ACCEPTANCE'))) {
        return (
          <div key={index} className="mt-4 mb-3">
            <h3 className="text-sm font-bold text-white bg-blue-600 dark:bg-blue-700 px-3 py-2 rounded-md">
              {line}
            </h3>
          </div>
        );
      }
      
      // Numbered terms and conditions with left border
      if (line.match(/^\d+\.\s+[A-Z]/)) {
        return (
          <h4 key={index} className="text-sm font-semibold text-blue-700 dark:text-blue-400 mt-3 mb-2 border-l-4 border-blue-500 pl-3">
            {line}
          </h4>
        );
      }
      
      // Bullet points
      if (line.startsWith('- ')) {
        return (
          <li key={index} className="text-xs text-gray-700 dark:text-gray-300 mb-1 ml-4">
            {line.substring(2)}
          </li>
        );
      }
      
      // Key information lines with background
      if (line.includes('Position:') || line.includes('Department:') || line.includes('Start Date:') || 
          line.includes('Base Salary:') || line.includes('Working Hours:') || line.includes('Performance Bonus:')) {
        return (
          <p key={index} className="text-xs font-medium text-gray-800 dark:text-gray-200 mb-1 bg-gray-100 dark:bg-gray-700 p-2 rounded">
            {line}
          </p>
        );
      }
      
      // Employee signature line with input field
      if (line.includes('Employee Signature: _________________________')) {
        return (
          <div key={index} className="mt-4 mb-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-mono">
              Employee Signature:
            </p>
            <Input
              type="text"
              placeholder="Enter your full name as your digital signature"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              disabled={isSubmitting}
              className="mb-2"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Your signature will be recorded along with timestamp and IP address for legal purposes.
            </p>
            <Button
              onClick={handleSignContract}
              disabled={!signature.trim() || isSubmitting || signContractMutation.isPending}
              className="w-full"
              size="sm"
            >
              {isSubmitting || signContractMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Signing Contract...
                </>
              ) : (
                <>
                  <PenTool className="h-4 w-4 mr-2" />
                  Sign Employment Contract
                </>
              )}
            </Button>
          </div>
        );
      }
      
      // Other signature lines
      if (line.includes('Signature:') || line.includes('Date:')) {
        return (
          <p key={index} className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-mono">
            {line}
          </p>
        );
      }
      
      // Regular content
      return (
        <p key={index} className="text-xs text-gray-600 dark:text-gray-300 mb-1 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  const handleSignContract = async () => {
    if (!signature.trim()) {
      toast({
        title: "Signature Required",
        description: "Please enter your full name as your digital signature.",
        variant: "destructive",
      });
      return;
    }

    if (!contract) {
      toast({
        title: "No Contract Found",
        description: "No pending contract found to sign.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await signContractMutation.mutateAsync({
        contractId: contract.id,
        signature: signature.trim()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Clock className="h-6 w-6 animate-spin" />
          <span>Loading contract...</span>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-6 w-6 mr-2 text-yellow-500" />
              No Pending Contract
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You don't have any pending employment contracts to sign.
            </p>
            <Button 
              onClick={() => window.location.href = "/"}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Employment Contract Signing
          </h1>
          <p className="text-muted-foreground">
            Please review and sign your employment contract to access the system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contract Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Contract Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Job Title</Label>
                <p className="text-sm text-muted-foreground">{contract.jobTitle}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Contract Type</Label>
                <p className="text-sm text-muted-foreground">{contract.contractType}</p>
              </div>

              {contract.department && (
                <div>
                  <Label className="text-sm font-medium">Department</Label>
                  <p className="text-sm text-muted-foreground">{contract.department}</p>
                </div>
              )}

              {contract.salary && (
                <div>
                  <Label className="text-sm font-medium">Salary</Label>
                  <p className="text-sm text-muted-foreground">
                    {contract.currency || 'PKR'} {Number(contract.salary).toLocaleString()}
                  </p>
                </div>
              )}

              {contract.contractDuration && (
                <div>
                  <Label className="text-sm font-medium">Contract Duration</Label>
                  <p className="text-sm text-muted-foreground">{contract.contractDuration}</p>
                </div>
              )}

              {contract.workingHours && (
                <div>
                  <Label className="text-sm font-medium">Working Hours</Label>
                  <p className="text-sm text-muted-foreground">{contract.workingHours}</p>
                </div>
              )}

              {contract.probationPeriod && (
                <div>
                  <Label className="text-sm font-medium">Probation Period</Label>
                  <p className="text-sm text-muted-foreground">{contract.probationPeriod}</p>
                </div>
              )}



              {contract.startDate && (
                <div>
                  <Label className="text-sm font-medium">Start Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(contract.startDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-1 text-yellow-500" />
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">
                    Pending Signature
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Content & Signing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PenTool className="h-5 w-5 mr-2" />
                Contract Terms & Signing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Contract Terms</Label>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-80 overflow-y-auto">
                  <div className="space-y-1">
                    {formatContractContent(contract.contractContent)}
                  </div>
                </div>
              </div>

              {contract.contractPdf && (
                <div>
                  <Label className="text-sm font-medium">Contract Document</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `data:application/pdf;base64,${contract.contractPdf}`;
                      link.download = `contract-${contract.id}.pdf`;
                      link.click();
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download Contract PDF
                  </Button>
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  By signing this contract, you agree to all terms and conditions outlined above.
                  This action cannot be undone.
                </AlertDescription>
              </Alert>

              <div className="text-center text-sm text-muted-foreground">
                <p>Please scroll to the bottom of the contract to sign in the ACCEPTANCE section.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contract History/Status */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Contract Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="font-medium">Created</Label>
                <p className="text-muted-foreground">
                  {new Date(contract.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="font-medium">Last Updated</Label>
                <p className="text-muted-foreground">
                  {new Date(contract.updatedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="font-medium">Contract ID</Label>
                <p className="text-muted-foreground font-mono">#{contract.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}