import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Users,
  Briefcase,
  GraduationCap,
  Globe,
  Heart,
  Shield,
  CheckCircle,
  AlertCircle,
  Save,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Comprehensive personal profile schema
const personalProfileSchema = z.object({
  // Basic Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  preferredName: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    required_error: 'Please select gender'
  }),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed', 'separated'], {
    required_error: 'Please select marital status'
  }),
  nationality: z.string().min(1, 'Nationality is required'),
  
  // Contact Information
  personalEmail: z.string().email('Invalid email format'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  alternatePhone: z.string().optional(),
  
  // Address Information
  currentAddress: z.string().min(10, 'Current address is required'),
  permanentAddress: z.string().min(10, 'Permanent address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  zipCode: z.string().min(5, 'ZIP/Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  
  // Emergency Contact
  emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
  emergencyContactRelation: z.string().min(1, 'Relationship is required'),
  emergencyContactPhone: z.string().min(10, 'Emergency contact phone is required'),
  emergencyContactAddress: z.string().min(5, 'Emergency contact address is required'),
  
  // Employment Information
  position: z.string().min(1, 'Position is required'),
  department: z.string().min(1, 'Department is required'),
  startDate: z.string().min(1, 'Start date is required'),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'internship'], {
    required_error: 'Please select employment type'
  }),
  workLocation: z.enum(['office', 'remote', 'hybrid'], {
    required_error: 'Please select work location'
  }),
  reportingManager: z.string().min(1, 'Reporting manager is required'),
  
  // Education & Skills
  highestEducation: z.enum(['high_school', 'associate', 'bachelor', 'master', 'phd', 'other'], {
    required_error: 'Please select highest education level'
  }),
  university: z.string().min(1, 'University/Institution name is required'),
  graduationYear: z.string().min(4, 'Graduation year is required'),
  majorSubject: z.string().min(1, 'Major/Field of study is required'),
  skills: z.string().min(10, 'Please list your key skills'),
  certifications: z.string().optional(),
  languagesSpoken: z.string().min(1, 'Languages spoken is required'),
  
  // Work Experience
  previousExperience: z.string().min(20, 'Please provide details about your work experience'),
  
  // Personal Interests
  hobbies: z.string().min(5, 'Please share your hobbies and interests'),
  
  // Legal Agreements & Consents
  privacyPolicyAgreed: z.boolean().refine(val => val === true, {
    message: 'You must agree to the privacy policy'
  }),
  termsAndConditionsAgreed: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
  backgroundCheckConsent: z.boolean().refine(val => val === true, {
    message: 'Background check consent is required'
  }),
  dataProcessingConsent: z.boolean().refine(val => val === true, {
    message: 'Data processing consent is required'
  })
});

type PersonalProfileFormData = z.infer<typeof personalProfileSchema>;

interface PersonalProfileFormProps {
  onComplete?: () => void;
}

