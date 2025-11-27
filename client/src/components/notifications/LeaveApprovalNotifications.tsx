import { useQuery } from '@tanstack/react-query';
import { Bell, Calendar, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface LeaveRequest {
  id: number;
  employeeId: number;
  requesterId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  createdAt: string;
  requesterName?: string;
}

export default function LeaveApprovalNotifications() {
  const { user } = useAuth();

  // Check if user has permission to approve leave requests
  const canApproveLeave = user && (
    user.role === 'hr_admin' || 
    user.permissions?.leave_management === 'manage'
  );

  // Fetch pending leave requests
  const { data: pendingLeaves = [], isError } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/leave-requests', 'pending'],
    queryFn: () => fetch('/api/leave-requests?status=pending').then(res => {
      if (!res.ok) {
        throw new Error('Failed to fetch leave requests');
      }
      return res.json();
    }),
    enabled: canApproveLeave,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Ensure pendingLeaves is always an array
  const safeLeaves = Array.isArray(pendingLeaves) ? pendingLeaves : [];

  if (!canApproveLeave || safeLeaves.length === 0 || isError) {
    return null;
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative" data-testid="button-leave-notifications">
          <Calendar size={20} className="text-gray-600" />
          {safeLeaves.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-[20px] text-xs px-1.5 rounded-full bg-orange-500 text-white"
            >
              {safeLeaves.length > 99 ? '99+' : safeLeaves.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center space-x-2">
          <Calendar size={16} className="text-orange-500" />
          <span>Pending Leave Requests</span>
          <Badge variant="secondary" className="ml-auto">
            {safeLeaves.length} pending
          </Badge>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {safeLeaves.slice(0, 5).map((request) => (
          <DropdownMenuItem key={request.id} className="p-0">
            <Link href="/leave-management" className="w-full">
              <Card className="border-0 shadow-none hover:bg-gray-50 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {request.requesterName || 'Employee'}
                        </h4>
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                          {getLeaveTypeLabel(request.leaveType)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()} ({request.totalDays} days)
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Clock size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(request.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </DropdownMenuItem>
        ))}
        
        {safeLeaves.length > 5 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/leave-management" className="text-center text-sm text-orange-600 hover:text-orange-800">
                View all {safeLeaves.length} requests
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        {safeLeaves.length === 0 && (
          <DropdownMenuItem disabled>
            <div className="text-center text-sm text-gray-500 py-4">
              No pending leave requests
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
