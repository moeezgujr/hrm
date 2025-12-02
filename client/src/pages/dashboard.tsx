import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, ListTodo, Shield, ArrowUp, Clock, TriangleAlert, Check, ChevronRight, UserCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import StatsCard from "@/components/dashboard/stats-card";
import ActivityFeed from "@/components/dashboard/activity-feed";
import QuickActions from "@/components/dashboard/quick-actions";
import PendingApprovals from "@/components/dashboard/pending-approvals";
import TaskRequestModal from '@/components/employee/task-request-modal';
import MyTaskRequests from '@/components/employee/my-task-requests';
import DemoBanner from "@/components/demo-banner";
import { DEMO_MODE } from "@/lib/mockData";
import ReportingStructureWidget from "@/components/reporting/ReportingStructureWidget";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Determine if user is an admin/manager who should see organization-wide dashboard
  const isAdminRole = user?.role === 'hr_admin' || 
                      user?.role === 'branch_manager' || 
                      user?.role === 'team_lead' ||
                      user?.role === 'admin';
  
  // For employees and social media team, fetch only their personal data
  const isEmployeeRole = user?.role === 'employee' || 
                         user?.role === 'content_creator' || 
                         user?.role === 'social_media_specialist' || 
                         user?.role === 'content_editor' || 
                         user?.role === 'creative_director' || 
                         user?.role === 'social_media_manager';

  // Admin queries - only fetch for admins
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    enabled: isAdminRole,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/dashboard/activities'],
    enabled: isAdminRole,
  });

  const { data: approvals, isLoading: approvalsLoading } = useQuery({
    queryKey: ['/api/dashboard/approvals'],
    enabled: isAdminRole,
  });

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees'],
    enabled: isAdminRole,
  });

  // Employee queries - fetch personal data
  const { data: myOnboardingData, isLoading: myOnboardingLoading, refetch: refetchOnboarding } = useQuery({
    queryKey: ['/api/my-onboarding'],
    enabled: isEmployeeRole && !!user,
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: myTasks, isLoading: myTasksLoading } = useQuery({
    queryKey: user?.id ? [`/api/tasks?assignedTo=${user.id}`] : ['/api/tasks/disabled'],
    enabled: isEmployeeRole && !!user?.id,
  });

  const { data: myProjects, isLoading: myProjectsLoading } = useQuery({
    queryKey: user?.id ? [`/api/users/${user.id}/projects`] : ['/api/projects/disabled'],
    enabled: isEmployeeRole && !!user?.id,
  });

  // Reporting structure for employees AND admins
  const { data: myPosition, isLoading: myPositionLoading } = useQuery<{
    manager?: { id: number; firstName: string; lastName: string; position: string | null } | null;
    directReports?: Array<{ id: number; firstName: string; lastName: string; position: string | null }>;
  }>({
    queryKey: ["/api/org-hierarchy/my-position"],
    enabled: true, // Enable for both employees and admins
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
    enabled: isAdminRole,
  });

  // Loading states
  const adminLoading = isAdminRole && (statsLoading || activitiesLoading || approvalsLoading);
  const employeeLoading = isEmployeeRole && (myOnboardingLoading || myTasksLoading || myProjectsLoading);

  if (adminLoading || employeeLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stats-card animate-pulse">
              <div className="h-16 md:h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Employee Dashboard View
  if (isEmployeeRole) {
    const onboardingProgress = myOnboardingData?.progress?.percentage || 0;
    const onboardingTotal = myOnboardingData?.progress?.total || 0;
    const onboardingCompleted = myOnboardingData?.progress?.completed || 0;
    
    const myTasksList = myTasks || [];
    const myOpenTasks = myTasksList.filter(t => t.status !== 'completed').length;
    const myCompletedTasks = myTasksList.filter(t => t.status === 'completed').length;
    const myOverdueTasks = myTasksList.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < new Date();
    }).length;
    
    const myProjectsList = myProjects || [];

    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {DEMO_MODE && <DemoBanner />}
        
        <div className="mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">My Dashboard</h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">Welcome back, {user?.firstName}! Here's your personal overview</p>
        </div>

        {/* Personal Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <StatsCard
            title="Onboarding Progress"
            value={`${onboardingProgress}%`}
            change={`${onboardingCompleted}/${onboardingTotal} completed`}
            changeType="neutral"
            icon={UserPlus}
            color="bg-blue-100 text-blue-700"
            onClick={() => setLocation('/onboarding')}
          />
          <StatsCard
            title="My Tasks"
            value={myOpenTasks}
            change={`${myCompletedTasks} completed`}
            changeType={myOverdueTasks > 0 ? "decrease" : "increase"}
            icon={ListTodo}
            color="bg-purple-100 text-purple-700"
            onClick={() => setLocation('/tasks')}
          />
          <StatsCard
            title="My Projects"
            value={myProjectsList.length}
            change="Active projects"
            changeType="neutral"
            icon={Users}
            color="bg-green-100 text-green-700"
            onClick={() => setLocation('/projects')}
          />
          <StatsCard
            title="Pending Items"
            value={myOverdueTasks}
            change={myOverdueTasks > 0 ? "Needs attention" : "All clear"}
            changeType={myOverdueTasks > 0 ? "decrease" : "increase"}
            icon={Clock}
            color={myOverdueTasks > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}
            onClick={() => setLocation('/tasks')}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* My Tasks */}
            <Card className="stats-card">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">My Tasks</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary/80"
                    onClick={() => setLocation('/tasks')}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {myTasksLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : myTasksList.length > 0 ? (
                  <div className="space-y-3">
                    {myTasksList.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => setLocation('/tasks')}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            task.status === 'completed' ? 'bg-green-100' :
                            task.priority === 'urgent' ? 'bg-red-100' :
                            task.priority === 'high' ? 'bg-orange-100' : 'bg-blue-100'
                          }`}>
                            {task.status === 'completed' ? (
                              <Check className={`${task.status === 'completed' ? 'text-green-600' : ''}`} size={16} />
                            ) : (
                              <ListTodo className={`${
                                task.priority === 'urgent' ? 'text-red-600' :
                                task.priority === 'high' ? 'text-orange-600' : 'text-blue-600'
                              }`} size={16} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{task.title}</p>
                            <p className="text-sm text-gray-500">
                              {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'}
                            </p>
                          </div>
                        </div>
                        <Badge className={
                          task.status === 'completed' ? 'bg-green-100 text-green-700' :
                          task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }>
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ListTodo className="mx-auto mb-4 text-gray-400" size={48} />
                    <p>No tasks assigned yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Projects */}
            <Card className="stats-card">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">My Projects</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary/80"
                    onClick={() => setLocation('/projects')}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {myProjectsLoading ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : myProjectsList.length > 0 ? (
                  <div className="space-y-3">
                    {myProjectsList.slice(0, 3).map((project: any) => (
                      <div key={project.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => setLocation(`/project/${project.id}`)}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{project.name}</h4>
                          <Badge className={
                            project.status === 'completed' ? 'bg-green-100 text-green-700' :
                            project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {project.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="mx-auto mb-4 text-gray-400" size={48} />
                    <p>No projects assigned yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Onboarding Progress */}
            <Card className="stats-card">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Onboarding</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary/80"
                    onClick={() => setLocation('/onboarding')}
                  >
                    View
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-primary mb-2">{onboardingProgress}%</div>
                  <p className="text-sm text-gray-600">{onboardingCompleted} of {onboardingTotal} items completed</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all duration-300"
                    style={{ width: `${onboardingProgress}%` }}
                  ></div>
                </div>
                {onboardingProgress < 100 && (
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => setLocation('/onboarding')}
                    data-testid="button-continue-onboarding"
                  >
                    Continue Onboarding
                    <ChevronRight size={16} className="ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Reporting Structure */}
            <Card className="stats-card">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Reporting Structure</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary/80"
                    onClick={() => setLocation('/organization')}
                  >
                    View
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {myPositionLoading ? (
                  <div className="space-y-3">
                    <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Manager */}
                    {myPosition?.manager ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase">Reports To</p>
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserCircle className="text-blue-600" size={24} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">
                              {myPosition.manager.firstName} {myPosition.manager.lastName}
                            </p>
                            <p className="text-xs text-gray-600">{myPosition.manager.position || 'Manager'}</p>
                          </div>
                          <ArrowRight className="text-blue-400" size={16} />
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                        <p className="text-sm text-gray-500">No manager assigned</p>
                      </div>
                    )}

                    {/* Direct Reports */}
                    {myPosition?.directReports && myPosition.directReports.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase">Direct Reports ({myPosition.directReports.length})</p>
                        <div className="space-y-2">
                          {myPosition.directReports.slice(0, 3).map((report: any) => (
                            <div key={report.id} className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <UserCircle className="text-green-600" size={24} />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">
                                  {report.firstName} {report.lastName}
                                </p>
                                <p className="text-xs text-gray-600">{report.position || 'Employee'}</p>
                              </div>
                            </div>
                          ))}
                          {myPosition.directReports.length > 3 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full text-xs"
                              onClick={() => setLocation('/organization')}
                            >
                              View all {myPosition.directReports.length} reports
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : myPosition?.manager && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                        <p className="text-sm text-gray-500">No direct reports</p>
                      </div>
                    )}

                    {/* No reporting structure at all */}
                    {!myPosition?.manager && (!myPosition?.directReports || myPosition.directReports.length === 0) && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                        <UserCircle className="mx-auto mb-2 text-gray-400" size={32} />
                        <p className="text-sm text-gray-500">No reporting structure defined</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <QuickActions />
            
            {/* Task Requests */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Task Requests</CardTitle>
                  <TaskRequestModal />
                </div>
              </CardHeader>
            </Card>
            <MyTaskRequests />
          </div>
        </div>
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Employees",
      value: stats?.totalEmployees || 0,
      change: "+12%",
      changeType: "increase" as const,
      icon: Users,
      color: "bg-blue-100 text-blue-700",
      onClick: () => setLocation('/employees')
    },
    {
      title: "Active Onboarding",
      value: stats?.activeOnboarding || 0,
      change: "5 pending approvals",
      changeType: "neutral" as const,
      icon: UserPlus,
      color: "bg-yellow-100 text-yellow-700",
      onClick: () => setLocation('/onboarding')
    },
    {
      title: "Open Tasks",
      value: stats?.openTasks || 0,
      change: "8 overdue",
      changeType: "decrease" as const,
      icon: ListTodo,
      color: "bg-purple-100 text-purple-700",
      onClick: () => setLocation('/tasks')
    },
    {
      title: "Department Compliance",
      value: `${stats?.complianceRate || 0}%`,
      change: "Above target",
      changeType: "increase" as const,
      icon: Shield,
      color: "bg-accent/10 text-accent",
      onClick: () => setLocation('/analytics')
    }
  ];

  const recentEmployees = employees?.slice(0, 3) || [];
  const taskStats = {
    completed: 78,
    inProgress: 15,
    overdue: 7
  };

  const urgentTasks = tasks?.filter(task => task.priority === 'urgent').slice(0, 2) || [];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Demo Banner */}
      {DEMO_MODE && <DemoBanner />}
      
      {/* Welcome Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Dashboard</h2>
        <p className="text-sm md:text-base text-gray-600 mt-1">Welcome back, here's what's happening today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {statsData.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <ActivityFeed activities={activities || []} isLoading={activitiesLoading} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Modern Reporting Structure Widget */}
          <ReportingStructureWidget 
            myPosition={myPosition} 
            isLoading={myPositionLoading} 
          />

          <QuickActions />
          <PendingApprovals approvals={approvals || []} isLoading={approvalsLoading} />
          {user?.role === 'employee' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>My Task Requests</CardTitle>
                    <TaskRequestModal />
                  </div>
                </CardHeader>
              </Card>
              <MyTaskRequests />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Employees */}
        <Card className="stats-card">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Employees</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary/80"
                onClick={() => setLocation('/employees')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {employeesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentEmployees.length > 0 ? (
                recentEmployees.map((employee, index) => (
                  <div key={employee.id} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="text-white" size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">
                        {employee.user.firstName} {employee.user.lastName}
                      </p>
                      <p className="text-gray-500 text-sm">{employee.user.position}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={`${employee.user.status === 'active' ? 'status-active' : 'status-pending'}`}>
                        {employee.user.status}
                      </Badge>
                      <p className="text-gray-500 text-xs mt-1">
                        {employee.user.startDate ? 
                          `Started ${new Date(employee.user.startDate).toLocaleDateString()}` : 
                          'No start date'
                        }
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="mx-auto mb-4 text-gray-400" size={48} />
                  <p>No recent employees found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Task Overview */}
        <Card className="stats-card">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Task Overview</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary/80"
                onClick={() => setLocation('/tasks')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Progress Bars */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completed</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full progress-fill" style={{ width: `${taskStats.completed}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{taskStats.completed}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">In Progress</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-warning h-2 rounded-full progress-fill" style={{ width: `${taskStats.inProgress}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{taskStats.inProgress}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Overdue</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-destructive h-2 rounded-full progress-fill" style={{ width: `${taskStats.overdue}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{taskStats.overdue}%</span>
                  </div>
                </div>
              </div>

              {/* Urgent ListTodo */}
              <div className="mt-6 space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Urgent ListTodo</h4>
                {tasksLoading ? (
                  <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 animate-pulse">
                        <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : urgentTasks.length > 0 ? (
                  urgentTasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-destructive rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500">
                          Assigned to: {task.assignedToUser?.firstName} {task.assignedToUser?.lastName}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Check className="mx-auto mb-2 text-gray-400" size={24} />
                    <p className="text-sm">No urgent tasks</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
