import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileMenu } from './main-layout';
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
  Share2,
  Clapperboard,
  LayoutDashboard,
  Sparkles,
  Target,
  MessageSquare,
  TrendingUp,
  Megaphone,
  Video
} from 'lucide-react';
import q361Logo from '@assets/generated_images/q361_professional_business_logo.png';

const categoryColors: Record<string, { bg: string; text: string; icon: string; border: string; gradient: string }> = {
  'Core Management': { 
    bg: 'bg-blue-50', 
    text: 'text-blue-700', 
    icon: 'text-blue-600',
    border: 'border-blue-200',
    gradient: 'from-blue-500 to-blue-600'
  },
  'Employee Onboarding': { 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-700', 
    icon: 'text-emerald-600',
    border: 'border-emerald-200',
    gradient: 'from-emerald-500 to-emerald-600'
  },
  'Assessment & Testing': { 
    bg: 'bg-purple-50', 
    text: 'text-purple-700', 
    icon: 'text-purple-600',
    border: 'border-purple-200',
    gradient: 'from-purple-500 to-purple-600'
  },
  'Project & Task Management': { 
    bg: 'bg-orange-50', 
    text: 'text-orange-700', 
    icon: 'text-orange-600',
    border: 'border-orange-200',
    gradient: 'from-orange-500 to-orange-600'
  },
  'Communication & Recognition': { 
    bg: 'bg-pink-50', 
    text: 'text-pink-700', 
    icon: 'text-pink-600',
    border: 'border-pink-200',
    gradient: 'from-pink-500 to-pink-600'
  },
  'Operations & Reports': { 
    bg: 'bg-cyan-50', 
    text: 'text-cyan-700', 
    icon: 'text-cyan-600',
    border: 'border-cyan-200',
    gradient: 'from-cyan-500 to-cyan-600'
  },
  'CRM & Sales': { 
    bg: 'bg-amber-50', 
    text: 'text-amber-700', 
    icon: 'text-amber-600',
    border: 'border-amber-200',
    gradient: 'from-amber-500 to-amber-600'
  },
  'Q361 Studio': { 
    bg: 'bg-violet-50', 
    text: 'text-violet-700', 
    icon: 'text-violet-600',
    border: 'border-violet-200',
    gradient: 'from-violet-500 to-violet-600'
  },
  'System': { 
    bg: 'bg-slate-50', 
    text: 'text-slate-700', 
    icon: 'text-slate-600',
    border: 'border-slate-200',
    gradient: 'from-slate-500 to-slate-600'
  }
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { isOpen, setIsOpen } = useMobileMenu();

  const hasAccess = (requiredRoles: string[], itemHref?: string, permissionModule?: string) => {
    if (!user) return false;
    
    if (user.username === "admin") return true;
    
    if (itemHref === '/job-applications' && 'hasJobApplicationsAccess' in user && user.hasJobApplicationsAccess) {
      return true;
    }
    
    if (itemHref === '/crm-inquiries' && 'hasCrmAccess' in user && user.hasCrmAccess) {
      return true;
    }

    if (itemHref === '/crm-daily-log' && 'hasCrmAccess' in user && user.hasCrmAccess) {
      return true;
    }

    if (itemHref === '/crm-management-dashboard' && 'hasCrmAccess' in user && user.hasCrmAccess) {
      return true;
    }

    if (itemHref === '/ceo-crm-meeting' && 'hasCrmAccess' in user && user.hasCrmAccess) {
      return true;
    }
    
    if (permissionModule && 'permissions' in user && user.permissions) {
      const modulePermission = user.permissions[permissionModule as keyof typeof user.permissions];
      if (modulePermission === 'view' || modulePermission === 'manage') {
        return true;
      }
    }
    
    const hasRoleAccess = 'role' in user && user.role && requiredRoles.includes(user.role);
    return hasRoleAccess;
  };

  const { data: pendingTrialCount = 0 } = useQuery<{ count: number }>({
    queryKey: ['/api/trial-requests/pending/count'],
    enabled: !!user && hasAccess(['hr_admin']),
    refetchInterval: 300000,
    refetchOnWindowFocus: true,
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
  
  const { logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleNavClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const navigationCategories = [
    {
      title: 'Core Management',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'logistics_manager', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'] },
        { icon: Users, label: 'Employees', href: '/employees', roles: ['hr_admin', 'branch_manager', 'team_lead', 'admin'], permission: 'employee_management' },
        { icon: Building2, label: 'Departments', href: '/departments', roles: ['hr_admin', 'branch_manager', 'department_head', 'admin'] },
        { icon: Shield, label: 'Dept. Management', href: '/department-management', roles: ['hr_admin', 'branch_manager', 'admin'] },
        { icon: Building2, label: 'Organization', href: '/organization', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'logistics_manager', 'department_head', 'project_manager', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'] },
      ]
    },
    {
      title: 'Employee Onboarding',
      items: [
        { icon: Briefcase, label: 'Job Applications', href: '/job-applications', roles: ['hr_admin', 'admin'] },
        { icon: FileText, label: 'Contracts', href: '/contract-management', roles: ['hr_admin', 'branch_manager', 'admin'], permission: 'contract_management' },
        { icon: FileText, label: 'My Contracts', href: '/my-contracts', roles: ['employee', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager'] },
        { icon: UserPlus, label: 'Onboarding', href: '/onboarding', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'] },
        { icon: ClipboardCheck, label: 'Checklists', href: '/onboarding-checklist-manager', roles: ['hr_admin', 'branch_manager', 'admin'] },
        { icon: UserCheck, label: 'HR Process', href: '/hr-onboarding', roles: ['hr_admin', 'branch_manager', 'admin'] },
        { icon: UserCheck, label: 'Approvals', href: '/registration-approvals', roles: ['hr_admin', 'admin'] },
        { icon: CreditCard, label: 'Banking', href: '/banking-overview', roles: ['hr_admin', 'branch_manager', 'admin'] },
      ]
    },
    {
      title: 'Assessment & Testing',
      items: [
        { icon: Brain, label: 'Psychometric Tests', href: '/psychometric-admin', roles: ['hr_admin', 'branch_manager', 'admin'] },
        { icon: TrendingUp, label: 'Test Results', href: '/psychometric-results', roles: ['hr_admin', 'admin'] },
        { icon: Target, label: 'Onboarding Tests', href: '/onboarding-tests', roles: ['hr_admin', 'branch_manager', 'admin'] },
      ]
    },
    {
      title: 'Project & Task Management',
      items: [
        { icon: FolderKanban, label: 'Projects', href: '/projects', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'] },
        { icon: ListTodo, label: 'Tasks', href: '/tasks', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'] },
        { icon: HelpCircle, label: 'Task Requests', href: '/task-requests', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'department_head', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'] },
        { icon: Calendar, label: 'Team Meetings', href: '/team-meetings', roles: ['hr_admin', 'branch_manager', 'team_lead', 'admin'] },
        { icon: CalendarDays, label: 'Leave Management', href: '/leave-management', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'logistics_manager', 'department_head', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'], permission: 'leave_management' },
      ]
    },
    {
      title: 'CRM & Sales',
      items: [
        { icon: Phone, label: 'Inquiries', href: '/crm-inquiries', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'admin'] },
        { icon: MessageSquare, label: 'Daily Log', href: '/crm-daily-log', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'admin'] },
        { icon: BarChart3, label: 'CRM Dashboard', href: '/crm-management-dashboard', roles: ['hr_admin', 'branch_manager', 'admin'] },
        { icon: Clapperboard, label: 'CEO Meeting', href: '/ceo-crm-meeting', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'admin'] },
        { icon: Shield, label: 'CRM Access', href: '/crm-access-management', roles: ['hr_admin', 'admin'] },
      ]
    },
    {
      title: 'Communication & Recognition',
      items: [
        { icon: Megaphone, label: 'Announcements', href: '/announcements', roles: ['hr_admin', 'branch_manager', 'admin'], permission: 'announcements' },
        { icon: Award, label: 'Recognition', href: '/recognition', roles: ['hr_admin', 'branch_manager', 'team_lead', 'employee', 'content_creator', 'social_media_specialist', 'content_editor', 'creative_director', 'social_media_manager', 'admin'] },
        { icon: Mail, label: 'Email Center', href: '/email-test', roles: ['hr_admin', 'admin'] },
        { icon: BookOpen, label: 'Handbook', href: '/handbook-management', roles: ['hr_admin', 'admin'] },
      ]
    },
    {
      title: 'Operations & Reports',
      items: [
        { icon: Boxes, label: 'Logistics', href: '/logistics', roles: ['hr_admin', 'logistics_manager', 'admin'] },
        { icon: CheckCircle, label: 'Approvals', href: '/hr-logistics-approvals', roles: ['hr_admin', 'admin'] },
        { icon: CalendarDays, label: 'Daily Reports', href: '/daily-reports', roles: ['hr_admin', 'branch_manager', 'admin'] },
        { icon: FileDown, label: 'PDF Export', href: '/onboarding-pdf-export', roles: ['hr_admin', 'branch_manager', 'admin'] },
        { icon: BarChart3, label: 'Analytics', href: '/analytics', roles: ['hr_admin', 'branch_manager', 'admin'] },
      ]
    },
    {
      title: 'Q361 Studio',
      items: [
        { icon: Sparkles, label: 'Studio Dashboard', href: '/social-media', roles: ['studio_manager', 'social_media_manager', 'content_creator', 'content_editor', 'social_media_specialist', 'creative_director', 'hr_admin', 'admin'] },
        { icon: Share2, label: 'Social Manager', href: '/social-media-manager', roles: ['studio_manager', 'social_media_manager', 'content_creator', 'content_editor', 'social_media_specialist', 'creative_director', 'hr_admin', 'admin'] },
      ]
    },
    {
      title: 'System',
      items: [
        { icon: Crown, label: 'Super Admin', href: '/super-admin', roles: ['hr_admin', 'admin'] },
        { icon: CreditCard, label: 'Trial Requests', href: '/admin/trial-requests', roles: ['hr_admin', 'admin'], notification: 'trial-requests' },
        { icon: DollarSign, label: 'Subscriptions', href: '/admin/subscription-management', roles: ['hr_admin', 'admin'] },
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

  const SidebarContent = () => (
    <>
      {/* Brand Header */}
      <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
            <img src={q361Logo} alt="Q361 Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Q361</h1>
            <p className="text-[10px] md:text-xs text-blue-100">Complete Business Management</p>
          </div>
        </div>
      </div>

      {/* User Role Indicator */}
      <div className="p-3 md:p-4 bg-blue-50 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-primary rounded-full flex items-center justify-center">
            <Shield className="text-white" size={12} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
              {user && 'firstName' in user ? `${user.firstName} ${user.lastName}` : 'User'}
            </p>
            <p className="text-[10px] md:text-xs text-primary font-medium truncate">
              {user && 'role' in user && user.role ? getRoleDisplayName(user.role) : 'Employee'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-2 md:p-3 space-y-2 md:space-y-3 flex-1 overflow-y-auto">
        {navigationCategories.map((category) => {
          const visibleItems = category.items.filter(item => hasAccess(item.roles, item.href, 'permission' in item ? item.permission : undefined));
          if (visibleItems.length === 0) return null;
          
          const colors = categoryColors[category.title] || categoryColors['System'];
          
          return (
            <div key={category.title} className="space-y-1">
              <div className={`flex items-center px-2 py-1 md:py-1.5 rounded-lg ${colors.bg} ${colors.border} border`}>
                <div className={`w-1 h-3 md:h-4 rounded-full bg-gradient-to-b ${colors.gradient} mr-2`}></div>
                <h3 className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                  {category.title}
                </h3>
              </div>
              <div className="space-y-0.5 pl-1">
                {visibleItems.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  
                  const getActiveStyles = (catTitle: string) => {
                    const styleMap: Record<string, string> = {
                      'Core Management': 'bg-gradient-to-r from-blue-500 to-blue-600',
                      'Employee Onboarding': 'bg-gradient-to-r from-emerald-500 to-emerald-600',
                      'Assessment & Testing': 'bg-gradient-to-r from-purple-500 to-purple-600',
                      'Project & Task Management': 'bg-gradient-to-r from-orange-500 to-orange-600',
                      'CRM & Sales': 'bg-gradient-to-r from-amber-500 to-amber-600',
                      'Communication & Recognition': 'bg-gradient-to-r from-pink-500 to-pink-600',
                      'Operations & Reports': 'bg-gradient-to-r from-cyan-500 to-cyan-600',
                      'Q361 Studio': 'bg-gradient-to-r from-violet-500 to-violet-600',
                      'System': 'bg-gradient-to-r from-slate-500 to-slate-600',
                    };
                    return styleMap[catTitle] || 'bg-gradient-to-r from-gray-500 to-gray-600';
                  };

                  const getHoverStyles = (catTitle: string) => {
                    const styleMap: Record<string, string> = {
                      'Core Management': 'hover:bg-blue-50 hover:text-blue-700',
                      'Employee Onboarding': 'hover:bg-emerald-50 hover:text-emerald-700',
                      'Assessment & Testing': 'hover:bg-purple-50 hover:text-purple-700',
                      'Project & Task Management': 'hover:bg-orange-50 hover:text-orange-700',
                      'CRM & Sales': 'hover:bg-amber-50 hover:text-amber-700',
                      'Communication & Recognition': 'hover:bg-pink-50 hover:text-pink-700',
                      'Operations & Reports': 'hover:bg-cyan-50 hover:text-cyan-700',
                      'Q361 Studio': 'hover:bg-violet-50 hover:text-violet-700',
                      'System': 'hover:bg-slate-50 hover:text-slate-700',
                    };
                    return styleMap[catTitle] || 'hover:bg-gray-50 hover:text-gray-700';
                  };
                  
                  return (
                    <Link key={item.href} href={item.href} onClick={handleNavClick}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start gap-2 md:gap-2.5 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 transition-all duration-200 ${
                          isActive 
                            ? `${getActiveStyles(category.title)} text-white shadow-md font-medium` 
                            : `text-gray-600 ${getHoverStyles(category.title)}`
                        }`}
                      >
                        <Icon size={14} className={isActive ? 'text-white' : colors.icon} />
                        <span className="truncate">{getMenuLabel(item.href, item.label)}</span>
                        {'notification' in item && item.notification && (
                          (() => {
                            const count = getNotificationCount(item.notification);
                            return count > 0 ? (
                              <Badge 
                                variant="destructive" 
                                className="ml-auto h-4 md:h-5 min-w-[16px] md:min-w-[20px] text-[10px] md:text-xs px-1 md:px-1.5 rounded-full bg-red-500 text-white animate-pulse"
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
      <div className="p-2 md:p-3 border-t border-gray-200 bg-gray-50">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-2 md:gap-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-xs md:text-sm h-8 md:h-9"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile: Sheet-based slide-out drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-[280px] p-0 flex flex-col md:hidden">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop: Fixed sidebar - hidden on mobile */}
      <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex-col h-screen sticky top-0 hidden md:flex">
        <SidebarContent />
      </aside>
    </>
  );
}
