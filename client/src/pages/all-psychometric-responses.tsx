import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, HelpCircle, User, Calendar, Clock, FileText, Brain, Users } from "lucide-react";
import { Link } from "wouter";

interface TestAttempt {
  id: number;
  candidateEmail: string;
  candidateName: string;
  testId: number;
  completedAt: string;
  timeSpent: number;
  status: string;
  percentageScore: number;
}

interface PsychometricTest {
  id: number;
  testName: string;
  testType: string;
  description: string;
}

export default function AllPsychometricResponses() {
  const { data: attempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ['/api/psychometric-test-attempts'],
    retry: false,
  });

  const { data: tests = [], isLoading: testsLoading } = useQuery({
    queryKey: ['/api/psychometric-tests'],
    retry: false,
  });

  if (attemptsLoading || testsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading all psychometric responses...</p>
        </div>
      </div>
    );
  }

  const formatTimeSpent = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getTestName = (testId: number) => {
    const test = tests.find((t: PsychometricTest) => t.id === testId);
    return test?.testName || `Test ${testId}`;
  };

  const getTestType = (testId: number) => {
    const test = tests.find((t: PsychometricTest) => t.id === testId);
    return test?.testType || 'unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'abandoned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-700';
    if (score >= 70) return 'text-blue-700';
    if (score >= 60) return 'text-orange-700';
    return 'text-red-700';
  };

  // Group attempts by candidate
  const candidateGroups = attempts.reduce((groups: any, attempt: TestAttempt) => {
    const candidateKey = `${attempt.candidateName}_${attempt.candidateEmail}`;
    if (!groups[candidateKey]) {
      groups[candidateKey] = {
        candidateName: attempt.candidateName,
        candidateEmail: attempt.candidateEmail,
        attempts: []
      };
    }
    groups[candidateKey].attempts.push(attempt);
    return groups;
  }, {});

  const candidateList = Object.values(candidateGroups);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <Brain className="w-8 h-8" />
                <span>All Psychometric Test Responses</span>
              </CardTitle>
              <p className="text-purple-100">
                Comprehensive view of all candidate responses to psychometric assessments
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold">{candidateList.length}</p>
                  <p className="text-purple-200">Total Candidates</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{attempts.length}</p>
                  <p className="text-purple-200">Test Attempts</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{attempts.filter((a: TestAttempt) => a.status === 'completed').length}</p>
                  <p className="text-purple-200">Completed Tests</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{tests.length}</p>
                  <p className="text-purple-200">Available Tests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Candidates and Their Test Attempts */}
        <div className="space-y-6">
          {candidateList.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Test Attempts Found</h3>
                <p className="text-gray-600">No psychometric test attempts have been completed yet.</p>
              </CardContent>
            </Card>
          ) : (
            candidateList.map((candidate: any, index: number) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <User className="w-6 h-6 text-purple-600" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{candidate.candidateName}</h3>
                        <p className="text-sm text-gray-600">{candidate.candidateEmail}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-purple-600 border-purple-200">
                      {candidate.attempts.length} Test{candidate.attempts.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid gap-4">
                    {candidate.attempts.map((attempt: TestAttempt) => (
                      <div key={attempt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                              <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{getTestName(attempt.testId)}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(attempt.completedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatTimeSpent(attempt.timeSpent)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <Badge className={getStatusColor(attempt.status)}>
                              {attempt.status}
                            </Badge>
                            {attempt.percentageScore && (
                              <Badge variant="outline" className={getScoreColor(attempt.percentageScore)}>
                                {attempt.percentageScore}%
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-lg font-bold text-purple-600">{attempt.percentageScore || 0}%</p>
                            <p className="text-xs text-gray-600">Overall Score</p>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-lg font-bold text-blue-600">{getTestType(attempt.testId)}</p>
                            <p className="text-xs text-gray-600">Test Type</p>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-lg font-bold text-green-600">ID: {attempt.id}</p>
                            <p className="text-xs text-gray-600">Attempt ID</p>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Link href={`/detailed-responses/${attempt.id}`}>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Detailed Questions & Answers
                            </Button>
                          </Link>
                          
                          <Link href={`/psychometric-report/${attempt.candidateEmail}`}>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-purple-200 text-purple-600 hover:bg-purple-50"
                            >
                              <Brain className="w-4 h-4 mr-2" />
                              View Analysis Report
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}