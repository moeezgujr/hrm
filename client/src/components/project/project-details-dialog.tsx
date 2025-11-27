import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  UserPlus,
  ListTodo,
  Download,
  FileText
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Project, User, ProjectMember, ProjectTask } from "@shared/schema";
import AddMemberDialog from "./add-member-dialog";
import CreateTaskDialog from "./create-task-dialog";

type ProjectWithDetails = Project & {
  projectManager?: User;
  managers: (ProjectMember & { user: User })[];
  memberCount: number;
};

type ProjectMemberWithUser = ProjectMember & {
  user: User;
};

type ProjectTaskWithUser = ProjectTask & {
  assignedToUser?: User;
  assignedByUser?: User;
};

interface ProjectDetailsDialogProps {
  project: ProjectWithDetails;
  open: boolean;
  onClose: () => void;
}

export default function ProjectDetailsDialog({ project, open, onClose }: ProjectDetailsDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingDailyReport, setIsGeneratingDailyReport] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch project details with members
  const { data: projectDetails } = useQuery({
    queryKey: ["/api/projects", project.id],
    enabled: open,
  });

  // Fetch project members
  const { data: members } = useQuery<ProjectMemberWithUser[]>({
    queryKey: ["/api/projects", project.id, "members"],
    enabled: open,
  });

  // Fetch project tasks
  const { data: tasks } = useQuery<ProjectTaskWithUser[]>({
    queryKey: ["/api/projects", project.id, "tasks"],
    enabled: open,
  });

  // Generate PDF report function
  const generatePDFReport = async (reportData: any, title: string) => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text(title, 20, 20);
      
      // Project details
      doc.setFontSize(14);
      doc.text(`Project: ${reportData.project.name}`, 20, 40);
      doc.text(`Status: ${reportData.project.status}`, 20, 50);
      doc.text(`Manager: ${reportData.project.projectManager?.username || 'N/A'}`, 20, 60);
      
      let yPos = 80;
      
      // Statistics section
      if (reportData.statistics) {
        doc.setFontSize(16);
        doc.text('Statistics', 20, yPos);
        yPos += 15;
        
        doc.setFontSize(12);
        doc.text(`Total Tasks: ${reportData.statistics.totalTasks}`, 20, yPos);
        doc.text(`Completed: ${reportData.statistics.completedTasks}`, 20, yPos + 10);
        doc.text(`Pending: ${reportData.statistics.pendingTasks}`, 20, yPos + 20);
        doc.text(`Overdue: ${reportData.statistics.overdueTasks}`, 20, yPos + 30);
        doc.text(`Completion Rate: ${reportData.statistics.completionRate}%`, 20, yPos + 40);
        yPos += 60;
      }
      
      // Daily statistics section (for daily reports)
      if (reportData.dailyStatistics) {
        doc.setFontSize(16);
        doc.text(`Daily Activity Report - ${reportData.reportDate}`, 20, yPos);
        yPos += 15;
        
        doc.setFontSize(12);
        doc.text(`Tasks Created: ${reportData.dailyStatistics.tasksCreated}`, 20, yPos);
        doc.text(`Tasks Completed: ${reportData.dailyStatistics.tasksCompleted}`, 20, yPos + 10);
        doc.text(`Tasks Updated: ${reportData.dailyStatistics.tasksUpdated}`, 20, yPos + 20);
        doc.text(`Messages Posted: ${reportData.dailyStatistics.messagesPosted}`, 20, yPos + 30);
        doc.text(`Files Uploaded: ${reportData.dailyStatistics.filesUploaded}`, 20, yPos + 40);
        if (reportData.dailyStatistics.notesAdded) {
          doc.text(`Notes Added: ${reportData.dailyStatistics.notesAdded}`, 20, yPos + 50);
          yPos += 10;
        }
        if (reportData.dailyStatistics.membersJoined) {
          doc.text(`Members Joined: ${reportData.dailyStatistics.membersJoined}`, 20, yPos + 50);
          yPos += 10;
        }
        doc.text(`Total Activities: ${reportData.dailyStatistics.totalActivity}`, 20, yPos + 50);
        yPos += 70;
      }
      
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Tasks section (for overall reports)
      if (reportData.tasks && reportData.tasks.length > 0 && !reportData.dailyStatistics) {
        doc.setFontSize(16);
        doc.text('Tasks', 20, yPos);
        yPos += 15;
        
        doc.setFontSize(10);
        reportData.tasks.slice(0, 10).forEach((task: any) => {
          const taskText = `• ${task.title} - Status: ${task.status}`;
          doc.text(taskText, 25, yPos);
          yPos += 8;
          
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
        });
      }

      // Activity Timeline section (for daily reports)
      if (reportData.activities && reportData.activities.timeline && reportData.activities.timeline.length > 0) {
        // Check if we need a new page
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(16);
        doc.text('Activity Timeline', 20, yPos);
        yPos += 15;
        
        doc.setFontSize(10);
        reportData.activities.timeline.forEach((activity: any) => {
          const time = new Date(activity.time).toLocaleTimeString();
          let activityText = '';
          
          switch (activity.type) {
            case 'task':
              activityText = `${time} - Task ${activity.action}: ${activity.data.title}`;
              break;
            case 'message':
              activityText = `${time} - Message posted: ${activity.data.content?.substring(0, 50) || 'New message'}`;
              break;
            case 'file':
              activityText = `${time} - File uploaded: ${activity.data.filename || 'New file'}`;
              break;
            case 'note':
              activityText = `${time} - Note added: ${activity.data.content?.substring(0, 50) || 'New note'}`;
              break;
            case 'member':
              activityText = `${time} - Member joined: ${activity.data.user?.username || 'New member'}`;
              break;
            default:
              activityText = `${time} - ${activity.type} ${activity.action}`;
          }
          
          doc.text(activityText, 25, yPos);
          yPos += 8;
          
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
        });
      }
      
      return doc;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  // Download overall report
  const downloadOverallReport = async () => {
    setIsGeneratingReport(true);
    try {
      const overallReportUrl = `/api/projects/${project.id}/report/overall?format=pdf&timestamp=${Date.now()}`;
      console.log('Overall report requesting URL:', overallReportUrl);
      const response = await fetch(overallReportUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/pdf',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        cache: 'no-store'  // Force no caching
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to download reports');
        }
        throw new Error(`Failed to download report (${response.status})`);
      }
      
      // Check if we received a PDF response
      const contentType = response.headers.get('content-type');
      console.log('Overall report response content-type:', contentType);
      
      if (!contentType || !contentType.includes('application/pdf')) {
        // Log the actual response for debugging
        const text = await response.text();
        console.log('Overall report non-PDF response:', text.substring(0, 500));
        throw new Error(`Server returned ${contentType || 'unknown'} instead of PDF`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('Overall report PDF size:', arrayBuffer.byteLength);
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const overallDownloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = overallDownloadUrl;
      a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Overall_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(overallDownloadUrl);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Overall report downloaded successfully",
      });
    } catch (error: any) {
      console.error('Report download error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download report",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Download daily report
  const downloadDailyReport = async () => {
    if (!selectedDate) {
      toast({
        title: "Date Required",
        description: "Please select a date for the daily report.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDailyReport(true);
    try {
      const dailyReportUrl = `/api/projects/${project.id}/report/daily?date=${selectedDate}&format=pdf&timestamp=${Date.now()}`;
      console.log('Daily report requesting URL:', dailyReportUrl);
      const response = await fetch(dailyReportUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/pdf',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        cache: 'no-store'  // Force no caching
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to download reports');
        }
        throw new Error(`Failed to download daily report (${response.status})`);
      }
      
      // Check if we received a PDF response
      const contentType = response.headers.get('content-type');
      console.log('Daily report response content-type:', contentType);
      
      if (!contentType || !contentType.includes('application/pdf')) {
        // Log the actual response for debugging
        const text = await response.text();
        console.log('Daily report non-PDF response:', text.substring(0, 500));
        throw new Error(`Server returned ${contentType || 'unknown'} instead of PDF`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('Daily report PDF size:', arrayBuffer.byteLength);
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Daily_Report_${selectedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: `Daily report for ${selectedDate} downloaded successfully`,
      });
    } catch (error: any) {
      console.error('Daily report download error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download daily report",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDailyReport(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning": return "bg-blue-100 text-blue-800";
      case "active": return "bg-green-100 text-green-800";
      case "on_hold": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "urgent": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const canManageProject = user?.id === project.projectManagerId || 
                          user?.role === "hr_admin" || 
                          user?.role === "branch_manager";

  // Check if user is a project member using the members query data
  const isProjectMember = members?.some((member: any) => member.userId === user?.id) || 
                         user?.id === project.projectManagerId;
  
  // Allow all project members and managers to create tasks
  const canCreateTasks = isProjectMember || canManageProject;

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const tasksByStatus = {
    pending: tasks?.filter(t => t.status === "pending") || [],
    in_progress: tasks?.filter(t => t.status === "in_progress") || [],
    completed: tasks?.filter(t => t.status === "completed") || [],
    overdue: tasks?.filter(t => t.status === "overdue") || [],
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto pb-16">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">{project.name}</DialogTitle>
                <DialogDescription className="mt-2">
                  {project.description}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(project.status)}>
                  {project.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* Download Reports Section - ALWAYS VISIBLE */}
          <div className="w-full p-4 bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300 rounded-lg shadow-md mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-700" />
                <span className="text-base font-bold text-blue-900">📊 Download Project Reports</span>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Button
                  variant="default"
                  size="default"
                  onClick={downloadOverallReport}
                  disabled={isGeneratingReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGeneratingReport ? "Generating..." : "📋 Overall Report"}
                </Button>
                
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40 text-sm border-2 border-green-400"
                    title="Select date for daily report"
                  />
                  <Button
                    variant="default"
                    size="default"
                    onClick={downloadDailyReport}
                    disabled={isGeneratingDailyReport}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isGeneratingDailyReport ? "Generating..." : "📅 Daily Report"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Team Size</span>
                </div>
                <p className="text-2xl font-bold mt-1">{members?.length || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <ListTodo className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Tasks</span>
                </div>
                <p className="text-2xl font-bold mt-1">{tasks?.length || 0}</p>
              </CardContent>
            </Card>

            {project.budget && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Budget</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    ${Number(project.budget).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <Tabs defaultValue="overview" className="w-full space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Team Members</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 pb-12">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Project Manager</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.projectManager ? (
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={project.projectManager.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {getInitials(project.projectManager.firstName || undefined, project.projectManager.lastName || undefined)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {project.projectManager.firstName} {project.projectManager.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{project.projectManager.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No project manager assigned</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {project.startDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          Start: {new Date(project.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {project.endDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          End: {new Date(project.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                      <Badge className={getPriorityColor(project.priority)}>
                        {project.priority}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {project.clientName && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Client Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-medium">{project.clientName}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="members" className="space-y-4 pb-12">
              {/* Project Managers Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Project Managers ({project.managers?.length || 0})
                  </h3>
                  {canManageProject && (
                    <Button onClick={() => setShowAddMember(true)} size="sm" variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Manager
                    </Button>
                  )}
                </div>

                {project.managers && project.managers.length > 0 ? (
                  <div className="grid gap-2">
                    {project.managers.map((manager: any) => (
                      <Card key={manager.id} className="bg-blue-50 border-blue-200">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={manager.user.profileImageUrl || undefined} />
                                <AvatarFallback className="bg-blue-100 text-blue-700">
                                  {getInitials(manager.user.firstName || undefined, manager.user.lastName || undefined)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-blue-900">
                                  {manager.user.firstName} {manager.user.lastName}
                                </p>
                                <p className="text-sm text-blue-600">{manager.user.email}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                              Manager
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No managers assigned to this project</p>
                      {canManageProject && (
                        <p className="text-sm mt-1">Click "Add Manager" to assign project managers</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Team Members Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Team Members ({members?.filter(m => m.role !== 'manager').length || 0})</h3>
                  {canManageProject && (
                    <Button onClick={() => setShowAddMember(true)} size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-80">
                  <div className="space-y-2 pr-4" style={{paddingBottom: '3rem'}}>
                    {members?.filter(member => member.role !== 'manager').map((member) => (
                      <Card key={member.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={member.user.profileImageUrl || undefined} />
                                <AvatarFallback>
                                  {getInitials(member.user.firstName || undefined, member.user.lastName || undefined)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {member.user.firstName} {member.user.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{member.user.email}</p>
                              </div>
                            </div>
                            <Badge variant="outline">{member.role}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {/* Extra spacer to ensure last item is fully visible */}
                    <div className="h-12"></div>
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4 pb-12">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Project Tasks ({tasks?.length || 0})</h3>
                {canCreateTasks && (
                  <Button onClick={() => setShowCreateTask(true)} size="sm" data-testid="add-task-dialog-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {tasksByStatus.pending.length}
                    </div>
                    <div className="text-sm text-gray-500">Pending</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {tasksByStatus.in_progress.length}
                    </div>
                    <div className="text-sm text-gray-500">In Progress</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {tasksByStatus.completed.length}
                    </div>
                    <div className="text-sm text-gray-500">Completed</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {tasksByStatus.overdue.length}
                    </div>
                    <div className="text-sm text-gray-500">Overdue</div>
                  </CardContent>
                </Card>
              </div>

              <ScrollArea className="h-80">
                <div className="space-y-2 pr-4" style={{paddingBottom: '3rem'}}>
                  {tasks?.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium">{task.title}</h4>
                              <Badge className={getTaskStatusColor(task.status)}>
                                {task.status.replace("_", " ")}
                              </Badge>
                              <Badge className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              {task.assignedToUser && (
                                <span>
                                  Assigned to: {task.assignedToUser.firstName} {task.assignedToUser.lastName}
                                </span>
                              )}
                              {task.dueDate && (
                                <span>
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {/* Extra spacer to ensure last item is fully visible */}
                  <div className="h-12"></div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {showAddMember && (
        <AddMemberDialog
          projectId={project.id}
          open={showAddMember}
          onClose={() => setShowAddMember(false)}
        />
      )}

      {showCreateTask && (
        <CreateTaskDialog
          projectId={project.id}
          open={showCreateTask}
          onClose={() => setShowCreateTask(false)}
        />
      )}
    </>
  );
}