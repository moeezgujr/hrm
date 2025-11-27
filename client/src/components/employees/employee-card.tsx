import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Mail, Phone, MapPin, Edit, Trash2, Eye, Shield } from 'lucide-react';
import { Employee, User } from '@shared/schema';
import { Link } from 'wouter';

interface EmployeeCardProps {
  employee: Employee & { user: User; company?: any };
  onEdit?: (employee: Employee & { user: User; company?: any }) => void;
  onDelete?: (employee: Employee & { user: User; company?: any }) => void;
  onManagePermissions?: (employee: Employee & { user: User; company?: any }) => void;
  canDelete?: boolean;
  canManagePermissions?: boolean;
}

export default function EmployeeCard({ employee, onEdit, onDelete, onManagePermissions, canDelete, canManagePermissions }: EmployeeCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'onboarding':
        return 'status-pending';
      case 'inactive':
        return 'status-inactive';
      default:
        return 'status-inactive';
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap = {
      hr_admin: 'HR Administrator',
      branch_manager: 'Branch Manager',
      team_lead: 'Team Lead',
      employee: 'Employee',
      logistics_manager: 'Logistics Manager'
    };
    return roleMap[role] || role;
  };

  return (
    <Card className="stats-card hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
              {employee.user.profileImageUrl ? (
                <img 
                  src={employee.user.profileImageUrl} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Users className="text-white" size={20} />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {employee.user.firstName} {employee.user.lastName}
              </h3>
              <p className="text-sm text-gray-600">{employee.user.position}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(employee.user.status)}>
              {employee.user.status}
            </Badge>
            <div className="flex space-x-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(employee)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <Edit size={16} />
                </Button>
              )}
              {canDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(employee)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Mail size={14} />
            <span>{employee.user.email}</span>
          </div>
          
          {employee.phoneNumber && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Phone size={14} />
              <span>{employee.phoneNumber}</span>
            </div>
          )}
          
          {employee.user.department && (
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin size={14} />
              <span>{employee.user.department}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          {employee.company && (
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-600">Company:</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {employee.company.name}
              </Badge>
            </div>
          )}
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Role:</span>
            <Badge variant="outline">{getRoleDisplayName(employee.user.role)}</Badge>
          </div>
          
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-gray-600">Employee ID:</span>
            <span className="font-medium">{employee.employeeId}</span>
          </div>
          
          {employee.user.startDate && (
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-gray-600">Start Date:</span>
              <span className="font-medium">
                {new Date(employee.user.startDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {employee.onboardingStatus !== 'completed' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-600">Onboarding Progress:</span>
              <span className="font-medium">{employee.onboardingProgress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill bg-primary" 
                style={{ width: `${employee.onboardingProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          {canManagePermissions && onManagePermissions && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onManagePermissions(employee)}
              data-testid={`button-manage-permissions-${employee.id}`}
            >
              <Shield className="h-4 w-4 mr-2" />
              Manage Permissions
            </Button>
          )}
          <Link href={`/employees/${employee.id}`}>
            <Button variant="default" size="sm" className="w-full" data-testid={`button-view-details-${employee.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
