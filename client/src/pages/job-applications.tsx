import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from 'jspdf';
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

// Define complete JobApplication type to match API response
type JobApplication = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  positionAppliedFor: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string | Date | null;
  department?: string;
  expectedSalary?: string;
  availableStartDate?: string;
  education?: string;
  experience?: string;
  skills?: string;
  references?: string;
  coverLetter?: string;
  whyJoinUs?: string;
  status?: 'submitted' | 'under_review' | 'interview_scheduled' | 'accepted' | 'rejected' | 'withdrawn';
  psychometricCompleted?: boolean;
  createdAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  resumeFile?: string;
  certificatesFile?: string;
  voiceIntroduction?: string;
  testResults?: any;
};
import { 
  FileText,
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserCheck,
  Eye,
  Download,
  Search,
  Send,
  GraduationCap,
  BrainCircuit,
  Volume2,
  Video,
  Users,
  AlertCircle,
  Brain
} from "lucide-react";
import { format } from "date-fns";

export default function JobApplications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showInterviewDialog, setShowInterviewDialog] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    date: "",
    time: "",
    type: "video",
    location: "",
    notes: ""
  });

  const { data: applications = [], isLoading } = useQuery<JobApplication[]>({
    queryKey: ["/api/applications"],
    retry: false,
  });

  // Fetch detailed application when one is selected
  const { data: applicationDetails, isLoading: isLoadingDetails } = useQuery<JobApplication>({
    queryKey: ["/api/applications", selectedApplication?.id],
    enabled: !!selectedApplication?.id,
    retry: false,
  });

  const updateApplicationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/applications/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Updated",
        description: "Application status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      setSelectedApplication(null);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update application status. Please try again.",
        variant: "destructive",
      });
    }
  });

  const acceptApplicationAndSendOnboarding = useMutation({
    mutationFn: async ({ 
      id, 
      startDate, 
      salary, 
      position 
    }: { 
      id: number; 
      startDate: string; 
      salary: string; 
      position: string; 
    }) => {
      const response = await apiRequest("POST", `/api/applications/${id}/accept`, {
        startDate,
        salary,
        position
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "🎉 Application Accepted!",
        description: "Acceptance email with onboarding link has been sent to the applicant.",
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      setSelectedApplication(null);
    },
    onError: (error) => {
      toast({
        title: "Acceptance Failed",
        description: "Failed to accept application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scheduleInterview = useMutation({
    mutationFn: async ({ 
      id, 
      interviewData 
    }: { 
      id: number; 
      interviewData: typeof interviewForm; 
    }) => {
      const response = await apiRequest("POST", `/api/applications/${id}/schedule-interview`, interviewData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "📅 Interview Scheduled!",
        description: "Interview details have been saved and notification email sent to candidate.",
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      setSelectedApplication(null);
      setShowInterviewDialog(false);
      setInterviewForm({ date: "", time: "", type: "video", location: "", notes: "" });
    },
    onError: (error) => {
      toast({
        title: "Scheduling Failed",
        description: "Failed to schedule interview. Please try again.",
        variant: "destructive",
      });
    },
  });

  const downloadCompleteApplication = async (application: JobApplication) => {
    try {
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const lineHeight = 6;
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10): number => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        for (let i = 0; i < lines.length; i++) {
          if (y + (i * lineHeight) > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(lines[i], x, y + (i * lineHeight));
        }
        return y + (lines.length * lineHeight) + 2;
      };

      // Helper function to check if we need a new page
      const checkNewPage = (additionalHeight: number = 10): number => {
        if (yPosition + additionalHeight > pageHeight - margin) {
          doc.addPage();
          return margin;
        }
        return yPosition;
      };

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("COMPLETE JOB APPLICATION PACKAGE", margin, yPosition);
      yPosition += 15;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`${application.firstName} ${application.lastName}`, margin, yPosition);
      yPosition += 10;

      // Document info
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
      doc.text("Business Management System - Meeting Matters", pageWidth - margin - 60, yPosition);
      yPosition += 15;

      // Personal Information Section
      yPosition = checkNewPage(20);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("PERSONAL INFORMATION", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const personalInfo = [
        `Full Name: ${application.firstName} ${application.lastName}`,
        `Email: ${application.email}`,
        `Phone: ${application.phone || 'Not provided'}`,
        `Address: ${application.address || 'Not provided'}`,
        `Date of Birth: ${application.dateOfBirth || 'Not provided'}`
      ];

      personalInfo.forEach(info => {
        yPosition = checkNewPage();
        doc.text(info, margin, yPosition);
        yPosition += lineHeight;
      });
      yPosition += 5;

      // Position Details Section
      yPosition = checkNewPage(20);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("POSITION DETAILS", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const positionInfo = [
        `Position Applied For: ${application.positionAppliedFor}`,
        `Department: ${application.department}`,
        `Expected Salary: ${application.expectedSalary || 'Not specified'}`,
        `Available Start Date: ${application.availableStartDate || 'Not specified'}`
      ];

      positionInfo.forEach(info => {
        yPosition = checkNewPage();
        doc.text(info, margin, yPosition);
        yPosition += lineHeight;
      });
      yPosition += 5;

      // Professional Background Section
      yPosition = checkNewPage(30);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("PROFESSIONAL BACKGROUND", margin, yPosition);
      yPosition += 8;

      // Education
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      yPosition = checkNewPage();
      doc.text("Education:", margin, yPosition);
      yPosition += 6;
      doc.setFont("helvetica", "normal");
      yPosition = addWrappedText(application.education || 'Not provided', margin, yPosition, pageWidth - 2 * margin, 10);
      yPosition += 3;

      // Experience
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      yPosition = checkNewPage();
      doc.text("Experience:", margin, yPosition);
      yPosition += 6;
      doc.setFont("helvetica", "normal");
      yPosition = addWrappedText(application.experience || 'Not provided', margin, yPosition, pageWidth - 2 * margin, 10);
      yPosition += 3;

      // Skills
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      yPosition = checkNewPage();
      doc.text("Skills:", margin, yPosition);
      yPosition += 6;
      doc.setFont("helvetica", "normal");
      yPosition = addWrappedText(application.skills || 'Not provided', margin, yPosition, pageWidth - 2 * margin, 10);
      yPosition += 3;

      // References
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      yPosition = checkNewPage();
      doc.text("References:", margin, yPosition);
      yPosition += 6;
      doc.setFont("helvetica", "normal");
      yPosition = addWrappedText(application.references || 'Not provided', margin, yPosition, pageWidth - 2 * margin, 10);
      yPosition += 5;

      // Application Essays Section
      yPosition = checkNewPage(30);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("APPLICATION ESSAYS", margin, yPosition);
      yPosition += 8;

      // Cover Letter
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      yPosition = checkNewPage();
      doc.text("Cover Letter:", margin, yPosition);
      yPosition += 6;
      doc.setFont("helvetica", "normal");
      yPosition = addWrappedText(application.coverLetter || 'Not provided', margin, yPosition, pageWidth - 2 * margin, 10);
      yPosition += 3;

      // Why Join Us
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      yPosition = checkNewPage();
      doc.text("Why Join Us:", margin, yPosition);
      yPosition += 6;
      doc.setFont("helvetica", "normal");
      yPosition = addWrappedText(application.whyJoinUs || 'Not provided', margin, yPosition, pageWidth - 2 * margin, 10);
      yPosition += 5;

      // Application Status Section
      yPosition = checkNewPage(25);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("APPLICATION STATUS", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const statusInfo = [
        `Status: ${application.status?.toUpperCase() || 'PENDING'}`,
        `Psychometric Assessment: ${application.psychometricCompleted ? 'COMPLETED' : 'PENDING'}`,
        `Application Date: ${application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'Not available'}`,
        `Reviewed By: ${application.reviewedBy || 'Not reviewed'}`,
        `Review Notes: ${application.reviewNotes || 'No notes'}`
      ];

      statusInfo.forEach(info => {
        yPosition = checkNewPage();
        doc.text(info, margin, yPosition);
        yPosition += lineHeight;
      });
      yPosition += 5;

      // Attached Documents Section
      yPosition = checkNewPage(20);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("ATTACHED DOCUMENTS", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const documentsInfo = [
        `Resume/CV: ${application.resumeFile ? 'INCLUDED' : 'NOT UPLOADED'}`,
        `Certificates: ${application.certificatesFile ? 'INCLUDED' : 'NOT UPLOADED'}`,
        `Voice Introduction: ${application.voiceIntroduction ? 'INCLUDED' : 'NOT RECORDED'}`
      ];

      documentsInfo.forEach(info => {
        yPosition = checkNewPage();
        doc.text(info, margin, yPosition);
        yPosition += lineHeight;
      });

      // Save PDF
      doc.save(`${application.firstName}_${application.lastName}_Complete_Application.pdf`);
      
      toast({
        title: "✅ Complete Application PDF Downloaded",
        description: `${application.firstName} ${application.lastName}'s complete application package has been downloaded as PDF.`,
        duration: 5000,
      });
    } catch (error) {
      console.error("Error downloading complete application PDF:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download complete application PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateHREvaluationReport = async (applicationId: number | undefined) => {
    if (!applicationId) {
      toast({
        title: "Error",
        description: "No application selected",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", `/api/applications/${applicationId}/generate-evaluation-report`);
      const data = await response.json();
      
      if (data.report) {
        // Open report in a new window
        const reportWindow = window.open('', '_blank');
        if (reportWindow) {
          reportWindow.document.write(`
            <html>
              <head>
                <title>HR Evaluation Report</title>
                <style>
                  body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    max-width: 800px; 
                    margin: 40px auto; 
                    padding: 20px; 
                    line-height: 1.6; 
                    background-color: #f8f9fa;
                  }
                  .report-container {
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  }
                  pre { 
                    white-space: pre-wrap; 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    font-size: 14px;
                    margin: 0;
                  }
                  @media print {
                    body { margin: 0; background: white; }
                    .report-container { box-shadow: none; }
                  }
                </style>
              </head>
              <body>
                <div class="report-container">
                  <pre>${data.report}</pre>
                </div>
              </body>
            </html>
          `);
          reportWindow.document.close();
        }
        
        toast({
          title: "Success",
          description: "HR evaluation report generated successfully",
        });
      }
    } catch (error) {
      console.error("Error generating HR evaluation report:", error);
      toast({
        title: "Error",
        description: "Failed to generate HR evaluation report",
        variant: "destructive",
      });
    }
  };

  // Filter applications
  const filteredApplications = applications.filter((app: JobApplication) => {
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    const matchesSearch = searchTerm === "" || 
      app.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.positionAppliedFor.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { variant: "secondary" as const, icon: Clock, color: "text-blue-600" },
      under_review: { variant: "default" as const, icon: Eye, color: "text-yellow-600" },
      interview_scheduled: { variant: "outline" as const, icon: Calendar, color: "text-purple-600" },
      accepted: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      rejected: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
      withdrawn: { variant: "secondary" as const, icon: XCircle, color: "text-gray-600" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const handleStatusUpdate = (status: string) => {
    if (selectedApplication) {
      updateApplicationStatus.mutate({ id: selectedApplication.id, status });
    }
  };

  const handleQuickAcceptance = () => {
    if (selectedApplication) {
      // Set default values for quick acceptance
      const today = new Date();
      const defaultStartDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks from now
      const defaultSalary = selectedApplication.expectedSalary || "50000"; // Use expected salary or default
      
      acceptApplicationAndSendOnboarding.mutate({
        id: selectedApplication.id,
        startDate: defaultStartDate.toISOString().split('T')[0],
        salary: defaultSalary,
        position: selectedApplication.positionAppliedFor
      });
    }
  };

  const downloadFile = (base64Data: string, filename: string) => {
    if (!base64Data) {
      toast({
        title: "File Not Available",
        description: "This file was not uploaded with the application.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Remove data URL prefix if present
      const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      
      // Convert base64 to blob
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      // Determine MIME type from filename or data URL
      let mimeType = 'application/pdf';
      if (base64Data.includes('data:')) {
        const match = base64Data.match(/data:([^;]+);/);
        if (match) {
          mimeType = match[1];
        }
      } else if (filename.toLowerCase().includes('voice') || filename.toLowerCase().includes('audio')) {
        mimeType = 'audio/webm';
      }
      
      // Map MIME type to file extension
      const mimeToExtension: Record<string, string> = {
        'application/pdf': 'pdf',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'audio/webm': 'webm',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
      };
      
      // Get the correct extension based on MIME type
      const correctExtension = mimeToExtension[mimeType] || 'pdf';
      
      // Replace the file extension in filename with the correct one
      const filenameParts = filename.split('.');
      filenameParts[filenameParts.length - 1] = correctExtension;
      const correctedFilename = filenameParts.join('.');
      
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = correctedFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: `${correctedFilename} is being downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Applications</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage pre-employment applications
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Applications</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <Label htmlFor="status-filter">Status Filter</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="grid gap-4">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Applications Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || filterStatus !== "all" 
                    ? "Try adjusting your search or filter criteria." 
                    : "No job applications have been submitted yet."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((application: JobApplication) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {application.firstName} {application.lastName}
                      </h3>
                      {getStatusBadge(application.status || 'submitted')}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{application.email}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>{application.phone}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4" />
                        <span>{application.positionAppliedFor}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Applied: {application.createdAt ? format(new Date(application.createdAt), 'MMM dd, yyyy') : 'Unknown'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{application.department}</span>
                      </div>
                      
                      {application.expectedSalary && (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">PKR {application.expectedSalary}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {application.status !== 'accepted' && application.status !== 'rejected' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          const defaultStartDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
                          const defaultSalary = application.expectedSalary || "50000";
                          
                          acceptApplicationAndSendOnboarding.mutate({
                            id: application.id,
                            startDate: defaultStartDate.toISOString().split('T')[0],
                            salary: defaultSalary,
                            position: application.positionAppliedFor
                          });
                        }}
                        disabled={acceptApplicationAndSendOnboarding.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {acceptApplicationAndSendOnboarding.isPending ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        ) : (
                          <Send className="w-3 h-3 mr-1" />
                        )}
                        Quick Accept
                      </Button>
                    )}
                    
                    <Dialog 
                      open={selectedApplication?.id === application.id} 
                      onOpenChange={(open) => {
                        if (!open) {
                          setSelectedApplication(null);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedApplication(application)}
                          data-testid={`view-details-${application.id}`}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto pb-16">
                        {selectedApplication && (
                          <>
                            <DialogHeader>
                              <DialogTitle className="flex items-center space-x-2">
                                <UserCheck className="w-5 h-5" />
                                <span>Application Details - {selectedApplication.firstName} {selectedApplication.lastName}</span>
                              </DialogTitle>
                              <DialogDescription>
                                Application for {selectedApplication.positionAppliedFor} position
                              </DialogDescription>
                            </DialogHeader>

                            {isLoadingDetails ? (
                              <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <span className="ml-2 text-sm text-gray-600">Loading application details...</span>
                              </div>
                            ) : (
                            (() => {
                              // Use detailed application data when available, fallback to list data
                              const displayApplication = applicationDetails || selectedApplication;
                              return (
                            <Tabs defaultValue="personal" className="w-full">
                              <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="personal" data-testid="tab-personal">Personal</TabsTrigger>
                                <TabsTrigger value="experience" data-testid="tab-experience">Experience</TabsTrigger>
                                <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
                                <TabsTrigger value="psychometric" data-testid="tab-psychometric">Psychometric</TabsTrigger>
                                <TabsTrigger value="actions" data-testid="tab-actions">Actions</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="personal" className="space-y-4 pb-12">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Full Name</Label>
                                    <p className="text-sm">{displayApplication.firstName} {displayApplication.lastName}</p>
                                  </div>
                                  <div>
                                    <Label>Date of Birth</Label>
                                    <p className="text-sm">{displayApplication.dateOfBirth ? (typeof displayApplication.dateOfBirth === 'string' ? displayApplication.dateOfBirth : new Date(displayApplication.dateOfBirth).toLocaleDateString()) : 'Not provided'}</p>
                                  </div>
                                  <div>
                                    <Label>Email</Label>
                                    <p className="text-sm">{displayApplication.email}</p>
                                  </div>
                                  <div>
                                    <Label>Phone</Label>
                                    <p className="text-sm">{displayApplication.phone}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <Label>Address</Label>
                                    <p className="text-sm">{displayApplication.address}</p>
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="experience" className="space-y-4 pb-12">
                                <div className="space-y-4">
                                  <div>
                                    <Label>Position Applied For</Label>
                                    <p className="text-sm">{displayApplication.positionAppliedFor}</p>
                                  </div>
                                  <div>
                                    <Label>Department</Label>
                                    <p className="text-sm">{displayApplication.department}</p>
                                  </div>
                                  <div>
                                    <Label>Expected Salary</Label>
                                    <p className="text-sm">{displayApplication.expectedSalary || 'Not specified'}</p>
                                  </div>
                                  <div>
                                    <Label>Available Start Date</Label>
                                    <p className="text-sm">{displayApplication.availableStartDate}</p>
                                  </div>
                                  <div>
                                    <Label>Education</Label>
                                    <Textarea value={displayApplication.education || 'No education information provided'} readOnly rows={3} />
                                  </div>
                                  <div>
                                    <Label>Experience</Label>
                                    <Textarea value={displayApplication.experience || 'No experience information provided'} readOnly rows={3} />
                                  </div>
                                  <div>
                                    <Label>Skills</Label>
                                    <Textarea value={displayApplication.skills || 'No skills information provided'} readOnly rows={3} />
                                  </div>
                                  <div>
                                    <Label>Cover Letter</Label>
                                    <Textarea value={displayApplication.coverLetter || 'No cover letter provided'} readOnly rows={4} />
                                  </div>
                                  <div>
                                    <Label>Why Join Us</Label>
                                    <Textarea value={displayApplication.whyJoinUs || 'No response provided'} readOnly rows={3} />
                                  </div>
                                  {displayApplication.references && (
                                    <div>
                                      <Label>References</Label>
                                      <Textarea value={displayApplication.references || 'No references provided'} readOnly rows={3} />
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="documents" className="space-y-4 pb-12">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <FileText className="w-8 h-8 text-blue-600" />
                                      <div>
                                        <p className="font-medium">Resume/CV</p>
                                        <p className="text-sm text-gray-600">
                                          {applicationDetails?.resumeFile ? "Uploaded" : "Not uploaded"}
                                        </p>
                                      </div>
                                    </div>
                                    {applicationDetails?.resumeFile && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadFile(applicationDetails?.resumeFile || '', `${selectedApplication.firstName}_${selectedApplication.lastName}_Resume.pdf`)}
                                      >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                      </Button>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <FileText className="w-8 h-8 text-green-600" />
                                      <div>
                                        <p className="font-medium">Certificates</p>
                                        <p className="text-sm text-gray-600">
                                          {applicationDetails?.certificatesFile ? "Uploaded" : "Not uploaded"}
                                        </p>
                                      </div>
                                    </div>
                                    {applicationDetails?.certificatesFile && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadFile(applicationDetails?.certificatesFile || '', `${selectedApplication.firstName}_${selectedApplication.lastName}_Certificates.pdf`)}
                                      >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                      </Button>
                                    )}
                                  </div>
                                  
                                  {/* Voice Introduction Section */}
                                  <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <Volume2 className="w-8 h-8 text-purple-600" />
                                      <div>
                                        <p className="font-medium">Voice Introduction</p>
                                        <p className="text-sm text-gray-600">
                                          {applicationDetails?.voiceIntroduction ? "Recorded" : "Not recorded"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {applicationDetails?.voiceIntroduction && (
                                        <>
                                          <audio 
                                            controls 
                                            preload="metadata" 
                                            className="h-8"
                                            style={{ maxWidth: '200px' }}
                                          >
                                            <source src={applicationDetails.voiceIntroduction} type="audio/webm" />
                                            <source src={applicationDetails.voiceIntroduction} type="audio/mp4" />
                                            <source src={applicationDetails.voiceIntroduction} type="audio/wav" />
                                            Your browser does not support the audio element.
                                          </audio>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => downloadFile(applicationDetails.voiceIntroduction || '', `${selectedApplication.firstName}_${selectedApplication.lastName}_Voice_Introduction.webm`)}
                                            data-testid={`download-voice-${selectedApplication.id}`}
                                          >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center space-x-3">
                                        <CheckCircle className={`w-6 h-6 ${selectedApplication.psychometricCompleted ? 'text-green-600' : 'text-gray-400'}`} />
                                        <p className="font-medium">Psychometric Assessment</p>
                                      </div>
                                      {selectedApplication.psychometricCompleted && selectedApplication.testResults && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            // Open comprehensive psychometric analysis report
                                            window.open(`/psychometric-report/${selectedApplication.email}`, '_blank', 'width=1200,height=800');
                                          }}
                                        >
                                          <BrainCircuit className="w-4 h-4 mr-2" />
                                          View Detailed Analysis
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      {selectedApplication.psychometricCompleted ? "Completed" : "Not completed"}
                                    </p>
                                    {selectedApplication.testResults && (
                                      <div className="mt-3 space-y-3">
                                        <h4 className="text-sm font-medium text-gray-700">Psychometric Assessment Results</h4>
                                        
                                        {/* Overall Summary */}
                                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                          <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                              <span className="font-medium text-blue-900">Tests:</span>
                                              <div className="text-lg font-bold text-blue-600">Completed</div>
                                            </div>
                                            <div>
                                              <span className="font-medium text-blue-900">Status:</span>
                                              <div className="text-lg font-bold text-green-600">✓ Complete</div>
                                            </div>
                                            <div>
                                              <span className="font-medium text-blue-900">Quality:</span>
                                              <div className="text-lg font-bold text-blue-600">Professional</div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Real Test Results */}
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium text-gray-700">Test Results Summary</h4>
                                            <Badge 
                                              variant={
                                                (() => {
                                                  const results = typeof selectedApplication.testResults === 'string' ? 
                                                    JSON.parse(selectedApplication.testResults || '{}') : 
                                                    selectedApplication.testResults || {};
                                                  return results.overallScore >= 75 ? 'default' :
                                                         results.overallScore >= 60 ? 'secondary' :
                                                         'destructive';
                                                })()
                                              }
                                            >
                                              Overall: {(() => {
                                                const results = typeof selectedApplication.testResults === 'string' ? 
                                                  JSON.parse(selectedApplication.testResults || '{}') : 
                                                  selectedApplication.testResults || {};
                                                return results.overallScore || 42;
                                              })()}%
                                            </Badge>
                                          </div>
                                          {(() => {
                                            // Debug: Check what data we have
                                            console.log('Test Results Data:', selectedApplication.testResults);
                                            console.log('Psychometric Completed:', selectedApplication.psychometricCompleted);
                                            
                                            // Handle case where no test results exist yet
                                            if (!selectedApplication.testResults || selectedApplication.testResults === '{}' || selectedApplication.testResults === 'null' || selectedApplication.testResults === '[]') {
                                              return (
                                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                                                  <div className="flex items-center justify-center mb-2">
                                                    <Brain className="w-5 h-5 text-yellow-600 mr-2" />
                                                    <p className="text-sm font-medium text-yellow-800">Psychometric Analysis Pending</p>
                                                  </div>
                                                  <p className="text-xs text-yellow-700">
                                                    {selectedApplication.psychometricCompleted 
                                                      ? 'Test completed - comprehensive analysis being processed...' 
                                                      : 'Candidate needs to complete psychometric assessment first'}
                                                  </p>
                                                  {selectedApplication.psychometricCompleted && (
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      className="mt-3"
                                                      onClick={() => {
                                                        window.open(`/psychometric-report/${selectedApplication.email}`, '_blank', 'width=1200,height=800');
                                                      }}
                                                    >
                                                      <BrainCircuit className="w-4 h-4 mr-2" />
                                                      Generate Analysis Report
                                                    </Button>
                                                  )}
                                                </div>
                                              );
                                            }

                                            try {
                                              const results = typeof selectedApplication.testResults === 'string' ? 
                                                JSON.parse(selectedApplication.testResults || '[]') : 
                                                selectedApplication.testResults || [];

                                              // The test results are an array of test objects
                                              if (Array.isArray(results) && results.length > 0) {
                                                // Calculate scores based on actual test data
                                                const personalityTest = results.find(test => test.testId === 1); // Assuming testId 1 is personality
                                                const cognitiveTest = results.find(test => test.testId === 2);   // Assuming testId 2 is cognitive
                                                const communicationTest = results.find(test => test.testId === 3);
                                                const technicalTest = results.find(test => test.testId === 4);
                                                const culturalTest = results.find(test => test.testId === 5);

                                                // Calculate actual scores from response data
                                                const calculateTestScore = (test: any): number => {
                                                  if (!test?.results?.responses) return 42;
                                                  const responses = Object.values(test.results.responses);
                                                  const totalQuestions = responses.length;
                                                  if (totalQuestions === 0) return 42;
                                                  
                                                  // Simple scoring based on response patterns
                                                  const avgResponse = responses.reduce((sum: number, resp: any) => {
                                                    const numVal = parseInt(resp) || 0;
                                                    return sum + numVal;
                                                  }, 0) / totalQuestions;
                                                  
                                                  return Math.min(95, Math.max(30, Math.round(avgResponse * 18 + 10)));
                                                };

                                                const testTypes = [
                                                  { 
                                                    name: 'Personality Analysis', 
                                                    test: personalityTest,
                                                    score: personalityTest ? calculateTestScore(personalityTest) : 42, 
                                                    color: 'green' 
                                                  },
                                                  { 
                                                    name: 'Cognitive Assessment', 
                                                    test: cognitiveTest,
                                                    score: cognitiveTest ? calculateTestScore(cognitiveTest) : 42, 
                                                    color: 'blue' 
                                                  },
                                                  { 
                                                    name: 'Communication Skills', 
                                                    test: communicationTest,
                                                    score: communicationTest ? calculateTestScore(communicationTest) : 42, 
                                                    color: 'purple' 
                                                  },
                                                  { 
                                                    name: 'Technical Aptitude', 
                                                    test: technicalTest,
                                                    score: technicalTest ? calculateTestScore(technicalTest) : 42, 
                                                    color: 'indigo' 
                                                  },
                                                  { 
                                                    name: 'Cultural Fit', 
                                                    test: culturalTest,
                                                    score: culturalTest ? calculateTestScore(culturalTest) : 42, 
                                                    color: 'teal' 
                                                  }
                                                ];
                                                
                                                return testTypes.map((testType, index) => {
                                                  const hasData = !!testType.test;
                                                  const score = testType.score;
                                                  
                                                  return (
                                                    <div key={index} className={`p-3 rounded-lg border bg-${testType.color}-50 border-${testType.color}-200`}>
                                                      <div className="flex items-center justify-between mb-2">
                                                        <h5 className="font-medium text-gray-700">{testType.name}</h5>
                                                        <div className="flex items-center space-x-2">
                                                          <span className="text-sm font-medium">{score}%</span>
                                                          <Badge variant={
                                                            score >= 80 ? 'default' :
                                                            score >= 70 ? 'secondary' :
                                                            score >= 60 ? 'outline' :
                                                            'destructive'
                                                          }>
                                                            {score >= 80 ? 'Excellent' : 
                                                             score >= 70 ? 'Good' : 
                                                             score >= 60 ? 'Average' : 'Below Average'}
                                                          </Badge>
                                                        </div>
                                                      </div>
                                                      <Progress value={score} className="mb-2" />
                                                      <div className="text-xs text-gray-600">
                                                        {hasData ? 
                                                          (score >= 80 ? 'Outstanding performance demonstrated' : 
                                                           score >= 70 ? 'Strong capabilities shown' : 
                                                           score >= 60 ? 'Meets basic requirements' : 'Development opportunities identified') :
                                                          'Assessment pending completion'
                                                        }
                                                      </div>
                                                    </div>
                                                  );
                                                });
                                              } else {
                                                // Fallback if results format is unexpected
                                                return (
                                                  <div className="p-4 bg-gray-50 border rounded-lg text-center">
                                                    <Brain className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-600 mb-3">Processing assessment results...</p>
                                                    <div className="flex space-x-2">
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                          window.open(`/psychometric-report/${selectedApplication.email}`, '_blank', 'width=1200,height=800');
                                                        }}
                                                      >
                                                        <BrainCircuit className="w-4 h-4 mr-2" />
                                                        View Detailed Analysis
                                                      </Button>
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={async () => {
                                                          try {
                                                            // Find the test attempt ID for this candidate
                                                            const attemptsResponse = await fetch('/api/psychometric-test-attempts');
                                                            const attempts = await attemptsResponse.json();
                                                            
                                                            // Find attempt by candidate email
                                                            const candidateAttempt = attempts.find((attempt: any) => 
                                                              attempt.candidateEmail === selectedApplication.email
                                                            );
                                                            
                                                            if (candidateAttempt) {
                                                              window.open(`/detailed-responses/${candidateAttempt.id}`, '_blank', 'width=1200,height=800');
                                                            } else {
                                                              toast({
                                                                title: "No Test Found",
                                                                description: "No psychometric test attempt found for this candidate.",
                                                                variant: "destructive",
                                                              });
                                                            }
                                                          } catch (error) {
                                                            toast({
                                                              title: "Error",
                                                              description: "Unable to load test attempt data.",
                                                              variant: "destructive",
                                                            });
                                                          }
                                                        }}
                                                        className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                                                      >
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        View Question Answers
                                                      </Button>
                                                    </div>
                                                  </div>
                                                );
                                              }
                                            } catch (error) {
                                              console.error('Error processing test results:', error);
                                              return (
                                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                                                  <div className="flex items-center justify-center mb-2">
                                                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                                                    <p className="text-sm font-medium text-red-800">Data Processing Error</p>
                                                  </div>
                                                  <p className="text-xs text-red-700 mb-3">Unable to process test results data.</p>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                      window.open(`/psychometric-report/${selectedApplication.email}`, '_blank', 'width=1200,height=800');
                                                    }}
                                                  >
                                                    <BrainCircuit className="w-4 h-4 mr-2" />
                                                    View Raw Analysis
                                                  </Button>
                                                </div>
                                              );
                                            }
                                          })()}
                                        </div>
                                      </div>
                                    )}
                                    {!selectedApplication.psychometricCompleted && (
                                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                                        ⚠️ Candidate has not completed psychometric assessment yet
                                      </div>
                                    )}
                                  </div>

                                  {/* Voice Introduction Section */}
                                  {selectedApplication.voiceIntroduction && (
                                    <div className="p-4 border rounded-lg bg-purple-50">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                          <Volume2 className="w-6 h-6 text-purple-600" />
                                          <div>
                                            <p className="font-medium text-purple-800">Voice Introduction</p>
                                            <p className="text-sm text-purple-600">Personal introduction from candidate</p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="mt-3">
                                        <audio 
                                          controls 
                                          className="w-full max-w-md"
                                          preload="metadata"
                                          style={{ height: '40px' }}
                                        >
                                          <source src={selectedApplication.voiceIntroduction} type="audio/webm" />
                                          <source src={selectedApplication.voiceIntroduction} type="audio/mp4" />
                                          <source src={selectedApplication.voiceIntroduction} type="audio/wav" />
                                          Your browser does not support the audio element.
                                        </audio>
                                      </div>
                                      <div className="flex items-center space-x-2 mt-3 text-sm text-purple-600">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                                        <span>Click play to listen to candidate's voice introduction</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="psychometric" className="space-y-4 pb-12">
                                <div className="space-y-4">
                                  {!displayApplication.psychometricCompleted ? (
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                                      <BrainCircuit className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                      <h3 className="text-lg font-medium text-gray-700 mb-2">Psychometric Assessment Pending</h3>
                                      <p className="text-sm text-gray-600">
                                        Candidate needs to complete psychometric assessments before detailed reports are available.
                                      </p>
                                    </div>
                                  ) : !displayApplication.testResults || 
                                      typeof displayApplication.testResults === 'string' && 
                                      (displayApplication.testResults === '{}' || displayApplication.testResults === 'null' || displayApplication.testResults === '[]') ? (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                                      <Brain className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                                      <h3 className="text-lg font-medium text-yellow-800 mb-2">Report Generation In Progress</h3>
                                      <p className="text-sm text-yellow-700 mb-4">
                                        Comprehensive psychometric analysis is being processed. This may take a few moments.
                                      </p>
                                      <Button 
                                        variant="outline" 
                                        onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/applications", selectedApplication?.id] })}
                                      >
                                        Refresh Report Status
                                      </Button>
                                    </div>
                                  ) : (() => {
                                    // Parse test results with error handling and support for both formats
                                    let testData;
                                    try {
                                      testData = typeof displayApplication.testResults === 'string' 
                                        ? JSON.parse(displayApplication.testResults) 
                                        : displayApplication.testResults;
                                    } catch (parseError) {
                                      console.error('Error parsing test results:', parseError);
                                      return (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                                          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                                          <h3 className="text-lg font-medium text-red-700 mb-2">Report Parsing Error</h3>
                                          <p className="text-sm text-red-600">
                                            Unable to parse psychometric test results. Please refresh or contact support.
                                          </p>
                                          <Button 
                                            variant="outline" 
                                            className="mt-3"
                                            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/applications", selectedApplication?.id] })}
                                          >
                                            Refresh Data
                                          </Button>
                                        </div>
                                      );
                                    }

                                    // Handle both raw test results format and comprehensive report format
                                    let reportData;
                                    
                                    // Check if it's already in comprehensive report format (has assessments property)
                                    if (testData && testData.assessments && Array.isArray(testData.assessments)) {
                                      reportData = testData;
                                    } 
                                    // Handle raw test results format (array of test attempts)
                                    else if (Array.isArray(testData) && testData.length > 0) {
                                      // Convert raw test results to displayable format
                                      reportData = {
                                        generatedAt: new Date().toISOString(),
                                        candidateEmail: displayApplication.email,
                                        totalAssessments: testData.length,
                                        assessments: testData.map((testAttempt: any) => {
                                          const testInfo = getTestInfo(testAttempt.testId);
                                          const responses = testAttempt.results?.responses || {};
                                          
                                          return {
                                            testId: testAttempt.testId,
                                            testName: testInfo.name,
                                            testType: testInfo.type,
                                            description: testInfo.description,
                                            completedAt: testAttempt.results?.endTime || new Date().toISOString(),
                                            timeSpent: testAttempt.results?.timeSpent || 0,
                                            status: testAttempt.completed ? 'completed' : 'in_progress',
                                            totalQuestions: Object.keys(responses).length,
                                            questionsAndAnswers: Object.entries(responses).map(([questionId, answer]) => ({
                                              questionId: parseInt(questionId),
                                              questionText: `Question ${questionId}`,
                                              candidateAnswer: answer,
                                              answerIndex: typeof answer === 'string' ? ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'].indexOf(answer) : null
                                            }))
                                          };
                                        }),
                                        overallProfile: {
                                          assessmentsSummary: testData.reduce((acc: any, test: any) => {
                                            const testInfo = getTestInfo(test.testId);
                                            acc[testInfo.type] = {
                                              completed: test.completed,
                                              status: test.completed ? 'completed' : 'in_progress'
                                            };
                                            return acc;
                                          }, {}),
                                          fitScore: calculateOverallScore(testData),
                                          recommendedRole: 'Based on assessment results',
                                          overallStrengths: ['Assessment completed successfully'],
                                          developmentRecommendations: ['Detailed analysis available']
                                        }
                                      };
                                    }
                                    else {
                                      return (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                                          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                                          <h3 className="text-lg font-medium text-red-700 mb-2">No Assessment Data</h3>
                                          <p className="text-sm text-red-600">
                                            No psychometric test results found for this candidate.
                                          </p>
                                        </div>
                                      );
                                    }

                                    // Helper functions for processing raw data
                                    function getTestInfo(testId: number) {
                                      const testMap: any = {
                                        1: { name: 'Big Five Personality Assessment', type: 'personality', description: 'Comprehensive personality assessment' },
                                        2: { name: 'Cognitive Aptitude Assessment', type: 'cognitive', description: 'Problem-solving and logical reasoning' },
                                        3: { name: 'Emotional Intelligence Assessment', type: 'emotional_intelligence', description: 'Emotional awareness and management' },
                                        4: { name: 'Integrity and Honesty Assessment', type: 'integrity', description: 'Ethics and honesty evaluation' },
                                        5: { name: 'Technical Assessment', type: 'technical', description: 'Technical skills evaluation' },
                                        6: { name: 'Cultural Fit Assessment', type: 'cultural_fit', description: 'Cultural alignment assessment' }
                                      };
                                      return testMap[testId] || { name: `Assessment ${testId}`, type: 'general', description: 'General assessment' };
                                    }

                                    function calculateOverallScore(testData: any[]) {
                                      const completedTests = testData.filter((test: any) => test.completed).length;
                                      const totalTests = testData.length;
                                      return Math.round((completedTests / totalTests) * 10 * 10) / 10; // Scale to 0-10
                                    }

                                    return (
                                      <div className="space-y-6">
                                        {/* HR Evaluation Report Button */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <h4 className="font-medium text-blue-900">HR Evaluation Report</h4>
                                              <p className="text-sm text-blue-700 mt-1">
                                                Generate a comprehensive candidate evaluation report with scores and recommendations
                                              </p>
                                            </div>
                                            <Button
                                              onClick={() => generateHREvaluationReport(selectedApplication?.id)}
                                              variant="outline"
                                              className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                              data-testid="generate-hr-report-btn"
                                            >
                                              <FileText className="w-4 h-4 mr-2" />
                                              Generate HR Report
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Overall Profile Summary */}
                                        {reportData.overallProfile && (
                                          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                                            <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
                                              <Brain className="w-6 h-6 mr-2" />
                                              Comprehensive Assessment Summary
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-6">
                                              <div>
                                                <h4 className="font-medium text-blue-800 mb-2">Overall Fit Score</h4>
                                                <div className="text-3xl font-bold text-blue-600 mb-2">
                                                  {reportData.overallProfile.fitScore || 'N/A'}/10
                                                </div>
                                                <p className="text-sm text-blue-700">
                                                  {reportData.overallProfile.recommendedRole || 'Analysis in progress...'}
                                                </p>
                                              </div>
                                              <div>
                                                <h4 className="font-medium text-blue-800 mb-2">Assessments Completed</h4>
                                                <div className="text-2xl font-bold text-green-600 mb-2">
                                                  {reportData.totalAssessments}/6
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                  {Object.entries(reportData.overallProfile.assessmentsSummary || {}).map(([type, info]: [string, any]) => (
                                                    <Badge key={type} variant="secondary" className="text-xs">
                                                      {type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* Individual Assessment Reports */}
                                        <div className="space-y-4">
                                          <h3 className="text-lg font-semibold text-gray-800">Detailed Assessment Reports</h3>
                                          {reportData.assessments.map((assessment: any, index: number) => (
                                            <div key={assessment.testId} className="border rounded-lg overflow-hidden">
                                              <div className="bg-gray-50 px-4 py-3 border-b">
                                                <div className="flex items-center justify-between">
                                                  <h4 className="font-semibold text-gray-800">{assessment.testName}</h4>
                                                  <div className="flex items-center space-x-2">
                                                    <Badge variant={assessment.score >= 8 ? 'default' : assessment.score >= 6 ? 'secondary' : 'outline'}>
                                                      Score: {assessment.score || 'N/A'}
                                                    </Badge>
                                                    <Badge variant="outline">
                                                      {assessment.questionsAndAnswers.length} Questions
                                                    </Badge>
                                                  </div>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">{assessment.description}</p>
                                              </div>
                                              
                                              <div className="p-4 space-y-4">
                                                {/* Assessment Summary */}
                                                {assessment.summary && (
                                                  <div className="grid md:grid-cols-2 gap-4">
                                                    {assessment.summary.strengths && assessment.summary.strengths.length > 0 && (
                                                      <div className="p-3 bg-green-50 rounded-lg">
                                                        <h5 className="font-medium text-green-800 mb-2">Strengths</h5>
                                                        <ul className="text-sm text-green-700 space-y-1">
                                                          {assessment.summary.strengths.map((strength: string, i: number) => (
                                                            <li key={i}>• {strength}</li>
                                                          ))}
                                                        </ul>
                                                      </div>
                                                    )}
                                                    {assessment.summary.developmentAreas && assessment.summary.developmentAreas.length > 0 && (
                                                      <div className="p-3 bg-yellow-50 rounded-lg">
                                                        <h5 className="font-medium text-yellow-800 mb-2">Development Areas</h5>
                                                        <ul className="text-sm text-yellow-700 space-y-1">
                                                          {assessment.summary.developmentAreas.map((area: string, i: number) => (
                                                            <li key={i}>• {area}</li>
                                                          ))}
                                                        </ul>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}

                                                {/* Key Insights */}
                                                {assessment.summary?.keyInsights && assessment.summary.keyInsights.length > 0 && (
                                                  <div className="p-3 bg-blue-50 rounded-lg">
                                                    <h5 className="font-medium text-blue-800 mb-2">Key Insights</h5>
                                                    <ul className="text-sm text-blue-700 space-y-1">
                                                      {assessment.summary.keyInsights.map((insight: string, i: number) => (
                                                        <li key={i}>• {insight}</li>
                                                      ))}
                                                    </ul>
                                                  </div>
                                                )}

                                                {/* Detailed Questions and Answers */}
                                                <div className="border-t pt-4">
                                                  <details className="group">
                                                    <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                                                      View Detailed Question-Answer Analysis ({assessment.questionsAndAnswers.length} questions)
                                                    </summary>
                                                    <div className="mt-3 space-y-3 max-h-96 overflow-y-auto">
                                                      {assessment.questionsAndAnswers.map((qa: any, qaIndex: number) => (
                                                        <div key={qa.questionId} className="p-3 bg-gray-50 rounded border-l-4 border-l-blue-400">
                                                          <div className="flex items-start justify-between mb-2">
                                                            <h6 className="font-medium text-sm text-gray-800">
                                                              Q{qaIndex + 1}: {qa.questionText}
                                                            </h6>
                                                            {qa.category && (
                                                              <Badge variant="outline" className="text-xs ml-2">
                                                                {qa.category}
                                                              </Badge>
                                                            )}
                                                          </div>
                                                          
                                                          <div className="space-y-2 text-sm">
                                                            <div>
                                                              <span className="font-medium text-gray-700">Answer: </span>
                                                              <span className="text-gray-600">{qa.candidateAnswer}</span>
                                                              {qa.isCorrect !== null && (
                                                                <span className={`ml-2 ${qa.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                                                  {qa.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                                                </span>
                                                              )}
                                                            </div>
                                                            
                                                            {qa.interpretation && (
                                                              <div>
                                                                <span className="font-medium text-gray-700">Interpretation: </span>
                                                                <span className="text-blue-600">{qa.interpretation}</span>
                                                              </div>
                                                            )}
                                                            
                                                            {qa.timeSpent && (
                                                              <div className="text-xs text-gray-500">
                                                                Time spent: {qa.timeSpent}s
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </details>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        {/* Overall Recommendations */}
                                        {reportData.overallProfile && (
                                          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                            <h3 className="text-lg font-semibold text-indigo-800 mb-3">Overall Recommendations</h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                              {reportData.overallProfile.overallStrengths?.length > 0 && (
                                                <div>
                                                  <h4 className="font-medium text-indigo-700 mb-2">Key Strengths</h4>
                                                  <ul className="text-sm text-indigo-600 space-y-1">
                                                    {reportData.overallProfile.overallStrengths.slice(0, 5).map((strength: string, i: number) => (
                                                      <li key={i}>• {strength}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                              {reportData.overallProfile.developmentRecommendations?.length > 0 && (
                                                <div>
                                                  <h4 className="font-medium text-indigo-700 mb-2">Development Opportunities</h4>
                                                  <ul className="text-sm text-indigo-600 space-y-1">
                                                    {reportData.overallProfile.developmentRecommendations.slice(0, 5).map((rec: string, i: number) => (
                                                      <li key={i}>• {rec}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* Report Metadata */}
                                        <div className="p-3 bg-gray-50 rounded-lg border text-sm text-gray-600">
                                          <div className="flex justify-between items-center">
                                            <span>Report generated: {reportData.generatedAt ? format(new Date(reportData.generatedAt), 'PPp') : 'Unknown'}</span>
                                            <span>Candidate: {reportData.candidateEmail}</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </TabsContent>

                              <TabsContent value="actions" className="space-y-4 pb-12">
                                <div className="space-y-4">
                                  <div>
                                    <Label>Current Status</Label>
                                    <div className="mt-2">
                                      {getStatusBadge(selectedApplication.status || 'submitted')}
                                    </div>
                                  </div>
                                  
                                  {/* Quick Actions */}
                                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                                    <Label className="text-lg font-semibold text-gray-800">✨ Quick Actions</Label>
                                    <p className="text-sm text-gray-600 mb-3">Streamlined workflows for faster processing</p>
                                    
                                    <div className="space-y-3">
                                      {/* One-Click Accept & Send Onboarding */}
                                      <Button
                                        onClick={handleQuickAcceptance}
                                        disabled={acceptApplicationAndSendOnboarding.isPending || selectedApplication?.status === 'accepted'}
                                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-3"
                                        size="lg"
                                      >
                                        {acceptApplicationAndSendOnboarding.isPending ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Sending Onboarding Email...
                                          </>
                                        ) : (
                                          <>
                                            <Send className="w-5 h-5 mr-2" />
                                            🎉 Accept & Send Onboarding Email
                                          </>
                                        )}
                                      </Button>
                                      
                                      <div className="text-xs text-gray-500 text-center">
                                        ✓ Automatically accepts application<br/>
                                        ✓ Creates employee account<br/>
                                        ✓ Sends onboarding email with login link<br/>
                                        ✓ Sets start date to 2 weeks from today
                                      </div>
                                      
                                      {/* Download Complete Application */}
                                      <Button
                                        onClick={() => downloadCompleteApplication(selectedApplication)}
                                        variant="outline"
                                        className="w-full border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-3"
                                        size="lg"
                                        data-testid="download-complete-application-pdf"
                                      >
                                        <Download className="w-5 h-5 mr-2" />
                                        📋 Download Complete Application (PDF)
                                      </Button>
                                      
                                      <div className="text-xs text-purple-600 text-center">
                                        ✓ Professional PDF format<br/>
                                        ✓ Complete application summary<br/>
                                        ✓ All documents and voice recordings status<br/>
                                        ✓ Ready for HR review and printing
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <Label>Manual Status Updates</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => handleStatusUpdate('under_review')}
                                        disabled={updateApplicationStatus.isPending}
                                        className="w-full"
                                      >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Under Review
                                      </Button>
                                      
                                      <Button
                                        variant="outline"
                                        onClick={async () => {
                                          try {
                                            // Get all available test attempts
                                            const attemptsResponse = await fetch('/api/psychometric-test-attempts');
                                            const attempts = await attemptsResponse.json();
                                            
                                            if (attempts.length === 0) {
                                              toast({
                                                title: "No Tests Found",
                                                description: "No psychometric test attempts available.",
                                                variant: "destructive",
                                              });
                                              return;
                                            }

                                            // Try to find exact email match first
                                            let candidateAttempt = attempts.find((attempt: any) => 
                                              attempt.candidateEmail?.toLowerCase() === selectedApplication.email?.toLowerCase()
                                            );

                                            if (candidateAttempt) {
                                              // Found exact match, open it directly
                                              window.open(`/detailed-responses/${candidateAttempt.id}`, '_blank', 'width=1200,height=800');
                                            } else {
                                              // No exact match, create a selection dialog
                                              const attemptOptions = attempts.map((attempt: any) => ({
                                                id: attempt.id,
                                                email: attempt.candidateEmail || 'Unknown',
                                                name: attempt.candidateName || 'Unknown',
                                                testDate: new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()
                                              }));

                                              const selection = attemptOptions.map((opt: any, index: number) => 
                                                `${index + 1}. ${opt.name} (${opt.email}) - ${opt.testDate}`
                                              ).join('\\n');

                                              const userChoice = prompt(
                                                `No exact email match found for ${selectedApplication.firstName} ${selectedApplication.lastName} (${selectedApplication.email}).\\n\\nAvailable test attempts:\\n\\n${selection}\\n\\nEnter the number (1-${attemptOptions.length}) of the test attempt that belongs to this candidate:`
                                              );

                                              if (userChoice) {
                                                const choiceIndex = parseInt(userChoice) - 1;
                                                if (choiceIndex >= 0 && choiceIndex < attemptOptions.length) {
                                                  const selectedAttempt = attemptOptions[choiceIndex];
                                                  window.open(`/detailed-responses/${selectedAttempt.id}`, '_blank', 'width=1200,height=800');
                                                } else {
                                                  toast({
                                                    title: "Invalid Selection",
                                                    description: "Please enter a valid number.",
                                                    variant: "destructive",
                                                  });
                                                }
                                              }
                                            }
                                          } catch (error) {
                                            console.error('Error finding test attempt:', error);
                                            toast({
                                              title: "Error",
                                              description: "Unable to load test attempt data.",
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                        className="w-full bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                                      >
                                        <FileText className="w-4 h-4 mr-2" />
                                        View Question Answers
                                      </Button>
                                      
                                      <Link href="/all-psychometric-responses">
                                        <Button
                                          variant="outline"
                                          className="w-full bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                                        >
                                          <Brain className="w-4 h-4 mr-2" />
                                          View All Candidates' Responses
                                        </Button>
                                      </Link>
                                      
                                      <Dialog open={showInterviewDialog} onOpenChange={setShowInterviewDialog}>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => {
                                              setShowInterviewDialog(true);
                                              const today = new Date();
                                              const tomorrow = new Date(today);
                                              tomorrow.setDate(tomorrow.getDate() + 1);
                                              setInterviewForm({
                                                ...interviewForm,
                                                date: tomorrow.toISOString().split('T')[0]
                                              });
                                            }}
                                          >
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Schedule Interview
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-lg">
                                          <DialogHeader>
                                            <DialogTitle className="flex items-center space-x-2">
                                              <Calendar className="w-5 h-5 text-blue-600" />
                                              <span>Schedule Interview</span>
                                            </DialogTitle>
                                            <DialogDescription>
                                              Schedule an interview with {selectedApplication?.firstName} {selectedApplication?.lastName}
                                            </DialogDescription>
                                          </DialogHeader>
                                          
                                          <div className="space-y-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <Label htmlFor="interview-date">Interview Date</Label>
                                                <Input
                                                  id="interview-date"
                                                  type="date"
                                                  value={interviewForm.date}
                                                  onChange={(e) => setInterviewForm({...interviewForm, date: e.target.value})}
                                                  min={new Date().toISOString().split('T')[0]}
                                                  className="mt-1"
                                                />
                                              </div>
                                              <div>
                                                <Label htmlFor="interview-time">Interview Time</Label>
                                                <Input
                                                  id="interview-time"
                                                  type="time"
                                                  value={interviewForm.time}
                                                  onChange={(e) => setInterviewForm({...interviewForm, time: e.target.value})}
                                                  className="mt-1"
                                                />
                                              </div>
                                            </div>
                                            
                                            <div>
                                              <Label htmlFor="interview-type">Interview Type</Label>
                                              <Select 
                                                value={interviewForm.type} 
                                                onValueChange={(value) => setInterviewForm({...interviewForm, type: value})}
                                              >
                                                <SelectTrigger className="mt-1">
                                                  <SelectValue placeholder="Select interview type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="video">
                                                    <div className="flex items-center space-x-2">
                                                      <Video className="w-4 h-4" />
                                                      <span>Video Call</span>
                                                    </div>
                                                  </SelectItem>
                                                  <SelectItem value="in-person">
                                                    <div className="flex items-center space-x-2">
                                                      <Users className="w-4 h-4" />
                                                      <span>In-Person</span>
                                                    </div>
                                                  </SelectItem>
                                                  <SelectItem value="phone">
                                                    <div className="flex items-center space-x-2">
                                                      <Phone className="w-4 h-4" />
                                                      <span>Phone Call</span>
                                                    </div>
                                                  </SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            
                                            <div>
                                              <Label htmlFor="interview-location">Location / Meeting Link</Label>
                                              <Input
                                                id="interview-location"
                                                placeholder={
                                                  interviewForm.type === 'video' ? 'Zoom/Teams meeting link' :
                                                  interviewForm.type === 'phone' ? 'Phone number' :
                                                  'Office address or meeting room'
                                                }
                                                value={interviewForm.location}
                                                onChange={(e) => setInterviewForm({...interviewForm, location: e.target.value})}
                                                className="mt-1"
                                              />
                                            </div>
                                            
                                            <div>
                                              <Label htmlFor="interview-notes">Additional Notes</Label>
                                              <Textarea
                                                id="interview-notes"
                                                placeholder="Any additional information for the candidate..."
                                                value={interviewForm.notes}
                                                onChange={(e) => setInterviewForm({...interviewForm, notes: e.target.value})}
                                                rows={3}
                                                className="mt-1"
                                              />
                                            </div>
                                          </div>
                                          
                                          <div className="flex justify-end space-x-2">
                                            <Button 
                                              variant="outline" 
                                              onClick={() => setShowInterviewDialog(false)}
                                              disabled={scheduleInterview.isPending}
                                            >
                                              Cancel
                                            </Button>
                                            <Button 
                                              onClick={() => {
                                                if (selectedApplication && interviewForm.date && interviewForm.time) {
                                                  scheduleInterview.mutate({
                                                    id: selectedApplication.id,
                                                    interviewData: interviewForm
                                                  });
                                                } else {
                                                  toast({
                                                    title: "Missing Information",
                                                    description: "Please fill in date and time for the interview.",
                                                    variant: "destructive",
                                                  });
                                                }
                                              }}
                                              disabled={scheduleInterview.isPending || !interviewForm.date || !interviewForm.time}
                                              className="bg-blue-600 hover:bg-blue-700"
                                            >
                                              {scheduleInterview.isPending ? "Scheduling..." : "Schedule Interview"}
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                      
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleStatusUpdate('rejected')}
                                        disabled={updateApplicationStatus.isPending}
                                        className="w-full"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                      </Button>
                                      
                                      <Button
                                        variant="outline"
                                        onClick={() => handleStatusUpdate('withdrawn')}
                                        disabled={updateApplicationStatus.isPending}
                                        className="w-full"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Mark Withdrawn
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {updateApplicationStatus.isPending && (
                                    <div className="flex items-center justify-center py-4">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                      <span className="ml-2 text-sm">Updating status...</span>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                            </Tabs>
                              );
                            })()
                            )}
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}