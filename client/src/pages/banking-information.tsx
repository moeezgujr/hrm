import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Building2, 
  User, 
  Hash, 
  Shield,
  CheckCircle,
  AlertCircle,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BankingInfo {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  accountType: string;
  iban?: string;
  routingNumber?: string;
  cnicNumber: string;
  passportNumber?: string;
  taxIdNumber?: string;
}

const initialBankingData: BankingInfo = {
  bankName: '',
  accountHolderName: '',
  accountNumber: '',
  accountType: '',
  iban: '',
  routingNumber: '',
  cnicNumber: '',
  passportNumber: '',
  taxIdNumber: ''
};

export default function BankingInformation() {
  const [formData, setFormData] = useState<BankingInfo>(initialBankingData);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Fetch existing banking information
  const { data: existingData, isLoading, refetch } = useQuery({
    queryKey: ['/api/banking-info'],
    enabled: true
  });

  // Update form data when existing data is loaded
  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
    }
  }, [existingData]);

  // Save banking information mutation
  const saveBankingMutation = useMutation({
    mutationFn: async (data: BankingInfo) => {
      const response = await fetch('/api/banking-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error('Failed to save banking information');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Banking information saved successfully.",
      });
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save banking information. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateFormData = (field: keyof BankingInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Basic validation
    if (!formData.bankName || !formData.accountHolderName || !formData.accountNumber || !formData.accountType || !formData.cnicNumber) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    saveBankingMutation.mutate(formData);
  };

  const isComplete = formData.bankName && formData.accountHolderName && formData.accountNumber && formData.accountType && formData.cnicNumber;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading banking information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Banking & Payroll Information</h1>
          <p className="text-gray-600">Manage your banking details for payroll processing</p>
          
          <div className="flex justify-center mt-4">
            {isComplete ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                <AlertCircle className="h-4 w-4 mr-1" />
                Incomplete
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Bank Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span>Bank Account Details</span>
              </CardTitle>
              <p className="text-sm text-gray-600">Required for payroll deposits</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => updateFormData('bankName', e.target.value)}
                    placeholder="Enter bank name"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                  <Input
                    id="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={(e) => updateFormData('accountHolderName', e.target.value)}
                    placeholder="Enter account holder name"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => updateFormData('accountNumber', e.target.value)}
                    placeholder="Enter account number"
                    type={isEditing ? "text" : "password"}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="accountType">Account Type *</Label>
                  <Select 
                    value={formData.accountType} 
                    onValueChange={(value) => updateFormData('accountType', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Savings Account</SelectItem>
                      <SelectItem value="checking">Checking Account</SelectItem>
                      <SelectItem value="current">Current Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="iban">IBAN (Optional)</Label>
                  <Input
                    id="iban"
                    value={formData.iban || ''}
                    onChange={(e) => updateFormData('iban', e.target.value)}
                    placeholder="Enter IBAN"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="routingNumber">Routing/Swift Code (Optional)</Label>
                  <Input
                    id="routingNumber"
                    value={formData.routingNumber || ''}
                    onChange={(e) => updateFormData('routingNumber', e.target.value)}
                    placeholder="Enter routing or swift code"
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Government Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Government Documents</span>
              </CardTitle>
              <p className="text-sm text-gray-600">Official identification and tax information</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="cnicNumber">CNIC/National ID Number *</Label>
                  <Input
                    id="cnicNumber"
                    value={formData.cnicNumber}
                    onChange={(e) => updateFormData('cnicNumber', e.target.value)}
                    placeholder="Enter CNIC/National ID number"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="passportNumber">Passport Number (Optional)</Label>
                  <Input
                    id="passportNumber"
                    value={formData.passportNumber || ''}
                    onChange={(e) => updateFormData('passportNumber', e.target.value)}
                    placeholder="Enter passport number"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="taxIdNumber">Tax ID Number (Optional)</Label>
                  <Input
                    id="taxIdNumber"
                    value={formData.taxIdNumber || ''}
                    onChange={(e) => updateFormData('taxIdNumber', e.target.value)}
                    placeholder="Enter tax ID number"
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="px-8">
                <User className="h-4 w-4 mr-2" />
                Edit Information
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    if (existingData) {
                      setFormData(existingData);
                    } else {
                      setFormData(initialBankingData);
                    }
                  }}
                  disabled={saveBankingMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saveBankingMutation.isPending}
                  className="px-8"
                >
                  {saveBankingMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Information
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}