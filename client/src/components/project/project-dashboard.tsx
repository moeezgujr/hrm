import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from '@/components/ui/file-upload';
import { 
  Users, 
  MessageSquare, 
  FileText, 
  Calendar, 
  CheckSquare, 
  Plus, 
  Send, 
  Upload,
  Clock,
  Target,
  AlertCircle,
  Edit3,
  Download,
  User as UserIcon,
  Timer,
  Hash,
  CheckCircle,
  RotateCcw,
  Edit
} from "lucide-react";
import type { 
  Project, 
  ProjectMember, 
  ProjectTask, 
  ProjectNote, 
  ProjectMessage, 
  User as UserType 
} from "@shared/schema";
import { ProjectOverview } from "./project-overview";
import AddMemberDialog from "./add-member-dialog";
import CreateTaskDialog from "./create-task-dialog";
import EditTaskDialog from "./edit-task-dialog";

// File record type for proper TypeScript support
type FileRecord = {
  id: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  projectId: number;
  uploadedBy: number;
  uploadedAt: string;
  linkedToMessage?: number | null;
  linkedToNote?: number | null;
  linkedToTask?: number | null;
};

type ProjectWithDetails = Project & {
  projectManager?: UserType;
  managers: (ProjectMember & { user: UserType })[];
  members: (ProjectMember & { user: UserType })[];
  tasks: (ProjectTask & { assignedToUser?: UserType; assignedByUser?: UserType })[];
  notes: (ProjectNote & { author: UserType })[];
  messages: (ProjectMessage & { sender: UserType })[];
};

interface ProjectDashboardProps {
  projectId: number;
  onClose: () => void;
}

