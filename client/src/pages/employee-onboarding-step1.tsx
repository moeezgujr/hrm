import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Briefcase,
  GraduationCap,
  Heart,
  CheckCircle,
  AlertCircle,
  FileText,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface EmployeeDetails {
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  
  // Contact Information
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  
  // Address Information
  currentAddress: string;
  permanentAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Employment Information
  position: string;
  department: string;
  startDate: string;
  employmentType: string;
  workLocation: string;
  reportingManager: string;
  
  // Educational Background
  highestEducation: string;
  university: string;
  graduationYear: string;
  majorSubject: string;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  emergencyContactAddress: string;
  
  // Additional Information
  skills: string;
  previousExperience: string;
  languagesSpoken: string;
  hobbies?: string;
  
  // Banking and Payroll Information
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  accountType: string;
  routingNumber?: string;
  iban?: string;
  
  // Government Documents
  cnicNumber: string;
  passportNumber?: string;
  taxIdNumber?: string;
  
  // Document Uploads (Base64 encoded)
  cvDocument?: string;
  cnicDocument?: string;
  profilePicture?: string;
  
  // Acknowledgments
  privacyPolicyAgreed: boolean;
  termsAndConditionsAgreed: boolean;
  backgroundCheckConsent: boolean;
}

const initialFormData: EmployeeDetails = {
  firstName: '', lastName: '', dateOfBirth: '', gender: '', maritalStatus: '', nationality: '',
  email: '', phoneNumber: '', alternatePhone: '',
  currentAddress: '', permanentAddress: '', city: '', state: '', zipCode: '', country: '',
  position: '', department: '', startDate: '', employmentType: '', workLocation: '', reportingManager: '',
  highestEducation: '', university: '', graduationYear: '', majorSubject: '',
  emergencyContactName: '', emergencyContactRelation: '', emergencyContactPhone: '', emergencyContactAddress: '',
  skills: '', previousExperience: '', languagesSpoken: '', hobbies: '',
  bankName: '', accountHolderName: '', accountNumber: '', accountType: '', routingNumber: '', iban: '',
  cnicNumber: '', passportNumber: '', taxIdNumber: '',
  cvDocument: '', cnicDocument: '', profilePicture: '',
  privacyPolicyAgreed: false, termsAndConditionsAgreed: false, backgroundCheckConsent: false
};

