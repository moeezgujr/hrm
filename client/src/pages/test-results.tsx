import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Brain, 
  BarChart3,
  User,
  Clock,
  Award,
  FileText,
  Download,
  Mail,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function TestResults() {
  const { user } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const attemptId = urlParams.get('attemptId');

  // Check if user is HR or admin - test results should only be visible to HR
  const canViewResults = user?.role && ['hr_admin', 'branch_manager'].includes(user.role);

  // Fetch test results - only if user has permission
  const { data: attempt, isLoading } = useQuery({
    queryKey: [`/api/psychometric-test-attempts/${attemptId}`],
    enabled: !!attemptId && canViewResults,
  });

  const { data: test } = useQuery({
    queryKey: [`/api/psychometric-tests/${attempt?.testId}`],
    enabled: !!attempt?.testId,
  });

  // Show access denied for non-HR users
  if (!canViewResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-4">
              Psychometric test results are only visible to HR administrators.
            </p>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Test results are confidential and managed by Human Resources for privacy and security reasons.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Results Not Found</h2>
            <p className="text-gray-600">The test results could not be found or are not yet available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const personalityTraits = attempt.results?.personalityTraits || {};
  const cognitiveScores = attempt.results?.cognitiveScores || {};

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Complete!</h1>
          <p className="text-gray-600 text-lg">
            Thank you for completing the {test?.testName}
          </p>
        </div>

        {/* Candidate Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Candidate Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-lg font-semibold text-gray-900">{attempt.candidateName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg font-semibold text-gray-900">{attempt.candidateEmail}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date Completed</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(attempt.completedAt!).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Overall Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={getScoreColor(attempt.percentageScore || 0)}
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${attempt.percentageScore || 0}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${getScoreColor(attempt.percentageScore || 0)}`}>
                      {attempt.percentageScore || 0}%
                    </span>
                  </div>
                </div>
                <Badge className={getScoreBadgeColor(attempt.percentageScore || 0)}>
                  {attempt.percentageScore >= 80 ? 'Excellent' : 
                   attempt.percentageScore >= 60 ? 'Good' : 'Needs Improvement'}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Raw Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {attempt.totalScore} / {test?.totalQuestions}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Time Spent</p>
                  <p className="text-lg font-semibold text-gray-900 flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    {attempt.timeSpent ? formatTime(attempt.timeSpent) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Test Type</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {test?.testType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Questions Answered</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {attempt.responses.length} / {test?.totalQuestions}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personality Traits (if personality test) */}
        {test?.testType === 'personality' && Object.keys(personalityTraits).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>Personality Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(personalityTraits).map(([trait, score]: [string, any]) => (
                  <div key={trait}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900 capitalize">
                        {trait.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm font-semibold text-gray-600">{score}%</span>
                    </div>
                    <Progress value={score} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {score >= 70 ? 'High' : score >= 40 ? 'Moderate' : 'Low'} level
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cognitive Scores (if cognitive test) */}
        {test?.testType === 'cognitive' && Object.keys(cognitiveScores).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Cognitive Assessment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(cognitiveScores).map(([domain, score]: [string, any]) => (
                  <div key={domain} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 capitalize">
                      {domain.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <div className="flex items-center justify-between mb-2">
                      <Progress value={score} className="flex-1 mr-4" />
                      <span className="font-semibold text-gray-900">{score}%</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {score >= 80 ? 'Excellent performance' :
                       score >= 60 ? 'Good performance' :
                       score >= 40 ? 'Average performance' : 'Below average performance'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {attempt.results?.recommendations && (
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attempt.results.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                    <Award className="h-5 w-5 text-blue-600 mt-0.5" />
                    <p className="text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className="px-8">
            <Download className="mr-2 h-4 w-4" />
            Download Results
          </Button>
          <Button variant="outline" className="px-8">
            <Mail className="mr-2 h-4 w-4" />
            Email Results
          </Button>
        </div>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">1</span>
                </div>
                <p className="text-gray-700">
                  Your results have been automatically submitted to the HR team at Meeting Matters.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">2</span>
                </div>
                <p className="text-gray-700">
                  You will receive an email confirmation with your detailed results within 24 hours.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">3</span>
                </div>
                <p className="text-gray-700">
                  Our HR team will contact you regarding the next steps in the application process.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}