export default function ProjectDashboard({ projectId, onClose }: ProjectDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [newMessage, setNewMessage] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [noteType, setNoteType] = useState<"daily" | "weekly" | "monthly" | "general">("daily");
  const [uploadedNoteFile, setUploadedNoteFile] = useState<any>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: number; userId: number }) => {
      const response = await apiRequest("DELETE", `/api/projects/${projectId}/members/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Member removed",
        description: "The team member has been removed from the project successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  // Handle removing a member from the project
  const handleRemoveMember = (userId: number, userName: string) => {
    if (confirm(`Are you sure you want to remove ${userName} from this project?`)) {
      removeMemberMutation.mutate({ projectId, userId });
    }
  };

  const [editingTask, setEditingTask] = useState<(ProjectTask & { assignedToUser?: UserType }) | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingDailyReport, setIsGeneratingDailyReport] = useState(false);

  const { data: project, isLoading } = useQuery<ProjectWithDetails>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  // Fetch project files
  const { data: files } = useQuery<FileRecord[]>({
    queryKey: ["/api/projects", projectId, "files"],
    enabled: !!projectId,
  });

  const { data: availableUsers } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/messages`, {
        message,
        messageType: "text"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      setNewMessage("");
      toast({
        title: "Message sent",
        description: "Your message has been posted to the project chat.",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (noteData: { title: string; content: string; type: string }) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/notes`, noteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      setNewNoteTitle("");
      setNewNoteContent("");
      toast({
        title: "Note added",
        description: "Your project note has been saved successfully.",
      });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (userData: { userId: number; role: string }) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/members`, userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "Team member added",
        description: "New team member has been added to the project.",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: number; updates: any }) => {
      const response = await apiRequest("PUT", `/api/project-tasks/${taskId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "Task updated",
        description: "Task status has been updated successfully.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) return null;

  const isAdmin = user?.role === "hr_admin";
  const isHRAdmin = user?.role === "hr_admin";
  const isProjectManager = user?.id === project.projectManagerId || isAdmin || user?.role === "project_manager";
  const isMember = project.members?.some(member => member.userId === user?.id) || isProjectManager;
  
  // Allow all project members and managers to create tasks and notes
  const canCreateTasks = isMember || isProjectManager || isHRAdmin;
  const canViewNotes = isMember || isProjectManager || isHRAdmin;
  
  const completedTasks = project.tasks?.filter(task => task.status === "completed").length || 0;
  const totalTasks = project.tasks?.length || 0;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const handleAddNote = async () => {
    if (newNoteTitle.trim() && newNoteContent.trim()) {
      try {
        // Create the note first
        const newNote = await addNoteMutation.mutateAsync({
          title: newNoteTitle.trim(),
          content: newNoteContent.trim(),
          type: noteType
        });
        
        // If there's an uploaded file, link it to the new note
        if (uploadedNoteFile?.id && newNote?.id) {
          await apiRequest("PUT", `/api/files/${uploadedNoteFile.id}/link`, {
            linkedToNote: newNote.id
          });
        }
        
        // Reset form and file
        setNewNoteTitle("");
        setNewNoteContent("");
        setUploadedNoteFile(null);
        
      } catch (error) {
        console.error('Error adding note or linking file:', error);
      }
    }
  };

  const downloadOverallReport = async () => {
    setIsGeneratingReport(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/report`);
      if (!response.ok) throw new Error('Failed to generate report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Overall_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Overall report downloaded",
        description: "Complete project overview has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download overall report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const downloadDailyReport = async () => {
    if (!selectedDate) {
      toast({
        title: "Date required",
        description: "Please select a date for the daily report.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingDailyReport(true);
    try {
      const dashboardDailyUrl = `/api/projects/${projectId}/report/daily?date=${selectedDate}&format=pdf&timestamp=${Date.now()}`;
      console.log('Dashboard daily report requesting URL:', dashboardDailyUrl);
      
      const response = await fetch(dashboardDailyUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/pdf',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to download reports');
        }
        throw new Error(`Failed to download daily report (${response.status})`);
      }

      // Check if we received a PDF response
      const contentType = response.headers.get('content-type');
      console.log('Dashboard daily report response content-type:', contentType);
      
      if (!contentType || !contentType.includes('application/pdf')) {
        const text = await response.text();
        console.log('Dashboard daily report non-PDF response:', text.substring(0, 500));
        throw new Error(`Server returned ${contentType || 'unknown'} instead of PDF`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('Dashboard daily report PDF size:', arrayBuffer.byteLength);
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const dashboardDownloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dashboardDownloadUrl;
      a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Daily_Report_${selectedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(dashboardDownloadUrl);
      document.body.removeChild(a);
      
      toast({
        title: "Daily report downloaded",
        description: `Daily activity report for ${selectedDate} has been downloaded successfully.`,
      });
    } catch (error: any) {
      console.error('Dashboard daily report download error:', error);
      toast({
        title: "Download failed",
        description: error.message || "Failed to download daily report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingDailyReport(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              <CardDescription className="mt-2 flex items-center gap-4">
                <span>Managers: {project?.managers?.length > 0 ? 
                  project.managers.map(m => m.user.username).join(', ') : 
                  (project?.projectManager?.username || 'None assigned')}</span>
                <Badge className={
                  project.status === "active" ? "bg-green-100 text-green-800" :
                  project.status === "planning" ? "bg-blue-100 text-blue-800" :
                  project.status === "completed" ? "bg-gray-100 text-gray-800" :
                  project.status === "on_hold" ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }>
                  {project.status.replace("_", " ")}
                </Badge>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        </CardHeader>

        {/* Download Reports Section - ALWAYS VISIBLE */}
        <div className="w-full p-4 bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300 rounded-lg shadow-md mx-6 my-4">
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

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b px-6">
              <TabsList className="grid w-full max-w-md grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
            </div>

            <div className="h-[calc(90vh-200px)] overflow-y-auto">
              <TabsContent value="overview" className="p-0">
                <ProjectOverview 
                  projectId={project.id} 
                  projectName={project.name}
                  isManager={isProjectManager}
                />
              </TabsContent>

              <TabsContent value="tasks" className="p-6 pb-16">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Project Tasks</h3>
                    {canCreateTasks && (
                      <Button size="sm" onClick={() => setShowCreateTask(true)} data-testid="add-task-button">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                      </Button>
                    )}
                  </div>
                  
                  {/* Show recent unlinked files available for download in Tasks section */}
                  {files && Array.isArray(files) && files.filter((file: any) => 
                    !file.linkedToMessage && 
                    !file.linkedToNote && 
                    !file.linkedToTask &&
                    file.uploadedBy === user?.id &&
                    new Date(file.uploadedAt) > new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
                  ).length > 0 && (
                    <div className="mb-4 p-3 border rounded bg-blue-50">
                      <div className="text-xs text-gray-600 mb-2">Recent uploads available for download:</div>
                      <div className="space-y-2">
                        {files.filter((file: any) => 
                          !file.linkedToMessage && 
                          !file.linkedToNote && 
                          !file.linkedToTask &&
                          file.uploadedBy === user?.id &&
                          new Date(file.uploadedAt) > new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
                        ).map((file: any) => (
                          <div key={file.id} className="flex items-center gap-2 p-2 bg-white rounded border text-xs">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="flex-1 truncate">{file.fileName}</span>
                            <span className="text-muted-foreground">({Math.round(file.fileSize / 1024)}KB)</span>
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              data-testid={`button-download-unlinked-tasks-${file.id}`}
                            >
                              <a 
                                href={`/api/files/${file.id}/download`} 
                                download={file.fileName}
                                rel="noopener"
                                className="inline-flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                Download
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {project.tasks && project.tasks.length > 0 ? (
                      project.tasks.map((task) => (
                        <Card key={task.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                          <CardContent className="p-5">
                            <div className="space-y-4">
                              {/* Task Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-lg text-gray-900 mb-2">{task.title}</h4>
                                  {task.description && (
                                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{task.description}</p>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2 ml-4">
                                  <Badge variant={
                                    task.priority === 'urgent' ? 'destructive' :
                                    task.priority === 'high' ? 'default' :
                                    task.priority === 'medium' ? 'secondary' : 'outline'
                                  }>
                                    {task.priority.toUpperCase()}
                                  </Badge>
                                  <Badge className={
                                    task.status === "completed" ? "bg-green-100 text-green-800" :
                                    task.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                                    task.status === "overdue" ? "bg-red-100 text-red-800" :
                                    "bg-gray-100 text-gray-800"
                                  }>
                                    {task.status.replace("_", " ").toUpperCase()}
                                  </Badge>
                                </div>
                              </div>

                              {/* Task Details Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Assignment */}
                                <div className="flex items-center gap-2">
                                  <UserIcon className="h-4 w-4 text-gray-500" />
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-700">Assigned:</span>
                                    <br />
                                    <span className="text-gray-600">
                                      {task.assignedToUser ? task.assignedToUser.username : 'Unassigned'}
                                    </span>
                                  </div>
                                </div>

                                {/* Start Date */}
                                {task.startDate && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-green-500" />
                                    <div className="text-sm">
                                      <span className="font-medium text-gray-700">Start Date:</span>
                                      <br />
                                      <span className="text-gray-600">
                                        {new Date(task.startDate).toLocaleDateString('en-US', {
                                          weekday: 'short',
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Due Date */}
                                {task.dueDate && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-red-500" />
                                    <div className="text-sm">
                                      <span className="font-medium text-gray-700">Due Date:</span>
                                      <br />
                                      <span className="text-gray-600">
                                        {new Date(task.dueDate).toLocaleDateString('en-US', {
                                          weekday: 'short',
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                


                                {/* Estimated Hours */}
                                {task.estimatedHours && (
                                  <div className="flex items-center gap-2">
                                    <Timer className="h-4 w-4 text-blue-500" />
                                    <div className="text-sm">
                                      <span className="font-medium text-gray-700">Estimated:</span>
                                      <br />
                                      <span className="text-gray-600">{task.estimatedHours} hours</span>
                                    </div>
                                  </div>
                                )}

                                {/* Task ID */}
                                <div className="flex items-center gap-2">
                                  <Hash className="h-4 w-4 text-gray-400" />
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-700">Task ID:</span>
                                    <br />
                                    <span className="text-gray-600">#{task.id}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium text-gray-700">Progress</span>
                                  <span className="text-gray-600">
                                    {task.status === 'completed' ? '100%' :
                                     task.status === 'in_progress' ? '50%' : '0%'}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      task.status === 'completed' ? 'bg-green-500 w-full' :
                                      task.status === 'in_progress' ? 'bg-blue-500 w-1/2' :
                                      'bg-gray-300 w-0'
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* Show files attached to this task */}
                              {files && Array.isArray(files) && files.filter((file: any) => file.linkedToTask === task.id).length > 0 && (
                                <div className="space-y-2">
                                  <h5 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Task Files
                                  </h5>
                                  <div className="space-y-2">
                                    {files.filter((file: any) => file.linkedToTask === task.id).map((file: any) => (
                                      <div key={file.id} className="flex items-center gap-2 p-2 bg-muted rounded border text-xs">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        <span className="flex-1 truncate">{file.fileName}</span>
                                        <span className="text-muted-foreground">({Math.round(file.fileSize / 1024)}KB)</span>
                                        <Button
                                          asChild
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 px-2 text-xs hover:bg-background"
                                          data-testid={`button-download-taskfile-${file.id}`}
                                        >
                                          <a 
                                            href={`/api/files/${file.id}/download`} 
                                            download={file.fileName}
                                            rel="noopener"
                                            className="inline-flex items-center"
                                          >
                                            <Download className="h-3 w-3 mr-1" />
                                            Download
                                          </a>
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              {(isProjectManager || task.assignedTo === user?.id) && (
                                <div className="pt-3 border-t border-gray-100">
                                  <div className="flex gap-2">
                                    {isProjectManager && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => setEditingTask(task)}
                                        className="flex-1"
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Task
                                      </Button>
                                    )}
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        const newStatus = task.status === "completed" ? "pending" : "completed";
                                        updateTaskMutation.mutate({
                                          taskId: task.id,
                                          updates: { 
                                            status: newStatus,
                                            completedAt: newStatus === "completed" ? new Date() : null
                                          }
                                        });
                                      }}
                                      disabled={updateTaskMutation.isPending}
                                      className="flex-1"
                                    >
                                      {task.status === "completed" ? 
                                        <><RotateCcw className="h-4 w-4 mr-2" />Reopen</> : 
                                        <><CheckCircle className="h-4 w-4 mr-2" />Complete</>
                                      }
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <div className="text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <h4 className="text-lg font-medium mb-2">No tasks yet</h4>
                            <p className="text-sm mb-4">Get started by creating your first project task</p>
                            {canCreateTasks && (
                              <Button size="sm" onClick={() => setShowCreateTask(true)} data-testid="add-first-task-button">
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Task
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="team" className="p-6 pb-16">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Team Members</h3>
                    {isProjectManager && (
                      <Button size="sm" onClick={() => setShowAddMember(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {/* Project Managers Section */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        Project Managers ({project?.managers?.length || 0})
                      </h4>
                      {project?.managers && project.managers.length > 0 ? (
                        <div className="space-y-2">
                          {project.managers.map((manager) => (
                            <Card key={manager.id} className="bg-blue-50 border-blue-200">
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback className="bg-blue-100 text-blue-700">
                                      {manager.user?.username?.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="font-medium text-blue-900">{manager.user?.username}</div>
                                    <div className="text-sm text-blue-600">{manager.user?.email}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-blue-100 text-blue-700 border-blue-300">Manager</Badge>
                                    {(isProjectManager || isHRAdmin) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveMember(manager.userId, manager.user?.username || 'Unknown')}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1"
                                        disabled={removeMemberMutation.isPending}
                                        data-testid={`remove-manager-${manager.userId}`}
                                      >
                                        Remove
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="border-dashed border-gray-300">
                          <CardContent className="p-4 text-center text-gray-500">
                            <Users className="h-6 w-6 mx-auto mb-1 opacity-50" />
                            <p className="text-sm">No managers assigned</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Legacy Project Manager (if exists and no managers in new system) */}
                    {project.projectManager && (!project?.managers || project.managers.length === 0) && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Legacy Project Manager</h4>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {project.projectManager?.username?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-medium">{project.projectManager?.username}</div>
                                <div className="text-sm text-gray-600">{project.projectManager?.email}</div>
                              </div>
                              <Badge className="bg-purple-100 text-purple-800">Project Manager</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Team Members Section */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Team Members ({project?.members?.filter(m => m.role !== 'manager').length || 0})</h4>
                      {project?.members?.filter(member => member.role !== 'manager').length > 0 ? (
                        <div className="space-y-2">
                          {project.members.filter(member => member.role !== 'manager').map((member) => (
                            <Card key={member.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback>
                                      {member.user?.username?.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="font-medium">{member.user?.username}</div>
                                    <div className="text-sm text-gray-600">{member.user?.email}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{member.role}</Badge>
                                    {(isProjectManager || isHRAdmin) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveMember(member.userId, member.user?.username || 'Unknown')}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1"
                                        disabled={removeMemberMutation.isPending}
                                        data-testid={`remove-member-${member.userId}`}
                                      >
                                        Remove
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="border-dashed border-gray-300">
                          <CardContent className="p-4 text-center text-gray-500">
                            <Users className="h-6 w-6 mx-auto mb-1 opacity-50" />
                            <p className="text-sm">No team members yet</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="chat" className="p-6 pb-16">
                {isMember ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Project Communication</h3>
                    
                    <Card className="h-[calc(100%-8rem)]">
                      <CardContent className="p-4 h-full flex flex-col">
                        <ScrollArea className="flex-1 mb-4">
                          <div className="space-y-3 pr-4 pb-4">
                            {project.messages?.map((message) => (
                              <div key={message.id} className="flex gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {message.sender?.username?.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{message.sender?.username}</span>
                                    <span className="text-xs text-gray-500">
                                      {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : ''}
                                    </span>
                                  </div>
                                  <p className="text-sm mt-1">{message.message}</p>
                                  
                                  {/* Show attached files linked to this message */}
                                  {files && Array.isArray(files) ? files.filter((file: any) => file.linkedToMessage === message.id).map((file: any) => (
                                    <div key={file.id} className="mt-2 flex items-center gap-2 p-2 bg-muted rounded border text-xs">
                                      <FileText className="h-4 w-4 text-blue-500" />
                                      <span className="flex-1 truncate">{file.fileName}</span>
                                      <span className="text-muted-foreground">({Math.round(file.fileSize / 1024)}KB)</span>
                                      <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2"
                                        data-testid={`button-download-messagefile-${file.id}`}
                                      >
                                        <a 
                                          href={`/api/files/${file.id}/download`} 
                                          download={file.fileName}
                                          rel="noopener"
                                          className="inline-flex items-center"
                                        >
                                          <Download className="h-3 w-3" />
                                        </a>
                                      </Button>
                                    </div>
                                  )) : null}
                                </div>
                              </div>
                            ))}
                            {(!project.messages || project.messages.length === 0) && (
                              <div className="text-center py-8 text-gray-500">
                                No messages yet. Start the conversation!
                              </div>
                            )}

                            {/* Show recent unlinked files as downloadable attachments */}
                            {files && Array.isArray(files) && (
                              (() => {
                                const recentUnlinkedFiles = files.filter((file: any) => 
                                  !file.linkedToMessage && 
                                  !file.linkedToNote && 
                                  !file.linkedToTask &&
                                  file.uploadedBy === user?.id &&
                                  new Date(file.uploadedAt) > new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
                                );
                                
                                if (recentUnlinkedFiles.length > 0) {
                                  return (
                                    <div className="mt-4 p-3 border-t">
                                      <div className="text-xs text-gray-500 mb-2">Recent uploads available for download:</div>
                                      <div className="space-y-2">
                                        {recentUnlinkedFiles.map((file: any) => (
                                          <div key={file.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded border text-xs">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            <span className="flex-1 truncate">{file.fileName}</span>
                                            <span className="text-muted-foreground">({Math.round(file.fileSize / 1024)}KB)</span>
                                            <Button
                                              asChild
                                              variant="outline"
                                              size="sm"
                                              className="h-6 px-2 text-xs"
                                              data-testid={`button-download-unlinked-${file.id}`}
                                            >
                                              <a 
                                                href={`/api/files/${file.id}/download`} 
                                                download={file.fileName}
                                                rel="noopener"
                                                className="inline-flex items-center gap-1"
                                              >
                                                <Download className="h-3 w-3" />
                                                Download
                                              </a>
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()
                            )}
                          </div>
                        </ScrollArea>
                        
                        <Separator className="mb-4" />
                        
                        <div className="flex gap-2 mt-auto">
                          <div className="flex-1 flex gap-2">
                            <Input
                              placeholder="Type your message..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                              className="flex-1"
                            />
                            <FileUpload
                              variant="minimal"
                              projectId={projectId}
                              onFileSelect={async (file, base64, uploadResult) => {
                                // Send file as message with attachment info
                                const fileMessage = `📎 ${file.name}`;
                                
                                // Create message first, then link file
                                try {
                                  // Send message with file attachment info  
                                  const messageResult = await sendMessageMutation.mutateAsync(fileMessage);
                                  
                                  // Link the uploaded file to this message using proper API request
                                  if (uploadResult?.id && messageResult?.id) {
                                    try {
                                      await apiRequest("PUT", `/api/files/${uploadResult.id}/link`, {
                                        linkedToMessage: messageResult.id
                                      });
                                      console.log('File successfully linked to message');
                                    } catch (linkError) {
                                      console.error('File linking failed, but file is still uploaded:', linkError);
                                    }
                                  }
                                  
                                  // Refresh project data to show the file
                                  queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
                                  queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'files'] });
                                } catch (error) {
                                  console.error('Error creating message or linking file:', error);
                                }
                                
                                console.log('File uploaded and linked:', uploadResult);
                              }}
                              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*"
                              maxSizeMB={5}
                              disabled={sendMessageMutation.isPending}
                            />
                          </div>
                          <Button 
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sendMessageMutation.isPending}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    You need to be a project member to access the chat.
                  </div>
                )}
              </TabsContent>


              <TabsContent value="notes" className="p-6 pb-16">
                {canViewNotes ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Project Notes</h3>
                      {isHRAdmin && !isProjectManager && (
                        <Badge variant="secondary" className="text-xs">
                          HR Administrator View
                        </Badge>
                      )}
                    </div>

                    {canViewNotes && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Add New Note</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                            placeholder="Note title"
                            value={newNoteTitle}
                            onChange={(e) => setNewNoteTitle(e.target.value)}
                          />
                            <select
                            className="px-3 py-2 border rounded-md"
                            value={noteType}
                            onChange={(e) => setNoteType(e.target.value as any)}
                          >
                            <option value="daily">Daily Note</option>
                            <option value="weekly">Weekly Note</option>
                            <option value="monthly">Monthly Note</option>
                            <option value="general">General Note</option>
                          </select>
                          </div>
                          <Textarea
                          placeholder="Note content..."
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          rows={4}
                        />
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleAddNote}
                              disabled={!newNoteTitle.trim() || !newNoteContent.trim() || addNoteMutation.isPending}
                              className="flex-1"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Add Note
                            </Button>
                            <FileUpload
                              variant="compact"  
                              projectId={projectId}
                              onFileSelect={async (file, base64, uploadResult) => {
                                // Handle note file attachment - Link to the most recently added note
                                console.log("Note file uploaded:", uploadResult);
                                
                                // First create the note, then link the file
                                if (!newNoteTitle.trim() || !newNoteContent.trim()) {
                                  // If note fields are empty, just upload the file without linking
                                  return;
                                }
                                
                                // The note will be created when "Add Note" is clicked
                                // For now, store the file info to link later
                                setUploadedNoteFile(uploadResult);
                              }}
                              accept="*/*"
                              maxSizeMB={10}
                              placeholder="Attach file to note"
                              disabled={addNoteMutation.isPending}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Show recent unlinked files available for download in Notes section */}
                    {files && Array.isArray(files) && files.filter((file: any) => 
                      !file.linkedToMessage && 
                      !file.linkedToNote && 
                      !file.linkedToTask &&
                      file.uploadedBy === user?.id &&
                      new Date(file.uploadedAt) > new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
                    ).length > 0 && (
                      <div className="mb-4 p-3 border rounded bg-blue-50">
                        <div className="text-xs text-gray-600 mb-2">Recent uploads available for download:</div>
                        <div className="space-y-2">
                          {files.filter((file: any) => 
                            !file.linkedToMessage && 
                            !file.linkedToNote && 
                            !file.linkedToTask &&
                            file.uploadedBy === user?.id &&
                            new Date(file.uploadedAt) > new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
                          ).map((file: any) => (
                            <div key={file.id} className="flex items-center gap-2 p-2 bg-white rounded border text-xs">
                              <FileText className="h-4 w-4 text-blue-500" />
                              <span className="flex-1 truncate">{file.fileName}</span>
                              <span className="text-muted-foreground">({Math.round(file.fileSize / 1024)}KB)</span>
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                data-testid={`button-download-unlinked-notes-${file.id}`}
                              >
                                <a 
                                  href={`/api/files/${file.id}/download`} 
                                  download={file.fileName}
                                  rel="noopener"
                                  className="inline-flex items-center gap-1"
                                >
                                  <Download className="h-3 w-3" />
                                  Download
                                </a>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      <div className="space-y-3 pr-4 pb-4">
                        {project.notes?.map((note) => (
                          <Card key={note.id}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{note.title}</CardTitle>
                                <div className="flex items-center gap-2">
                                  <Badge className={
                                    note.type === "daily" ? "bg-blue-100 text-blue-800" :
                                    note.type === "weekly" ? "bg-green-100 text-green-800" :
                                    note.type === "monthly" ? "bg-purple-100 text-purple-800" :
                                    "bg-gray-100 text-gray-800"
                                  }>
                                    {note.type}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    📅 {note.noteDate ? new Date(note.noteDate).toLocaleDateString() : new Date().toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="whitespace-pre-wrap">{note.content}</p>
                              
                              {/* Show files attached to this note */}
                              {files && Array.isArray(files) ? files.filter((file: any) => file.linkedToNote === note.id).map((file: any) => (
                                <div key={file.id} className="mt-3 flex items-center gap-2 p-2 bg-muted rounded border text-xs">
                                  <FileText className="h-4 w-4 text-blue-500" />
                                  <span className="flex-1 truncate">{file.fileName}</span>
                                  <span className="text-muted-foreground">({Math.round(file.fileSize / 1024)}KB)</span>
                                  <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs hover:bg-background"
                                    data-testid={`button-download-notefile-${file.id}`}
                                  >
                                    <a 
                                      href={`/api/files/${file.id}/download`} 
                                      download={file.fileName}
                                      rel="noopener"
                                      className="inline-flex items-center"
                                    >
                                      <Download className="h-3 w-3 mr-1" />
                                      Download
                                    </a>
                                  </Button>
                                </div>
                              )) : null}
                              
                              <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                                By {note.author?.username} • {note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {(!project.notes || project.notes.length === 0) && (
                          <div className="text-center py-8 text-gray-500">
                            No notes yet. Add your first project note above.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Only project members, managers, and HR administrators can view and add project notes.
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </Card>
      
      {/* Add Member Dialog */}
      <AddMemberDialog
        projectId={projectId}
        open={showAddMember}
        onClose={() => setShowAddMember(false)}
      />
      
      {/* Create Task Dialog */}
      <CreateTaskDialog
        projectId={projectId}
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
      />
      
      {/* Edit Task Dialog */}
      {editingTask && (
        <EditTaskDialog
          projectId={projectId}
          task={editingTask}
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}