import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, User, Brain, CheckCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import jsPDF from 'jspdf';

interface PersonalityFactor {
  factor: string;
  category: string;
  stenScore: number;
  level: string;
  lowLabel: string;
  highLabel: string;
  interpretation: string;
  questionsAnswered: number;
}

interface DetailedTestResult {
  testName: string;
  testType: string;
  candidateInfo: {
    name: string;
    email: string;
  };
  overallScore: number;
  averageStenScore?: number;
  completionTime: number;
  personalityFactors?: PersonalityFactor[];
  profileSummary?: string;
  questionsWithAnswers: Array<{
    questionId: number;
    questionText: string;
    category: string;
    selectedAnswer: string;
    selectedValue: number;
    options: Array<{ text: string; value: number }>;
  }>;
  recommendations: {
    hiring: string[];
    development: string[];
    placement: string[];
  };
  strengths: string[];
  areasForImprovement: string[];
}

export default function PsychometricReport() {
  const { email } = useParams<{ email: string }>();
  const decodedEmail = email ? decodeURIComponent(email) : '';

  const { data: analysis, isLoading, error } = useQuery<DetailedTestResult>({
    queryKey: [`/api/psychometric-analysis/${decodedEmail}`],
    enabled: !!decodedEmail,
    retry: false,
  });

  // Log for debugging
  if (analysis) {
    console.log('Analysis loaded:', analysis);
    console.log('Questions with answers:', analysis.questionsWithAnswers?.length || 0);
  }
  if (error) {
    console.error('Error loading analysis:', error);
  }

  const generatePDF = () => {
    if (!analysis) {
      alert('No analysis data available');
      return;
    }
    
    const doc = new jsPDF();
    let yPos = 20;
    
    // Title
    doc.setFontSize(18);
    doc.text('16PF Psychometric Assessment Report', 20, yPos);
    yPos += 15;
    
    // Candidate Info
    doc.setFontSize(11);
    doc.text(`Candidate: ${analysis.candidateInfo.name}`, 20, yPos);
    yPos += 7;
    doc.text(`Email: ${analysis.candidateInfo.email}`, 20, yPos);
    yPos += 7;
    doc.text(`Test: ${analysis.testName}`, 20, yPos);
    yPos += 7;
    doc.text(`Overall Score: ${analysis.overallScore}/100`, 20, yPos);
    if (analysis.averageStenScore) {
      yPos += 7;
      doc.text(`Average Sten Score: ${analysis.averageStenScore}/10`, 20, yPos);
    }
    yPos += 12;

    // Profile Summary
    if (analysis.profileSummary) {
      doc.setFontSize(12);
      doc.text('Profile Summary', 20, yPos);
      yPos += 8;
      doc.setFontSize(9);
      const summaryLines = doc.splitTextToSize(analysis.profileSummary, 170);
      summaryLines.forEach((line: string) => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 5;
      });
      yPos += 8;
    }

    // 16PF Personality Factors
    if (analysis.personalityFactors && analysis.personalityFactors.length > 0) {
      doc.setFontSize(12);
      doc.text('16 Personality Factor Scores', 20, yPos);
      yPos += 10;
      
      analysis.personalityFactors.forEach((factor) => {
        if (yPos > 260) { doc.addPage(); yPos = 20; }
        
        doc.setFontSize(10);
        doc.text(`${factor.factor}: ${factor.stenScore}/10 (${factor.level})`, 20, yPos);
        yPos += 5;
        
        doc.setFontSize(8);
        const interpLines = doc.splitTextToSize(`  ${factor.lowLabel} ← → ${factor.highLabel}: ${factor.interpretation}`, 165);
        interpLines.forEach((line: string) => {
          if (yPos > 270) { doc.addPage(); yPos = 20; }
          doc.text(line, 25, yPos);
          yPos += 4;
        });
        yPos += 3;
      });
      yPos += 5;
    }

    // Strengths
    doc.addPage();
    yPos = 20;
    doc.setFontSize(12);
    doc.text('Key Strengths', 20, yPos);
    yPos += 8;
    doc.setFontSize(9);
    analysis.strengths.forEach((strength) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      const lines = doc.splitTextToSize(`• ${strength}`, 170);
      lines.forEach((line: string) => {
        doc.text(line, 20, yPos);
        yPos += 5;
      });
    });
    yPos += 8;

    // Areas for Improvement
    doc.setFontSize(12);
    doc.text('Areas for Improvement', 20, yPos);
    yPos += 8;
    doc.setFontSize(9);
    analysis.areasForImprovement.forEach((area) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      const lines = doc.splitTextToSize(`• ${area}`, 170);
      lines.forEach((line: string) => {
        doc.text(line, 20, yPos);
        yPos += 5;
      });
    });
    yPos += 8;

    // Recommendations
    doc.setFontSize(12);
    doc.text('HR Recommendations', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.text('Hiring:', 20, yPos);
    yPos += 6;
    doc.setFontSize(9);
    analysis.recommendations.hiring.forEach((rec) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      const lines = doc.splitTextToSize(`  • ${rec}`, 165);
      lines.forEach((line: string) => {
        doc.text(line, 25, yPos);
        yPos += 5;
      });
    });
    yPos += 5;
    doc.setFontSize(10);
    doc.text('Development:', 20, yPos);
    yPos += 6;
    doc.setFontSize(9);
    analysis.recommendations.development.forEach((rec) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      const lines = doc.splitTextToSize(`  • ${rec}`, 165);
      lines.forEach((line: string) => {
        doc.text(line, 25, yPos);
        yPos += 5;
      });
    });
    yPos += 5;
    doc.setFontSize(10);
    doc.text('Role Placement:', 20, yPos);
    yPos += 6;
    doc.setFontSize(9);
    analysis.recommendations.placement.forEach((rec) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      const lines = doc.splitTextToSize(`  • ${rec}`, 165);
      lines.forEach((line: string) => {
        doc.text(line, 25, yPos);
        yPos += 5;
      });
    });
    
    // Questions & Answers on new page
    doc.addPage();
    yPos = 20;
    doc.setFontSize(12);
    doc.text('Detailed Question Responses', 20, yPos);
    yPos += 10;
    
    const questions = analysis.questionsWithAnswers || [];
    questions.forEach((q, idx) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(9);
      const qText = `Q${idx + 1}. [${q.category}] ${q.questionText || 'N/A'}`;
      const qLines = doc.splitTextToSize(qText, 170);
      qLines.forEach((line: string) => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 4;
      });
      
      doc.setFontSize(8);
      doc.text(`   Answer: ${q.selectedAnswer || 'N/A'}`, 20, yPos);
      yPos += 6;
    });
    
    doc.save(`16PF_Report_${analysis.candidateInfo.name.replace(/\s+/g, '_')}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing psychometric test results...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Brain className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Analysis Not Available</h2>
          <p className="text-gray-600">Unable to load psychometric test analysis for this candidate.</p>
          <p className="text-sm text-gray-500 mt-4">Email: {decodedEmail}</p>
          <p className="text-sm text-gray-500">Error: {error ? String(error) : 'No data received'}</p>
        </div>
      </div>
    );
  }

  const scoreColor = analysis.overallScore >= 75 ? 'bg-green-100 text-green-800' :
    analysis.overallScore >= 60 ? 'bg-blue-100 text-blue-800' :
      'bg-orange-100 text-orange-800';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Psychometric Assessment Report</h1>
          <p className="text-gray-600 mt-1">Detailed analysis and candidate responses</p>
        </div>
        <Button onClick={generatePDF} className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Candidate Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Candidate Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-semibold text-gray-900">{analysis.candidateInfo.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-semibold text-gray-900">{analysis.candidateInfo.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Test</p>
            <p className="font-semibold text-gray-900">{analysis.testName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Time Spent</p>
            <p className="font-semibold text-gray-900">{Math.round(analysis.completionTime / 60)} min</p>
          </div>
        </CardContent>
      </Card>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Overall Assessment Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className={`${scoreColor} rounded-lg p-8 text-center`}>
              <p className="text-5xl font-bold">{analysis.overallScore}</p>
              <p className="text-sm mt-2">Out of 100</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-4">Performance Level</p>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-3 rounded-full"
                  style={{ width: `${analysis.overallScore}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Summary */}
      {analysis.profileSummary && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Brain className="w-5 h-5" />
              16PF Profile Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{analysis.profileSummary}</p>
            {analysis.averageStenScore && (
              <div className="mt-4 flex items-center gap-4">
                <Badge variant="outline" className="text-purple-700 border-purple-300 bg-white">
                  Average Sten Score: {analysis.averageStenScore}/10
                </Badge>
                <Badge variant="outline" className="text-blue-700 border-blue-300 bg-white">
                  {analysis.personalityFactors?.length || 0} Factors Measured
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 16PF Personality Factors */}
      {analysis.personalityFactors && analysis.personalityFactors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              16 Personality Factor Scores (Sten Scale 1-10)
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Sten scores: 1-3 = Low, 4-7 = Average, 8-10 = High
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analysis.personalityFactors.map((factor, idx) => (
                <div key={idx} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm
                        ${factor.stenScore >= 8 ? 'bg-green-600' : 
                          factor.stenScore >= 4 ? 'bg-blue-600' : 'bg-orange-500'}`}>
                        {factor.stenScore}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{factor.factor}</h4>
                        <p className="text-xs text-gray-500">{factor.questionsAnswered} questions</p>
                      </div>
                    </div>
                    <Badge 
                      className={
                        factor.level === 'High' ? 'bg-green-100 text-green-800 border-green-300' :
                        factor.level === 'Low' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                        'bg-blue-100 text-blue-800 border-blue-300'
                      }
                    >
                      {factor.level === 'High' && <TrendingUp className="w-3 h-3 mr-1" />}
                      {factor.level === 'Low' && <TrendingDown className="w-3 h-3 mr-1" />}
                      {factor.level === 'Average' && <Minus className="w-3 h-3 mr-1" />}
                      {factor.level}
                    </Badge>
                  </div>
                  
                  {/* Sten Score Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{factor.lowLabel}</span>
                      <span>{factor.highLabel}</span>
                    </div>
                    <div className="relative w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          factor.stenScore >= 8 ? 'bg-green-500' : 
                          factor.stenScore >= 4 ? 'bg-blue-500' : 'bg-orange-400'
                        }`}
                        style={{ width: `${(factor.stenScore / 10) * 100}%` }}
                      />
                      {/* Score marker */}
                      <div 
                        className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border-2 border-gray-700 rounded-full"
                        style={{ left: `calc(${(factor.stenScore / 10) * 100}% - 6px)` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1</span>
                      <span>5</span>
                      <span>10</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">{factor.interpretation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths & Development Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Key Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.strengths.map((strength, idx) => (
                <li key={idx} className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.areasForImprovement.map((area, idx) => (
                <li key={idx} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-orange-700">!</span>
                  </div>
                  <span className="text-gray-700">{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>HR Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Hiring Recommendations</h3>
            <ul className="space-y-2">
              {analysis.recommendations.hiring.map((rec, idx) => (
                <li key={idx} className="text-gray-700">• {rec}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Development Recommendations</h3>
            <ul className="space-y-2">
              {analysis.recommendations.development.map((rec, idx) => (
                <li key={idx} className="text-gray-700">• {rec}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Role Placement</h3>
            <ul className="space-y-2">
              {analysis.recommendations.placement.map((rec, idx) => (
                <li key={idx} className="text-gray-700">• {rec}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Questions & Answers */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Question Responses</CardTitle>
          <p className="text-sm text-gray-600">Complete answers to all assessment questions ({analysis.questionsWithAnswers?.length || 0} questions)</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {analysis.questionsWithAnswers && analysis.questionsWithAnswers.length > 0 ? (
              analysis.questionsWithAnswers.map((question, idx) => (
                <div key={question.questionId} className="border-b pb-6 last:border-b-0 last:pb-0">
                  <div className="flex gap-4 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{question.questionText}</p>
                      <Badge variant="outline" className="mt-2">{question.category}</Badge>
                    </div>
                  </div>

                  <div className="ml-12 space-y-2">
                    <p className="text-sm text-gray-600">Selected Answer:</p>
                    <div className="bg-green-50 border border-green-500 border-2 rounded p-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="font-semibold text-green-900">{question.selectedAnswer}</span>
                        <Badge className="ml-auto bg-green-600">Selected</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No question responses available.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
