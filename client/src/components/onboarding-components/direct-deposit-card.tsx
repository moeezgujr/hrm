import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { CheckCircle, CreditCard, Shield, Building2, AlertTriangle, Save } from 'lucide-react';
import { OnboardingChecklist } from '@shared/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const directDepositSchema = z.object({
  bankName: z.string().min(2, 'Bank name is required'),
  accountHolderName: z.string().min(2, 'Account holder name is required'),
  accountType: z.enum(['checking', 'savings'], {
    required_error: 'Please select account type'
  }),
  routingNumber: z.string().regex(/^\d{9}$/, 'Routing number must be exactly 9 digits'),
  accountNumber: z.string().min(4, 'Account number must be at least 4 digits').regex(/^\d+$/, 'Account number must contain only digits'),
  accountNumberConfirm: z.string(),
  
  // Optional split deposit
  enableSplitDeposit: z.boolean().default(false),
  secondBankName: z.string().optional(),
  secondAccountType: z.enum(['checking', 'savings']).optional(),
  secondRoutingNumber: z.string().optional(),
  secondAccountNumber: z.string().optional(),
  splitAmount: z.string().optional(),
  splitType: z.enum(['percentage', 'fixed']).optional(),
  
  // Verification
  authorizeDirectDeposit: z.boolean().refine(val => val === true, {
    message: 'You must authorize direct deposit to proceed'
  }),
  confirmAccountOwnership: z.boolean().refine(val => val === true, {
    message: 'You must confirm account ownership'
  })
}).refine((data) => data.accountNumber === data.accountNumberConfirm, {
  message: "Account numbers don't match",
  path: ["accountNumberConfirm"],
});

type DirectDepositData = z.infer<typeof directDepositSchema>;

interface DirectDepositCardProps {
  item: OnboardingChecklist;
  employeeId: number;
  onToggleComplete: (id: number, isCompleted: boolean) => void;
}

export function DirectDepositCard({ item, employeeId, onToggleComplete }: DirectDepositCardProps) {
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DirectDepositData>({
    resolver: zodResolver(directDepositSchema),
    defaultValues: {
      bankName: '',
      accountHolderName: '',
      routingNumber: '',
      accountNumber: '',
      accountNumberConfirm: '',
      enableSplitDeposit: false,
      authorizeDirectDeposit: false,
      confirmAccountOwnership: false
    }
  });

  const watchEnableSplit = form.watch('enableSplitDeposit');

  const submitMutation = useMutation({
    mutationFn: async (data: DirectDepositData) => {
      return await apiRequest('PUT', `/api/employees/${employeeId}/direct-deposit`, data);
    },
    onSuccess: () => {
      toast({
        title: "Direct Deposit Setup Complete",
        description: "Your banking information has been securely saved for payroll processing.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/personal-profile/${employeeId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-onboarding'] });
      onToggleComplete(item.id, true);
      setShowModal(false);
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to save direct deposit information.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DirectDepositData) => {
    submitMutation.mutate(data);
  };

  return (
    <>
      <Card className="border border-green-200 bg-green-50/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`mt-1 ${item.isCompleted ? 'text-green-600' : 'text-green-700'}`}>
                {item.isCompleted ? <CheckCircle className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.itemTitle}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                
                {item.isCompleted ? (
                  <div className="mt-3 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Direct Deposit Configured</span>
                    {item.completedAt && (
                      <span className="text-xs text-gray-500">
                        on {new Date(item.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="flex items-center space-x-4 mb-3 text-sm text-green-700">
                      <div className="flex items-center space-x-1">
                        <Shield className="w-4 h-4" />
                        <span>Bank-level security</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-4 h-4" />
                        <span>Supports split deposits</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Set Up Direct Deposit
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <Badge variant={item.isCompleted ? "default" : "secondary"}>
              {item.isCompleted ? "Complete" : "Pending"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="direct-deposit-description">
          <DialogHeader>
            <DialogTitle>Direct Deposit Setup</DialogTitle>
            <p id="direct-deposit-description" className="text-sm text-gray-600 mt-2">
              Set up direct deposit for automatic payroll payments to your bank account.
            </p>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Security Notice */}
              <Card className="border border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-900">Secure Information</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Your banking information is encrypted and securely stored. We use bank-level security 
                        to protect your financial data.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Primary Bank Account */}
              <Card className="border border-green-200">
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-green-600" />
                    Primary Bank Account
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Chase Bank, Wells Fargo, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="accountHolderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Holder Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name as on account" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="checking">Checking Account</SelectItem>
                              <SelectItem value="savings">Savings Account</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="routingNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Routing Number *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="9-digit routing number" 
                              maxLength={9}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Account number"
                              type="password"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="accountNumberConfirm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Account Number *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Re-enter account number"
                              type="password"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Split Deposit Option */}
              <Card className="border border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <FormField
                      control={form.control}
                      name="enableSplitDeposit"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300 text-yellow-600"
                            />
                          </FormControl>
                          <FormLabel className="font-medium text-gray-900 cursor-pointer">
                            Enable Split Deposit (Optional)
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Split your paycheck between two accounts (e.g., checking and savings)
                  </p>

                  {watchEnableSplit && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="secondBankName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Second Bank Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Bank name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="secondAccountType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="checking">Checking</SelectItem>
                                  <SelectItem value="savings">Savings</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="secondRoutingNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Routing Number</FormLabel>
                              <FormControl>
                                <Input placeholder="9-digit routing number" maxLength={9} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="secondAccountNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Account number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="splitType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Split Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select split type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="percentage">Percentage</SelectItem>
                                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="splitAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount/Percentage</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 25 or 500" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Authorization */}
              <Card className="border border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <h3 className="font-medium text-red-900 mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Required Authorizations
                  </h3>
                  
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="authorizeDirectDeposit"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300 text-red-600 mt-1"
                            />
                          </FormControl>
                          <FormLabel className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                            I authorize my employer to deposit my pay directly into the account(s) specified above. 
                            I understand that this authorization will remain in effect until I provide written notice to change it.
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="confirmAccountOwnership"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300 text-red-600 mt-1"
                            />
                          </FormControl>
                          <FormLabel className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                            I confirm that I am the owner or authorized user of the bank account(s) specified above 
                            and have the authority to authorize direct deposits.
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  {submitMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Setting Up...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Complete Setup
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}