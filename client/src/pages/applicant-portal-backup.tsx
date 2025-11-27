import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobApplicationSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Upload, FileText, Award, User, Briefcase, Calendar, Phone, Mail, MapPin, GraduationCap, CheckCircle, Brain, Target, MessageCircle, Code, Users, X, ArrowRight, ArrowLeft, Clock, Building2 } from "lucide-react";
import { z } from "zod";

type JobApplicationFormData = z.infer<typeof insertJobApplicationSchema>;

export default function ApplicantPortal() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [psychometricResults, setPsychometricResults] = useState<any[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [activeTestModal, setActiveTestModal] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testResponses, setTestResponses] = useState<Record<number, string>>({});
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);

  // Listen for test completion messages from popup windows
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TEST_COMPLETED') {
        const testId = event.data.testId;
        const results = event.data.results;
        
        // Mark test as completed
        handleTestCompletion(testId, results);
        
        toast({
          title: "Test Completed!",
          description: `${psychometricTests[testId - 1].name} has been completed successfully.`,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [psychometricResults]);

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
        { id: 10, text: "I am comfortable with sales targets and quotas.", type: "likert" }
      ];
    } else if (positionLower.includes('developer') || positionLower.includes('programmer') || positionLower.includes('engineer') || positionLower.includes('technical')) {
      return [
        { id: 1, text: "I enjoy solving complex technical problems.", type: "likert" },
        { id: 2, text: "I write clean, maintainable code.", type: "likert" },
        { id: 3, text: "I stay updated with latest programming trends.", type: "likert" },
        { id: 4, text: "I can debug issues systematically.", type: "likert" },
        { id: 5, text: "I follow software development best practices.", type: "likert" },
        { id: 6, text: "I can work with version control systems.", type: "likert" },
        { id: 7, text: "I document my code thoroughly.", type: "likert" },
        { id: 8, text: "I can work in agile development environments.", type: "likert" },
        { id: 9, text: "I enjoy learning new programming languages.", type: "likert" },
        { id: 10, text: "I can optimize code for performance.", type: "likert" }
      ];
    } else if (positionLower.includes('customer') || positionLower.includes('support') || positionLower.includes('service')) {
      return [
        { id: 1, text: "I remain calm when dealing with upset customers.", type: "likert" },
        { id: 2, text: "I enjoy helping people solve their problems.", type: "likert" },
        { id: 3, text: "I can explain technical issues in simple terms.", type: "likert" },
        { id: 4, text: "I am patient with customers who need extra help.", type: "likert" },
        { id: 5, text: "I can multitask effectively during busy periods.", type: "likert" },
        { id: 6, text: "I follow up to ensure customer satisfaction.", type: "likert" },
        { id: 7, text: "I can de-escalate tense situations.", type: "likert" },
        { id: 8, text: "I maintain detailed customer interaction records.", type: "likert" },
        { id: 9, text: "I can identify opportunities to improve service.", type: "likert" },
        { id: 10, text: "I work well under pressure during peak times.", type: "likert" }
      ];
    } else if (positionLower.includes('marketing') || positionLower.includes('content') || positionLower.includes('creative')) {
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
    resolver: zodResolver(insertJobApplicationSchema),
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
      resumeFile: "",
      certificatesFile: "",
      psychometricCompleted: false,
      testResults: null,
    }
  });

  // Get current position from form for dynamic test questions
  const currentPosition = form.watch("positionAppliedFor") || "General";
  
  // Define the 6 psychometric tests with sample questions (now includes position-specific)
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
      timeEstimate: "15-20 minutes"
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
        { id: 5, text: "If you rearrange the letters 'CIFAIPC', you would have the name of a:", type: "multiple_choice", options: ["Country", "Ocean", "State", "City"] },
        { id: 6, text: "A clock shows 3:15. What is the angle between the hour and minute hands?", type: "multiple_choice", options: ["0°", "7.5°", "15°", "22.5°"] },
        { id: 7, text: "Complete the pattern: 1, 1, 2, 3, 5, 8, ?", type: "multiple_choice", options: ["11", "13", "15", "16"] },
        { id: 8, text: "If all Bloops are Razzles and all Razzles are Lazzles, then all Bloops are:", type: "multiple_choice", options: ["Definitely Lazzles", "Definitely not Lazzles", "Possibly Lazzles", "Cannot be determined"] },
        { id: 9, text: "What is the missing number: 4, 9, 16, 25, ?, 49", type: "multiple_choice", options: ["30", "33", "36", "42"] },
        { id: 10, text: "A store sells books for $12 each. If you buy 3 books, you get 1 free. What's the effective price per book when buying 4?", type: "multiple_choice", options: ["$8", "$9", "$10", "$12"] }
      ],
      timeEstimate: "15 minutes"
    },
    {
      id: 3,
      name: "Communication Assessment", 
      description: "Verbal and written communication skills",
      icon: MessageCircle,
      color: "green",
      questions: [
        { id: 1, text: "When presenting to a group, I feel confident and articulate.", type: "likert" },
        { id: 2, text: "I can easily explain complex ideas in simple terms.", type: "likert" },
        { id: 3, text: "I listen actively when others are speaking.", type: "likert" },
        { id: 4, text: "I adapt my communication style based on my audience.", type: "likert" },
        { id: 5, text: "I am comfortable giving constructive feedback to colleagues.", type: "likert" },
        { id: 6, text: "I can handle difficult conversations professionally.", type: "likert" },
        { id: 7, text: "I express my ideas clearly in writing.", type: "likert" },
        { id: 8, text: "I ask clarifying questions when I don't understand something.", type: "likert" },
        { id: 9, text: "I am skilled at reading non-verbal communication cues.", type: "likert" },
        { id: 10, text: "I can mediate conflicts between team members effectively.", type: "likert" },
        { id: 11, text: "I am comfortable speaking up in meetings.", type: "likert" },
        { id: 12, text: "I can deliver bad news in a sensitive manner.", type: "likert" }
      ],
      timeEstimate: "12 minutes"
    },
    {
      id: 4,
      name: "Technical Assessment",
      description: "Job-specific technical competencies",
      icon: Code,
      color: "orange",
      questions: [
        { id: 1, text: "I stay updated with the latest industry trends and technologies.", type: "likert" },
        { id: 2, text: "I can troubleshoot technical problems systematically.", type: "likert" },
        { id: 3, text: "I enjoy learning new software and tools.", type: "likert" },
        { id: 4, text: "I can work with data analysis and reporting tools.", type: "likert" },
        { id: 5, text: "I am proficient with Microsoft Office Suite (Word, Excel, PowerPoint).", type: "likert" },
        { id: 6, text: "I can learn new software applications quickly.", type: "likert" },
        { id: 7, text: "I understand basic database concepts and queries.", type: "likert" },
        { id: 8, text: "I am comfortable with cloud-based collaboration tools.", type: "likert" },
        { id: 9, text: "I can create and maintain accurate documentation.", type: "likert" },
        { id: 10, text: "I follow IT security best practices consistently.", type: "likert" },
        { id: 11, text: "I can work with project management software.", type: "likert" },
        { id: 12, text: "I am comfortable with video conferencing and remote work tools.", type: "likert" }
      ],
      timeEstimate: "18 minutes"
    },
    {
      id: 5,
      name: "Cultural Fit Assessment",
      description: "Values alignment and team dynamics",
      icon: Users,
      color: "indigo",
      questions: [
        { id: 1, text: "I value collaboration over individual achievement.", type: "likert" },
        { id: 2, text: "I embrace change and adapt quickly to new situations.", type: "likert" },
        { id: 3, text: "I believe in continuous learning and improvement.", type: "likert" },
        { id: 4, text: "I take initiative without being asked.", type: "likert" },
        { id: 5, text: "I am committed to maintaining high ethical standards.", type: "likert" },
        { id: 6, text: "I believe in work-life balance for long-term success.", type: "likert" },
        { id: 7, text: "I am comfortable working in diverse, multicultural teams.", type: "likert" },
        { id: 8, text: "I value transparency and open communication.", type: "likert" },
        { id: 9, text: "I am willing to take calculated risks for innovation.", type: "likert" },
        { id: 10, text: "I believe in supporting colleagues' professional development.", type: "likert" },
        { id: 11, text: "I can maintain a positive attitude during challenging times.", type: "likert" },
        { id: 12, text: "I align my personal values with the organization's mission.", type: "likert" }
      ],
      timeEstimate: "10 minutes"
    },
    {
      id: 6,
      name: "Position-Specific Assessment",
      description: "Role-specific competencies and skills evaluation",
      icon: Briefcase,
      color: "teal",
      questions: getPositionSpecificQuestions(currentPosition),
      timeEstimate: "8 minutes"
    }
  ], [currentPosition]);

  const submitApplication = useMutation({
    mutationFn: async (data: JobApplicationFormData) => {
      const response = await apiRequest("POST", "/api/applications", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Application Submitted Successfully",
        description: "Thank you for your application. We will review it and get back to you soon.",
      });
      setIsSubmitted(true);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: JobApplicationFormData) => {
    submitApplication.mutate(data);
  };

  const handleFileUpload = (file: File, fieldName: 'resumeFile' | 'certificatesFile') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      form.setValue(fieldName, base64);
    };
    reader.readAsDataURL(file);
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleTestCompletion = (testId: number, results: any) => {
    const newResults = [...psychometricResults];
    newResults[testId - 1] = results;
    setPsychometricResults(newResults);
    
    // Move to next test or complete assessment
    if (testId < 6) {
      setCurrentTestIndex(testId);
    } else {
      // All tests completed, update form data
      form.setValue('psychometricCompleted', true);
      form.setValue('testResults', newResults);
      toast({
        title: "Psychometric Assessment Completed!",
        description: "All 6 tests have been completed successfully. You can now submit your application.",
      });
    }
  };

  const startTest = (testIndex: number) => {
    setActiveTestModal(testIndex + 1);
    setCurrentQuestionIndex(0);
    setTestResponses({});
    setTestStartTime(new Date());
    setCurrentTestIndex(testIndex);
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setTestResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    const currentTest = psychometricTests.find(t => t.id === activeTestModal);
    if (currentTest && currentQuestionIndex < currentTest.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const completeTest = () => {
    if (!activeTestModal || !testStartTime) return;
    
    const currentTest = psychometricTests.find(t => t.id === activeTestModal);
    if (!currentTest) return;

    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - testStartTime.getTime()) / 1000);
    
    // Calculate score (simple scoring for demo)
    const totalQuestions = currentTest.questions.length;
    const answeredQuestions = Object.keys(testResponses).length;
    const score = Math.floor((answeredQuestions / totalQuestions) * 100);

    const results = {
      testId: activeTestModal,
      testName: currentTest.name,
      score: score,
      completedAt: endTime.toISOString(),
      timeSpent: timeSpent,
      responses: testResponses,
      totalQuestions: totalQuestions,
      answeredQuestions: answeredQuestions
    };

    handleTestCompletion(activeTestModal, results);
    setActiveTestModal(null);
    setCurrentQuestionIndex(0);
    setTestResponses({});
    setTestStartTime(null);

    toast({
      title: "Test Completed!",
      description: `${currentTest.name} completed with ${score}% completion rate.`,
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-green-600 dark:text-green-400">Application Submitted!</CardTitle>
            <CardDescription>
              Thank you for applying to Meeting Matters. We have received your application and will review it within 3-5 business days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You will receive an email confirmation shortly with next steps in the process.
            </p>
            <Button onClick={() => window.location.href = "/"} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stepTitles = [
    "Personal Information",
    "Position & Experience", 
    "Documents & Skills",
    "Final Details",
    "Psychometric Assessment"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Join Our Team
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Complete your job application to start your journey with Meeting Matters
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {stepTitles.map((title, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                  ${currentStep > index + 1 ? 'bg-green-500 text-white' : 
                    currentStep === index + 1 ? 'bg-blue-500 text-white' : 
                    'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'}`}>
                  {index + 1}
                </div>
                {index < stepTitles.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {currentStep === 1 && <User className="w-5 h-5" />}
              {currentStep === 2 && <Briefcase className="w-5 h-5" />}
              {currentStep === 3 && <FileText className="w-5 h-5" />}
              {currentStep === 4 && <Award className="w-5 h-5" />}
              {currentStep === 5 && <Brain className="w-5 h-5" />}
              <span>Step {currentStep}: {stepTitles[currentStep - 1]}</span>
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Please provide your basic personal information"}
              {currentStep === 2 && "Tell us about the position you're applying for and your experience"}
              {currentStep === 3 && "Upload your documents and list your skills"}
              {currentStep === 4 && "Complete your application with additional details"}
              {currentStep === 5 && "Complete all 5 psychometric assessments to strengthen your application"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>First Name *</span>
                    </Label>
                    <Input
                      {...form.register("firstName")}
                      placeholder="Enter your first name"
                      className="mt-1"
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Last Name *</span>
                    </Label>
                    <Input
                      {...form.register("lastName")}
                      placeholder="Enter your last name"
                      className="mt-1"
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.lastName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Address *</span>
                    </Label>
                    <Input
                      {...form.register("email")}
                      type="email"
                      placeholder="your.email@example.com"
                      className="mt-1"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>Phone Number *</span>
                    </Label>
                    <Input
                      {...form.register("phone")}
                      placeholder="+92 300 1234567"
                      className="mt-1"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.phone.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address" className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>Address *</span>
                    </Label>
                    <Textarea
                      {...form.register("address")}
                      placeholder="Enter your complete address"
                      className="mt-1"
                      rows={3}
                    />
                    {form.formState.errors.address && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.address.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth" className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Date of Birth *</span>
                    </Label>
                    <Input
                      {...form.register("dateOfBirth")}
                      type="date"
                      className="mt-1"
                    />
                    {form.formState.errors.dateOfBirth && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.dateOfBirth.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Position & Experience */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="positionAppliedFor" className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4" />
                        <span>Position Applied For *</span>
                      </Label>
                      <Input
                        {...form.register("positionAppliedFor")}
                        placeholder="e.g., Software Developer, Marketing Manager"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="department">Department *</Label>
                      <Input
                        {...form.register("department")}
                        placeholder="e.g., IT, Marketing, HR"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="expectedSalary">Expected Salary (PKR)</Label>
                      <Input
                        {...form.register("expectedSalary")}
                        placeholder="e.g., 100,000"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="availableStartDate" className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Available Start Date *</span>
                      </Label>
                      <Input
                        {...form.register("availableStartDate")}
                        type="date"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="education" className="flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>Education Background *</span>
                    </Label>
                    <Textarea
                      {...form.register("education")}
                      placeholder="Describe your educational qualifications, degrees, certifications..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="experience">Work Experience *</Label>
                    <Textarea
                      {...form.register("experience")}
                      placeholder="Describe your relevant work experience, previous roles, achievements..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Documents & Skills */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="skills">Skills & Expertise *</Label>
                    <Textarea
                      {...form.register("skills")}
                      placeholder="List your technical skills, soft skills, and areas of expertise..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="references">Professional References</Label>
                    <Textarea
                      {...form.register("references")}
                      placeholder="Provide contact information for 2-3 professional references (optional)"
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>Resume/CV</span>
                        {form.watch('resumeFile') && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-200">
                            ✓ Uploaded
                          </span>
                        )}
                      </Label>
                      <div className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        form.watch('resumeFile') 
                          ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'resumeFile');
                          }}
                          className="hidden"
                          id="resume-upload"
                        />
                        <label htmlFor="resume-upload" className="cursor-pointer">
                          {form.watch('resumeFile') ? (
                            <>
                              <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                Resume uploaded successfully!
                              </p>
                              <p className="text-xs text-green-500 mt-1">Click to replace file</p>
                            </>
                          ) : (
                            <>
                              <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Click to upload your resume
                              </p>
                              <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    <div>
                      <Label className="flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>Certificates (Optional)</span>
                        {form.watch('certificatesFile') && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
                            ✓ Uploaded
                          </span>
                        )}
                      </Label>
                      <div className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        form.watch('certificatesFile') 
                          ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'certificatesFile');
                          }}
                          className="hidden"
                          id="certificates-upload"
                        />
                        <label htmlFor="certificates-upload" className="cursor-pointer">
                          {form.watch('certificatesFile') ? (
                            <>
                              <CheckCircle className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                Certificates uploaded successfully!
                              </p>
                              <p className="text-xs text-blue-500 mt-1">Click to replace file</p>
                            </>
                          ) : (
                            <>
                              <Award className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Click to upload certificates
                              </p>
                              <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG up to 10MB</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Final Details */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="coverLetter">Cover Letter *</Label>
                    <Textarea
                      {...form.register("coverLetter")}
                      placeholder="Write a brief cover letter explaining your interest in this position..."
                      className="mt-1"
                      rows={6}
                    />
                  </div>

                  <div>
                    <Label htmlFor="whyJoinUs">Why do you want to join Meeting Matters? *</Label>
                    <Textarea
                      {...form.register("whyJoinUs")}
                      placeholder="Tell us what attracts you to our company and this role..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Next Steps</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Continue to complete the comprehensive psychometric assessment to strengthen your application.
                      These assessments help us understand your potential and find the best fit for your skills.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 5: Psychometric Assessment */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Psychometric Assessment
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Complete all 6 assessments to strengthen your application. Total time: ~78 minutes.
                    </p>
                    <div className="mt-4">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(psychometricResults.filter(r => r).length / 6) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {psychometricResults.filter(r => r).length} of 6 tests completed
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {psychometricTests.map((test, index) => {
                      const Icon = test.icon;
                      const isCompleted = psychometricResults[index];
                      const isActive = currentTestIndex === index && !isCompleted;
                      
                      return (
                        <Card key={test.id} className={`transition-all border-2 ${
                          isCompleted 
                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                            : isActive
                            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  isCompleted 
                                    ? 'bg-green-100 dark:bg-green-900'
                                    : isActive
                                    ? 'bg-blue-100 dark:bg-blue-900'
                                    : 'bg-gray-100 dark:bg-gray-800'
                                }`}>
                                  {isCompleted ? (
                                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                  ) : (
                                    <Icon className={`w-6 h-6 ${
                                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                                    }`} />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {test.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {test.description}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    {test.questions.length} questions • {test.timeEstimate}
                                  </p>
                                </div>
                              </div>
                              <div>
                                {isCompleted ? (
                                  <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                                    ✓ Completed
                                  </span>
                                ) : (
                                  <Button 
                                    variant={isActive ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => startTest(index)}
                                    disabled={index > currentTestIndex}
                                  >
                                    Start Test
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {psychometricResults.filter(r => r).length === 6 && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                      <CheckCircle className="w-8 h-8 mx-auto text-green-600 dark:text-green-400 mb-2" />
                      <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                        Assessment Complete!
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Excellent! You've completed all psychometric assessments. You can now submit your complete application.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>

                <div className="flex space-x-2">
                  {currentStep < 5 ? (
                    <Button 
                      type="button" 
                      onClick={nextStep}
                      disabled={currentStep === 4 && (!form.watch('coverLetter') || !form.watch('whyJoinUs'))}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={submitApplication.isPending || psychometricResults.filter(r => r).length < 5}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {submitApplication.isPending ? "Submitting..." : "Submit Complete Application"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Psychometric Test Modal */}
        <Dialog open={activeTestModal !== null} onOpenChange={() => setActiveTestModal(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {activeTestModal && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    {(() => {
                      const currentTest = psychometricTests.find(t => t.id === activeTestModal);
                      if (!currentTest) return null;
                      const Icon = currentTest.icon;
                      return (
                        <>
                          <Icon className="w-5 h-5" />
                          <span>{currentTest.name}</span>
                        </>
                      );
                    })()}
                  </DialogTitle>
                  <DialogDescription>
                    {(() => {
                      const currentTest = psychometricTests.find(t => t.id === activeTestModal);
                      return currentTest ? currentTest.description : "";
                    })()}
                  </DialogDescription>
                </DialogHeader>
                
                {(() => {
                  const currentTest = psychometricTests.find(t => t.id === activeTestModal);
                  if (!currentTest) return null;
                  
                  const currentQuestion = currentTest.questions[currentQuestionIndex];
                  const progress = ((currentQuestionIndex + 1) / currentTest.questions.length) * 100;
                  
                  return (
                    <div className="space-y-6">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Question {currentQuestionIndex + 1} of {currentTest.questions.length}</span>
                          <span>{Math.round(progress)}% Complete</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {/* Question */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">
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

                        {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
                          <RadioGroup
                            value={testResponses[currentQuestion.id] || ''}
                            onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                            className="space-y-2"
                          >
                            {currentQuestion.options.map((option, idx) => (
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
                  );
                })()}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}