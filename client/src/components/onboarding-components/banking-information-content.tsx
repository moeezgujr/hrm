import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Shield, CheckCircle, AlertTriangle, DollarSign, Building2 } from 'lucide-react';
import { OnboardingChecklist } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface BankingInformationContentProps {
  item: OnboardingChecklist | null;
  employeeId: number;
  onComplete: () => void;
}

export function BankingInformationContent({ item, employeeId, onComplete }: BankingInformationContentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [bankingInfo, setBankingInfo] = useState({
    accountType: '',
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    accountNumberConfirm: '',
    accountHolderName: '',
    depositAmount: '',
    depositPercentage: '',
    splitDeposit: false,
    secondaryAccountType: '',
    secondaryBankName: '',
    secondaryRoutingNumber: '',
    secondaryAccountNumber: '',
    secondaryAccountNumberConfirm: '',
    secondaryDepositAmount: '',
    secondaryDepositPercentage: '',
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [verifiedInformation, setVerifiedInformation] = useState(false);

  const saveBankingInfoMutation = useMutation({
    mutationFn: async (data: any) => {
      // Map the data to match the expected direct deposit format
      const directDepositData = {
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
        accountType: data.accountType,
        routingNumber: data.routingNumber,
        accountNumber: data.accountNumber,
        enableSplitDeposit: data.splitDeposit,
        secondaryBankName: data.secondaryBankName,
        secondaryAccountType: data.secondaryAccountType,
        secondaryRoutingNumber: data.secondaryRoutingNumber,
        secondaryAccountNumber: data.secondaryAccountNumber,
        depositAmount: data.depositAmount,
        depositPercentage: data.depositPercentage,
        secondaryDepositAmount: data.secondaryDepositAmount,
        secondaryDepositPercentage: data.secondaryDepositPercentage,
      };
      return await apiRequest('PUT', `/api/employees/${employeeId}/direct-deposit`, directDepositData);
    },
    onSuccess: () => {
      toast({
        title: "Banking Information Saved",
        description: "Your banking information has been securely saved.",
      });
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: [`/api/employees/${employeeId}/banking`] });
      queryClient.invalidateQueries({ queryKey: [`/api/onboarding/${employeeId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
    },
    onError: (error) => {
      console.error('Banking save error:', error);
      toast({
        title: "Error",
        description: "Failed to save banking information. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setBankingInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!bankingInfo.bankName) errors.push("Bank name is required");
    if (!bankingInfo.routingNumber || bankingInfo.routingNumber.length !== 9) {
      errors.push("Valid 9-digit routing number is required");
    }
    if (!bankingInfo.accountNumber || bankingInfo.accountNumber.length < 4) {
      errors.push("Valid account number is required");
    }
    if (bankingInfo.accountNumber !== bankingInfo.accountNumberConfirm) {
      errors.push("Account numbers must match");
    }
    if (!bankingInfo.accountHolderName) errors.push("Account holder name is required");
    if (!bankingInfo.accountType) errors.push("Account type is required");
    if (!agreedToTerms) errors.push("You must agree to the terms and conditions");
    if (!verifiedInformation) errors.push("You must verify the accuracy of the information");

    if (bankingInfo.splitDeposit) {
      if (!bankingInfo.secondaryBankName) errors.push("Secondary bank name is required for split deposit");
      if (!bankingInfo.secondaryRoutingNumber || bankingInfo.secondaryRoutingNumber.length !== 9) {
        errors.push("Valid secondary routing number is required for split deposit");
      }
      if (!bankingInfo.secondaryAccountNumber) errors.push("Secondary account number is required for split deposit");
      if (bankingInfo.secondaryAccountNumber !== bankingInfo.secondaryAccountNumberConfirm) {
        errors.push("Secondary account numbers must match");
      }
    }

    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors[0],
        variant: "destructive",
      });
      return;
    }

    try {
      await saveBankingInfoMutation.mutateAsync(bankingInfo);
      onComplete();
    } catch (error) {
      console.error('Error saving banking information:', error);
    }
  };

  const canComplete = () => {
    return validateForm().length === 0;
  };

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Secure Information</h4>
              <p className="text-sm text-blue-700 mt-1">
                Your banking information is encrypted and stored securely. This data is only used for payroll purposes and is never shared with third parties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Primary Account Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank-name">Bank Name *</Label>
              <Input
                id="bank-name"
                value={bankingInfo.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                placeholder="Enter your bank name"
              />
            </div>
            <div>
              <Label htmlFor="account-type">Account Type *</Label>
              <Select value={bankingInfo.accountType} onValueChange={(value) => handleInputChange('accountType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="routing-number">Routing Number *</Label>
              <Input
                id="routing-number"
                value={bankingInfo.routingNumber}
                onChange={(e) => handleInputChange('routingNumber', e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="9-digit routing number"
                maxLength={9}
              />
            </div>
            <div>
              <Label htmlFor="account-holder-name">Account Holder Name *</Label>
              <Input
                id="account-holder-name"
                value={bankingInfo.accountHolderName}
                onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                placeholder="Full name on account"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="account-number">Account Number *</Label>
              <Input
                id="account-number"
                type="password"
                value={bankingInfo.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                placeholder="Enter account number"
              />
            </div>
            <div>
              <Label htmlFor="account-number-confirm">Confirm Account Number *</Label>
              <Input
                id="account-number-confirm"
                type="password"
                value={bankingInfo.accountNumberConfirm}
                onChange={(e) => handleInputChange('accountNumberConfirm', e.target.value)}
                placeholder="Re-enter account number"
              />
            </div>
          </div>

          {bankingInfo.accountNumber && bankingInfo.accountNumberConfirm && (
            <div className="flex items-center space-x-2">
              {bankingInfo.accountNumber === bankingInfo.accountNumberConfirm ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Account numbers match</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600">Account numbers do not match</span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Split Deposit Option */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="split-deposit"
              checked={bankingInfo.splitDeposit}
              onCheckedChange={(checked) => setBankingInfo(prev => ({ ...prev, splitDeposit: !!checked }))}
            />
            <Label htmlFor="split-deposit" className="text-base font-medium cursor-pointer">
              Enable Split Deposit
            </Label>
          </div>
          <p className="text-sm text-gray-600">
            Divide your paycheck between two accounts (e.g., checking and savings)
          </p>
        </CardHeader>

        {bankingInfo.splitDeposit && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary-amount">Primary Account Amount/Percentage</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Amount ($)"
                    value={bankingInfo.depositAmount}
                    onChange={(e) => handleInputChange('depositAmount', e.target.value)}
                  />
                  <Input
                    placeholder="Percentage (%)"
                    value={bankingInfo.depositPercentage}
                    onChange={(e) => handleInputChange('depositPercentage', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <h4 className="font-medium">Secondary Account Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="secondary-bank-name">Secondary Bank Name</Label>
                <Input
                  id="secondary-bank-name"
                  value={bankingInfo.secondaryBankName}
                  onChange={(e) => handleInputChange('secondaryBankName', e.target.value)}
                  placeholder="Enter secondary bank name"
                />
              </div>
              <div>
                <Label htmlFor="secondary-account-type">Secondary Account Type</Label>
                <Select value={bankingInfo.secondaryAccountType} onValueChange={(value) => handleInputChange('secondaryAccountType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="secondary-routing-number">Secondary Routing Number</Label>
                <Input
                  id="secondary-routing-number"
                  value={bankingInfo.secondaryRoutingNumber}
                  onChange={(e) => handleInputChange('secondaryRoutingNumber', e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="9-digit routing number"
                  maxLength={9}
                />
              </div>
              <div>
                <Label htmlFor="secondary-amount">Secondary Account Amount/Percentage</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Amount ($)"
                    value={bankingInfo.secondaryDepositAmount}
                    onChange={(e) => handleInputChange('secondaryDepositAmount', e.target.value)}
                  />
                  <Input
                    placeholder="Percentage (%)"
                    value={bankingInfo.secondaryDepositPercentage}
                    onChange={(e) => handleInputChange('secondaryDepositPercentage', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="secondary-account-number">Secondary Account Number</Label>
                <Input
                  id="secondary-account-number"
                  type="password"
                  value={bankingInfo.secondaryAccountNumber}
                  onChange={(e) => handleInputChange('secondaryAccountNumber', e.target.value)}
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <Label htmlFor="secondary-account-number-confirm">Confirm Secondary Account Number</Label>
                <Input
                  id="secondary-account-number-confirm"
                  type="password"
                  value={bankingInfo.secondaryAccountNumberConfirm}
                  onChange={(e) => handleInputChange('secondaryAccountNumberConfirm', e.target.value)}
                  placeholder="Re-enter account number"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Terms and Verification */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="agree-terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
            />
            <Label htmlFor="agree-terms" className="cursor-pointer text-sm">
              I agree to the direct deposit authorization terms and understand that changes may take 1-2 pay periods to take effect.
            </Label>
          </div>
          
          <div className="flex items-start space-x-3">
            <Checkbox
              id="verify-info"
              checked={verifiedInformation}
              onCheckedChange={(checked) => setVerifiedInformation(!!checked)}
            />
            <Label htmlFor="verify-info" className="cursor-pointer text-sm">
              I have verified that all banking information provided is accurate and complete.
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Important Notes</h4>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Direct deposit setup may take 1-2 pay periods to become effective</li>
                <li>• Verify your account information with your bank before submitting</li>
                <li>• Contact HR immediately if you need to make changes after submission</li>
                <li>• Keep a copy of your account information for your records</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            {canComplete() ? "Ready to Submit" : "Complete Banking Information"}
          </h3>
          <p className="text-green-700 mb-4">
            {canComplete() 
              ? "Your banking information is complete and ready to submit."
              : "Please fill out all required fields and accept the terms."
            }
          </p>
          <Button
            onClick={handleSave}
            disabled={!canComplete() || saveBankingInfoMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {saveBankingInfoMutation.isPending ? "Saving..." : "Submit Banking Information"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}