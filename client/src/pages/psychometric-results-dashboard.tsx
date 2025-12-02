import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, Download, Eye, Search, Filter, Calendar, 
  TrendingUp, AlertCircle, CheckCircle, Users, FileText, BarChart3, X, XCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import jsPDF from 'jspdf';
import type { PsychometricTestAttempt, PsychometricTest } from '@shared/schema';

export default function PsychometricResultsDashboard() {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<PsychometricTestAttempt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch all psychometric test results (HR only)
  const { data: results = [], isLoading } = useQuery<PsychometricTestAttempt[]>({
    queryKey: ['/api/psychometric-results/all'],
    enabled: user?.role === 'hr_admin',
  });

  // Get unique candidates from results for filtering
  const uniqueCandidates = useMemo(() => {
    const candidates = results.reduce((acc: Array<{email: string, name: string}>, result) => {
      const existing = acc.find(c => c.email === result.candidateEmail);
      if (!existing) {
        acc.push({
          email: result.candidateEmail,
          name: result.candidateName
        });
      }
      return acc;
    }, []);
    return candidates;
  }, [results]);

  // Fetch available tests
  const { data: tests = [] } = useQuery<PsychometricTest[]>({
    queryKey: ['/api/psychometric-tests'],
  });

  const filteredResults = results.filter((result) => {
    const candidateMatch = selectedEmployee === 'all' || !selectedEmployee || result.candidateEmail === selectedEmployee;
    const testMatch = selectedTest === 'all' || !selectedTest || result.testId?.toString() === selectedTest;
    const searchMatch = !searchQuery || 
      result.candidateName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.candidateEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return candidateMatch && testMatch && searchMatch;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const generateIndividualReport = (result: PsychometricTestAttempt) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Psychometric Assessment Report', 20, 30);
    
    // Employee Info
    doc.setFontSize(12);
    doc.text(`Employee: ${result.candidateName || 'Unknown'}`, 20, 50);
    doc.text(`Test: ${result.testId}`, 20, 60);
    doc.text(`Date Taken: ${result.completedAt ? new Date(result.completedAt).toLocaleDateString() : 'N/A'}`, 20, 70);
    doc.text(`Score: ${result.percentageScore || 0}% (${getScoreLabel(result.percentageScore || 0)})`, 20, 80);
    doc.text(`Time Taken: ${result.timeSpent ? Math.round(result.timeSpent / 60) : 0} minutes`, 20, 90);
    
    // Test Analysis
    doc.text('Assessment Analysis:', 20, 110);
    
    let yPosition = 120;
    
    // For now we'll provide general recommendations since testType is not available in PsychometricTestAttempt
    // In a real implementation, this would need to be joined from the psychometricTests table
    const testType = 'general'; // Default to general assessment
    
    // General assessment recommendations
    doc.text('General Assessment Summary:', 20, yPosition);
    yPosition += 10;
    doc.text('• This assessment evaluates overall capabilities', 20, yPosition);
    yPosition += 10;
    doc.text('• Results indicate general aptitude and skills', 20, yPosition);
    yPosition += 10;
    doc.text('• Useful for overall candidate evaluation', 20, yPosition);
    
    /*
    // Future implementation when testType is available:
    if (testType === 'personality') {
      doc.text('Personality Profile Summary:', 20, yPosition);
      yPosition += 10;
      doc.text('• This assessment evaluates key personality traits', 20, yPosition);
      yPosition += 10;
      doc.text('• Results indicate behavioral tendencies in work environment', 20, yPosition);
      yPosition += 10;
      doc.text('• Useful for team dynamics and role assignments', 20, yPosition);
    } else if (testType === 'cognitive') {
      doc.text('Cognitive Abilities Summary:', 20, yPosition);
      yPosition += 10;
      doc.text('• Measures problem-solving and analytical thinking', 20, yPosition);
      yPosition += 10;
      doc.text('• Evaluates logical reasoning capabilities', 20, yPosition);
      yPosition += 10;
      doc.text('• Indicates learning potential and adaptability', 20, yPosition);
    } else if (testType === 'communication') {
      doc.text('Communication Skills Summary:', 20, yPosition);
      yPosition += 10;
      doc.text('• Assesses verbal and written communication abilities', 20, yPosition);
      yPosition += 10;
      doc.text('• Evaluates professional interaction skills', 20, yPosition);
      yPosition += 10;
      doc.text('• Important for collaboration and leadership roles', 20, yPosition);
    }
    */
    
    yPosition += 20;
    doc.text('Recommendations:', 20, yPosition);
    yPosition += 10;
    
    if ((result.percentageScore || 0) >= 80) {
      doc.text('• Strong performance indicates high suitability for role', 20, yPosition);
      yPosition += 10;
      doc.text('• Consider for leadership or advanced responsibilities', 20, yPosition);
      yPosition += 10;
      doc.text('• Excellent candidate for team collaboration', 20, yPosition);
    } else if ((result.percentageScore || 0) >= 60) {
      doc.text('• Good performance with room for development', 20, yPosition);
      yPosition += 10;
      doc.text('• Suitable for role with appropriate support', 20, yPosition);
      yPosition += 10;
      doc.text('• Consider targeted training programs', 20, yPosition);
    } else {
      doc.text('• Performance indicates need for significant development', 20, yPosition);
      yPosition += 10;
      doc.text('• Recommend comprehensive training program', 20, yPosition);
      yPosition += 10;
      doc.text('• Close supervision and mentoring advised', 20, yPosition);
    }
    
    // Footer
    doc.setFontSize(10);
    doc.text(`Generated by Q361 Business Management System - ${new Date().toLocaleDateString()}`, 20, 280);
    doc.text('CONFIDENTIAL - For HR Use Only', 20, 290);
    
    doc.save(`Psychometric_Report_${result.candidateName}_${result.testId}.pdf`);
  };

  const generateBatchReport = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Batch Psychometric Assessment Report', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 50);
    doc.text(`Total Assessments: ${filteredResults.length}`, 20, 60);
    
    // Statistics
    const avgScore = filteredResults.reduce((sum: number, r) => sum + (r.percentageScore || 0), 0) / filteredResults.length;
    const excellentCount = filteredResults.filter((r) => (r.percentageScore || 0) >= 80).length;
    const goodCount = filteredResults.filter((r) => (r.percentageScore || 0) >= 60 && (r.percentageScore || 0) < 80).length;
    const improvementCount = filteredResults.filter((r) => (r.percentageScore || 0) < 60).length;
    
    doc.text(`Average Score: ${avgScore.toFixed(1)}%`, 20, 80);
    doc.text(`Excellent (80%+): ${excellentCount} candidates`, 20, 90);
    doc.text(`Good (60-79%): ${goodCount} candidates`, 20, 100);
    doc.text(`Needs Improvement (<60%): ${improvementCount} candidates`, 20, 110);
    
    // Individual Results Table
    doc.text('Individual Results:', 20, 130);
    
    let yPos = 140;
    doc.setFontSize(10);
    doc.text('Employee', 20, yPos);
    doc.text('Test', 80, yPos);
    doc.text('Score', 130, yPos);
    doc.text('Status', 160, yPos);
    
    yPos += 10;
    filteredResults.slice(0, 20).forEach((result) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
      }
      
      doc.text(result.candidateName || 'Unknown', 20, yPos);
      doc.text(result.testId.toString(), 80, yPos);
      doc.text(`${result.percentageScore || 0}%`, 130, yPos);
      doc.text(getScoreLabel(result.percentageScore || 0), 160, yPos);
      yPos += 8;
    });
    
    if (filteredResults.length > 20) {
      doc.text(`... and ${filteredResults.length - 20} more results`, 20, yPos + 10);
    }
    
    doc.save(`Batch_Psychometric_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const viewDetailedResult = (result: PsychometricTestAttempt) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  if (user?.role !== 'hr_admin') {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 text-center">
            Psychometric test results are confidential and only accessible to HR administrators.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Psychometric Assessment Results</h1>
          <p className="text-gray-600">View and analyze all employee assessment results (HR Only)</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={generateBatchReport} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Download Batch Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Assessments</p>
                <p className="text-2xl font-bold text-gray-900">{results.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {results.length > 0 ? Math.round(results.reduce((sum: number, r) => sum + (r.percentageScore || 0), 0) / results.length) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Excellent (80%{`+`})</p>
                <p className="text-2xl font-bold text-gray-900">
                  {results.filter((r) => (r.percentageScore || 0) >= 80).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Need Support ({`<`}60%)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {results.filter((r) => (r.percentageScore || 0) < 60).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employee or test..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Candidate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Candidates</SelectItem>
                {uniqueCandidates.map((candidate) => (
                  <SelectItem key={candidate.email} value={candidate.email}>
                    {candidate.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedTest} onValueChange={setSelectedTest}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Test" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tests</SelectItem>
                {tests.map((test) => (
                  <SelectItem key={test.id} value={test.id.toString()}>
                    {test.testName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedEmployee('all');
                setSelectedTest('all');
                setSearchQuery('');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Results ({filteredResults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-600">
                {results.length === 0 
                  ? "No psychometric assessments have been completed yet."
                  : "No results match your current filters."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResults.map((result, index: number) => (
                    <tr key={`${result.candidateEmail}-${result.testId}-${result.completedAt}-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {result.candidateName || 'Unknown Candidate'}
                        </div>
                        <div className="text-sm text-gray-500">{result.candidateEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Test ID: {result.testId}</div>
                        <div className="text-sm text-gray-500">Status: {result.status}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-semibold text-gray-900">
                          {result.percentageScore || 0}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getScoreColor(result.percentageScore || 0)}>
                          {getScoreLabel(result.percentageScore || 0)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {result.completedAt ? new Date(result.completedAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { window.location.href = `/psychometric-report/${encodeURIComponent(result.candidateEmail)}`; }}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                        >
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Detailed Report
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewDetailedResult(result)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Quick View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateIndividualReport(result)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Result Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detailed Assessment Result</DialogTitle>
          </DialogHeader>
          
          {selectedResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Candidate Information</h3>
                  <div className="mt-2 space-y-1">
                    <p><strong>Name:</strong> {selectedResult.candidateName}</p>
                    <p><strong>Email:</strong> {selectedResult.candidateEmail}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900">Assessment Details</h3>
                  <div className="mt-2 space-y-1">
                    <p><strong>Test ID:</strong> {selectedResult.testId}</p>
                    <p><strong>Status:</strong> {selectedResult.status}</p>
                    <p><strong>Date:</strong> {selectedResult.completedAt ? new Date(selectedResult.completedAt).toLocaleString() : 'N/A'}</p>
                    <p><strong>Duration:</strong> {selectedResult.timeSpent ? Math.round(selectedResult.timeSpent / 60) : 0} minutes</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Performance Summary</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Overall Score</span>
                    <Badge className={getScoreColor(selectedResult.percentageScore || 0)}>
                      {selectedResult.percentageScore || 0}% - {getScoreLabel(selectedResult.percentageScore || 0)}
                    </Badge>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${selectedResult.percentageScore || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">HR Recommendations</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  {(selectedResult.percentageScore || 0) >= 80 ? (
                    <div className="space-y-2">
                      <p className="font-medium text-blue-900">Excellent Performance</p>
                      <ul className="text-blue-800 space-y-1">
                        <li>• Strong candidate for leadership roles</li>
                        <li>• Suitable for complex project assignments</li>
                        <li>• Consider for mentoring opportunities</li>
                        <li>• Minimal supervision required</li>
                      </ul>
                    </div>
                  ) : (selectedResult.percentageScore || 0) >= 60 ? (
                    <div className="space-y-2">
                      <p className="font-medium text-yellow-900">Good Performance</p>
                      <ul className="text-yellow-800 space-y-1">
                        <li>• Suitable for role with standard support</li>
                        <li>• Consider targeted skill development</li>
                        <li>• Regular feedback and coaching recommended</li>
                        <li>• Monitor progress in initial months</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-medium text-red-900">Needs Improvement</p>
                      <ul className="text-red-800 space-y-1">
                        <li>• Comprehensive training program recommended</li>
                        <li>• Close supervision and mentoring required</li>
                        <li>• Regular assessment and feedback sessions</li>
                        <li>• Consider alternative role assignments</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Question and Answer Review */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Question by Question Review</h3>
                <div className="space-y-3">
                  {(() => {
                    try {
                      const results = typeof selectedResult.results === 'string' 
                        ? JSON.parse(selectedResult.results) 
                        : selectedResult.results;
                      
                      if (results?.detailedAnswers && Array.isArray(results.detailedAnswers)) {
                        return results.detailedAnswers.map((answer: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 mb-2">
                                  Question {index + 1}: {answer.questionText}
                                </p>
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <span className="text-sm text-gray-600 mr-2">Your Answer:</span>
                                    <span className="font-medium">{answer.selectedAnswer}</span>
                                  </div>
                                  {answer.correctAnswer && (
                                    <div className="flex items-center">
                                      <span className="text-sm text-gray-600 mr-2">Correct Answer:</span>
                                      <span className="font-medium text-green-600">{answer.correctAnswer}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="ml-4">
                                {answer.isCorrect ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Correct
                                  </Badge>
                                ) : answer.correctAnswer ? (
                                  <Badge className="bg-red-100 text-red-800">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Incorrect
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800">
                                    No Scoring
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ));
                      } else if (selectedResult.responses) {
                        // Fallback to basic responses if detailed answers not available
                        const responses = typeof selectedResult.responses === 'string'
                          ? JSON.parse(selectedResult.responses)
                          : selectedResult.responses;
                        
                        return Array.isArray(responses) ? responses.map((response: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">Question {response.questionId}</p>
                                <p className="text-sm text-gray-600">Answer: {response.selectedAnswer}</p>
                              </div>
                            </div>
                          </div>
                        )) : <p className="text-gray-500">No response data available</p>;
                      } else {
                        return <p className="text-gray-500">No detailed answers available</p>;
                      }
                    } catch (error) {
                      return <p className="text-gray-500">Error loading answer details</p>;
                    }
                  })()}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => generateIndividualReport(selectedResult)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}