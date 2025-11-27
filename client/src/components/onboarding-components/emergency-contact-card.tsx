import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { CheckCircle, Phone, Users, AlertTriangle, Save } from 'lucide-react';
import { OnboardingChecklist } from '@shared/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const emergencyContactSchema = z.object({
  primaryContactName: z.string().min(2, 'Primary contact name is required'),
  primaryContactRelation: z.enum(['spouse', 'parent', 'sibling', 'child', 'friend', 'other'], {
    required_error: 'Please select relationship'
  }),
  primaryContactPhone: z.string().min(10, 'Primary contact phone is required'),
  primaryContactEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  primaryContactAddress: z.string().min(10, 'Primary contact address is required'),
  
  secondaryContactName: z.string().min(2, 'Secondary contact name is required'),
  secondaryContactRelation: z.enum(['spouse', 'parent', 'sibling', 'child', 'friend', 'other'], {
    required_error: 'Please select relationship'
  }),
  secondaryContactPhone: z.string().min(10, 'Secondary contact phone is required'),
  secondaryContactEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  secondaryContactAddress: z.string().min(10, 'Secondary contact address is required'),
  
  medicalConditions: z.string().optional(),
  medications: z.string().optional(),
  allergies: z.string().optional(),
  doctorName: z.string().optional(),
  doctorPhone: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional()
});

type EmergencyContactData = z.infer<typeof emergencyContactSchema>;

interface EmergencyContactCardProps {
  item: OnboardingChecklist;
  employeeId: number;
  onToggleComplete: (id: number, isCompleted: boolean) => void;
}

export function EmergencyContactCard({ item, employeeId, onToggleComplete }: EmergencyContactCardProps) {
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EmergencyContactData>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: {
      primaryContactName: '',
      primaryContactPhone: '',
      primaryContactEmail: '',
      primaryContactAddress: '',
      secondaryContactName: '',
      secondaryContactPhone: '',
      secondaryContactEmail: '',
      secondaryContactAddress: '',
      medicalConditions: '',
      medications: '',
      allergies: '',
      doctorName: '',
      doctorPhone: '',
      insuranceProvider: '',
      insurancePolicyNumber: ''
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: EmergencyContactData) => {
      return await apiRequest('PUT', `/api/employees/${employeeId}/emergency-contact`, data);
    },
    onSuccess: () => {
      toast({
        title: "Emergency Contact Information Saved",
        description: "Your emergency contact information has been successfully saved.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/personal-profile/${employeeId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-onboarding'] });
      onToggleComplete(item.id, true);
      setShowModal(false);
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save emergency contact information.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmergencyContactData) => {
    submitMutation.mutate(data);
  };

  return (
    <>
      <Card className="border border-red-200 bg-red-50/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`mt-1 ${item.isCompleted ? 'text-green-600' : 'text-red-600'}`}>
                {item.isCompleted ? <CheckCircle className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.itemTitle}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                
                {item.isCompleted ? (
                  <div className="mt-3 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Emergency Contacts Added</span>
                    {item.completedAt && (
                      <span className="text-xs text-gray-500">
                        on {new Date(item.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="flex items-center space-x-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">Required for workplace safety</span>
                    </div>
                    <Button
                      onClick={() => setShowModal(true)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Add Emergency Contacts
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <Badge variant={item.isCompleted ? "default" : "destructive"}>
              {item.isCompleted ? "Complete" : "Required"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="emergency-contact-description">
          <DialogHeader>
            <DialogTitle>Emergency Contact Information</DialogTitle>
            <p id="emergency-contact-description" className="text-sm text-gray-600 mt-2">
              Please provide at least two emergency contacts and any relevant medical information.
            </p>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Primary Emergency Contact */}
              <Card className="border border-red-200">
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-red-600" />
                    Primary Emergency Contact
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="primaryContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="primaryContactRelation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="spouse">Spouse</SelectItem>
                              <SelectItem value="parent">Parent</SelectItem>
                              <SelectItem value="sibling">Sibling</SelectItem>
                              <SelectItem value="child">Child</SelectItem>
                              <SelectItem value="friend">Friend</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="primaryContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="primaryContactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="john@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="primaryContactAddress"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, City, State, ZIP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Secondary Emergency Contact */}
              <Card className="border border-orange-200">
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-orange-600" />
                    Secondary Emergency Contact
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="secondaryContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="secondaryContactRelation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="spouse">Spouse</SelectItem>
                              <SelectItem value="parent">Parent</SelectItem>
                              <SelectItem value="sibling">Sibling</SelectItem>
                              <SelectItem value="child">Child</SelectItem>
                              <SelectItem value="friend">Friend</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="secondaryContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="secondaryContactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="jane@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="secondaryContactAddress"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="456 Oak Ave, City, State, ZIP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Medical Information */}
              <Card className="border border-blue-200">
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-blue-600" />
                    Medical Information (Optional)
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="medicalConditions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medical Conditions</FormLabel>
                          <FormControl>
                            <Input placeholder="Diabetes, Heart condition, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="medications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Medications</FormLabel>
                          <FormControl>
                            <Input placeholder="List any medications" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allergies</FormLabel>
                          <FormControl>
                            <Input placeholder="Food, drug, environmental allergies" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="doctorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Doctor</FormLabel>
                          <FormControl>
                            <Input placeholder="Dr. John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="doctorPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Doctor Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="insuranceProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Provider</FormLabel>
                          <FormControl>
                            <Input placeholder="Blue Cross Blue Shield" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="insurancePolicyNumber"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Insurance Policy Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Policy number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitMutation.isPending} className="bg-red-600 hover:bg-red-700">
                  {submitMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Emergency Contacts
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