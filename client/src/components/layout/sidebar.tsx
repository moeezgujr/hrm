import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  UserPlus, 
  ListTodo, 
  BellRing, 
  Award, 
  Boxes, 
  BarChart3, 
  Settings,
  LogOut,
  Home,
  Shield,
  Brain,
  HelpCircle,
  Building2,
  ClipboardCheck,
  ClipboardList,
  UserCheck,
  FileDown,
  FolderKanban,
  BookOpen,
  Calendar,
  FileText,
  MessageCircle,
  Instagram,
  Camera,
  Palette,
  Mail,
  CreditCard,
  DollarSign,
  CheckCircle,
  Crown,
  Briefcase,
  CalendarDays,
  Phone,
  Share2
} from 'lucide-react';

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const hasAccess = (requiredRoles: string[], itemHref?: string, permissionModule?: string) => {
    if (!user) return false;
    
    // Admin username has access to everything
    if (user.username === "admin") return true;
    
    // Special access checks for specific features
    if (itemHref === '/job-applications' && 'hasJobApplicationsAccess' in user && user.hasJobApplicationsAccess) {
      return true;
    }
    
    if (itemHref === '/crm-inquiries' && 'hasCrmAccess' in user && user.hasCrmAccess) {
      return true;
    }
    
    // Check module-specific permissions first (allows permission-based access regardless of role)
    if (permissionModule && 'permissions' in user && user.permissions) {
      const modulePermission = user.permissions[permissionModule as keyof typeof user.permissions];
      // User needs at least 'view' permission to access the module
      if (modulePermission === 'view' || modulePermission === 'manage') {
        return true;
      }
    }
    
    // Check role-based access as fallback
    const hasRoleAccess = 'role' in user && user.role && requiredRoles.includes(user.role);
    return hasRoleAccess;
  };

  // Fetch pending trial requests count for notification badge
  const { data: pendingTrialCount = 0 } = useQuery<{ count: number }>({
    queryKey: ['/api/trial-requests/pending/count'],
    enabled: !!user && hasAccess(['hr_admin']),
    refetchInterval: 300000, // Refresh every 5 minutes instead of 30 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });

  const getNotificationCount = (notificationType: string) => {
    switch (notificationType) {
      case 'trial-requests':
        return typeof pendingTrialCount === 'object' && pendingTrialCount ? pendingTrialCount.count : 0;
      default:
        return 0;
    }
  };

  const getMenuLabel = (href: string, defaultLabel: string) => {
    if (href === '/organization') {
      const isHRAdmin = user && 'role' in user && (user.role === 'hr_admin' || user.username === 'admin');
      return isHRAdmin ? 'Organization' : 'Responsibilities & Reporting';
    }
    return defaultLabel;
  };
  
  // Debug logging removed
  
  const { logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigationCategories = [
    {
      title: 'Core Management',
      items: [
        { icon: Home, label: 'Dashboard', href: '/', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'logistics_manager', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'] },
        { icon: Users, label: 'Employee Management', href: '/employees', roles: ['hr_admin', 'branch_manager', 'team_lead', 'admin'], permission: 'employee_management' },
        { icon: Building2, label: 'Departments', href: '/departments', roles: ['hr_admin', 'branch_manager', 'department_head', 'admin'] },
        { icon: Building2, label: 'Department Management', href: '/department-management', roles: ['hr_admin', 'branch_manager', 'admin'] },
        { icon: Shield, label: 'Department Isolation', href: '/department-isolation', roles: ['hr_admin', 'branch_manager', 'admin'] },
      ]
    },
    {
      title: 'Employee Onboarding',
      items: [
        { icon: Briefcase, label: 'Job Applications', href: '/job-applications', roles: ['hr_admin', 'admin'] },
        { icon: FileText, label: 'Contract Management', href: '/contract-management', roles: ['hr_admin', 'branch_manager', 'admin'], permission: 'contract_management' },
        { icon: FileText, label: 'My Contracts', href: '/my-contracts', roles: ['employee', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager'] },
        { icon: UserPlus, label: 'Onboarding Overview', href: '/onboarding', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'] },
        { icon: ClipboardCheck, label: 'Onboarding Checklists', href: '/onboarding-checklist-manager', roles: ['hr_admin', 'branch_manager', 'admin'] },
        { icon: ClipboardList, label: 'Checklist Overview', href: '/onboarding-checklist-viewer', roles: ['hr_admin', 'branch_manager', 'team_lead', 'admin'] },
        { icon: UserCheck, label: 'HR Onboarding Process', href: '/hr-onboarding', roles: ['hr_admin', 'branch_manager', 'admin'] },
        { icon: UserCheck, label: 'Registration Approvals', href: '/registration-approvals', roles: ['hr_admin', 'admin'] },
        { icon: CreditCard, label: 'Banking Overview', href: '/banking-overview', roles: ['hr_admin', 'branch_manager', 'admin'] },
        { icon: CreditCard, label: 'Trial Requests', href: '/admin/trial-requests', roles: ['hr_admin', 'admin'], notification: 'trial-requests' },
        { icon: DollarSign, label: 'Subscription Management', href: '/admin/subscription-management', roles: ['hr_admin', 'admin'] },
        { icon: Crown, label: 'Super Admin Panel', href: '/super-admin', roles: ['hr_admin', 'admin'] },
      ]
    },
    {
      title: 'Assessment & Testing',
      items: [
        { icon: Brain, label: 'Psychometric Tests', href: '/psychometric-admin', roles: ['hr_admin', 'branch_manager', 'admin'] },
        { icon: FileText, label: 'Test Results Dashboard', href: '/psychometric-results', roles: ['hr_admin', 'admin'] },
        { icon: Brain, label: 'Onboarding Tests', href: '/onboarding-tests', roles: ['hr_admin', 'branch_manager', 'admin'] },
      ]
    },
    {
      title: 'Project & Task Management',
      items: [
        { icon: FolderKanban, label: 'Project Management', href: '/projects', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'] },
        { icon: ListTodo, label: 'Task Management', href: '/tasks', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'] },
        { icon: HelpCircle, label: 'Task Requests', href: '/task-requests', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'department_head', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'] },
        { icon: Calendar, label: 'Team Meetings', href: '/team-meetings', roles: ['hr_admin', 'branch_manager', 'team_lead', 'admin'] },
      ]
    },
    {
      title: 'Communication & Recognition',
      items: [
        { icon: BellRing, label: 'Announcements', href: '/announcements', roles: ['hr_admin', 'branch_manager', 'admin'], permission: 'announcements' },
        { icon: Award, label: 'Recognition', href: '/recognition', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'] },
        { icon: Mail, label: 'Email Notifications', href: '/email-test', roles: ['hr_admin', 'admin'] },
        { icon: BookOpen, label: 'Handbook Management', href: '/handbook-management', roles: ['hr_admin', 'admin'] },
      ]
    },
    {
      title: 'Operations & Reports',
      items: [
        { icon: Building2, label: 'Responsibilities & Reporting', href: '/organization', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'logistics_manager', 'department_head', 'project_manager', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'] },
        { icon: Calendar, label: 'Leave Management', href: '/leave-management', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'logistics_manager', 'department_head', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'], permission: 'leave_management' },
        { icon: Phone, label: 'CRM Inquiries', href: '/crm-inquiries', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'admin'] },
        { icon: Shield, label: 'CRM Access Management', href: '/crm-access-management', roles: ['hr_admin', 'admin'] },
        { icon: Shield, label: 'Job Applications Access', href: '/job-applications-access-management', roles: ['hr_admin', 'admin'] },
        { icon: Boxes, label: 'Logistics', href: '/logistics', roles: ['hr_admin', 'logistics_manager', 'admin'] },
        { icon: CheckCircle, label: 'Logistics Approvals', href: '/hr-logistics-approvals', roles: ['hr_admin', 'admin'] },
        { icon: CalendarDays, label: 'Daily Reports', href: '/daily-reports', roles: ['hr_admin', 'branch_manager', 'admin'] },
        { icon: FileDown, label: 'PDF Export Center', href: '/onboarding-pdf-export', roles: ['hr_admin', 'branch_manager', 'admin'] },
        { icon: FileDown, label: 'Logistics PDF Export', href: '/logistics-pdf-export', roles: ['hr_admin', 'logistics_manager', 'branch_manager', 'admin'] },
        { icon: BarChart3, label: 'Analytics', href: '/analytics', roles: ['hr_admin', 'branch_manager', 'admin'] },
      ]
    },
    {
      title: 'Studio & Content',
      items: [
        { icon: Instagram, label: 'Q361 Studio', href: '/social-media', roles: ['studio_manager', 'social_media_manager', 'content_creator', 'content_editor', 'social_media_specialist', 'creative_director', 'hr_admin', 'admin'] },
        { icon: Share2, label: 'Social Media Manager', href: '/social-media-manager', roles: ['studio_manager', 'social_media_manager', 'content_creator', 'content_editor', 'social_media_specialist', 'creative_director', 'hr_admin', 'admin'] },
      ]
    },
    {
      title: 'System',
      items: [
        { icon: Settings, label: 'Settings', href: '/settings', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'logistics_manager', 'department_head', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'] },
      ]
    }
  ];

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      hr_admin: 'HR Administrator',
      branch_manager: 'Branch Manager',
      team_lead: 'Team Lead',
      employee: 'Employee',
      logistics_manager: 'Logistics Manager',
      department_head: 'Department Head',
      studio_manager: 'Studio Manager',
      social_media_manager: 'Social Media Manager',
      content_creator: 'Content Creator',
      content_editor: 'Content Editor',
      social_media_specialist: 'Social Media Specialist',
      creative_director: 'Creative Director',
      admin: 'System Administrator'
    };
    return roleMap[role] || role;
  };

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Users className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Q361</h1>
            <p className="text-sm text-gray-500">Business Management</p>
          </div>
        </div>
      </div>

      {/* User Role Indicator */}
      <div className="p-4 bg-blue-50 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Shield className="text-white" size={14} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {user && 'firstName' in user ? `${user.firstName} ${user.lastName}` : 'User'}
            </p>
            <p className="text-xs text-primary font-medium">
              {user && 'role' in user && user.role ? getRoleDisplayName(user.role) : 'Employee'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 space-y-4 flex-1 overflow-y-auto">
        {navigationCategories.map((category) => {
          const visibleItems = category.items.filter(item => hasAccess(item.roles, item.href, 'permission' in item ? item.permission : undefined));
          if (visibleItems.length === 0) return null;
          
          return (
            <div key={category.title} className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                {category.title}
              </h3>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start space-x-3 text-sm ${
                          isActive 
                            ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="truncate">{getMenuLabel(item.href, item.label)}</span>
                        {'notification' in item && item.notification && (
                          (() => {
                            const count = getNotificationCount(item.notification);
                            return count > 0 ? (
                              <Badge 
                                variant="destructive" 
                                className="ml-auto h-5 min-w-[20px] text-xs px-1.5 rounded-full bg-red-500 text-white"
                              >
                                {count > 99 ? '99+' : count}
                              </Badge>
                            ) : null;
                          })()
                        )}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start space-x-3 text-gray-700 hover:bg-gray-100"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
