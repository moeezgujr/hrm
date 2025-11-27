import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface PsychometricTest {
  id: number;
  testName: string;
  testType: string;
  description: string;
  instructions: string;
  timeLimit: number;
  totalQuestions: number;
  isActive: boolean;
  questions: Array<{
    id: number;
    questionText: string;
    questionType: string;
    options: any;
    category: string;
    order: number;
  }>;
}

export function PsychometricTestsPDFExport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: tests = [], isLoading } = useQuery<PsychometricTest[]>({
    queryKey: ['/api/psychometric-tests/export'],
  });

  const generatePDF = async () => {
    if (!tests || tests.length === 0) {
      toast({
        title: "No Data",
        description: "No psychometric tests available to export",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Title page
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Psychometric Tests Collection', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString();
      pdf.text(`Generated on: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      pdf.text(`Total Tests: ${tests.length}`, pageWidth / 2, yPosition, { align: 'center' });

      // Table of Contents
      yPosition += 30;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Table of Contents', margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      tests.forEach((test, index) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(`${index + 1}. ${test.testName}`, margin + 10, yPosition);
        pdf.text(`${test.testType.replace('_', ' ').toUpperCase()}`, pageWidth - margin - 50, yPosition);
        yPosition += 8;
      });

      // Test details
      tests.forEach((test, testIndex) => {
        pdf.addPage();
        yPosition = margin;

        // Test header
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        const testTitle = `${testIndex + 1}. ${test.testName}`;
        pdf.text(testTitle, margin, yPosition);
        
        yPosition += 15;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        // Test type badge
        pdf.setFillColor(59, 130, 246);
        pdf.rect(margin, yPosition - 5, 60, 12, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.text(test.testType.replace('_', ' ').toUpperCase(), margin + 2, yPosition + 2);
        pdf.setTextColor(0, 0, 0);
        
        // Test metadata
        yPosition += 20;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Test Information:', margin, yPosition);
        
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Time Limit: ${test.timeLimit} minutes`, margin + 10, yPosition);
        yPosition += 6;
        pdf.text(`Total Questions: ${test.totalQuestions}`, margin + 10, yPosition);
        yPosition += 6;
        pdf.text(`Status: ${test.isActive ? 'Active' : 'Inactive'}`, margin + 10, yPosition);
        
        // Description
        yPosition += 15;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Description:', margin, yPosition);
        
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        const descriptionLines = pdf.splitTextToSize(test.description, maxWidth);
        pdf.text(descriptionLines, margin, yPosition);
        yPosition += descriptionLines.length * 6;
        
        // Instructions
        yPosition += 10;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Instructions:', margin, yPosition);
        
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        const instructionLines = pdf.splitTextToSize(test.instructions, maxWidth);
        pdf.text(instructionLines, margin, yPosition);
        yPosition += instructionLines.length * 6;
        
        // Questions
        if (test.questions && test.questions.length > 0) {
          yPosition += 15;
          pdf.setFont('helvetica', 'bold');
          pdf.text('Questions:', margin, yPosition);
          
          test.questions.forEach((question, questionIndex) => {
            if (yPosition > pageHeight - 50) {
              pdf.addPage();
              yPosition = margin;
            }
            
            yPosition += 10;
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Q${questionIndex + 1}.`, margin, yPosition);
            
            pdf.setFont('helvetica', 'normal');
            const questionLines = pdf.splitTextToSize(question.questionText, maxWidth - 20);
            pdf.text(questionLines, margin + 15, yPosition);
            yPosition += questionLines.length * 6;
            
            // Question options (if available)
            if (question.options) {
              try {
                const options = typeof question.options === 'string' 
                  ? JSON.parse(question.options) 
                  : question.options;
                
                if (Array.isArray(options)) {
                  options.forEach((option: any, optionIndex: number) => {
                    if (yPosition > pageHeight - 30) {
                      pdf.addPage();
                      yPosition = margin;
                    }
                    yPosition += 5;
                    const optionText = typeof option === 'string' ? option : option.text || option.label || String(option);
                    pdf.text(`${String.fromCharCode(97 + optionIndex)}) ${optionText}`, margin + 20, yPosition);
                  });
                }
              } catch (e) {
                // Skip if options can't be parsed
              }
            }
            
            // Question category
            if (question.category) {
              yPosition += 8;
              pdf.setFontSize(9);
              pdf.setTextColor(128, 128, 128);
              pdf.text(`Category: ${question.category}`, margin + 15, yPosition);
              pdf.setTextColor(0, 0, 0);
              pdf.setFontSize(12);
            }
            
            yPosition += 5;
          });
        }
      });

      // Save the PDF
      const filename = `Psychometric_Tests_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      toast({
        title: "Success",
        description: `PDF exported successfully as ${filename}`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading tests...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Export Psychometric Tests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Export all psychometric tests with questions and details in PDF format.</p>
            <p className="mt-2">
              <strong>Available Tests:</strong> {tests.length}
            </p>
          </div>
          
          {tests.length > 0 && (
            <div className="space-y-2">
              {tests.map((test, index) => (
                <div key={test.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium">{index + 1}.</span>
                    <span className="text-sm">{test.testName}</span>
                    <Badge variant="secondary" className="text-xs">
                      {test.testType.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {test.questions?.length || 0} questions
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button 
            onClick={generatePDF}
            disabled={isGenerating || tests.length === 0}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}