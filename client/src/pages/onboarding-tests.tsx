import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Play, Users, Clock, BarChart3, Eye, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import PsychometricTestModal from "@/components/psychometric-test-modal";

interface PsychometricTest {
  id: number;
  testName: string;
  title?: string;
  description: string;
  testType: string;
  type?: string;
  timeLimit: number;
  instructions: string;
  isActive: boolean;
  createdAt: string;
  totalQuestions?: number;
  questionCount?: number;
  attemptCount?: number;
}

interface TestAttempt {
  id: number;
  testId: number;
  candidateEmail: string;
  candidateName: string;
  score: number;
  completedAt: string;
  results: any;
  test: PsychometricTest;
}

export default function OnboardingTestsPage() {
  const { toast } = useToast();
  const [selectedTestType, setSelectedTestType] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<TestAttempt | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<PsychometricTest | null>(null);

  // Fetch tests
  const { data: tests = [], isLoading: testsLoading } = useQuery<PsychometricTest[]>({
    queryKey: ['/api/psychometric-tests'],
  });

  // Fetch test attempts
  const { data: attempts = [], isLoading: attemptsLoading } = useQuery<TestAttempt[]>({
    queryKey: ['/api/psychometric-test-attempts'],
  });

  // Create onboarding tests mutation
  const createOnboardingTestsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/onboarding-tests/create-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psychometric-tests'] });
      toast({
        title: "Success",
        description: "All onboarding tests have been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create onboarding tests",
        variant: "destructive",
      });
    },
  });

  // Delete test mutation
  const deleteTestMutation = useMutation({
    mutationFn: async (testId: number) => {
      return await apiRequest('DELETE', `/api/psychometric-tests/${testId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psychometric-tests'] });
      toast({
        title: "Success",
        description: "Test deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete test",
        variant: "destructive",
      });
    },
  });

  const getTestTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      personality: "bg-purple-100 text-purple-800",
      cognitive: "bg-blue-100 text-blue-800",
      communication: "bg-green-100 text-green-800",
      technical: "bg-orange-100 text-orange-800",
      culture: "bg-pink-100 text-pink-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const filteredTests = selectedTestType && selectedTestType !== 'all'
    ? tests.filter((test) => (test.type || test.testType) === selectedTestType)
    : tests;

  const testTypes = Array.from(new Set(tests.map((test) => test.type || test.testType)));

  const getScoreInterpretation = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-green-600" };
    if (score >= 60) return { label: "Good", color: "text-blue-600" };
    if (score >= 40) return { label: "Average", color: "text-yellow-600" };
    return { label: "Needs Improvement", color: "text-red-600" };
  };

  // Debug logging removed for production

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Onboarding Tests</h1>
          <p className="text-muted-foreground">
            Manage psychometric and skills assessments for new employees
          </p>

        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => createOnboardingTestsMutation.mutate()}
            disabled={createOnboardingTestsMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create All Tests
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tests">Test Library</TabsTrigger>
          <TabsTrigger value="attempts">Test Results</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select value={selectedTestType} onValueChange={setSelectedTestType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {testTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {testsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTests.map((test: PsychometricTest) => (
                <Card key={test.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{test.title || test.testName}</CardTitle>
                        <Badge className={getTestTypeColor(test.type || test.testType)} variant="secondary">
                          {(test.type || test.testType).charAt(0).toUpperCase() + (test.type || test.testType).slice(1)}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteTestMutation.mutate(test.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {test.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {test.timeLimit} minutes
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {test.attemptCount || 0} attempts
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Take Test clicked for:', test.testName, test.id);
                            setSelectedTest(test);
                            setShowTestModal(true);
                            console.log('Modal state set to true');
                          }}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Take Test
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!testsLoading && filteredTests.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-muted-foreground mb-4">
                  {tests.length === 0 ? "No tests created yet" : "No tests match your filter"}
                </div>
                {tests.length === 0 && (
                  <Button onClick={() => createOnboardingTestsMutation.mutate()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Onboarding Tests
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attempts" className="space-y-4">
          {attemptsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.map((attempt) => {
                const scoreInfo = getScoreInterpretation(attempt.score);
                return (
                  <Card key={attempt.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{attempt.candidateName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {attempt.test.title || attempt.test.testName} • {attempt.candidateEmail}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Completed {new Date(attempt.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${scoreInfo.color}`}>
                            {attempt.score}%
                          </div>
                          <Badge variant="outline" className={scoreInfo.color}>
                            {scoreInfo.label}
                          </Badge>
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAttempt(attempt);
                                setShowResultsDialog(true);
                              }}
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {attempts.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-muted-foreground">
                      No test attempts yet
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tests.length}</div>
                <p className="text-xs text-muted-foreground">Active assessments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attempts.length}</div>
                <p className="text-xs text-muted-foreground">Completed assessments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {attempts.length > 0 
                    ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Across all tests</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">95%</div>
                <p className="text-xs text-muted-foreground">Test completion</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Test Performance by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testTypes.map((type) => {
                  const typeAttempts = attempts.filter((attempt) => attempt.test.type === type);
                  const avgScore = typeAttempts.length > 0 
                    ? Math.round(typeAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / typeAttempts.length)
                    : 0;
                  
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getTestTypeColor(type)} variant="secondary">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Badge>
                        <span className="text-sm">{typeAttempts.length} attempts</span>
                      </div>
                      <div className="text-sm font-medium">{avgScore}% avg</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Results Details</DialogTitle>
            <DialogDescription>
              Detailed results for {selectedAttempt?.candidateName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAttempt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Test</Label>
                  <p className="text-sm">{selectedAttempt.test.title || selectedAttempt.test.testName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Score</Label>
                  <p className="text-sm font-bold">{selectedAttempt.score}%</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Completed</Label>
                  <p className="text-sm">{new Date(selectedAttempt.completedAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Badge className={getTestTypeColor(selectedAttempt.test.type || selectedAttempt.test.testType)}>
                    {(selectedAttempt.test.type || selectedAttempt.test.testType)?.charAt(0).toUpperCase() + (selectedAttempt.test.type || selectedAttempt.test.testType)?.slice(1)}
                  </Badge>
                </div>
              </div>

              {selectedAttempt.results && (
                <div>
                  <Label className="text-sm font-medium">Detailed Results</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedAttempt.results, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Psychometric Test Modal */}
      <PsychometricTestModal
        isOpen={showTestModal}
        onClose={() => {
          console.log('Modal closing');
          setShowTestModal(false);
          setSelectedTest(null);
        }}
        testId={selectedTest?.id || 0}
        testName={selectedTest?.testName || selectedTest?.title || 'Assessment Test'}
        candidateEmail="preview@test.com"
        candidateName="Preview User"
      />
    </div>
  );
}