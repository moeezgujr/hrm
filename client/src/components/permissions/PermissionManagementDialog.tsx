import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Check, X, Lock, Unlock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PermissionManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  userName: string;
  userRole: string;
}

interface UserPermission {
  id: number;
  userId: number;
  module: string;
  level: string;
  grantedBy: number | null;
  grantedAt: Date | null;
  revokedAt: Date | null;
}

const MODULE_LABELS: Record<string, string> = {
  employee_management: 'Employee Management',
  contract_management: 'Contract Management',
  announcements: 'Announcements',
  leave_management: 'Leave Management',
};

const LEVEL_LABELS: Record<string, string> = {
  view: 'View Only',
  manage: 'Full Management',
};

export function PermissionManagementDialog({
  open,
  onOpenChange,
  userId,
  userName,
  userRole,
}: PermissionManagementDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('view');

  // Fetch user-specific permission overrides
  const { data: userPermissions = [], isLoading: permissionsLoading } = useQuery<UserPermission[]>({
    queryKey: ['/api/users', userId, 'permissions'],
    enabled: open,
  });

  // Fetch aggregated permissions (role defaults + user overrides)
  const { data: aggregatedPermissions = {}, isLoading: aggregatedLoading } = useQuery<Record<string, string>>({
    queryKey: ['/api/users', userId, 'aggregated-permissions'],
    enabled: open,
  });

  // Grant permission mutation
  const grantPermissionMutation = useMutation({
    mutationFn: async ({ module, level }: { module: string; level: string }) => {
      return await apiRequest('POST', `/api/users/${userId}/permissions`, { module, level });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'permissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'aggregated-permissions'] });
      toast({
        title: 'Permission granted',
        description: 'User permission has been updated successfully.',
      });
      setSelectedModule('');
      setSelectedLevel('view');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to grant permission. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Revoke permission mutation
  const revokePermissionMutation = useMutation({
    mutationFn: async (module: string) => {
      return await apiRequest('DELETE', `/api/users/${userId}/permissions/${module}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'permissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'aggregated-permissions'] });
      toast({
        title: 'Permission revoked',
        description: 'User permission override has been removed.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to revoke permission. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleGrantPermission = () => {
    if (!selectedModule) {
      toast({
        title: 'Module required',
        description: 'Please select a module to grant permission.',
        variant: 'destructive',
      });
      return;
    }

    grantPermissionMutation.mutate({
      module: selectedModule,
      level: selectedLevel,
    });
  };

  const handleRevokePermission = (module: string) => {
    revokePermissionMutation.mutate(module);
  };

  // Check if a module has a user-specific override
  const hasUserOverride = (module: string) => {
    return userPermissions.some(p => p.module === module && !p.revokedAt);
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      hr_admin: 'HR Administrator',
      branch_manager: 'Branch Manager',
      team_lead: 'Team Lead',
      employee: 'Employee',
      logistics_manager: 'Logistics Manager',
    };
    return roleMap[role] || role;
  };

  const isLoading = permissionsLoading || aggregatedLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="dialog-permissions">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Manage Permissions - {userName}
          </DialogTitle>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span>Role:</span>
            <Badge variant="outline">{getRoleDisplayName(userRole)}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Current Permissions */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Current Permissions
            </h3>
            
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(MODULE_LABELS).map(([module, label]) => {
                  const level = aggregatedPermissions[module];
                  const hasOverride = hasUserOverride(module);

                  return (
                    <Card key={module} className="stats-card">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${level === 'manage' ? 'bg-green-500' : level === 'view' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                            <div>
                              <p className="font-medium text-sm">{label}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={level === 'manage' ? 'default' : level === 'view' ? 'secondary' : 'outline'} className="text-xs">
                                  {level ? LEVEL_LABELS[level] : 'No Access'}
                                </Badge>
                                {hasOverride ? (
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <Unlock className="h-3 w-3" />
                                    User Override
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    Role Default
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {hasOverride && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokePermission(module)}
                              disabled={revokePermissionMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-revoke-${module}`}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove Override
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grant New Permission */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Unlock className="h-4 w-4" />
              Grant Permission Override
            </h3>
            
            <Card className="stats-card">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Module</label>
                      <Select value={selectedModule} onValueChange={setSelectedModule}>
                        <SelectTrigger data-testid="select-module">
                          <SelectValue placeholder="Select module" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(MODULE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Permission Level</label>
                      <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                        <SelectTrigger data-testid="select-level">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleGrantPermission}
                    disabled={!selectedModule || grantPermissionMutation.isPending}
                    className="w-full btn-primary"
                    data-testid="button-grant-permission"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {grantPermissionMutation.isPending ? 'Granting...' : 'Grant Permission Override'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Permission overrides will replace the role's default permissions for specific modules. 
              Removing an override will restore the role's default permission for that module.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
