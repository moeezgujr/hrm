import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Plus, BellRing, BarChart3 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

export default function QuickActions() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const actions = [
    {
      icon: UserPlus,
      label: 'Add New Employee',
      action: () => setLocation('/employees'),
      color: 'bg-primary/5 hover:bg-primary/10',
      textColor: 'text-primary',
      roles: ['hr_admin', 'branch_manager']
    },
    {
      icon: Plus,
      label: 'Create Task',
      action: () => setLocation('/tasks'),
      color: 'bg-gray-50 hover:bg-gray-100',
      textColor: 'text-gray-600',
      roles: ['hr_admin', 'branch_manager', 'team_lead']
    },
    {
      icon: BellRing,
      label: 'New Announcement',
      action: () => setLocation('/announcements'),
      color: 'bg-gray-50 hover:bg-gray-100',
      textColor: 'text-gray-600',
      roles: ['hr_admin', 'branch_manager', 'team_lead']
    },
    {
      icon: BarChart3,
      label: 'Generate Report',
      action: () => setLocation('/analytics'),
      color: 'bg-gray-50 hover:bg-gray-100',
      textColor: 'text-gray-600',
      roles: ['hr_admin', 'branch_manager']
    }
  ];

  const hasAccess = (requiredRoles: string[]) => {
    return user?.role && requiredRoles.includes(user.role);
  };

  return (
    <Card className="stats-card">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        {actions.map((action, index) => {
          if (!hasAccess(action.roles)) return null;
          
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant="ghost"
              onClick={action.action}
              className={`w-full justify-start space-x-3 p-3 ${action.color} transition-colors`}
            >
              <Icon className={action.textColor} size={16} />
              <span className="text-gray-900 font-medium">{action.label}</span>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
