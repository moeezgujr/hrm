import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobApplicationSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Upload, FileText, Award, User, Briefcase, Calendar, Phone, Mail, MapPin, GraduationCap, CheckCircle, Brain, Target, MessageCircle, Code, Users, X, ArrowRight, ArrowLeft, Clock, Building2, Mic, MicOff, Play, Pause, Square, Volume2 } from "lucide-react";
import { z } from "zod";
import { VoiceRecorder } from "@/components/VoiceRecorder";

type JobApplicationFormData = z.infer<typeof insertJobApplicationSchema>;

const STORAGE_KEY = 'jobApplicationDraft';

export default function ApplicantPortal() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [psychometricResults, setPsychometricResults] = useState<any[]>([]);
  const [activeTestModal, setActiveTestModal] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testResponses, setTestResponses] = useState<Record<number, string>>({});
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);
  const [isDataRestored, setIsDataRestored] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Position-specific test questions
  const getPositionSpecificQuestions = (position: string) => {
    const positionLower = position.toLowerCase();
    
    if (positionLower.includes('manager') || positionLower.includes('lead') || positionLower.includes('supervisor')) {
      return [
        { id: 1, text: "I enjoy mentoring and developing team members.", type: "likert" },
        { id: 2, text: "I can make difficult decisions under pressure.", type: "likert" },
        { id: 3, text: "I am comfortable delegating tasks to others.", type: "likert" },
        { id: 4, text: "I can handle conflicts between team members effectively.", type: "likert" },
        { id: 5, text: "I take responsibility for my team's performance.", type: "likert" },
        { id: 6, text: "I can motivate others to achieve challenging goals.", type: "likert" },
        { id: 7, text: "I am skilled at strategic planning and execution.", type: "likert" },
        { id: 8, text: "I can balance competing priorities effectively.", type: "likert" },
        { id: 9, text: "I provide regular feedback to my team members.", type: "likert" },
        { id: 10, text: "I can lead organizational change initiatives.", type: "likert" }
      ];
    } else if (positionLower.includes('sales') || positionLower.includes('account') || positionLower.includes('business development')) {
      return [
        { id: 1, text: "I enjoy building relationships with new clients.", type: "likert" },
        { id: 2, text: "I am persistent in pursuing sales opportunities.", type: "likert" },
        { id: 3, text: "I can handle rejection and maintain motivation.", type: "likert" },
        { id: 4, text: "I am skilled at identifying customer needs.", type: "likert" },
        { id: 5, text: "I can negotiate win-win solutions.", type: "likert" },
        { id: 6, text: "I follow up consistently with prospects.", type: "likert" },
        { id: 7, text: "I can present products/services convincingly.", type: "likert" },
        { id: 8, text: "I maintain detailed records of client interactions.", type: "likert" },
        { id: 9, text: "I can upsell and cross-sell effectively.", type: "likert" },
        { id: 10, text: "I are comfortable with sales targets and quotas.", type: "likert" }
      ];
    } else if (positionLower.includes('developer') || positionLower.includes('programmer') || positionLower.includes('engineer') || positionLower.includes('technical')) {
      return [
        { id: 1, text: "I enjoy solving complex technical problems.", type: "likert" },
        { id: 2, text: "I can break down complex problems into smaller tasks.", type: "likert" },
        { id: 3, text: "I write clean and maintainable code.", type: "likert" },
        { id: 4, text: "I am comfortable with version control systems.", type: "likert" },
        { id: 5, text: "I enjoy learning new programming languages.", type: "likert" },
        { id: 6, text: "I can debug issues efficiently.", type: "likert" },
        { id: 7, text: "I consider performance optimization important.", type: "likert" },
        { id: 8, text: "I can work effectively in agile development.", type: "likert" },
        { id: 9, text: "I enjoy code reviews and collaboration.", type: "likert" },
        { id: 10, text: "I stay current with technology trends.", type: "likert" }
      ];
    } else if (positionLower.includes('customer') || positionLower.includes('support') || positionLower.includes('service')) {
      return [
        { id: 1, text: "I remain calm when dealing with upset customers.", type: "likert" },
        { id: 2, text: "I am patient when explaining complex information.", type: "likert" },
        { id: 3, text: "I can de-escalate tense situations effectively.", type: "likert" },
        { id: 4, text: "I enjoy helping people solve their problems.", type: "likert" },
        { id: 5, text: "I can adapt my communication style to different people.", type: "likert" },
        { id: 6, text: "I follow up to ensure customer satisfaction.", type: "likert" },
        { id: 7, text: "I can handle multiple customer inquiries simultaneously.", type: "likert" },
        { id: 8, text: "I maintain detailed records of customer interactions.", type: "likert" },
        { id: 9, text: "I can identify opportunities to exceed expectations.", type: "likert" },
        { id: 10, text: "I stay positive even during challenging days.", type: "likert" }
      ];
    } else if (positionLower.includes('marketing') || positionLower.includes('creative') || positionLower.includes('design')) {
      return [
        { id: 1, text: "I have a strong creative imagination.", type: "likert" },
        { id: 2, text: "I can develop engaging marketing campaigns.", type: "likert" },
        { id: 3, text: "I understand digital marketing trends.", type: "likert" },
        { id: 4, text: "I can analyze campaign performance data.", type: "likert" },
        { id: 5, text: "I am skilled at visual design and aesthetics.", type: "likert" },
        { id: 6, text: "I can write compelling copy for different audiences.", type: "likert" },
        { id: 7, text: "I understand social media marketing strategies.", type: "likert" },
        { id: 8, text: "I can manage multiple projects simultaneously.", type: "likert" },
        { id: 9, text: "I stay current with industry design trends.", type: "likert" },
        { id: 10, text: "I can adapt content for different platforms.", type: "likert" }
      ];
    } else {
      // General position questions
      return [
        { id: 1, text: "I am reliable and meet deadlines consistently.", type: "likert" },
        { id: 2, text: "I can adapt to new processes and procedures.", type: "likert" },
        { id: 3, text: "I work well both independently and in teams.", type: "likert" },
        { id: 4, text: "I take initiative to improve work processes.", type: "likert" },
        { id: 5, text: "I can handle multiple tasks effectively.", type: "likert" },
        { id: 6, text: "I maintain high quality standards in my work.", type: "likert" },
        { id: 7, text: "I communicate updates and issues promptly.", type: "likert" },
        { id: 8, text: "I am committed to continuous learning.", type: "likert" },
        { id: 9, text: "I can work effectively under minimal supervision.", type: "likert" },
        { id: 10, text: "I contribute positively to team dynamics.", type: "likert" }
      ];
    }
  };

  const form = useForm<JobApplicationFormData>({
    resolver: zodResolver(insertJobApplicationSchema.omit({ 
      id: true, 
      createdAt: true, 
      updatedAt: true,
      status: true,
      reviewedBy: true,
      reviewedAt: true,
      reviewNotes: true,
      rejectionReason: true,
      interviewDate: true
    })),
    mode: 'onChange',
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      positionAppliedFor: "",
      department: "",
      expectedSalary: "",
      availableStartDate: "",
      education: "",
      experience: "",
      skills: "",
      references: "",
      coverLetter: "",
      whyJoinUs: "",
      voiceIntroduction: "",
      resumeFile: "",
      certificatesFile: "",
      psychometricCompleted: false,
      testResults: null,
    }
  });

  // Get current position from form for dynamic test questions
  const currentPosition = form.watch("positionAppliedFor") || "General";
  
  // Define the 6 psychometric tests with position-specific assessment
  const psychometricTests = useMemo(() => [
    {
      id: 1,
      name: "Personality Assessment",
      description: "16PF comprehensive personality evaluation",
      icon: Brain,
      color: "purple",
      questions: [
        { id: 1, text: "I enjoy meeting new people in social situations.", type: "likert" },
        { id: 2, text: "I prefer working alone rather than in teams.", type: "likert" },
        { id: 3, text: "I often worry about things that might go wrong.", type: "likert" },
        { id: 4, text: "I am comfortable taking leadership roles.", type: "likert" },
        { id: 5, text: "I find it easy to express my emotions.", type: "likert" },
        { id: 6, text: "I am energized by being around other people.", type: "likert" },
        { id: 7, text: "I tend to be optimistic about the future.", type: "likert" },
        { id: 8, text: "I like to have a plan before starting any task.", type: "likert" },
        { id: 9, text: "I am comfortable with uncertainty and change.", type: "likert" },
        { id: 10, text: "I often reflect deeply on my experiences.", type: "likert" },
        { id: 11, text: "I am assertive when expressing my opinions.", type: "likert" },
        { id: 12, text: "I prefer stability over adventure.", type: "likert" },
        { id: 13, text: "I am sensitive to other people's emotions.", type: "likert" },
        { id: 14, text: "I enjoy competitive environments.", type: "likert" },
        { id: 15, text: "I am cautious when making important decisions.", type: "likert" }
      ],
      timeEstimate: "3 minutes"
    },
    {
      id: 2, 
      name: "Cognitive Assessment",
      description: "Problem-solving and analytical thinking",
      icon: Target,
      color: "blue",
      questions: [
        { id: 1, text: "If it takes 3 machines 3 minutes to make 3 widgets, how long would it take 100 machines to make 100 widgets?", type: "multiple_choice", options: ["1 minute", "3 minutes", "33 minutes", "100 minutes"] },
        { id: 2, text: "What comes next in the sequence: 2, 6, 12, 20, ?", type: "multiple_choice", options: ["28", "30", "32", "36"] },
        { id: 3, text: "A man is 4 times as old as his son. In 20 years, he will be twice as old as his son. How old is the son now?", type: "multiple_choice", options: ["8 years", "10 years", "12 years", "15 years"] },
        { id: 4, text: "Which word does NOT belong: Apple, Banana, Carrot, Orange", type: "multiple_choice", options: ["Apple", "Banana", "Carrot", "Orange"] },
        { id: 5, text: "If all roses are flowers and some flowers are red, which statement is correct?", type: "multiple_choice", options: ["All roses are red", "Some roses are red", "No roses are red", "Cannot be determined"] },
        { id: 6, text: "What is 15% of 240?", type: "multiple_choice", options: ["24", "30", "36", "42"] },
        { id: 7, text: "In a group of 30 people, 18 like coffee, 15 like tea, and 8 like both. How many like neither?", type: "multiple_choice", options: ["3", "5", "7", "9"] },
        { id: 8, text: "If you rearrange the letters of 'LISTEN', you get:", type: "multiple_choice", options: ["SILENT", "ENLIST", "TINSEL", "All of these"] },
        { id: 9, text: "A train travels 60 km in 45 minutes. What is its speed in km/h?", type: "multiple_choice", options: ["75", "80", "85", "90"] },
        { id: 10, text: "Which number should come next: 1, 4, 9, 16, 25, ?", type: "multiple_choice", options: ["30", "36", "42", "49"] }
      ],
      timeEstimate: "3 minutes"
    },
    {
      id: 3,
      name: "Communication Assessment", 
      description: "Verbal and written communication skills",
      icon: MessageCircle,
      color: "green",
      questions: [
        { id: 1, text: "I can clearly explain complex ideas to others.", type: "likert" },
        { id: 2, text: "I am comfortable presenting to large groups.", type: "likert" },
        { id: 3, text: "I listen actively when others are speaking.", type: "likert" },
        { id: 4, text: "I can adapt my communication style to my audience.", type: "likert" },
        { id: 5, text: "I provide constructive feedback effectively.", type: "likert" },
        { id: 6, text: "I can write clear and concise emails.", type: "likert" },
        { id: 7, text: "I ask clarifying questions when needed.", type: "likert" },
        { id: 8, text: "I can summarize information effectively.", type: "likert" },
        { id: 9, text: "I am comfortable with difficult conversations.", type: "likert" },
        { id: 10, text: "I can influence others through communication.", type: "likert" },
        { id: 11, text: "I use appropriate non-verbal communication.", type: "likert" },
        { id: 12, text: "I can communicate across cultural differences.", type: "likert" }
      ],
      timeEstimate: "3 minutes"
    },
    {
      id: 4,
      name: "Technical Assessment",
      description: "Role-specific technical competencies",
      icon: Code,
      color: "orange",
      questions: [
        { id: 1, text: "I stay current with industry best practices.", type: "likert" },
        { id: 2, text: "I can learn new technical skills quickly.", type: "likert" },
        { id: 3, text: "I enjoy working with data and analytics.", type: "likert" },
        { id: 4, text: "I am comfortable using various software tools.", type: "likert" },
        { id: 5, text: "I can troubleshoot technical problems systematically.", type: "likert" },
        { id: 6, text: "I understand the importance of security practices.", type: "likert" },
        { id: 7, text: "I can work effectively with technical documentation.", type: "likert" },
        { id: 8, text: "I enjoy automating repetitive tasks.", type: "likert" },
        { id: 9, text: "I can integrate different systems and platforms.", type: "likert" },
        { id: 10, text: "I value quality assurance and testing.", type: "likert" },
        { id: 11, text: "I can explain technical concepts to non-technical people.", type: "likert" },
        { id: 12, text: "I participate actively in technical communities.", type: "likert" }
      ],
      timeEstimate: "3 minutes"
    },
    {
      id: 5,
      name: "Cultural Fit Assessment",
      description: "Alignment with company values and culture",
      icon: Users,
      color: "indigo",
      questions: [
        { id: 1, text: "I thrive in collaborative team environments.", type: "likert" },
        { id: 2, text: "I am committed to continuous learning and growth.", type: "likert" },
        { id: 3, text: "I take ownership of my mistakes and learn from them.", type: "likert" },
        { id: 4, text: "I believe in maintaining work-life balance.", type: "likert" },
        { id: 5, text: "I am passionate about delivering quality work.", type: "likert" },
        { id: 6, text: "I enjoy helping colleagues succeed.", type: "likert" },
        { id: 7, text: "I am comfortable with fast-paced environments.", type: "likert" },
        { id: 8, text: "I believe in transparent and open communication.", type: "likert" },
        { id: 9, text: "I am willing to go above and beyond when needed.", type: "likert" },
        { id: 10, text: "I value diversity and inclusion in the workplace.", type: "likert" },
        { id: 11, text: "I can handle constructive criticism positively.", type: "likert" },
        { id: 12, text: "I believe in continuous process improvement.", type: "likert" }
      ],
      timeEstimate: "3 minutes"
    },
    {
      id: 6,
      name: "Position-Specific Assessment",
      description: `Tailored evaluation for ${currentPosition} role`,
      icon: Award,
      color: "teal",
      questions: getPositionSpecificQuestions(currentPosition),
      timeEstimate: "3 minutes"
    }
  ], [currentPosition]);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    if (isDataRestored) return; // Already restored, skip
    
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        
        // Restore form data
        if (parsed.formData) {
          Object.keys(parsed.formData).forEach((key) => {
            form.setValue(key as any, parsed.formData[key]);
          });
        }
        
        // Restore psychometric results
        if (parsed.psychometricResults) {
          setPsychometricResults(parsed.psychometricResults);
        }
        
        // Restore current step
        if (parsed.currentStep) {
          setCurrentStep(parsed.currentStep);
        }
        
        // Restore last saved timestamp if available
        if (parsed.savedAt) {
          setLastSaved(new Date(parsed.savedAt));
        }
        
        toast({
          title: "Draft Restored",
          description: "Your previous application draft has been restored. You can continue from where you left off.",
        });
      }
      
      // Mark as restored whether or not data existed
      // This allows auto-save to work for new applicants
      setIsDataRestored(true);
    } catch (error) {
      console.error('Error loading saved data:', error);
      // Still set as restored even if there was an error
      setIsDataRestored(true);
    }
  }, [form, toast, isDataRestored]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (!isDataRestored || isSubmitted) return;
    
    const subscription = form.watch((values) => {
      try {
        const now = new Date();
        const dataToSave = {
          formData: values,
          psychometricResults,
          currentStep,
          savedAt: now.toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        setLastSaved(now);
      } catch (error) {
        console.error('Error saving draft:', error);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, psychometricResults, currentStep, isDataRestored, isSubmitted]);

  // Also save when psychometric results or step changes
  useEffect(() => {
    if (!isDataRestored || isSubmitted) return;
    
    try {
      const now = new Date();
      const formData = form.getValues();
      const dataToSave = {
        formData,
        psychometricResults,
        currentStep,
        savedAt: now.toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setLastSaved(now);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [form, psychometricResults, currentStep, isDataRestored, isSubmitted]);

  const submitApplication = useMutation({
    mutationFn: async (data: JobApplicationFormData) => {
      const response = await apiRequest("POST", "/api/applications", data);
      return response.json();
    },
    onSuccess: () => {
      // Clear saved draft from localStorage
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Error clearing saved draft:', error);
      }
      
      toast({
        title: "Application Submitted!",
        description: "Your job application has been submitted successfully. You'll hear from us soon!",
      });
      setIsSubmitted(true);
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleTestCompletion = (testId: number, results: any) => {
    setPsychometricResults(prev => {
      const updated = [...prev];
      updated[testId - 1] = { testId, results, completed: true };
      return updated;
    });

    // Update form data
    const currentResults = form.getValues("testResults") || [];
    const updatedResults = Array.isArray(currentResults) ? [...currentResults] : [];
    updatedResults[testId - 1] = { testId, results, completed: true };
    
    form.setValue("testResults", updatedResults);
    form.setValue("psychometricCompleted", updatedResults.length === psychometricTests.length && updatedResults.every(r => r?.completed));
  };

  const openTestModal = (testIndex: number) => {
    setActiveTestModal(testIndex);
    setCurrentQuestionIndex(0);
    setTestResponses({});
    setTestStartTime(new Date());
  };

  const closeTestModal = () => {
    setActiveTestModal(null);
    setCurrentQuestionIndex(0);
    setTestResponses({});
    setTestStartTime(null);
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setTestResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (activeTestModal !== null) {
      const currentTest = psychometricTests[activeTestModal];
      if (currentQuestionIndex < currentTest.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const completeTest = () => {
    if (activeTestModal !== null) {
      const currentTest = psychometricTests[activeTestModal];
      const testResults = {
        testId: currentTest.id,
        responses: testResponses,
        startTime: testStartTime,
        endTime: new Date(),
        timeSpent: testStartTime ? Math.round((new Date().getTime() - testStartTime.getTime()) / 1000) : 0
      };

      handleTestCompletion(currentTest.id, testResults);
      closeTestModal();

      toast({
        title: "Test Completed!",
        description: `${currentTest.name} has been completed successfully.`,
      });
    }
  };

  const handleFileConversion = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (data: JobApplicationFormData) => {
    // First validate all form fields
    const formErrors = form.formState.errors;
    if (Object.keys(formErrors).length > 0) {
      const missingFields = Object.keys(formErrors).join(", ");
      toast({
        title: "Please Complete Required Fields",
        description: `The following fields are required: ${missingFields}`,
        variant: "destructive",
      });
      return;
    }

    // Check if all psychometric tests are completed  
    const allTestsCompleted = psychometricResults.filter(r => r?.completed).length === psychometricTests.length;
    
    if (!allTestsCompleted) {
      toast({
        title: "Complete Psychometric Tests",
        description: `Please complete all ${psychometricTests.length} psychometric assessments before submitting your application. You have completed ${psychometricResults.filter(r => r?.completed).length} out of ${psychometricTests.length} tests.`,
        variant: "destructive",
      });
      return;
    }

    // Check if required documents are uploaded (files are already converted to base64 strings)
    const hasResumeFile = data.resumeFile && typeof data.resumeFile === 'string' && data.resumeFile.trim() !== '';
    const hasCertificatesFile = data.certificatesFile && typeof data.certificatesFile === 'string' && data.certificatesFile.trim() !== '';
    const hasVoiceIntroduction = data.voiceIntroduction && typeof data.voiceIntroduction === 'string' && data.voiceIntroduction.trim() !== '';

    if (!hasResumeFile) {
      toast({
        title: "Resume/CV Required",
        description: "Please upload your Resume/CV before submitting your application.",
        variant: "destructive",
      });
      return;
    }

    if (!hasCertificatesFile) {
      toast({
        title: "Certificates Required", 
        description: "Please upload your certificates before submitting your application.",
        variant: "destructive",
      });
      return;
    }

    if (!hasVoiceIntroduction) {
      toast({
        title: "Voice Introduction Required",
        description: "Please record your voice introduction before submitting your application.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Files are already converted to base64 strings via onChange handlers
      // No need to convert them again
      
      // Set psychometric completion status
      data.psychometricCompleted = true;
      data.testResults = psychometricResults;
      
      submitApplication.mutate(data);
    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "File Processing Error",
        description: "There was an error processing your uploaded files. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Application Submitted Successfully!</CardTitle>
            <CardDescription>
              Thank you for applying to our company. We've received your application and will review it shortly.
              You'll receive a confirmation email with next steps.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Application Portal</h1>
          <p className="text-lg text-gray-600">Complete your application and comprehensive assessment</p>
        </div>

        <div className="grid gap-6">
          {/* Application Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                {lastSaved && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>Auto-saved {new Date(lastSaved).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
              <CardDescription>Please provide your personal and professional details</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="mt-1" />
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
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="mt-1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      {...form.register("email")} 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      {...form.register("phone")} 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionAppliedFor">Position Applied For</Label>
                    <Input 
                      id="positionAppliedFor" 
                      {...form.register("positionAppliedFor")} 
                      className="mt-1"
                      placeholder="e.g., Software Developer, Marketing Manager"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input 
                      id="department" 
                      {...form.register("department")} 
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea 
                    id="address" 
                    {...form.register("address")} 
                    className="mt-1" 
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input 
                      id="dateOfBirth" 
                      type="date" 
                      {...form.register("dateOfBirth")} 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedSalary">Expected Salary</Label>
                    <Input 
                      id="expectedSalary" 
                      {...form.register("expectedSalary")} 
                      className="mt-1"
                      placeholder="e.g., $50,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="availableStartDate">Available Start Date</Label>
                    <Input 
                      id="availableStartDate" 
                      type="date" 
                      {...form.register("availableStartDate")} 
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="education">Education</Label>
                  <Textarea 
                    id="education" 
                    {...form.register("education")} 
                    className="mt-1" 
                    rows={3}
                    placeholder="Describe your educational background..."
                  />
                </div>

                <div>
                  <Label htmlFor="experience">Experience</Label>
                  <Textarea 
                    id="experience" 
                    {...form.register("experience")} 
                    className="mt-1" 
                    rows={4}
                    placeholder="Describe your relevant work experience..."
                  />
                </div>

                <div>
                  <Label htmlFor="skills">Skills</Label>
                  <Textarea 
                    id="skills" 
                    {...form.register("skills")} 
                    className="mt-1" 
                    rows={3}
                    placeholder="List your technical and soft skills..."
                  />
                </div>

                <div>
                  <Label htmlFor="references">References</Label>
                  <Textarea 
                    id="references" 
                    {...form.register("references")} 
                    className="mt-1" 
                    rows={3}
                    placeholder="Provide contact information for references..."
                  />
                </div>

                <FormField
                  control={form.control}
                  name="coverLetter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Letter</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="mt-1" 
                          rows={5}
                          placeholder="Tell us why you're interested in this position..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whyJoinUs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Why do you want to join us?</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="mt-1" 
                          rows={4}
                          placeholder="Explain what motivates you to work with our company..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Voice Introduction Section */}
                <div>
                  <VoiceRecorder
                    onRecordingComplete={(audioData) => {
                      form.setValue("voiceIntroduction", audioData);
                    }}
                    existingRecording={form.watch("voiceIntroduction") || undefined}
                  />
                </div>

                {/* File Upload Section */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="resumeFile">Resume/CV</Label>
                    <Input 
                      id="resumeFile" 
                      type="file" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            form.setValue("resumeFile", base64);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="certificatesFile">Certificates (Optional)</Label>
                    <Input 
                      id="certificatesFile" 
                      type="file" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            form.setValue("certificatesFile", base64);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Psychometric Tests Completion Status */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-blue-900">Assessment Progress</h3>
                        <p className="text-sm text-blue-700">
                          {psychometricResults.filter(r => r?.completed).length} of {psychometricTests.length} tests completed
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round((psychometricResults.filter(r => r?.completed).length / psychometricTests.length) * 100)}%
                      </div>
                    </div>
                    {psychometricResults.filter(r => r?.completed).length < psychometricTests.length && (
                      <p className="text-sm text-blue-600 mt-2">
                        Complete all assessments above to enable application submission.
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={submitApplication.isPending}
                  >
                    {submitApplication.isPending 
                      ? "Submitting..." 
                      : "Submit Application"
                    }
                  </Button>
                  
                  {/* Validation Summary */}
                  {Object.keys(form.formState.errors).length > 0 && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Please complete the following required fields:</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {Object.entries(form.formState.errors).map(([field, error]) => (
                          <li key={field} className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').toLowerCase()}: {error?.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </form>
              </Form>
            </CardContent>
          </Card>

          {/* Psychometric Tests Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Psychometric Assessment Suite
              </CardTitle>
              <CardDescription>
                Complete all 6 comprehensive assessments to provide a complete evaluation (Total time: ~18 minutes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {psychometricTests.map((test, index) => {
                  const isCompleted = psychometricResults[index]?.completed || false;
                  const Icon = test.icon;
                  
                  return (
                    <Card 
                      key={test.id} 
                      className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                        isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => !isCompleted && openTestModal(index)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <Icon className={`w-8 h-8 ${isCompleted ? 'text-green-600' : `text-${test.color}-600`}`} />
                          {isCompleted && <CheckCircle className="w-6 h-6 text-green-600" />}
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-2">{test.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{test.description}</p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-4 h-4" />
                            {test.timeEstimate}
                          </div>
                          <div className="text-xs">
                            {test.questions.length} Questions
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full mt-3" 
                          variant={isCompleted ? "secondary" : "default"}
                          size="sm"
                          disabled={isCompleted}
                        >
                          {isCompleted ? "Completed" : "Start Test"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Modal */}
        <Dialog open={activeTestModal !== null} onOpenChange={closeTestModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto pb-16">
            {activeTestModal !== null && (() => {
              const currentTest = psychometricTests[activeTestModal];
              const currentQuestion = currentTest.questions[currentQuestionIndex];
              const totalQuestions = currentTest.questions.length;
              const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      <currentTest.icon className={`w-6 h-6 text-${currentTest.color}-600`} />
                      {currentTest.name}
                    </DialogTitle>
                    <DialogDescription>
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </DialogDescription>
                  </DialogHeader>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress value={progress} className="w-full" />
                    <div className="text-sm text-gray-500 text-center">
                      {Math.round(progress)}% Complete
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">
                        {currentQuestion.text}
                      </h3>

                      {/* Answer Options */}
                      {currentQuestion.type === "likert" && (
                        <RadioGroup
                          value={testResponses[currentQuestion.id] || ''}
                          onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                          className="space-y-2"
                        >
                          {["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"].map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <RadioGroupItem value={(idx + 1).toString()} id={`q${currentQuestion.id}-${idx}`} />
                              <Label htmlFor={`q${currentQuestion.id}-${idx}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {currentQuestion.type === "multiple_choice" && "options" in currentQuestion && currentQuestion.options && (
                        <RadioGroup
                          value={testResponses[currentQuestion.id] || ''}
                          onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                          className="space-y-2"
                        >
                          {currentQuestion.options.map((option: string, idx: number) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`q${currentQuestion.id}-${idx}`} />
                              <Label htmlFor={`q${currentQuestion.id}-${idx}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={prevQuestion}
                        disabled={currentQuestionIndex === 0}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>

                      <div className="flex space-x-2">
                        {currentQuestionIndex < currentTest.questions.length - 1 ? (
                          <Button onClick={nextQuestion}>
                            Next
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        ) : (
                          <Button 
                            onClick={completeTest}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Complete Test
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}