import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, BarChart3 } from 'lucide-react';
import { Task } from '@shared/schema';

interface TaskOverviewProps {
  tasks: Task[];
  isLoading: boolean;
}

export default function TaskOverview({ tasks, isLoading }: TaskOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="stats-card animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  const overdueTasks = tasks.filter(task => task.status === 'overdue').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const inProgressRate = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
  const overdueRate = totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0;

  // Priority breakdown
  const urgentTasks = tasks.filter(task => task.priority === 'urgent').length;
  const highTasks = tasks.filter(task => task.priority === 'high').length;
  const mediumTasks = tasks.filter(task => task.priority === 'medium').length;
  const lowTasks = tasks.filter(task => task.priority === 'low').length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalTasks}</p>
                <p className="text-gray-600 text-sm font-medium mt-2 flex items-center">
                  <BarChart3 className="mr-1" size={12} />
                  All tasks
                </p>
              </div>
              <div className="stats-card-icon bg-primary/10 text-primary">
                <BarChart3 size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{completedTasks}</p>
                <p className="text-accent text-sm font-medium mt-2 flex items-center">
                  <CheckCircle className="mr-1" size={12} />
                  {completionRate}% complete
                </p>
              </div>
              <div className="stats-card-icon bg-accent/10 text-accent">
                <CheckCircle size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{inProgressTasks}</p>
                <p className="text-warning text-sm font-medium mt-2 flex items-center">
                  <Clock className="mr-1" size={12} />
                  {inProgressRate}% active
                </p>
              </div>
              <div className="stats-card-icon bg-warning/10 text-warning">
                <Clock size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Overdue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{overdueTasks}</p>
                <p className="text-destructive text-sm font-medium mt-2 flex items-center">
                  <AlertTriangle className="mr-1" size={12} />
                  {overdueRate}% overdue
                </p>
              </div>
              <div className="stats-card-icon bg-destructive/10 text-destructive">
                <AlertTriangle size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Progress */}
        <Card className="stats-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Task Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Completed</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-accent h-2 rounded-full progress-fill" style={{ width: `${completionRate}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{completionRate}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">In Progress</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-warning h-2 rounded-full progress-fill" style={{ width: `${inProgressRate}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{inProgressRate}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pending</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-secondary h-2 rounded-full progress-fill" style={{ width: `${totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Overdue</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-destructive h-2 rounded-full progress-fill" style={{ width: `${overdueRate}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{overdueRate}%</span>
                </div>
              </div>
            </div>

            {totalTasks > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{completionRate}%</div>
                  <p className="text-sm text-gray-600">Overall Completion Rate</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card className="stats-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Urgent</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{urgentTasks}</span>
                  <Badge className="bg-destructive/10 text-destructive">
                    {totalTasks > 0 ? Math.round((urgentTasks / totalTasks) * 100) : 0}%
                  </Badge>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">High</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{highTasks}</span>
                  <Badge className="bg-warning/10 text-warning">
                    {totalTasks > 0 ? Math.round((highTasks / totalTasks) * 100) : 0}%
                  </Badge>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Medium</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{mediumTasks}</span>
                  <Badge className="bg-primary/10 text-primary">
                    {totalTasks > 0 ? Math.round((mediumTasks / totalTasks) * 100) : 0}%
                  </Badge>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Low</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{lowTasks}</span>
                  <Badge className="bg-gray/10 text-gray-600">
                    {totalTasks > 0 ? Math.round((lowTasks / totalTasks) * 100) : 0}%
                  </Badge>
                </div>
              </div>
            </div>

            {urgentTasks > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium text-destructive flex items-center">
                    <AlertTriangle className="mr-2" size={16} />
                    {urgentTasks} urgent task{urgentTasks !== 1 ? 's' : ''} require immediate attention
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
