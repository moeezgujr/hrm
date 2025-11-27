import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare,
  Calendar,
  FileText,
  Video,
  Camera,
  Palette,
  Target,
  User,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

interface TeamCollaborationProps {
  tasks: any[];
  projects: any[];
}

export function TeamCollaboration({ tasks, projects }: TeamCollaborationProps) {
  const [selectedTab, setSelectedTab] = useState("creators");
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newCreatorOpen, setNewCreatorOpen] = useState(false);
  const [promoteEmployeeOpen, setPromoteEmployeeOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    taskType: '',
    priority: 'medium',
    assignedTo: '',
    projectId: '',
    campaignId: '',
    dueDate: '',
    estimatedHours: ''
  });
  
  const [creatorFormData, setCreatorFormData] = useState({
    name: '',
    email: '',
    role: 'content_creator',
    specialization: '',
    skills: '',
    portfolioUrl: '',
    bio: '',
    hourlyRate: '',
    availability: 'full_time'
  });

  const [promoteFormData, setPromoteFormData] = useState({
    employeeId: '',
    role: 'content_creator',
    specialization: '',
    skills: '',
    portfolioUrl: '',
    bio: '',
    hourlyRate: '',
    availability: 'full_time'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users for task assignment
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => fetch('/api/users').then(res => res.json()),
  });

  // Fetch campaigns for task association
  const { data: campaigns = [] } = useQuery({
    queryKey: ['/api/social-media/campaigns'],
    queryFn: () => fetch('/api/social-media/campaigns').then(res => res.json()),
  });

  // Add content creator mutation
  const createCreatorMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/social-media/content-creators', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "Content creator added successfully",
      });
      setNewCreatorOpen(false);
      resetCreatorForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add content creator",
        variant: "destructive",
      });
    }
  });

  // Promote employee mutation
  const promoteEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/social-media/promote-employee', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "Employee promoted to content creator successfully",
      });
      setPromoteEmployeeOpen(false);
      resetPromoteForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to promote employee",
        variant: "destructive",
      });
    }
  });

  const resetCreatorForm = () => {
    setCreatorFormData({
      name: '',
      email: '',
      role: 'content_creator',
      specialization: '',
      skills: '',
      portfolioUrl: '',
      bio: '',
      hourlyRate: '',
      availability: 'full_time'
    });
  };

  const resetPromoteForm = () => {
    setPromoteFormData({
      employeeId: '',
      role: 'content_creator',
      specialization: '',
      skills: '',
      portfolioUrl: '',
      bio: '',
      hourlyRate: '',
      availability: 'full_time'
    });
  };

  const handleCreatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!creatorFormData.name || !creatorFormData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createCreatorMutation.mutate(creatorFormData);
  };

  const handlePromoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!promoteFormData.employeeId) {
      toast({
        title: "Validation Error",
        description: "Please select an employee to promote",
        variant: "destructive",
      });
      return;
    }

    promoteEmployeeMutation.mutate(promoteFormData);
  };

  const taskTypes = [
    { value: 'content_creation', label: 'Content Creation', icon: FileText },
    { value: 'design', label: 'Design', icon: Palette },
    { value: 'copywriting', label: 'Copywriting', icon: Edit },
    { value: 'video_production', label: 'Video Production', icon: Video },
    { value: 'photography', label: 'Photography', icon: Camera },
    { value: 'scheduling', label: 'Scheduling', icon: Calendar },
    { value: 'campaign_management', label: 'Campaign Management', icon: Target },
    { value: 'analytics', label: 'Analytics', icon: Users }
  ];

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800'
  };

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/social-media/tasks', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/tasks'] });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      setNewTaskOpen(false);
      resetTaskForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number, status: string }) => {
      return await apiRequest('PUT', `/api/social-media/tasks/${taskId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/tasks'] });
      toast({
        title: "Success",
        description: "Task status updated",
      });
    }
  });

  const resetTaskForm = () => {
    setTaskFormData({
      title: '',
      description: '',
      taskType: '',
      priority: 'medium',
      assignedTo: '',
      projectId: '',
      campaignId: '',
      dueDate: '',
      estimatedHours: ''
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskFormData.title || !taskFormData.taskType || !taskFormData.assignedTo) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createTaskMutation.mutate({
      ...taskFormData,
      assignedTo: parseInt(taskFormData.assignedTo),
      projectId: taskFormData.projectId ? parseInt(taskFormData.projectId) : undefined,
      campaignId: taskFormData.campaignId ? parseInt(taskFormData.campaignId) : undefined,
      estimatedHours: taskFormData.estimatedHours ? parseFloat(taskFormData.estimatedHours) : undefined,
      dueDate: taskFormData.dueDate ? new Date(taskFormData.dueDate).toISOString() : undefined
    });
  };

  const getTaskIcon = (taskType: string) => {
    const task = taskTypes.find(t => t.value === taskType);
    return task ? <task.icon className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  };

  const getUserName = (userId: number) => {
    const user = users.find((u: any) => u.id === userId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Unknown';
  };

  const getProjectName = (projectId: number) => {
    const project = projects.find((p: any) => p.id === projectId);
    return project ? project.name : 'No Project';
  };

  const getCampaignName = (campaignId: number) => {
    const campaign = campaigns.find((c: any) => c.id === campaignId);
    return campaign ? campaign.name : 'No Campaign';
  };

  // Group tasks by status
  const tasksByStatus = tasks.reduce((acc, task) => {
    const status = task.status || 'pending';
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {});

  // Calculate team metrics
  const teamMetrics = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    overdueTasks: tasks.filter(t => t.status === 'overdue').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Team Collaboration</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setNewCreatorOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Creator
          </Button>
          <Button onClick={() => setNewTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Team Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMetrics.totalTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMetrics.inProgressTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMetrics.completedTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMetrics.overdueTasks}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="creators">Content Creators</TabsTrigger>
          <TabsTrigger value="tasks">Task Board</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="team">Team Members</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['pending', 'in_progress', 'completed', 'overdue'].map(status => (
              <Card key={status} className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
                    {status === 'pending' && <Clock className="h-4 w-4" />}
                    {status === 'in_progress' && <Users className="h-4 w-4" />}
                    {status === 'completed' && <CheckCircle className="h-4 w-4" />}
                    {status === 'overdue' && <AlertTriangle className="h-4 w-4" />}
                    {status.replace('_', ' ')}
                    <Badge variant="secondary" className="ml-auto">
                      {tasksByStatus[status]?.length || 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(tasksByStatus[status] || []).map((task: any) => (
                    <Card key={task.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          {getTaskIcon(task.taskType)}
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <Badge className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                            {task.priority}
                          </Badge>
                          {task.assignedTo && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span className="text-xs">{getUserName(task.assignedTo)}</span>
                            </div>
                          )}
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.dueDate), 'MMM dd')}
                          </div>
                        )}
                        <div className="flex gap-1">
                          {task.projectId && (
                            <Badge variant="outline" className="text-xs">
                              {getProjectName(task.projectId)}
                            </Badge>
                          )}
                          {task.campaignId && (
                            <Badge variant="outline" className="text-xs">
                              {getCampaignName(task.campaignId)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6"
                            onClick={() => updateTaskStatusMutation.mutate({
                              taskId: task.id,
                              status: task.status === 'pending' ? 'in_progress' : 
                                     task.status === 'in_progress' ? 'completed' : task.status
                            })}
                          >
                            {task.status === 'pending' ? 'Start' : 
                             task.status === 'in_progress' ? 'Complete' : 'Done'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project: any) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                      {project.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {project.progress || 0}% complete
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4" />
                      <span>PM: {getUserName(project.projectManager)}</span>
                    </div>
                    {project.deadline && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {project.budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4" />
                        <span>Budget: ${project.budget}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.filter((user: any) => 
              ['social_media_manager', 'content_creator', 'content_editor', 'social_media_specialist', 'creative_director'].includes(user.role)
            ).map((user: any) => {
              const userTasks = tasks.filter(t => t.assignedTo === user.id);
              const activeTasks = userTasks.filter(t => ['pending', 'in_progress'].includes(t.status));
              
              return (
                <Card key={user.id}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.profileImageUrl} />
                        <AvatarFallback>
                          {(user.firstName?.[0] || '') + (user.lastName?.[0] || user.username?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {user.role.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{activeTasks.length}</div>
                        <div className="text-xs text-muted-foreground">Active Tasks</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {userTasks.filter(t => t.status === 'completed').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {activeTasks.slice(0, 3).map((task: any) => (
                        <div key={task.id} className="flex items-center gap-2 text-sm">
                          {getTaskIcon(task.taskType)}
                          <span className="truncate">{task.title}</span>
                          <Badge className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                            {task.priority}
                          </Badge>
                        </div>
                      ))}
                      {activeTasks.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{activeTasks.length - 3} more tasks
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="creators" className="space-y-4">
          {/* Tutorial Card */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-green-900 mb-1">Content Creator Management</h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>• <strong>Add Creators:</strong> Click "Add Creator" to onboard new content creators</p>
                    <p>• <strong>Manage Skills:</strong> Track specializations, skills, and portfolio links</p>
                    <p>• <strong>Assign Tasks:</strong> Content creators will appear in task assignment dropdowns</p>
                    <p>• <strong>Track Performance:</strong> Monitor active tasks and completion rates</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Creators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.filter((user: any) => 
              user.role === 'content_creator' || user.role === 'social_media_specialist'
            ).map((creator: any) => {
              const creatorTasks = tasks.filter(t => t.assignedTo === creator.id);
              const activeTasks = creatorTasks.filter(t => ['pending', 'in_progress'].includes(t.status));
              
              return (
                <Card key={creator.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={creator.profileImageUrl} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {(creator.firstName?.[0] || '') + (creator.lastName?.[0] || creator.username?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {`${creator.firstName || ''} ${creator.lastName || ''}`.trim() || creator.username}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {creator.email}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {creator.role.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{activeTasks.length}</div>
                        <div className="text-xs text-blue-600">Active Tasks</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {creatorTasks.filter(t => t.status === 'completed').length}
                        </div>
                        <div className="text-xs text-green-600">Completed</div>
                      </div>
                    </div>

                    {/* Recent Tasks */}
                    {activeTasks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Recent Tasks</h4>
                        <div className="space-y-2">
                          {activeTasks.slice(0, 2).map((task: any) => (
                            <div key={task.id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                              {getTaskIcon(task.taskType)}
                              <span className="truncate flex-1">{task.title}</span>
                              <Badge className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                                {task.priority}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills or Specialization */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Specializations</h4>
                      <div className="flex flex-wrap gap-1">
                        {['Content Writing', 'Video Production', 'Graphic Design'].map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add New Creator Options */}
            <div className="space-y-4">
              <Card 
                className="border-dashed border-2 border-gray-300 hover:border-blue-400 cursor-pointer transition-colors"
                onClick={() => setNewCreatorOpen(true)}
              >
                <CardContent className="flex flex-col items-center justify-center h-full min-h-48 text-center p-6">
                  <div className="p-4 bg-blue-50 rounded-full mb-4">
                    <Plus className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">Add New Creator</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a new content creator account
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="border-dashed border-2 border-orange-300 hover:border-orange-400 cursor-pointer transition-colors"
                onClick={() => setPromoteEmployeeOpen(true)}
              >
                <CardContent className="flex flex-col items-center justify-center h-full min-h-48 text-center p-6">
                  <div className="p-4 bg-orange-50 rounded-full mb-4">
                    <User className="h-8 w-8 text-orange-500" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">Promote Employee</h3>
                  <p className="text-sm text-muted-foreground">
                    Convert an existing employee to content creator
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Task Modal */}
      {newTaskOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter task description"
                    className="h-20"
                  />
                </div>

                <div>
                  <Label htmlFor="taskType">Task Type *</Label>
                  <Select 
                    value={taskFormData.taskType} 
                    onValueChange={(value) => setTaskFormData(prev => ({ ...prev, taskType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskTypes.map(type => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={taskFormData.priority} 
                      onValueChange={(value) => setTaskFormData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="estimatedHours">Est. Hours</Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      step="0.5"
                      value={taskFormData.estimatedHours}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="assignedTo">Assign To *</Label>
                  <Select 
                    value={taskFormData.assignedTo} 
                    onValueChange={(value) => setTaskFormData(prev => ({ ...prev, assignedTo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter((user: any) => 
                        ['social_media_manager', 'content_creator', 'content_editor', 'social_media_specialist', 'creative_director'].includes(user.role)
                      ).map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={taskFormData.dueDate}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="projectId">Project (Optional)</Label>
                  <Select 
                    value={taskFormData.projectId} 
                    onValueChange={(value) => setTaskFormData(prev => ({ ...prev, projectId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Project</SelectItem>
                      {projects.map((project: any) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="campaignId">Campaign (Optional)</Label>
                  <Select 
                    value={taskFormData.campaignId} 
                    onValueChange={(value) => setTaskFormData(prev => ({ ...prev, campaignId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Campaign</SelectItem>
                      {campaigns.map((campaign: any) => (
                        <SelectItem key={campaign.id} value={campaign.id.toString()}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setNewTaskOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTaskMutation.isPending}>
                    {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Content Creator Modal */}
      {newCreatorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add Content Creator</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add a new content creator to your social media team
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatorSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="creatorName">Full Name *</Label>
                    <Input
                      id="creatorName"
                      value={creatorFormData.name}
                      onChange={(e) => setCreatorFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="creatorEmail">Email *</Label>
                    <Input
                      id="creatorEmail"
                      type="email"
                      value={creatorFormData.email}
                      onChange={(e) => setCreatorFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="creatorRole">Role</Label>
                    <Select 
                      value={creatorFormData.role} 
                      onValueChange={(value) => setCreatorFormData(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content_creator">Content Creator</SelectItem>
                        <SelectItem value="social_media_specialist">Social Media Specialist</SelectItem>
                        <SelectItem value="content_editor">Content Editor</SelectItem>
                        <SelectItem value="creative_director">Creative Director</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="availability">Availability</Label>
                    <Select 
                      value={creatorFormData.availability} 
                      onValueChange={(value) => setCreatorFormData(prev => ({ ...prev, availability: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={creatorFormData.specialization}
                    onChange={(e) => setCreatorFormData(prev => ({ ...prev, specialization: e.target.value }))}
                    placeholder="e.g., Video Production, Graphic Design, Copywriting"
                  />
                </div>

                <div>
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    value={creatorFormData.skills}
                    onChange={(e) => setCreatorFormData(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="e.g., Adobe Creative Suite, Final Cut Pro, Social Media Strategy"
                  />
                </div>

                <div>
                  <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                  <Input
                    id="portfolioUrl"
                    type="url"
                    value={creatorFormData.portfolioUrl}
                    onChange={(e) => setCreatorFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                    placeholder="https://portfolio.example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="creatorBio">Bio</Label>
                  <Textarea
                    id="creatorBio"
                    value={creatorFormData.bio}
                    onChange={(e) => setCreatorFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Brief professional bio and background"
                    className="h-20"
                  />
                </div>

                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate (Optional)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    value={creatorFormData.hourlyRate}
                    onChange={(e) => setCreatorFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setNewCreatorOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCreatorMutation.isPending}>
                    {createCreatorMutation.isPending ? 'Adding...' : 'Add Creator'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Promote Employee Modal */}
      {promoteEmployeeOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Promote Employee to Content Creator</CardTitle>
              <p className="text-sm text-muted-foreground">
                Convert an existing employee to a content creator role with additional skills and portfolio
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePromoteSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="employeeSelect">Select Employee *</Label>
                  <Select 
                    value={promoteFormData.employeeId} 
                    onValueChange={(value) => setPromoteFormData(prev => ({ ...prev, employeeId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an employee to promote" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter((user: any) => 
                        user.role === 'employee' || 
                        (user.role !== 'content_creator' && user.role !== 'social_media_specialist' && user.role !== 'creative_director')
                      ).map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.profileImageUrl} />
                              <AvatarFallback className="text-xs">
                                {(user.firstName?.[0] || '') + (user.lastName?.[0] || user.username?.[0] || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
                              </div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="promoteRole">New Role</Label>
                    <Select 
                      value={promoteFormData.role} 
                      onValueChange={(value) => setPromoteFormData(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content_creator">Content Creator</SelectItem>
                        <SelectItem value="social_media_specialist">Social Media Specialist</SelectItem>
                        <SelectItem value="content_editor">Content Editor</SelectItem>
                        <SelectItem value="creative_director">Creative Director</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="promoteAvailability">Availability</Label>
                    <Select 
                      value={promoteFormData.availability} 
                      onValueChange={(value) => setPromoteFormData(prev => ({ ...prev, availability: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="promoteSpecialization">Specialization</Label>
                  <Input
                    id="promoteSpecialization"
                    value={promoteFormData.specialization}
                    onChange={(e) => setPromoteFormData(prev => ({ ...prev, specialization: e.target.value }))}
                    placeholder="e.g., Video Production, Graphic Design, Copywriting"
                  />
                </div>

                <div>
                  <Label htmlFor="promoteSkills">Skills (comma-separated)</Label>
                  <Input
                    id="promoteSkills"
                    value={promoteFormData.skills}
                    onChange={(e) => setPromoteFormData(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="e.g., Adobe Creative Suite, Final Cut Pro, Social Media Strategy"
                  />
                </div>

                <div>
                  <Label htmlFor="promotePortfolioUrl">Portfolio URL</Label>
                  <Input
                    id="promotePortfolioUrl"
                    type="url"
                    value={promoteFormData.portfolioUrl}
                    onChange={(e) => setPromoteFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                    placeholder="https://portfolio.example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="promoteBio">Bio</Label>
                  <Textarea
                    id="promoteBio"
                    value={promoteFormData.bio}
                    onChange={(e) => setPromoteFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Brief professional bio and background"
                    className="h-20"
                  />
                </div>

                <div>
                  <Label htmlFor="promoteHourlyRate">Hourly Rate (Optional)</Label>
                  <Input
                    id="promoteHourlyRate"
                    type="number"
                    step="0.01"
                    value={promoteFormData.hourlyRate}
                    onChange={(e) => setPromoteFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setPromoteEmployeeOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={promoteEmployeeMutation.isPending}>
                    {promoteEmployeeMutation.isPending ? 'Promoting...' : 'Promote Employee'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}