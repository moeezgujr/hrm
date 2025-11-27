import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, Users, ClipboardCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { useQuery } from '@tanstack/react-query';

interface EmployeeSubmission {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  department: string;
  position: string;
  startDate: string;
  salary: number;
  education: string;
  emergencyContact: string;
  emergencyPhone: string;
  status: string;
  submittedAt: string;
  hrStepsCompleted: string[];
  hrStepsNotes: Record<string, string>;
}

export default function EmployeeOnboardingPDFExport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: submissions = [], isLoading } = useQuery<EmployeeSubmission[]>({
    queryKey: ['/api/onboarding/employee-submissions'],
  });

  const generateEmployeeSubmissionsPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Employee Onboarding Submissions Report', 20, yPosition);
      yPosition += 20;

      // Subtitle
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
      doc.text(`Total Submissions: ${submissions.length}`, 20, yPosition + 10);
      yPosition += 30;

      // Process each submission
      submissions.forEach((submission, index) => {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }

        // Employee header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${submission.firstName} ${submission.lastName}`, 20, yPosition);
        yPosition += 15;

        // Personal Information
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const personalInfo = [
          `Email: ${submission.email}`,
          `Phone: ${submission.phone}`,
          `Address: ${submission.address}, ${submission.city}, ${submission.state} ${submission.zipCode}`,
          `Department: ${submission.department}`,
          `Position: ${submission.position}`,
          `Start Date: ${submission.startDate}`,
          `Salary: $${submission.salary?.toLocaleString() || 'N/A'}`,
          `Education: ${submission.education}`,
          `Emergency Contact: ${submission.emergencyContact} (${submission.emergencyPhone})`,
          `Status: ${submission.status}`,
          `Submitted: ${new Date(submission.submittedAt).toLocaleDateString()}`
        ];

        personalInfo.forEach((info) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(info, 25, yPosition);
          yPosition += 6;
        });

        // HR Steps Progress
        yPosition += 5;
        doc.setFont('helvetica', 'bold');
        doc.text(`HR Steps Completed: ${submission.hrStepsCompleted?.length || 0}/15`, 25, yPosition);
        yPosition += 8;

        if (submission.hrStepsCompleted?.length > 0) {
          doc.setFont('helvetica', 'normal');
          submission.hrStepsCompleted.forEach((stepId) => {
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(`✓ Step ${stepId}`, 30, yPosition);
            if (submission.hrStepsNotes?.[stepId]) {
              yPosition += 5;
              doc.text(`  Note: ${submission.hrStepsNotes[stepId]}`, 35, yPosition);
            }
            yPosition += 6;
          });
        }

        yPosition += 15;
      });

      // Save the PDF
      doc.save('employee-onboarding-submissions.pdf');

      toast({
        title: "PDF Generated Successfully",
        description: `Downloaded ${submissions.length} employee onboarding submissions`,
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

  const generateSummaryReportPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Onboarding Summary Report', 20, yPosition);
      yPosition += 30;

      // Statistics
      const statusCounts = submissions.reduce((acc, sub) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const departmentCounts = submissions.reduce((acc, sub) => {
        acc[sub.department] = (acc[sub.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Status Overview:', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      Object.entries(statusCounts).forEach(([status, count]) => {
        doc.text(`${status}: ${count} employees`, 30, yPosition);
        yPosition += 8;
      });

      yPosition += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Department Distribution:', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      Object.entries(departmentCounts).forEach(([dept, count]) => {
        doc.text(`${dept}: ${count} employees`, 30, yPosition);
        yPosition += 8;
      });

      // Recent submissions
      yPosition += 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recent Submissions (Last 10):', 20, yPosition);
      yPosition += 15;

      const recentSubmissions = submissions
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 10);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      recentSubmissions.forEach((sub) => {
        doc.text(`${sub.firstName} ${sub.lastName} - ${sub.department} - ${new Date(sub.submittedAt).toLocaleDateString()}`, 30, yPosition);
        yPosition += 8;
      });

      doc.save('onboarding-summary-report.pdf');

      toast({
        title: "Summary Report Generated",
        description: "Downloaded onboarding summary report",
      });
    } catch (error) {
      console.error('Error generating summary PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate summary report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateOnboardingTemplatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Employee Onboarding Template & Checklist', 20, yPosition);
      yPosition += 30;

      // Step 1: Employee Information
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('STEP 1: EMPLOYEE SELF-SERVICE PORTAL', 20, yPosition);
      yPosition += 20;

      const step1Items = [
        '1. Personal Information',
        '   • First Name, Last Name',
        '   • Date of Birth, Social Security Number',
        '   • Preferred Pronouns',
        '',
        '2. Contact Details',
        '   • Email Address, Phone Number',
        '   • Alternative Contact Information',
        '',
        '3. Address Information',
        '   • Street Address, City, State, ZIP Code',
        '   • Mailing Address (if different)',
        '',
        '4. Employment Information',
        '   • Department, Position Title',
        '   • Start Date, Salary',
        '   • Direct Supervisor',
        '',
        '5. Education & Emergency Contact',
        '   • Highest Level of Education',
        '   • Emergency Contact Name and Phone',
        '',
        '6. Additional Information & Acknowledgments',
        '   • Special Accommodations',
        '   • Terms and Conditions Agreement',
        '   • Privacy Policy Acknowledgment'
      ];

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      step1Items.forEach((item) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(item, 20, yPosition);
        yPosition += 6;
      });

      // Step 2: HR Administrative Process
      doc.addPage();
      yPosition = 20;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('STEP 2: HR ADMINISTRATIVE PROCESS', 20, yPosition);
      yPosition += 20;

      const hrCategories = [
        {
          title: 'Pre-arrival Setup',
          items: ['Workspace preparation', 'Equipment ordering', 'Account creation requests']
        },
        {
          title: 'IT Setup',
          items: ['Computer setup', 'Software installation', 'Network access configuration']
        },
        {
          title: 'Access & Permissions',
          items: ['Building access card', 'System permissions', 'Security clearance']
        },
        {
          title: 'Documentation',
          items: ['Contract preparation', 'Policy documents', 'Handbook materials', 'Benefits enrollment']
        },
        {
          title: 'Orientation & Integration',
          items: ['Welcome meeting scheduled', 'Team introductions', '90-day review planning']
        }
      ];

      hrCategories.forEach((category) => {
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(category.title, 20, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        category.items.forEach((item) => {
          doc.text(`☐ ${item}`, 25, yPosition);
          yPosition += 8;
        });
        yPosition += 5;
      });

      doc.save('onboarding-template-checklist.pdf');

      toast({
        title: "Template Generated",
        description: "Downloaded onboarding template and checklist",
      });
    } catch (error) {
      console.error('Error generating template PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">PDF Export Center</h1>
        <p className="text-gray-600">Download comprehensive reports and templates for your onboarding system</p>
      </div>

      <Tabs defaultValue="submissions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="submissions">Employee Submissions</TabsTrigger>
          <TabsTrigger value="summary">Summary Report</TabsTrigger>
          <TabsTrigger value="template">Template & Checklist</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Submissions Report
              </CardTitle>
              <CardDescription>
                Download a detailed PDF containing all employee onboarding submissions with their personal information, 
                employment details, and HR progress status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total Submissions: {submissions.length}</p>
                  <p className="text-sm text-gray-600">Complete employee data with HR processing status</p>
                </div>
                <Button 
                  onClick={generateEmployeeSubmissionsPDF}
                  disabled={isGenerating || submissions.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isGenerating ? 'Generating...' : 'Download PDF'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Summary Report
              </CardTitle>
              <CardDescription>
                Generate a summary report with statistics, status breakdowns, and department distribution 
                of all onboarding submissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Executive Summary</p>
                  <p className="text-sm text-gray-600">Status overview, department analytics, and recent activity</p>
                </div>
                <Button 
                  onClick={generateSummaryReportPDF}
                  disabled={isGenerating || submissions.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isGenerating ? 'Generating...' : 'Download Report'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Onboarding Template & Checklist
              </CardTitle>
              <CardDescription>
                Download a comprehensive template showing the complete two-phase onboarding process, 
                including all steps and requirements for both employees and HR staff.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Complete Process Guide</p>
                  <p className="text-sm text-gray-600">6-step employee portal + 15-task HR checklist</p>
                </div>
                <Button 
                  onClick={generateOnboardingTemplatePDF}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isGenerating ? 'Generating...' : 'Download Template'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {submissions.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <FileText className="h-5 w-5" />
              <p className="text-sm">
                No employee submissions found. The template and checklist are still available for download.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}