import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Clock, CreditCard, Building2 } from 'lucide-react';
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

interface TrialRequest {
  id: number;
  name: string;
  email: string;
  company: string;
  planId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function TrialRequestNotifications() {
  const { user } = useAuth();

  // Check if user has access to trial requests
  const hasTrialAccess = user && (
    user.username === "admin" || 
    ('role' in user && user.role === 'hr_admin')
  );

  // Fetch pending trial requests
  const { data: pendingRequests = [], isError } = useQuery<TrialRequest[]>({
    queryKey: ['/api/trial-requests', 'pending'],
    queryFn: () => fetch('/api/trial-requests?status=pending').then(res => {
      if (!res.ok) {
        throw new Error('Failed to fetch trial requests');
      }
      return res.json();
    }),
    enabled: hasTrialAccess,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Ensure pendingRequests is always an array
  const safeRequests = Array.isArray(pendingRequests) ? pendingRequests : [];

  if (!hasTrialAccess || safeRequests.length === 0 || isError) {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell size={20} className="text-gray-600" />
          {safeRequests.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-[20px] text-xs px-1.5 rounded-full bg-red-500 text-white"
            >
              {safeRequests.length > 99 ? '99+' : safeRequests.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center space-x-2">
          <CreditCard size={16} className="text-blue-500" />
          <span>Trial Requests</span>
          <Badge variant="secondary" className="ml-auto">
            {safeRequests.length} pending
          </Badge>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {safeRequests.slice(0, 5).map((request) => (
          <DropdownMenuItem key={request.id} className="p-0">
            <Link href="/admin/trial-requests" className="w-full">
              <Card className="border-0 shadow-none hover:bg-gray-50 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building2 size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {request.company}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {request.planId}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {request.name} • {request.email}
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
        
        {safeRequests.length > 5 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/trial-requests" className="text-center text-sm text-blue-600 hover:text-blue-800">
                View all {safeRequests.length} requests
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        {safeRequests.length === 0 && (
          <DropdownMenuItem disabled>
            <div className="text-center text-sm text-gray-500 py-4">
              No pending requests
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}