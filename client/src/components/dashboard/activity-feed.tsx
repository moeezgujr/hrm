import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, FileText, Check, BellRing, Users } from 'lucide-react';

interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    role?: string;
    email?: string;
  };
  metadata?: {
    status?: string;
    requestedRole?: string;
    department?: string;
    position?: string;
  };
}

interface ActivityFeedProps {
  activities: DashboardActivity[];
  isLoading: boolean;
}

export default function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'employee_added':
        return UserPlus;
      case 'registration_request':
        return FileText;
      case 'task_completed':
        return Check;
      case 'recognition_given':
        return BellRing;
      default:
        return Users;
    }
  };

  const getActivityColor = (type: string, status?: string) => {
    switch (type) {
      case 'employee_added':
        return 'bg-green-100 text-green-700';
      case 'registration_request':
        return 'bg-blue-100 text-blue-700';
      case 'task_completed':
        return 'bg-accent/10 text-accent';
      case 'recognition_given':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  const getBadgeVariant = (status?: string, type?: string) => {
    if (type === 'registration_request') {
      switch (status) {
        case 'pending':
          return 'bg-yellow-100 text-yellow-700';
        case 'approved':
          return 'bg-green-100 text-green-700';
        case 'rejected':
          return 'bg-red-100 text-red-700';
        default:
          return 'bg-blue-100 text-blue-700';
      }
    }
    
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-accent/10 text-accent';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <Card className="stats-card">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Activities</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="activity-item animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const status = activity.metadata?.status || 'active';
              return (
                <div key={`${activity.type}-${activity.id}`} className="activity-item">
                  <div className={`activity-icon ${getActivityColor(activity.type, status)}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">
                      {activity.title}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      {activity.description}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {formatTimeAgo(new Date(activity.timestamp))} {activity.user?.name && `• ${activity.user.name}`}
                    </p>
                  </div>
                  <Badge className={`activity-badge ${getBadgeVariant(status, activity.type)}`}>
                    {status}
                  </Badge>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Check className="mx-auto mb-4 text-gray-400" size={48} />
              <p>No recent activities</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