export default function PersonalProfileForm({ onComplete }: PersonalProfileFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);

  const form = useForm<PersonalProfileFormData>({
    resolver: zodResolver(personalProfileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      personalEmail: user?.email || '',
      phoneNumber: '',
      currentAddress: '',
      permanentAddress: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      dateOfBirth: '',
      nationality: '',
      alternatePhone: '',
      emergencyContactName: '',
      emergencyContactRelation: '',
      emergencyContactPhone: '',
      emergencyContactAddress: '',
      position: '',
      department: '',
      startDate: '',
      reportingManager: '',
      university: '',
      graduationYear: '',
      majorSubject: '',
      skills: '',
      certifications: '',
      languagesSpoken: '',
      previousExperience: '',
      hobbies: '',
      preferredName: '',
      privacyPolicyAgreed: false,
      termsAndConditionsAgreed: false,
      backgroundCheckConsent: false,
      dataProcessingConsent: false
    },
  });

  // Watch form values to calculate completion progress
  const watchedValues = form.watch();
  
  useEffect(() => {
    const totalFields = Object.keys(personalProfileSchema.shape).length;
    const filledFields = Object.values(watchedValues).filter(value => 
      value !== '' && value !== undefined && value !== false
    ).length;
    
    const progress = Math.round((filledFields / totalFields) * 100);
    setCompletionProgress(progress);
  }, [watchedValues]);

  // Fetch existing employee profile data using the current user's profile
  const { data: employeeProfile, isLoading, error } = useQuery({
    queryKey: ['/api/my-personal-profile'],
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Pre-fill form with existing data
  useEffect(() => {
    if (employeeProfile && typeof employeeProfile === 'object') {
      const profile = employeeProfile as any; // Type assertion to handle dynamic employee data
      form.reset({
        firstName: profile.firstName || user?.firstName || '',
        lastName: profile.lastName || user?.lastName || '',
        personalEmail: profile.personalEmail || user?.email || '',
        phoneNumber: profile.phoneNumber || '',
        currentAddress: profile.currentAddress || '',
        permanentAddress: profile.permanentAddress || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        country: profile.country || '',
        dateOfBirth: profile.dateOfBirth || '',
        gender: profile.gender || undefined,
        maritalStatus: profile.maritalStatus || undefined,
        nationality: profile.nationality || '',
        alternatePhone: profile.alternatePhone || '',
        emergencyContactName: profile.emergencyContactName || '',
        emergencyContactRelation: profile.emergencyContactRelation || '',
        emergencyContactPhone: profile.emergencyContactPhone || '',
        emergencyContactAddress: profile.emergencyContactAddress || '',
        position: profile.position || '',
        department: profile.department || '',
        startDate: profile.startDate || '',
        employmentType: profile.employmentType || undefined,
        workLocation: profile.workLocation || undefined,
        reportingManager: profile.reportingManager || '',
        highestEducation: profile.highestEducation || undefined,
        university: profile.university || '',
        graduationYear: profile.graduationYear || '',
        majorSubject: profile.majorSubject || '',
        skills: profile.skills || '',
        certifications: profile.certifications || '',
        languagesSpoken: profile.languagesSpoken || '',
        previousExperience: profile.previousExperience || '',
        hobbies: profile.hobbies || '',
        preferredName: profile.preferredName || '',
        privacyPolicyAgreed: profile.privacyPolicyAgreed || false,
        termsAndConditionsAgreed: profile.termsAndConditionsAgreed || false,
        backgroundCheckConsent: profile.backgroundCheckConsent || false,
        dataProcessingConsent: profile.dataProcessingConsent || false
      });
    }
  }, [employeeProfile, user, form]);

  // Submit personal profile
  const submitProfileMutation = useMutation({
    mutationFn: async (data: PersonalProfileFormData) => {
      return await apiRequest('PUT', '/api/my-personal-profile', {
        ...data,
        completedAt: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile Completed Successfully",
        description: "Your personal profile has been saved and marked as complete.",
      });
      
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/my-personal-profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding-checklists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to save personal profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: PersonalProfileFormData) => {
    setIsSubmitting(true);
    try {
      await submitProfileMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">Loading your profile...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center text-red-600 space-y-2">
            <p>Unable to load profile data.</p>
            <p className="text-sm text-gray-600">
              {error.message?.includes('Authentication required') 
                ? 'Please refresh the page and log in again.' 
                : 'Please try refreshing the page or contact support if the problem persists.'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Complete Personal Profile</CardTitle>
              <p className="text-gray-600">Please fill out all required information to complete your onboarding</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Progress</div>
            <div className="flex items-center space-x-2">
              <Progress value={completionProgress} className="w-24" />
              <Badge variant={completionProgress === 100 ? "default" : "secondary"}>
                {completionProgress}%
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                          <SelectItem value="separated">Separated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., American, Canadian, British" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Contact Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Contact Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="personalEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Email *</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+1 (555) 123-4567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="alternatePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternate Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Optional alternate contact number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Address Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Address Information</h3>
              </div>
              
              <FormField
                control={form.control}
                name="currentAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Address *</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Street address, apartment/unit number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="permanentAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permanent Address *</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Permanent/home address (if different from current)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP/Postal Code *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Emergency Contact Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold">Emergency Contact</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContactRelation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Spouse, Parent, Sibling" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Phone *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContactAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Address *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Employment Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Employment Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position/Job Title *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full_time">Full Time</SelectItem>
                          <SelectItem value="part_time">Part Time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Location *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="office">Office</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="reportingManager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporting Manager *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Name of your direct supervisor" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Education & Skills Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Education & Skills</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="highestEducation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Highest Education Level *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select education level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high_school">High School</SelectItem>
                          <SelectItem value="associate">Associate Degree</SelectItem>
                          <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                          <SelectItem value="master">Master's Degree</SelectItem>
                          <SelectItem value="phd">PhD/Doctorate</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="graduationYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Graduation Year *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 2020" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="university"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>University/Institution *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="majorSubject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Major/Field of Study *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Skills & Competencies *</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="List your technical skills, soft skills, and key competencies" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certifications</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Professional certifications, licenses, or credentials (optional)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="languagesSpoken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Languages Spoken *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., English (Native), Spanish (Fluent), French (Conversational)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Work Experience Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Work Experience</h3>
              </div>
              
              <FormField
                control={form.control}
                name="previousExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Work Experience *</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Describe your previous work experience, including job titles, companies, duration, and key achievements"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Personal Interests Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Personal Interests</h3>
              </div>
              
              <FormField
                control={form.control}
                name="hobbies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hobbies & Interests *</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Share your hobbies, interests, and activities you enjoy outside of work" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Legal Agreements Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Legal Agreements & Consents</h3>
              </div>
              
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <FormField
                  control={form.control}
                  name="privacyPolicyAgreed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I have read and agree to the Privacy Policy *
                        </FormLabel>
                        <p className="text-sm text-gray-600">
                          You acknowledge that you have read and understood our privacy policy regarding the collection and use of your personal information.
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="termsAndConditionsAgreed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I agree to the Terms and Conditions *
                        </FormLabel>
                        <p className="text-sm text-gray-600">
                          You agree to comply with all company terms, conditions, and employment policies.
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="backgroundCheckConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I consent to background check verification *
                        </FormLabel>
                        <p className="text-sm text-gray-600">
                          You authorize the company to conduct necessary background checks as required for employment.
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dataProcessingConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I consent to data processing for employment purposes *
                        </FormLabel>
                        <p className="text-sm text-gray-600">
                          You consent to the processing of your personal data for HR management, payroll, and employment-related purposes.
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Section */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center space-x-2">
                {completionProgress === 100 ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">Profile Complete</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <span className="text-amber-600 font-medium">
                      Please complete all required fields ({completionProgress}% done)
                    </span>
                  </>
                )}
              </div>
              
              <Button 
                type="submit" 
                disabled={isSubmitting || completionProgress < 100}
                className="px-8"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Complete Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}