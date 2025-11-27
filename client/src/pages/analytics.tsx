import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Award,
  Briefcase
} from 'lucide-react';

export default function Analytics() {
  // Mock data for now - replace with actual API calls
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/analytics'],
    queryFn: async () => {
      // Simulated analytics data
      return {
        overview: {
          totalEmployees: 145,
          activeProjects: 23,
          completedTasks: 342,
          onboardingInProgress: 8
        },
        trends: {
          employeeGrowth: 12.5,
          projectCompletion: 89.2,
          taskCompletion: 76.8,
          onboardingTime: 4.2
        },
        departments: [
          { name: 'Engineering', employees: 45, projects: 8, completion: 92 },
          { name: 'Marketing', employees: 22, projects: 5, completion: 87 },
          { name: 'Sales', employees: 18, projects: 4, completion: 94 },
          { name: 'HR', employees: 12, projects: 2, completion: 88 },
          { name: 'Finance', employees: 15, projects: 3, completion: 91 }
        ],
        projects: [
          { name: 'Website Redesign', progress: 75, team: 8, dueDate: '2025-09-15' },
          { name: 'Mobile App Development', progress: 45, team: 12, dueDate: '2025-10-30' },
          { name: 'Data Migration', progress: 90, team: 6, dueDate: '2025-08-20' },
          { name: 'Security Audit', progress: 30, team: 4, dueDate: '2025-09-30' }
        ],
        recognition: [
          { employee: 'John Smith', type: 'Employee of the Month', date: '2025-08-01' },
          { employee: 'Sarah Johnson', type: 'Innovation Award', date: '2025-07-28' },
          { employee: 'Mike Wilson', type: 'Team Player', date: '2025-07-25' }
        ]
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const data = analyticsData || {};

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">HR Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into your workforce and operations</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Calendar className="h-4 w-4 mr-1" />
          Updated Today
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview?.totalEmployees}</div>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{data.trends?.employeeGrowth}% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview?.activeProjects}</div>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {data.trends?.projectCompletion}% completion rate
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview?.completedTasks}</div>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {data.trends?.taskCompletion}% this month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Onboarding</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview?.onboardingInProgress}</div>
                <div className="flex items-center text-xs text-blue-600">
                  <Clock className="h-3 w-3 mr-1" />
                  {data.trends?.onboardingTime} days avg. time
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Employee Growth Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Chart visualization would go here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Task Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <div className="text-center">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Chart visualization would go here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.departments?.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{dept.name}</h3>
                        <p className="text-sm text-gray-600">
                          {dept.employees} employees, {dept.projects} active projects
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{dept.completion}%</p>
                        <p className="text-xs text-gray-500">Completion Rate</p>
                      </div>
                      <Progress value={dept.completion} className="w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.projects?.map((project, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{project.name}</h3>
                      <Badge variant="outline">{project.progress}% Complete</Badge>
                    </div>
                    <Progress value={project.progress} className="mb-3" />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{project.team} team members</span>
                      <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Recent Recognition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recognition?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.employee}</p>
                        <p className="text-sm text-gray-600">{item.type}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Task Completion Time</span>
                    <span className="font-medium">3.2 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Employee Satisfaction</span>
                    <span className="font-medium">4.3/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Project Success Rate</span>
                    <span className="font-medium">91%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Onboarding Completion Rate</span>
                    <span className="font-medium">97%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}