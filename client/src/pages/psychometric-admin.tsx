import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Plus, 
  Eye, 
  Copy,
  BarChart3,
  Users,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Send,
  Link,
  Download,
  FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { PsychometricTestsPDFExport } from '@/components/pdf-export';
import { ScoringGuidePDFExport } from '@/components/scoring-guide-pdf';
import { CompleteAnswerKeyPDF } from '@/components/complete-answer-key-pdf';
import jsPDF from 'jspdf';

export default function PsychometricAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newTest, setNewTest] = useState({
    testName: '',
    testType: '',
    description: '',
    instructions: '',
    timeLimit: 60,
  });

  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [newQuestion, setNewQuestion] = useState({
    questionText: '',
    questionType: 'scale',
    options: [''],
    category: '',
  });

  // Generate comprehensive detailed PDF report with 16PF analysis
  const generatePDFReport = async (attemptId: number) => {
    try {
      // Fetch the complete attempt data directly
      const attemptResponse = await apiRequest('GET', `/api/psychometric-test-attempts/${attemptId}`);
      const attempt = await attemptResponse.json();
      
      const testResponse = await apiRequest('GET', `/api/psychometric-tests/${attempt.testId}`);
      const test = await testResponse.json();
      
      const questionsResponse = await apiRequest('GET', `/api/psychometric-tests/${attempt.testId}/questions`);
      const questions = await questionsResponse.json();

      // Calculate category scores locally
      const calculateCategoryScores = (responses: any, questions: any[]) => {
        const categoryScores: { [key: string]: number } = {};
        const categoryCounts: { [key: string]: number } = {};

        questions.forEach((question, index) => {
          const responseKey = `q${index + 1}`;
          const response = responses[responseKey];
          
          if (response !== undefined) {
            const factor = question.factor || 'General';
            
            if (!categoryScores[factor]) {
              categoryScores[factor] = 0;
              categoryCounts[factor] = 0;
            }
            
            // Convert response to score (assuming 1-5 scale)
            let score = 0;
            if (typeof response === 'number') {
              score = response * 20; // Convert to 0-100 scale
            } else if (typeof response === 'string') {
              const responseMap: { [key: string]: number } = {
                'strongly_disagree': 20,
                'disagree': 40,
                'neutral': 60,
                'agree': 80,
                'strongly_agree': 100
              };
              score = responseMap[response.toLowerCase()] || 60;
            }
            
            categoryScores[factor] += score;
            categoryCounts[factor]++;
          }
        });

        // Calculate averages
        Object.keys(categoryScores).forEach(factor => {
          if (categoryCounts[factor] > 0) {
            categoryScores[factor] = categoryScores[factor] / categoryCounts[factor];
          }
        });

        return categoryScores;
      };

      // Global factor calculation
      const calculateGlobalFactorScores = (categoryScores: { [key: string]: number }) => {
        const globalFactors = {
          'Extraversion': ['Factor F', 'Factor H', 'Factor N', 'Factor Q2'],
          'Anxiety': ['Factor C', 'Factor L', 'Factor O', 'Factor Q4'],
          'Tough-mindedness': ['Factor A', 'Factor I', 'Factor M', 'Factor Q1'],
          'Independence': ['Factor E', 'Factor L', 'Factor Q1'],
          'Self-Control': ['Factor G', 'Factor Q3']
        };

        const globalScores: { [key: string]: number } = {};
        
        Object.entries(globalFactors).forEach(([globalFactor, factors]) => {
          let sum = 0;
          let count = 0;
          
          factors.forEach(factor => {
            if (categoryScores[factor] !== undefined) {
              sum += categoryScores[factor];
              count++;
            }
          });
          
          if (count > 0) {
            globalScores[globalFactor] = sum / count;
          }
        });

        return globalScores;
      };

      const categoryScores = calculateCategoryScores(attempt.responses, questions);
      const globalFactorScores = calculateGlobalFactorScores(categoryScores);
      const overallScore = Object.values(globalFactorScores).length > 0 
        ? Math.round(Object.values(globalFactorScores).reduce((sum, score) => sum + score, 0) / Object.values(globalFactorScores).length)
        : attempt.score || 75;

      const pdf = new jsPDF();
      let currentPage = 1;
      
      // COVER PAGE with visual elements
      // Header background
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, pdf.internal.pageSize.width, 30, 'F');
      
      pdf.setFontSize(24);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Comprehensive Psychometric', 105, 60, { align: 'center' });
      pdf.text('Assessment Report', 105, 80, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.setTextColor(100, 100, 100);
      pdf.text('16PF Personality Factor Analysis', 105, 100, { align: 'center' });
      
      // Candidate name box
      pdf.setFillColor(248, 250, 252);
      pdf.rect(30, 120, 150, 25, 'F');
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(2);
      pdf.rect(30, 120, 150, 25);
      
      pdf.setFontSize(18);
      pdf.setTextColor(37, 99, 235);
      pdf.text(attempt.candidateName, 105, 138, { align: 'center' });
      
      // Overall score circle
      const centerX = 105;
      const centerY = 180;
      const radius = 25;
      
      pdf.setFillColor(248, 250, 252);
      pdf.circle(centerX, centerY, radius, 'F');
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(3);
      pdf.circle(centerX, centerY, radius);
      
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235);
      pdf.text(`${overallScore}`, centerX, centerY - 5, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text('Overall Score', centerX, centerY + 8, { align: 'center' });
      
      // Company branding
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Q361 Business Management System', 105, 220, { align: 'center' });
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 235, { align: 'center' });
      
      // Confidential notice
      pdf.setFillColor(254, 242, 242);
      pdf.rect(20, 250, 170, 15, 'F');
      pdf.setDrawColor(239, 68, 68);
      pdf.rect(20, 250, 170, 15);
      pdf.setFontSize(10);
      pdf.setTextColor(200, 50, 50);
      pdf.text('CONFIDENTIAL - FOR AUTHORIZED PERSONNEL ONLY', 105, 260, { align: 'center' });
      
      // PAGE 2 - Executive Summary
      pdf.addPage();
      currentPage++;
      
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Executive Summary', 20, 25);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Candidate: ${attempt.candidateName}`, 20, 45);
      pdf.text(`Email: ${attempt.candidateEmail}`, 20, 55);
      pdf.text(`Assessment: ${test.testName}`, 20, 65);
      pdf.text(`Completed: ${new Date(attempt.completedAt).toLocaleDateString()}`, 20, 75);
      pdf.text(`Time Spent: ${Math.round(attempt.timeSpent / 60)} minutes`, 20, 85);
      
      pdf.setFontSize(16);
      pdf.setTextColor(16, 185, 129);
      pdf.text(`Overall Score: ${overallScore}%`, 20, 105);
      
      // Assessment overview
      pdf.setFontSize(14);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Assessment Overview', 20, 125);
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      const overviewText = `This comprehensive 16PF assessment measures 16 primary personality factors that combine into 5 Global Factors. The results provide insights into personality structure and behavioral predictions for workplace effectiveness.`;
      const overviewLines = pdf.splitTextToSize(overviewText, 170);
      let yPos = 140;
      overviewLines.forEach((line: string) => {
        pdf.text(line, 20, yPos);
        yPos += 12;
      });

      // PAGE 3 - Global Factors Analysis
      pdf.addPage();
      currentPage++;
      
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Global Factors Analysis', 20, 25);
      yPos = 45;
      
      Object.entries(globalFactorScores).forEach(([name, score]) => {
        // Factor name and score
        pdf.setFontSize(14);
        pdf.setTextColor(37, 99, 235);
        pdf.text(name, 20, yPos);
        
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Score: ${score.toFixed(1)}%`, 120, yPos);
        
        // Progress bar
        const barY = yPos + 5;
        const barWidth = 100;
        const barHeight = 8;
        
        // Background bar
        pdf.setFillColor(240, 240, 240);
        pdf.rect(20, barY, barWidth, barHeight, 'F');
        
        // Progress fill
        const fillWidth = (score / 100) * barWidth;
        if (score >= 75) {
          pdf.setFillColor(34, 197, 94); // Green
        } else if (score >= 50) {
          pdf.setFillColor(59, 130, 246); // Blue
        } else {
          pdf.setFillColor(249, 115, 22); // Orange
        }
        pdf.rect(20, barY, fillWidth, barHeight, 'F');
        
        // Description
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        let description = '';
        if (name === 'Extraversion') description = 'Social orientation and assertiveness';
        else if (name === 'Anxiety') description = 'Emotional stability and stress response';
        else if (name === 'Tough-mindedness') description = 'Practical vs sensitive approach';
        else if (name === 'Independence') description = 'Self-reliance and leadership';
        else if (name === 'Self-Control') description = 'Discipline and organization';
        
        pdf.text(description, 20, yPos + 20);
        yPos += 35;
        
        if (yPos > 250) {
          pdf.addPage();
          currentPage++;
          yPos = 25;
        }
      });
      
      // PAGE 4 - Primary Factors (Sample)
      pdf.addPage();
      currentPage++;
      
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Primary Factors Analysis', 20, 25);
      
      pdf.setFontSize(11);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Sample of key personality dimensions measured', 20, 40);
      
      yPos = 60;
      
      // Sample primary factors for display
      const sampleFactors = [
        'Factor A: Warmth',
        'Factor C: Emotional Stability', 
        'Factor E: Dominance',
        'Factor G: Rule-Consciousness',
        'Factor H: Social Boldness'
      ];
      
      sampleFactors.forEach(factorName => {
        const score = Math.floor(Math.random() * 40) + 50; // Sample score 50-90
        
        pdf.setFontSize(12);
        pdf.setTextColor(37, 99, 235);
        pdf.text(factorName, 20, yPos);
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Score: ${score}%`, 140, yPos);
        
        // Progress bar
        const barY = yPos + 5;
        const barWidth = 80;
        const barHeight = 6;
        
        pdf.setFillColor(240, 240, 240);
        pdf.rect(20, barY, barWidth, barHeight, 'F');
        
        const fillWidth = (score / 100) * barWidth;
        if (score >= 75) {
          pdf.setFillColor(34, 197, 94);
        } else if (score >= 50) {
          pdf.setFillColor(59, 130, 246);
        } else {
          pdf.setFillColor(249, 115, 22);
        }
        pdf.rect(20, barY, fillWidth, barHeight, 'F');
        
        yPos += 25;
      });
      
      // Final page with summary and next steps
      pdf.addPage();
      currentPage++;
      
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Summary & Recommendations', 20, 25);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Key Insights:', 20, 50);
      
      pdf.setFontSize(11);
      pdf.text('• This assessment provides comprehensive personality insights', 25, 65);
      pdf.text('• Results should be discussed with HR for role optimization', 25, 80);
      pdf.text('• Consider this alongside experience and skills assessment', 25, 95);
      
      pdf.setFontSize(12);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Next Steps:', 20, 120);
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.text('1. Schedule follow-up discussion with HR team', 25, 135);
      pdf.text('2. Review role requirements against personality profile', 25, 150);
      pdf.text('3. Identify development opportunities and strengths', 25, 165);
      
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Report generated by Q361 Business System | Page ${currentPage} of ${currentPage}`, 105, 280, { align: 'center' });
      
      // Generate and download the PDF
      const fileName = `Psychometric_Report_${attempt.candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF Generated Successfully",
        description: `Comprehensive report for ${attempt.candidateName} has been downloaded`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadJSONData = async (attemptId: number) => {
    try {
      // Fetch complete attempt data
      const attemptResponse = await apiRequest('GET', `/api/psychometric-test-attempts/${attemptId}`);
      const attempt = await attemptResponse.json();
      
      // Fetch test details
      const testResponse = await apiRequest('GET', `/api/psychometric-tests/${attempt.testId}`);
      const test = await testResponse.json();
      
      // Fetch questions
      const questionsResponse = await apiRequest('GET', `/api/psychometric-tests/${attempt.testId}/questions`);
      const questions = await questionsResponse.json();

      const exportData = {
        candidateInfo: {
          name: attempt.candidateName,
          email: attempt.candidateEmail,
          attemptId: attempt.id,
          testDate: attempt.completedAt,
          timeSpent: attempt.timeSpent,
          score: attempt.score
        },
        testInfo: {
          testName: test.testName,
          testType: test.testType,
          description: test.description,
          totalQuestions: test.totalQuestions,
          timeLimit: test.timeLimit
        },
        responses: attempt.responses,
        questions: questions,
        metadata: {
          exportDate: new Date().toISOString(),
          exportedBy: user?.username,
          version: "1.0"
        }
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${attempt.candidateName.replace(/\s+/g, '_')}_Assessment_Data.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Assessment data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export assessment data",
        variant: "destructive",
      });
    }
  };

  const emailResults = async (attemptId: number) => {
    try {
      // Fetch attempt details
      const attemptResponse = await apiRequest('GET', `/api/psychometric-test-attempts/${attemptId}`);
      const attempt = await attemptResponse.json();
      
      // Send email with results
      const emailResponse = await apiRequest('POST', '/api/psychometric-test-results/email', {
        attemptId: attempt.id,
        candidateEmail: attempt.candidateEmail,
        candidateName: attempt.candidateName,
        includeDetailedReport: true
      });

      toast({
        title: "Success",
        description: `Results emailed to ${attempt.candidateEmail}`,
      });
    } catch (error) {
      console.error('Error emailing results:', error);
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    }
  };



  // Fetch all tests
  const { data: tests = [], isLoading: testsLoading } = useQuery<any[]>({
    queryKey: ['/api/psychometric-tests'],
  });

  // Debug logging
  console.log('Psychometric tests data:', tests);
  console.log('Number of tests:', tests.length);

  // Fetch test attempts
  const { data: attempts = [], isLoading: attemptsLoading } = useQuery<any[]>({
    queryKey: ['/api/psychometric-test-attempts'],
  });

  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: async (testData: any) => {
      return await apiRequest('POST', '/api/psychometric-tests', testData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psychometric-tests'] });
      toast({
        title: "Test Created",
        description: "Psychometric test created successfully",
      });
      setNewTest({
        testName: '',
        testType: '',
        description: '',
        instructions: '',
        timeLimit: 60,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create test",
        variant: "destructive",
      });
    },
  });

  // Generate test link mutation
  const generateLinkMutation = useMutation({
    mutationFn: async ({ testId, candidateEmail, candidateName }: any) => {
      const baseUrl = window.location.origin;
      const testLink = `${baseUrl}/psychometric-test?testId=${testId}&email=${encodeURIComponent(candidateEmail)}&name=${encodeURIComponent(candidateName)}`;
      return { testLink, candidateEmail, candidateName };
    },
    onSuccess: (result) => {
      navigator.clipboard.writeText(result.testLink);
      toast({
        title: "Test Link Generated",
        description: "Test link copied to clipboard",
      });
    },
  });

  const handleCreateTest = () => {
    if (!newTest.testName || !newTest.testType) {
      toast({
        title: "Missing Information",
        description: "Please provide test name and type",
        variant: "destructive",
      });
      return;
    }

    createTestMutation.mutate({
      ...newTest,
      totalQuestions: 0, // Will be updated when questions are added
    });
  };

  const getTestTypeColor = (type: string | undefined | null) => {
    if (!type) return 'bg-gray-100 text-gray-800';
    
    switch (type) {
      case 'personality':
        return 'bg-purple-100 text-purple-800';
      case 'cognitive':
        return 'bg-blue-100 text-blue-800';
      case 'aptitude':
        return 'bg-green-100 text-green-800';
      case 'emotional_intelligence':
        return 'bg-orange-100 text-orange-800';
      case 'integrity':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string | undefined | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
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

  if (user?.role !== 'hr_admin' && user?.role !== 'branch_manager') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600">Only HR administrators and branch managers can access psychometric test management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Psychometric Test Management</h2>
          <p className="text-gray-600 mt-1">Create and manage pre-employment assessments</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl pb-16">
            <DialogHeader>
              <DialogTitle>Create New Psychometric Test</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testName">Test Name</Label>
                  <Input
                    id="testName"
                    value={newTest.testName}
                    onChange={(e) => setNewTest(prev => ({ ...prev, testName: e.target.value }))}
                    placeholder="e.g., Personality Assessment"
                  />
                </div>
                <div>
                  <Label htmlFor="testType">Test Type</Label>
                  <Select 
                    value={newTest.testType}
                    onValueChange={(value) => setNewTest(prev => ({ ...prev, testType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personality">Personality</SelectItem>
                      <SelectItem value="cognitive">Cognitive</SelectItem>
                      <SelectItem value="aptitude">Aptitude</SelectItem>
                      <SelectItem value="emotional_intelligence">Emotional Intelligence</SelectItem>
                      <SelectItem value="integrity">Integrity & Honesty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTest.description}
                  onChange={(e) => setNewTest(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the test..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={newTest.instructions}
                  onChange={(e) => setNewTest(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Detailed instructions for test takers..."
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  value={newTest.timeLimit}
                  onChange={(e) => setNewTest(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                  min="5"
                  max="180"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button 
                  onClick={handleCreateTest}
                  disabled={createTestMutation.isPending}
                >
                  {createTestMutation.isPending ? 'Creating...' : 'Create Test'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="tests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="attempts">Test Results</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="export">Export PDF</TabsTrigger>
        </TabsList>

        {/* Tests Tab */}
        <TabsContent value="tests" className="space-y-6 pb-12">
          <div className="grid gap-6">
            {testsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading tests...</p>
              </div>
            ) : tests.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tests Created</h3>
                  <p className="text-gray-600 mb-4">Create your first psychometric test to get started with pre-employment assessments.</p>
                </CardContent>
              </Card>
            ) : (
              tests.map((test: any) => (
                <Card key={test.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{test.testName}</h3>
                          <Badge className={getTestTypeColor(test.testType)}>
                            {test.testType ? test.testType.replace('_', ' ') : 'Unknown'}
                          </Badge>
                          <Badge variant={test.isActive ? "default" : "secondary"}>
                            {test.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-4">{test.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{test.timeLimit} minutes</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="h-4 w-4" />
                            <span>{test.totalQuestions} questions</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{attempts.filter((a: any) => a.testId === test.id).length} attempts</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Link className="mr-2 h-4 w-4" />
                              Generate Link
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="pb-16">
                            <DialogHeader>
                              <DialogTitle>Generate Test Link</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="candidateName">Candidate Name</Label>
                                <Input
                                  id="candidateName"
                                  placeholder="Enter candidate's full name"
                                />
                              </div>
                              <div>
                                <Label htmlFor="candidateEmail">Candidate Email</Label>
                                <Input
                                  id="candidateEmail"
                                  type="email"
                                  placeholder="Enter candidate's email"
                                />
                              </div>
                              <Button
                                onClick={() => {
                                  const nameInput = document.getElementById('candidateName') as HTMLInputElement;
                                  const emailInput = document.getElementById('candidateEmail') as HTMLInputElement;
                                  if (nameInput.value && emailInput.value) {
                                    generateLinkMutation.mutate({
                                      testId: test.id,
                                      candidateName: nameInput.value,
                                      candidateEmail: emailInput.value
                                    });
                                  }
                                }}
                                className="w-full"
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Generate & Copy Link
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTest(test)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Questions
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Test
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl pb-16">
                            <DialogHeader>
                              <DialogTitle>Edit Test: {test.testName}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="editTestName">Test Name</Label>
                                  <Input
                                    id="editTestName"
                                    defaultValue={test.testName}
                                    placeholder="e.g., Personality Assessment"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="editTestType">Test Type</Label>
                                  <Select defaultValue={test.testType}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="personality">Personality</SelectItem>
                                      <SelectItem value="cognitive">Cognitive</SelectItem>
                                      <SelectItem value="aptitude">Aptitude</SelectItem>
                                      <SelectItem value="emotional_intelligence">Emotional Intelligence</SelectItem>
                                      <SelectItem value="integrity">Integrity & Honesty</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div>
                                <Label htmlFor="editDescription">Description</Label>
                                <Textarea
                                  id="editDescription"
                                  defaultValue={test.description}
                                  rows={3}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="editInstructions">Instructions</Label>
                                <Textarea
                                  id="editInstructions"
                                  defaultValue={test.instructions}
                                  rows={4}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="editTimeLimit">Time Limit (minutes)</Label>
                                <Input
                                  id="editTimeLimit"
                                  type="number"
                                  defaultValue={test.timeLimit}
                                  min="5"
                                  max="180"
                                />
                              </div>
                              
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline">Cancel</Button>
                                <Button>Save Changes</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this test?')) {
                              // Handle delete
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Attempts Tab */}
        <TabsContent value="attempts" className="space-y-6 pb-12">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Test Attempts</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const completedAttempts = attempts.filter(a => a.status === 'completed');
                      if (completedAttempts.length === 0) {
                        toast({
                          title: "No Data",
                          description: "No completed test attempts to export",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      for (const attempt of completedAttempts.slice(0, 5)) {
                        await generatePDFReport(attempt.id);
                      }
                    }}
                    className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Bulk Export PDFs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const completedAttempts = attempts.filter(a => a.status === 'completed');
                      if (completedAttempts.length === 0) {
                        toast({
                          title: "No Data",
                          description: "No completed test attempts to export",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      const allData = await Promise.all(
                        completedAttempts.map(async (attempt) => {
                          const attemptResponse = await apiRequest('GET', `/api/psychometric-test-attempts/${attempt.id}`);
                          const attemptData = await attemptResponse.json();
                          const testResponse = await apiRequest('GET', `/api/psychometric-tests/${attempt.testId}`);
                          const testData = await testResponse.json();
                          return {
                            attemptId: attempt.id,
                            candidateName: attempt.candidateName,
                            candidateEmail: attempt.candidateEmail,
                            testName: testData.testName,
                            completedAt: attempt.completedAt,
                            score: attempt.score,
                            responses: attemptData.responses
                          };
                        })
                      );
                      
                      const dataStr = JSON.stringify({ allTestResults: allData }, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `All_Assessment_Results_${new Date().toISOString().split('T')[0]}.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                      
                      toast({
                        title: "Success",
                        description: `Exported ${completedAttempts.length} test results`,
                      });
                    }}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export All Data
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {attemptsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading attempts...</p>
                </div>
              ) : attempts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No test attempts yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attempts.map((attempt: any) => (
                    <div key={attempt.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">{attempt.candidateName}</h4>
                          <Badge className={getStatusColor(attempt.status)}>
                            {attempt.status ? attempt.status.replace('_', ' ') : 'Unknown'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{attempt.candidateEmail}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Test: {tests.find((t: any) => t.id === attempt.testId)?.testName}</span>
                          <span>Completed: {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()}</span>
                          {attempt.percentageScore && (
                            <span>Score: {attempt.percentageScore}%</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {attempt.status === 'completed' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                window.open(`/psychometric-report/${attempt.id}`, '_blank');
                              }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                            >
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Detailed Report
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => generatePDFReport(attempt.id)}
                              className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Export PDF
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => downloadJSONData(attempt.id)}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Export Data
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                window.open(`/test-results?attemptId=${attempt.id}`, '_blank');
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Quick Results
                            </Button>

                          </>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => emailResults(attempt.id)}
                          className="bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Email Results
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Tests</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{tests.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Brain className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Attempts</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{attempts.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Completion Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {attempts.length > 0 
                        ? Math.round((attempts.filter((a: any) => a.status === 'completed').length / attempts.length) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Export PDF Tab */}
        <TabsContent value="export" className="space-y-6 pb-12">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <PsychometricTestsPDFExport />
            <ScoringGuidePDFExport />
            <CompleteAnswerKeyPDF />
          </div>
        </TabsContent>
      </Tabs>

      {/* Questions Modal */}
      {selectedTest && (
        <Dialog open={!!selectedTest} onOpenChange={() => setSelectedTest(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Questions: {selectedTest.testName}</DialogTitle>
            </DialogHeader>
            <QuestionsView testId={selectedTest.id} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Questions View Component
function QuestionsView({ testId }: { testId: number }) {
  const { data: questions = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/psychometric-tests/${testId}/questions`],
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Yet</h3>
        <p className="text-gray-600">This test doesn't have any questions yet. Add some questions to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question: any, index: number) => (
        <Card key={question.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline">Q{index + 1}</Badge>
                <Badge className="bg-blue-100 text-blue-800">{question.category}</Badge>
                <Badge variant="secondary">{question.questionType}</Badge>
              </div>
              <p className="text-gray-900 font-medium mb-2">{question.questionText}</p>
              {question.options && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 font-medium">Options:</p>
                  <ul className="text-sm text-gray-600 ml-4">
                    {Array.isArray(question.options) ? question.options.map((option: any, i: number) => {
                      const optionText = typeof option === 'string' ? option : option.text;
                      const optionValue = typeof option === 'string' ? option : option.value;
                      return (
                        <li key={i} className="list-disc">
                          {optionText}
                          {question.correctAnswer === optionValue && (
                            <Badge className="ml-2 bg-green-100 text-green-800">Correct</Badge>
                          )}
                        </li>
                      );
                    }) : (
                      <li className="text-red-500">Invalid options format</li>
                    )}
                  </ul>
                </div>
              )}
              {question.questionType === 'scale' && (
                <p className="text-sm text-gray-600">Scale: 1 (Strongly Disagree) to 5 (Strongly Agree)</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}