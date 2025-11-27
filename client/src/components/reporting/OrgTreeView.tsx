import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronRight, 
  User, 
  Mail,
  Briefcase,
  Users
} from 'lucide-react';
import type { OrgUnit } from "@shared/schema";

type Employee = {
  id: number;
  userId: number;
  employeeId: string;
  companyId?: number | null;
  responsibilities?: string | null;
  user: {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
};

type OrgUnitWithEmployees = OrgUnit & {
  employees: Employee[];
};

interface OrgTreeViewProps {
  units: OrgUnitWithEmployees[];
  onEdit?: (unit: OrgUnitWithEmployees) => void;
  onDelete?: (unit: OrgUnitWithEmployees) => void;
  isHRAdmin: boolean;
}

function getInitials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
}

function getAvatarColor(index: number) {
  const colors = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-green-500 to-green-600',
    'bg-gradient-to-br from-orange-500 to-orange-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-indigo-500 to-indigo-600',
    'bg-gradient-to-br from-red-500 to-red-600',
    'bg-gradient-to-br from-teal-500 to-teal-600',
  ];
  return colors[index % colors.length];
}

interface OrgNodeProps {
  unit: OrgUnitWithEmployees;
  children: OrgUnitWithEmployees[];
  level: number;
  onEdit?: (unit: OrgUnitWithEmployees) => void;
  onDelete?: (unit: OrgUnitWithEmployees) => void;
  isHRAdmin: boolean;
  allUnits: OrgUnitWithEmployees[];
  index: number;
}

function OrgNode({ unit, children, level, onEdit, onDelete, isHRAdmin, allUnits, index }: OrgNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = children.length > 0;
  const hasEmployees = unit.employees.length > 0;

  return (
    <div className="relative">
      {/* Node Card */}
      <Card className={`
        group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300
        ${level === 0 ? 'bg-gradient-to-br from-indigo-50 to-blue-50' : 
          level === 1 ? 'bg-gradient-to-br from-purple-50 to-pink-50' : 
          'bg-gradient-to-br from-gray-50 to-white'}
      `}>
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Expand/Collapse Button */}
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-white/50"
                onClick={() => setIsExpanded(!isExpanded)}
                data-testid={`button-toggle-${unit.id}`}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Unit Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-lg truncate">
                    {unit.title}
                  </h4>
                  {unit.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {unit.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {unit.location && (
                      <Badge variant="outline" className="text-xs">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {unit.location}
                      </Badge>
                    )}
                    {hasEmployees && (
                      <Badge className={`text-xs ${getAvatarColor(index)} text-white border-0`}>
                        <Users className="h-3 w-3 mr-1" />
                        {unit.employees.length} {unit.employees.length === 1 ? 'Person' : 'People'}
                      </Badge>
                    )}
                    {hasChildren && (
                      <Badge variant="secondary" className="text-xs">
                        {children.length} Sub-unit{children.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions for HR Admin */}
                {isHRAdmin && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(unit)}
                      className="h-8 px-3 hover:bg-white/80"
                      data-testid={`button-edit-${unit.id}`}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete?.(unit)}
                      className="h-8 px-3 text-red-600 hover:bg-red-50"
                      data-testid={`button-delete-${unit.id}`}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {/* Employees */}
              {hasEmployees && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Team Members</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {unit.employees.map((emp, empIndex) => (
                      <div
                        key={emp.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-white/60 backdrop-blur hover:bg-white transition-colors"
                        data-testid={`employee-${emp.id}`}
                      >
                        <Avatar className={`h-10 w-10 ${getAvatarColor(empIndex)} shadow-sm ring-2 ring-white`}>
                          <AvatarFallback className="text-white font-bold text-sm">
                            {getInitials(emp.user.firstName, emp.user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {emp.user.firstName} {emp.user.lastName}
                          </p>
                          <p className="text-xs text-gray-600 truncate flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {emp.user.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-8 mt-4 pl-4 border-l-2 border-gray-200 space-y-4">
          {children.map((child, childIndex) => {
            const grandchildren = allUnits.filter(u => u.parentUnitId === child.id);
            return (
              <OrgNode
                key={child.id}
                unit={child}
                children={grandchildren}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                isHRAdmin={isHRAdmin}
                allUnits={allUnits}
                index={index + childIndex + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OrgTreeView({ units, onEdit, onDelete, isHRAdmin }: OrgTreeViewProps) {
  if (units.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6">
          <Users className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Organization Structure</h3>
        <p className="text-gray-600 mb-6">Start building your organizational hierarchy by adding units</p>
        {isHRAdmin && (
          <p className="text-sm text-gray-500">Click "Add Unit" above to create your first organizational unit</p>
        )}
      </div>
    );
  }

  // Find root nodes (nodes without parents or with null parent)
  const rootNodes = units.filter(u => !u.parentUnitId);

  return (
    <div className="space-y-6">
      {rootNodes.map((root, index) => {
        const children = units.filter(u => u.parentUnitId === root.id);
        return (
          <OrgNode
            key={root.id}
            unit={root}
            children={children}
            level={0}
            onEdit={onEdit}
            onDelete={onDelete}
            isHRAdmin={isHRAdmin}
            allUnits={units}
            index={index}
          />
        );
      })}
    </div>
  );
}
