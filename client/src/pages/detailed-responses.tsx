import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, HelpCircle, ArrowLeft, User, Calendar, Clock, FileText } from "lucide-react";
import { Link } from "wouter";

interface QuestionResponse {
  questionId: number;
  questionNumber: number;
  questionText: string;
  questionType: string;
  category: string;
  options: any;
  correctAnswer: string | null;
  selectedAnswer: any;
  selectedAnswerText: string | null;
  selectedOption: any;
  isCorrect: boolean | null;
  wasAnswered: boolean;
}

interface DetailedResponseData {
  attempt: {
    id: number;
    candidateEmail: string;
    candidateName: string;
    completedAt: string;
    timeSpent: number;
    totalScore: number;
    percentageScore: number;
  };
  test: {
    id: number;
    testName: string;
    testType: string;
    description: string;
  };
  questionResponses: QuestionResponse[];
  totalQuestions: number;
  answeredQuestions: number;
}

export default function DetailedResponses() {
  const { attemptId } = useParams();
  
  const { data: detailedData, isLoading, error } = useQuery<DetailedResponseData>({
    queryKey: [`/api/psychometric-test-attempts/${attemptId}/detailed`],
    enabled: !!attemptId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading detailed responses...</p>
        </div>
      </div>
    );
  }

  if (error || !detailedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Responses</h2>
          <p className="text-gray-600">Could not load the detailed question responses for this test attempt.</p>
          <Button className="mt-4" variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const { attempt, test, questionResponses, totalQuestions, answeredQuestions } = detailedData;

  const getAnswerIcon = (response: QuestionResponse) => {
    if (!response.wasAnswered) {
      return <HelpCircle className="w-5 h-5 text-gray-400" />;
    }
    
    if (response.isCorrect === true) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (response.isCorrect === false) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    
    return <FileText className="w-5 h-5 text-blue-600" />;
  };

  const getAnswerBadge = (response: QuestionResponse) => {
    if (!response.wasAnswered) {
      return <Badge variant="secondary">Not Answered</Badge>;
    }
    
    if (response.isCorrect === true) {
      return <Badge variant="default" className="bg-green-600">Correct</Badge>;
    } else if (response.isCorrect === false) {
      return <Badge variant="destructive">Incorrect</Badge>;
    }
    
    return <Badge variant="outline">Subjective</Badge>;
  };

  const formatTimeSpent = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatOptions = (options: any) => {
    if (!options) return [];
    if (typeof options === 'string') {
      try {
        return JSON.parse(options);
      } catch {
        return [];
      }
    }
    return Array.isArray(options) ? options : [];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => window.location.href = `/psychometric-report/${encodeURIComponent(attempt?.candidateEmail || '')}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Report
            </Button>
            <div className="text-right">
              <p className="text-sm text-gray-600">Test Attempt ID: {attempt.id}</p>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-purple-600" />
                <span>Detailed Question Responses</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{attempt.candidateName}</p>
                    <p className="text-sm text-gray-600">{attempt.candidateEmail}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">{test.testName}</p>
                    <p className="text-sm text-gray-600">{test.testType}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Completed</p>
                    <p className="text-sm text-gray-600">
                      {new Date(attempt.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Time Spent</p>
                    <p className="text-sm text-gray-600">
                      {formatTimeSpent(attempt.timeSpent)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{totalQuestions}</p>
                  <p className="text-sm text-gray-600">Total Questions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{answeredQuestions}</p>
                  <p className="text-sm text-gray-600">Answered</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{attempt.percentageScore}%</p>
                  <p className="text-sm text-gray-600">Overall Score</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.round((answeredQuestions / totalQuestions) * 100)}%
                  </p>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Responses */}
        <div className="space-y-4">
          {questionResponses.map((response) => (
            <Card key={response.questionId} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                      <span className="text-sm font-semibold text-purple-600">
                        {response.questionNumber}
                      </span>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {response.category || 'General'}
                      </Badge>
                      <h3 className="font-medium text-gray-900">
                        {response.questionText}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getAnswerIcon(response)}
                    {getAnswerBadge(response)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Show options for multiple choice */}
                {response.questionType === 'multiple_choice' && formatOptions(response.options).length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Available Options:</p>
                    <div className="space-y-2">
                      {formatOptions(response.options).map((option: any, index: number) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg border ${
                            response.selectedAnswer === option.value
                              ? response.isCorrect === true
                                ? 'bg-green-50 border-green-200'
                                : response.isCorrect === false
                                ? 'bg-red-50 border-red-200'
                                : 'bg-blue-50 border-blue-200'
                              : option.value === response.correctAnswer
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{option.text || option.value}</span>
                            <div className="flex items-center space-x-2">
                              {response.selectedAnswer === option.value && (
                                <Badge variant="secondary" className="text-xs">Selected</Badge>
                              )}
                              {option.value === response.correctAnswer && (
                                <Badge variant="default" className="text-xs bg-yellow-600">Correct Answer</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Applicant's Response */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Applicant's Response:</p>
                    {response.isCorrect !== null && (
                      <div className="flex items-center space-x-1">
                        {response.isCorrect ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600">Correct</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-600">Incorrect</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {response.wasAnswered ? (
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">
                        {response.selectedAnswerText || response.selectedAnswer || 'No text available'}
                      </p>
                      {response.selectedAnswer !== response.selectedAnswerText && (
                        <p className="text-sm text-gray-600">
                          Raw Value: {response.selectedAnswer}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Question was not answered</p>
                  )}
                </div>

                {/* Show correct answer for objective questions */}
                {response.correctAnswer && response.isCorrect === false && (
                  <div className="mt-3 bg-yellow-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-800">Correct Answer:</p>
                    <p className="text-sm text-yellow-700">{response.correctAnswer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}