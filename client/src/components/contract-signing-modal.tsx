import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface ContractSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSigningComplete: () => void;
}

export default function ContractSigningModal({ isOpen, onClose, onSigningComplete }: ContractSigningModalProps) {
  const [signature, setSignature] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending contract
  const { data: contract, isLoading, error } = useQuery<EmploymentContract>({
    queryKey: ["/api/contracts/pending"],
    enabled: isOpen,
    retry: false,
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
        description: "Your employment contract has been signed. Welcome to the team!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setSignature("");
      onSigningComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Signing Failed",
        description: error.message || "Failed to sign contract. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSignContract = () => {
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
        title: "Error",
        description: "No contract found to sign.",
        variant: "destructive",
      });
      return;
    }

    signContractMutation.mutate({
      contractId: contract.id,
      signature: signature.trim()
    });
  };

  const formatContractContent = (content: string) => {
    console.log('Contract content received:', content?.substring(0, 100) + '...');
    console.log('Contract content length:', content?.length);
    
    if (!content || content.trim() === '') {
      return (
        <div className="text-center py-8">
          <p className="text-lg text-red-600 mb-2">Contract content not available</p>
          <p className="text-sm text-gray-500">Please contact HR for assistance</p>
        </div>
      );
    }
    
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
      
      // Default paragraph styling
      return (
        <p key={index} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-1">
          {line}
        </p>
      );
    });
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} modal={true}>
        <DialogContent className="max-w-4xl max-h-[90vh] pb-16" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your contract...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !contract) {
    return (
      <Dialog open={isOpen} modal={true}>
        <DialogContent className="max-w-2xl pb-16" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Contract Loading Error
            </DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription>
              Unable to load your employment contract. Please contact HR for assistance.
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent 
        className="max-w-4xl h-[95vh] p-0 flex flex-col" 
        onPointerDownOutside={(e) => e.preventDefault()} 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-6 w-6 text-blue-600" />
            Employment Offer Letter - Signature Required
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Please review your employment offer letter carefully and provide your digital signature to accept the position.
          </p>
        </DialogHeader>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Contract Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 border-b">
            <div className="prose max-w-none text-base leading-relaxed space-y-2">
              {contract?.contractContent ? (
                formatContractContent(contract.contractContent)
              ) : (
                <div className="text-center py-8">
                  <p className="text-lg text-red-600 mb-2">Contract content is empty</p>
                  <p className="text-sm text-gray-500">Contract ID: {contract?.id}</p>
                  <p className="text-sm text-gray-500">Content Length: {contract?.contractContent?.length || 0}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Signature Section */}
          <div className="border-t bg-gray-50 dark:bg-gray-900 p-6 space-y-4 flex-shrink-0 max-h-[40vh] overflow-y-auto pb-12">
            <Alert className="py-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <PenTool className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-base text-green-800 dark:text-green-200">
                <strong>Complete Your Digital Signature:</strong> As mentioned in the ACCEPTANCE section above, please provide your digital signature below to finalize your employment contract.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">✍️</div>
                  <Label htmlFor="signature" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Employee Digital Signature
                  </Label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Complete the signature section above by typing your full legal name as it appears in your identification documents
                </p>
                <Input
                  id="signature"
                  type="text"
                  placeholder="Muqaddas Saeed"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="text-lg py-4 border-2 border-blue-300 focus:border-blue-500 bg-white dark:bg-gray-900"
                  disabled={signContractMutation.isPending}
                />
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Legal Notice:</strong> Your digital signature is legally binding and equivalent to a handwritten signature. Once signed, this contract becomes enforceable.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSignContract}
                  disabled={!signature.trim() || signContractMutation.isPending}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 w-full"
                  size="lg"
                >
                  {signContractMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Signing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Sign & Accept Offer
                    </>
                  )}
                </Button>
                
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  Contract must be signed to access your employee dashboard
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}