export default function EmployeeOnboardingStep1() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EmployeeDetails>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const totalSteps = 8;
  const progress = (currentStep / totalSteps) * 100;

  // Submit employee details mutation
  const submitDetailsMutation = useMutation({
    mutationFn: async (data: EmployeeDetails) => {
      const response = await fetch('/api/onboarding/employee-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your details have been submitted successfully. HR will complete your onboarding process.",
      });
      // Reset form or redirect
      setFormData(initialFormData);
      setCurrentStep(1);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit details. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateFormData = (field: keyof EmployeeDetails, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields: (keyof EmployeeDetails)[] = [
      'firstName', 'lastName', 'email', 'phoneNumber', 'currentAddress',
      'position', 'department', 'startDate', 'emergencyContactName', 'emergencyContactPhone',
      'bankName', 'accountHolderName', 'accountNumber', 'accountType', 'cnicNumber'
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.privacyPolicyAgreed || !formData.termsAndConditionsAgreed || !formData.backgroundCheckConsent) {
      toast({
        title: "Acknowledgments Required",
        description: "Please agree to all required acknowledgments.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    submitDetailsMutation.mutate(formData);
    setIsSubmitting(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Personal Information</h3>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => updateFormData('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maritalStatus">Marital Status</Label>
                <Select value={formData.maritalStatus} onValueChange={(value) => updateFormData('maritalStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => updateFormData('nationality', e.target.value)}
                  placeholder="Enter your nationality"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Phone className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Contact Information</h3>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <Label htmlFor="alternatePhone">Alternate Phone</Label>
                <Input
                  id="alternatePhone"
                  value={formData.alternatePhone || ''}
                  onChange={(e) => updateFormData('alternatePhone', e.target.value)}
                  placeholder="Enter alternate phone number"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Address Information</h3>
            </div>
            
            <div className="grid gap-4">
              <div>
                <Label htmlFor="currentAddress">Current Address *</Label>
                <Textarea
                  id="currentAddress"
                  value={formData.currentAddress}
                  onChange={(e) => updateFormData('currentAddress', e.target.value)}
                  placeholder="Enter your current address"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="permanentAddress">Permanent Address</Label>
                <Textarea
                  id="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={(e) => updateFormData('permanentAddress', e.target.value)}
                  placeholder="Enter your permanent address"
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => updateFormData('state', e.target.value)}
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => updateFormData('zipCode', e.target.value)}
                    placeholder="Enter ZIP code"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => updateFormData('country', e.target.value)}
                    placeholder="Enter country"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Employment Information</h3>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => updateFormData('position', e.target.value)}
                  placeholder="Enter your position"
                />
              </div>
              <div>
                <Label htmlFor="department">Department *</Label>
                <Select value={formData.department} onValueChange={(value) => updateFormData('department', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="human-resources">Human Resources</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="customer-service">Customer Service</SelectItem>
                    <SelectItem value="it">Information Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateFormData('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select value={formData.employmentType} onValueChange={(value) => updateFormData('employmentType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="workLocation">Work Location</Label>
                <Input
                  id="workLocation"
                  value={formData.workLocation}
                  onChange={(e) => updateFormData('workLocation', e.target.value)}
                  placeholder="Enter work location"
                />
              </div>
              <div>
                <Label htmlFor="reportingManager">Reporting Manager</Label>
                <Input
                  id="reportingManager"
                  value={formData.reportingManager}
                  onChange={(e) => updateFormData('reportingManager', e.target.value)}
                  placeholder="Enter reporting manager"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Education & Emergency Contact</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Educational Background</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="highestEducation">Highest Education</Label>
                    <Select value={formData.highestEducation} onValueChange={(value) => updateFormData('highestEducation', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high-school">High School</SelectItem>
                        <SelectItem value="associate">Associate Degree</SelectItem>
                        <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                        <SelectItem value="master">Master's Degree</SelectItem>
                        <SelectItem value="doctorate">Doctorate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="university">University/Institution</Label>
                    <Input
                      id="university"
                      value={formData.university}
                      onChange={(e) => updateFormData('university', e.target.value)}
                      placeholder="Enter university name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="graduationYear">Graduation Year</Label>
                    <Input
                      id="graduationYear"
                      value={formData.graduationYear}
                      onChange={(e) => updateFormData('graduationYear', e.target.value)}
                      placeholder="Enter graduation year"
                    />
                  </div>
                  <div>
                    <Label htmlFor="majorSubject">Major Subject</Label>
                    <Input
                      id="majorSubject"
                      value={formData.majorSubject}
                      onChange={(e) => updateFormData('majorSubject', e.target.value)}
                      placeholder="Enter major subject"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-red-500" />
                  Emergency Contact *
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="emergencyContactName">Contact Name *</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => updateFormData('emergencyContactName', e.target.value)}
                      placeholder="Enter emergency contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactRelation">Relationship</Label>
                    <Input
                      id="emergencyContactRelation"
                      value={formData.emergencyContactRelation}
                      onChange={(e) => updateFormData('emergencyContactRelation', e.target.value)}
                      placeholder="Enter relationship"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactPhone">Phone Number *</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => updateFormData('emergencyContactPhone', e.target.value)}
                      placeholder="Enter emergency contact phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactAddress">Address</Label>
                    <Input
                      id="emergencyContactAddress"
                      value={formData.emergencyContactAddress}
                      onChange={(e) => updateFormData('emergencyContactAddress', e.target.value)}
                      placeholder="Enter emergency contact address"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Banking & Payroll Information</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Bank Account Details (Required for Payroll)</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => updateFormData('bankName', e.target.value)}
                      placeholder="Enter bank name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                    <Input
                      id="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={(e) => updateFormData('accountHolderName', e.target.value)}
                      placeholder="Enter account holder name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => updateFormData('accountNumber', e.target.value)}
                      placeholder="Enter account number"
                      type="password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountType">Account Type *</Label>
                    <Select value={formData.accountType} onValueChange={(value) => updateFormData('accountType', value)}>
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="routingNumber">Routing/Swift Code (Optional)</Label>
                    <Input
                      id="routingNumber"
                      value={formData.routingNumber || ''}
                      onChange={(e) => updateFormData('routingNumber', e.target.value)}
                      placeholder="Enter routing or swift code"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Government Documents</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="cnicNumber">CNIC/National ID Number *</Label>
                    <Input
                      id="cnicNumber"
                      value={formData.cnicNumber}
                      onChange={(e) => updateFormData('cnicNumber', e.target.value)}
                      placeholder="Enter CNIC/National ID number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="passportNumber">Passport Number (Optional)</Label>
                    <Input
                      id="passportNumber"
                      value={formData.passportNumber || ''}
                      onChange={(e) => updateFormData('passportNumber', e.target.value)}
                      placeholder="Enter passport number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxIdNumber">Tax ID Number (Optional)</Label>
                    <Input
                      id="taxIdNumber"
                      value={formData.taxIdNumber || ''}
                      onChange={(e) => updateFormData('taxIdNumber', e.target.value)}
                      placeholder="Enter tax ID number"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Document Uploads</h3>
            </div>
            
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="cvDocument">CV/Resume Upload</Label>
                  <Input
                    id="cvDocument"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          updateFormData('cvDocument', e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-sm text-gray-500 mt-1">Upload your CV or resume (PDF, DOC, DOCX)</p>
                </div>
                
                <div>
                  <Label htmlFor="cnicDocument">CNIC/ID Document Upload</Label>
                  <Input
                    id="cnicDocument"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          updateFormData('cnicDocument', e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-sm text-gray-500 mt-1">Upload CNIC/National ID (PDF, JPG, PNG)</p>
                </div>
                
                <div>
                  <Label htmlFor="profilePicture">Profile Picture Upload</Label>
                  <Input
                    id="profilePicture"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          updateFormData('profilePicture', e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-sm text-gray-500 mt-1">Upload a professional profile picture (JPG, PNG)</p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Document Upload Status</h4>
                <div className="space-y-2 text-sm">
                  <div className={`flex items-center ${formData.cvDocument ? 'text-green-700' : 'text-gray-600'}`}>
                    <CheckCircle className={`h-4 w-4 mr-2 ${formData.cvDocument ? 'text-green-500' : 'text-gray-400'}`} />
                    CV/Resume: {formData.cvDocument ? 'Uploaded' : 'Not uploaded'}
                  </div>
                  <div className={`flex items-center ${formData.cnicDocument ? 'text-green-700' : 'text-gray-600'}`}>
                    <CheckCircle className={`h-4 w-4 mr-2 ${formData.cnicDocument ? 'text-green-500' : 'text-gray-400'}`} />
                    CNIC/ID Document: {formData.cnicDocument ? 'Uploaded' : 'Not uploaded'}
                  </div>
                  <div className={`flex items-center ${formData.profilePicture ? 'text-green-700' : 'text-gray-600'}`}>
                    <CheckCircle className={`h-4 w-4 mr-2 ${formData.profilePicture ? 'text-green-500' : 'text-gray-400'}`} />
                    Profile Picture: {formData.profilePicture ? 'Uploaded' : 'Not uploaded'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Additional Information & Acknowledgments</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="skills">Skills & Expertise</Label>
                <Textarea
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => updateFormData('skills', e.target.value)}
                  placeholder="List your key skills and areas of expertise"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="previousExperience">Previous Work Experience</Label>
                <Textarea
                  id="previousExperience"
                  value={formData.previousExperience}
                  onChange={(e) => updateFormData('previousExperience', e.target.value)}
                  placeholder="Briefly describe your previous work experience"
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="languagesSpoken">Languages Spoken</Label>
                  <Input
                    id="languagesSpoken"
                    value={formData.languagesSpoken}
                    onChange={(e) => updateFormData('languagesSpoken', e.target.value)}
                    placeholder="List languages you speak"
                  />
                </div>
                <div>
                  <Label htmlFor="hobbies">Hobbies & Interests</Label>
                  <Input
                    id="hobbies"
                    value={formData.hobbies || ''}
                    onChange={(e) => updateFormData('hobbies', e.target.value)}
                    placeholder="List your hobbies and interests"
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">Required Acknowledgments</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="privacyPolicy"
                      checked={formData.privacyPolicyAgreed}
                      onCheckedChange={(checked) => updateFormData('privacyPolicyAgreed', !!checked)}
                    />
                    <Label htmlFor="privacyPolicy" className="text-sm">
                      I have read and agree to the Privacy Policy and consent to the collection and processing of my personal data.
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="termsAndConditions"
                      checked={formData.termsAndConditionsAgreed}
                      onCheckedChange={(checked) => updateFormData('termsAndConditionsAgreed', !!checked)}
                    />
                    <Label htmlFor="termsAndConditions" className="text-sm">
                      I have read and agree to the Terms and Conditions of employment.
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="backgroundCheck"
                      checked={formData.backgroundCheckConsent}
                      onCheckedChange={(checked) => updateFormData('backgroundCheckConsent', !!checked)}
                    />
                    <Label htmlFor="backgroundCheck" className="text-sm">
                      I consent to background verification checks as required by company policy.
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles = [
    "Personal Info",
    "Contact Details", 
    "Address",
    "Employment",
    "Education & Emergency",
    "Banking & Payroll",
    "Document Uploads",
    "Final Details"
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Onboarding</h1>
          <p className="text-gray-600">Step 1: Complete Your Personal Details</p>
          <Badge variant="outline" className="mt-2">
            Step {currentStep} of {totalSteps}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 overflow-x-auto">
            {stepTitles.map((title, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  index + 1 === currentStep
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : index + 1 < currentStep
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {index + 1 < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : index + 1 === currentStep ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-gray-300 text-xs flex items-center justify-center text-white">
                    {index + 1}
                  </span>
                )}
                <span>{title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{stepTitles[currentStep - 1]}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              <Button
                onClick={handleNextStep}
                disabled={isSubmitting || submitDetailsMutation.isPending}
              >
                {currentStep === totalSteps ? (
                  isSubmitting || submitDetailsMutation.isPending ? 'Submitting...' : 'Submit Details'
                ) : (
                  'Next Step'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Information Box */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">What happens next?</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Once you submit your details, HR will review your information and complete the administrative 
                  aspects of your onboarding including IT setup, document verification, and account creation. 
                  You'll receive updates on your progress via email.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}