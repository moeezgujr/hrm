import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  Brain, 
  CheckCircle, 
  AlertTriangle,
  User,
  Mail,
  Timer,
  BarChart3,
  FileText,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

interface TestQuestion {
  id: number;
  questionText: string;
  questionType: 'multiple_choice' | 'scale' | 'yes_no';
  options?: { text: string; value: string; isCorrect?: boolean }[];
  category: string;
  order: number;
}

interface PsychometricTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId: number;
  testName: string;
  candidateEmail?: string;
  candidateName?: string;
  employeeId?: number;
  onComplete?: () => void;
}

export default function PsychometricTestModal({ 
  isOpen, 
  onClose, 
  testId, 
  testName,
  candidateEmail = '',
  candidateName = '',
  employeeId,
  onComplete
}: PsychometricTestModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [candidateInfo, setCandidateInfo] = useState({
    name: candidateName || user?.firstName + ' ' + user?.lastName || '',
    email: candidateEmail || user?.email || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);

  // Fetch test details
  const { data: test = {}, isLoading: testLoading, error: testError } = useQuery({
    queryKey: [`/api/psychometric-tests/${testId}`],
    enabled: testId > 0 && isOpen, // Only fetch when testId is valid and modal is open
  }) as { data: any, isLoading: boolean, error: any };

  // Fetch test questions
  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: [`/api/psychometric-tests/${testId}/questions`],
    enabled: testId > 0 && isOpen,
  }) as { data: TestQuestion[], isLoading: boolean };

  // Timer effect
  useEffect(() => {
    if (testStarted && timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testStarted, timeRemaining]);

  // Auto-populate user information when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setCandidateInfo({
        name: candidateName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: candidateEmail || user.email || ''
      });
    }
  }, [isOpen, user, candidateName, candidateEmail]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentQuestionIndex(0);
      setResponses({});
      setTimeRemaining(null);
      setTestStarted(false);
      setIsSubmitting(false);
      setQuestionStartTime(null);
    }
  }, [isOpen]);

  // Set 30-second timer per question
  useEffect(() => {
    if (testStarted && questions.length > 0) {
      setQuestionStartTime(Date.now());
      setTimeRemaining(30); // 30 seconds per question
    }
  }, [testStarted, currentQuestionIndex, questions.length]);

  const handleStartTest = () => {
    // Auto-fill with user info if available, but still validate
    const name = candidateInfo.name.trim() || `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    const email = candidateInfo.email.trim() || user?.email || '';
    
    if (!name || !email) {
      toast({
        title: "Missing Information",
        description: "Unable to detect your profile information. Please contact your HR administrator.",
        variant: "destructive",
      });
      return;
    }

    // Update candidate info with detected values
    setCandidateInfo({ name, email });
    setTestStarted(true);
    setQuestionStartTime(Date.now());
    setTimeRemaining(30); // 30 seconds per question
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Auto-advance to next question after answering
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        handleNextQuestion();
      }
    }, 500);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
      setTimeRemaining(30); // Reset to 30 seconds for next question
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(Date.now());
      setTimeRemaining(30); // Reset to 30 seconds when going back
    }
  };

  const handleTimeUp = () => {
    // If time runs out on a question, auto-advance to next or submit
    if (currentQuestionIndex < questions.length - 1) {
      toast({
        title: "Time's Up!",
        description: "Moving to next question automatically.",
        variant: "default",
      });
      handleNextQuestion();
    } else {
      toast({
        title: "Assessment Complete!",
        description: "Submitting your responses. Results will be reviewed by HR.",
        variant: "default",
      });
      handleSubmitTest();
    }
  };

  const handleSubmitTest = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const attemptData = {
        testId: parseInt(testId.toString()),
        candidateName: candidateInfo.name,
        candidateEmail: candidateInfo.email,
        responses: Object.entries(responses).map(([questionId, answer]) => ({
          questionId: parseInt(questionId),
          selectedAnswer: answer
        })),
        timeSpent: test.timeLimit * 60 - (timeRemaining || 0),
        status: 'completed'
      };

      await apiRequest('POST', '/api/psychometric-test-attempts', attemptData);
      
      toast({
        title: "Assessment Submitted Successfully",
        description: "Your psychometric assessment has been completed. Results will be reviewed by HR and are not visible to employees.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/psychometric-test-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding-checklists'] });
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      } else {
        onClose();
      }
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const currentQuestion = questions[currentQuestionIndex];
  


  const renderMultipleChoiceQuestion = (question: TestQuestion) => (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-900">{question.questionText}</p>
      <RadioGroup
        value={responses[question.id] || ''}
        onValueChange={(value) => handleAnswerChange(question.id, value)}
        className="space-y-3"
      >
        {question.options?.map((option, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <RadioGroupItem value={option.value} id={`q${question.id}-${index}`} />
            <Label htmlFor={`q${question.id}-${index}`} className="flex-1 cursor-pointer">
              {option.text}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );

  const renderScaleQuestion = (question: TestQuestion) => (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-900">{question.questionText}</p>
      <RadioGroup
        value={responses[question.id] || ''}
        onValueChange={(value) => handleAnswerChange(question.id, value)}
        className="space-y-3"
      >
        {question.options?.map((option, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <RadioGroupItem value={option.value.toString()} id={`q${question.id}-${index}`} />
            <Label htmlFor={`q${question.id}-${index}`} className="flex-1 cursor-pointer">
              {option.text}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );

  if (testLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!testStarted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
              {test?.testName || testName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <p className="text-gray-600 text-center">{test?.description}</p>
            
            {/* Candidate Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Candidate Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Auto-detected from your profile"
                      value={candidateInfo.name}
                      readOnly
                      className="pl-10 bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Auto-detected from your profile"
                      value={candidateInfo.email}
                      readOnly
                      className="pl-10 bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Test Information */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Instructions</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">{test?.instructions}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Timer className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Time limit: 30 seconds per question</span>
                </div>
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Total questions: {test?.totalQuestions || questions.length || 'Loading...'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={handleStartTest}
                className="px-8 py-3"
                disabled={!candidateInfo.name.trim() || !candidateInfo.email.trim()}
              >
                Start Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>{test?.testName || testName}</span>
            {timeRemaining !== null && (
              <div className="flex items-center space-x-2">
                <Timer className="h-4 w-4" />
                <span className={`font-mono ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-600'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {questionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question */}
            {currentQuestion && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {currentQuestion.questionText}
                    </h3>
                    
                    <RadioGroup
                      value={responses[currentQuestion.id] || ''}
                      onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                      className="space-y-3"
                    >
                      {currentQuestion.options?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <RadioGroupItem value={option.value} id={`q${currentQuestion.id}-${index}`} />
                          <Label htmlFor={`q${currentQuestion.id}-${index}`} className="flex-1 cursor-pointer text-sm">
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <span className="text-sm text-gray-500">
                {Object.keys(responses).length} of {questions.length} answered
              </span>

              {currentQuestionIndex === questions.length - 1 ? (
                <Button 
                  onClick={handleSubmitTest}
                  disabled={isSubmitting || Object.keys(responses).length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Test
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  disabled={!responses[currentQuestion?.id]}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}