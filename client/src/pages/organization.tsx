import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, User, ChevronRight, Users, Briefcase, Plus, Pencil, Trash2, UserCheck, ArrowDownUp, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { OrgUnit } from "@shared/schema";
import OrgTreeView from "@/components/reporting/OrgTreeView";

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

type EmployeeInfo = {
  id: number;
  userId: number;
  employeeId: string;
  position: string;
  department: string;
  responsibilities?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
};

type MyPosition = {
  employee: Employee;
  orgUnit: OrgUnit | null;
  manager?: EmployeeInfo | null;
  directReports?: EmployeeInfo[];
};

const orgUnitSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  parentUnitId: z.number().nullable().optional(),
  companyId: z.number().min(1, "Company is required"),
  orderIndex: z.number().optional(),
  location: z.string().optional(),
  responsibilities: z.string().optional(),
});

type OrgUnitFormData = z.infer<typeof orgUnitSchema>;

export default function Organization() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<OrgUnitWithEmployees | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<OrgUnitWithEmployees | null>(null);
  const [isOrgUnitDialogOpen, setIsOrgUnitDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch current user to check role
  const { user } = useAuth();
  const isHRAdmin = user?.role === 'hr_admin';

  // Fetch my position first to determine default company
  const { data: myPosition, isLoading: myPositionLoading } = useQuery<MyPosition>({
    queryKey: ["/api/org-hierarchy/my-position"],
  });

  // Set default company based on user's employee record
  const defaultCompanyId = myPosition?.employee?.companyId?.toString();
  const effectiveCompanyId = selectedCompanyId || defaultCompanyId;
  const hasCompanyAssignment = !!myPosition?.employee?.companyId;

  const { data: hierarchy, isLoading: hierarchyLoading } = useQuery<OrgUnitWithEmployees[]>({
    queryKey: ["/api/org-hierarchy", effectiveCompanyId],
    queryFn: async () => {
      const res = await fetch(`/api/org-hierarchy?companyId=${effectiveCompanyId}`);
      if (!res.ok) throw new Error("Failed to fetch hierarchy");
      return res.json();
    },
    enabled: !!effectiveCompanyId && !myPositionLoading,
  });

  // Mutations for create, update, delete
  const createMutation = useMutation({
    mutationFn: async (data: OrgUnitFormData) => {
      const res = await apiRequest("POST", "/api/org-units", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-hierarchy"] });
      toast({ title: "Success", description: "Organizational unit created successfully" });
      setIsOrgUnitDialogOpen(false);
      setEditingUnit(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create organizational unit", 
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<OrgUnitFormData> }) => {
      const res = await apiRequest("PUT", `/api/org-units/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-hierarchy"] });
      toast({ title: "Success", description: "Organizational unit updated successfully" });
      setIsOrgUnitDialogOpen(false);
      setEditingUnit(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update organizational unit", 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/org-units/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-hierarchy"] });
      toast({ title: "Success", description: "Organizational unit deleted successfully" });
      setDeletingUnit(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete organizational unit. This unit may have employees or sub-units that need to be reassigned first.", 
        variant: "destructive" 
      });
    },
  });

  // Helper function to get all descendant IDs of a unit
  const getAllDescendantIds = (unitId: number, units: OrgUnitWithEmployees[]): number[] => {
    const descendants: number[] = [];
    const children = units.filter(u => u.parentUnitId === unitId);
    
    for (const child of children) {
      descendants.push(child.id);
      descendants.push(...getAllDescendantIds(child.id, units));
    }
    
    return descendants;
  };

  // Form for creating/editing org units
  const form = useForm<OrgUnitFormData>({
    resolver: zodResolver(orgUnitSchema),
    defaultValues: {
      title: "",
      description: "",
      parentUnitId: null,
      companyId: effectiveCompanyId ? parseInt(effectiveCompanyId) : undefined,
      orderIndex: 0,
      location: "",
      responsibilities: "",
    },
  });

  // Handle opening dialog for create/edit
  const handleOpenDialog = (unit?: OrgUnitWithEmployees) => {
    if (unit) {
      setEditingUnit(unit);
      form.reset({
        title: unit.title,
        description: unit.description || "",
        parentUnitId: unit.parentUnitId,
        companyId: unit.companyId,
        orderIndex: unit.orderIndex || 0,
        location: unit.location || "",
        responsibilities: unit.responsibilities || "",
      });
    } else {
      setEditingUnit(null);
      form.reset({
        title: "",
        description: "",
        parentUnitId: null,
        companyId: effectiveCompanyId ? parseInt(effectiveCompanyId) : undefined,
        orderIndex: 0,
        location: "",
        responsibilities: "",
      });
    }
    setIsOrgUnitDialogOpen(true);
  };

  const onSubmit = (data: OrgUnitFormData) => {
    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const buildTree = (units: OrgUnitWithEmployees[], parentId: number | null = null): OrgUnitWithEmployees[] => {
    return units
      .filter(unit => unit.parentUnitId === parentId)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  };

  const renderOrgNode = (unit: OrgUnitWithEmployees, level: number = 0): JSX.Element => {
    const children = hierarchy ? buildTree(hierarchy, unit.id) : [];
    const hasChildren = children.length > 0;
    const isMyPosition = myPosition?.orgUnit?.id === unit.id;

    return (
      <div key={unit.id} className="space-y-2">
        <Card 
          className={`${isMyPosition ? 'border-primary border-2 shadow-md' : ''} ${level > 0 ? 'ml-8' : ''}`}
          data-testid={`org-unit-${unit.id}`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {level === 0 ? <Building2 className="w-5 h-5" /> : <Briefcase className="w-4 h-4" />}
                  {unit.title}
                  {isMyPosition && (
                    <Badge variant="default" className="ml-2" data-testid="my-position-badge">
                      You are here
                    </Badge>
                  )}
                </CardTitle>
                {unit.description && (
                  <CardDescription className="mt-1 text-sm">
                    {unit.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasChildren && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
                {isHRAdmin && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenDialog(unit)}
                      data-testid={`button-edit-unit-${unit.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingUnit(unit)}
                      data-testid={`button-delete-unit-${unit.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          {unit.employees && unit.employees.length > 0 && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Team Members ({unit.employees.length})</span>
                </div>
                <div className="grid gap-2">
                  {unit.employees.map((emp) => {
                    const isMe = myPosition?.employee?.id === emp.id;
                    return (
                      <div
                        key={emp.id}
                        className={`flex items-center gap-3 p-2 rounded-md ${
                          isMe ? 'bg-primary/10 border border-primary/20' : 'bg-muted'
                        }`}
                        data-testid={`employee-${emp.id}`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {emp.user.firstName?.[0] || emp.user.username[0]}
                            {emp.user.lastName?.[0] || emp.user.username[1] || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {emp.user.firstName && emp.user.lastName
                              ? `${emp.user.firstName} ${emp.user.lastName}`
                              : emp.user.username}
                            {isMe && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {emp.employeeId}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {children.map(child => renderOrgNode(child, level + 1))}
      </div>
    );
  };

  if (hierarchyLoading || myPositionLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading organizational structure...</p>
        </div>
      </div>
    );
  }

  const topLevelUnits = hierarchy ? buildTree(hierarchy, null) : [];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold" data-testid="page-title">
              {isHRAdmin ? 'Organizational Structure' : 'Responsibilities & Reporting Structure'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isHRAdmin 
                ? "Manage and view the company's reporting hierarchy and team structure"
                : "View your responsibilities, reporting relationships, and organizational hierarchy"
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isHRAdmin && (
              <>
                <Button onClick={() => handleOpenDialog()} data-testid="button-add-unit">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Unit
                </Button>
                <Select value={effectiveCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger className="w-64" data-testid="company-selector">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1" data-testid="company-option-1">Qanzak Global</SelectItem>
                    <SelectItem value="2" data-testid="company-option-2">Meeting Matters Clinic</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {!hasCompanyAssignment && (
          <Card className="border-yellow-500/50 bg-yellow-50" data-testid="no-company-warning">
            <CardContent className="py-4">
              <p className="text-sm text-yellow-800">
                You are not currently assigned to a company. Contact HR to update your company assignment.
              </p>
            </CardContent>
          </Card>
        )}

        {myPosition?.orgUnit && hasCompanyAssignment && effectiveCompanyId === defaultCompanyId && (
          <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-xl transition-all duration-300" data-testid="my-position-card">
            <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500 to-teal-600">
              <CardTitle className="text-base flex items-center gap-2 text-white font-bold">
                <User className="w-5 h-5" />
                Your Position
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white shadow-sm">
                <Avatar className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md ring-2 ring-white">
                  <AvatarFallback className="text-white font-bold text-base">
                    {myPosition.employee.user.firstName?.[0] || myPosition.employee.user.username[0]}
                    {myPosition.employee.user.lastName?.[0] || myPosition.employee.user.username[1] || ''}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base text-gray-900 truncate">
                    {myPosition.employee.user.firstName && myPosition.employee.user.lastName
                      ? `${myPosition.employee.user.firstName} ${myPosition.employee.user.lastName}`
                      : myPosition.employee.user.username}
                  </div>
                  <div className="text-sm text-gray-600 truncate flex items-center gap-2 mt-1">
                    <Briefcase className="w-4 h-4" />
                    {myPosition.orgUnit.title}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Responsibilities and Reporting Structure */}
        {myPosition && hasCompanyAssignment && effectiveCompanyId === defaultCompanyId && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Responsibilities Card */}
            <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-300" data-testid="responsibilities-card">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-500 to-indigo-600">
                <CardTitle className="text-base flex items-center gap-2 text-white font-bold">
                  <FileText className="w-5 h-5" />
                  Your Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {myPosition.employee.responsibilities ? (
                  <div className="text-sm whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {myPosition.employee.responsibilities}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-4 mb-4">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">No Responsibilities Defined</p>
                    <p className="text-xs text-gray-500">Your role responsibilities will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reporting Structure Card */}
            <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300" data-testid="reporting-structure-card">
              <CardHeader className="pb-4 bg-gradient-to-r from-purple-500 to-pink-600">
                <CardTitle className="text-base flex items-center gap-2 text-white font-bold">
                  <ArrowDownUp className="w-5 h-5" />
                  Reporting Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-5">
                {/* Reports To */}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded"></div>
                    Reports To
                  </div>
                  {myPosition.manager ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow" data-testid="manager-card">
                      <Avatar className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 shadow-md ring-2 ring-white">
                        <AvatarFallback className="text-white font-bold">
                          {myPosition.manager.firstName?.[0] || myPosition.manager.username[0]}
                          {myPosition.manager.lastName?.[0] || myPosition.manager.username[1] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate text-gray-900">
                          {myPosition.manager.firstName && myPosition.manager.lastName
                            ? `${myPosition.manager.firstName} ${myPosition.manager.lastName}`
                            : myPosition.manager.username}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {myPosition.manager.position || myPosition.manager.department || 'Manager'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border-2 border-dashed border-gray-200">
                      <div className="rounded-full bg-gray-100 p-2">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">No manager assigned</p>
                    </div>
                  )}
                </div>

                {/* Direct Reports */}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded"></div>
                    Direct Reports {myPosition.directReports && myPosition.directReports.length > 0 && `(${myPosition.directReports.length})`}
                  </div>
                  {myPosition.directReports && myPosition.directReports.length > 0 ? (
                    <div className="space-y-3">
                      {myPosition.directReports.map((report, index) => (
                        <div
                          key={report.id}
                          className="rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                          data-testid={`direct-report-${report.id}`}
                        >
                          <div className="flex items-center gap-3 p-3">
                            <Avatar className={`w-10 h-10 shadow-md ring-2 ring-white flex-shrink-0 ${
                              index % 3 === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                              index % 3 === 1 ? 'bg-gradient-to-br from-green-500 to-green-600' :
                              'bg-gradient-to-br from-orange-500 to-orange-600'
                            }`}>
                              <AvatarFallback className="text-white font-bold">
                                {report.firstName?.[0] || report.username[0]}
                                {report.lastName?.[0] || report.username[1] || ''}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate text-gray-900">
                                {report.firstName && report.lastName
                                  ? `${report.firstName} ${report.lastName}`
                                  : report.username}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {report.position || report.department || 'Employee'}
                              </div>
                            </div>
                          </div>
                          {report.responsibilities && (
                            <div className="px-3 pb-3 pt-0">
                              <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-3 border border-gray-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="w-3.5 h-3.5 text-purple-500" />
                                  <span className="text-xs font-semibold text-gray-700">Responsibilities</span>
                                </div>
                                <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                                  {report.responsibilities}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border-2 border-dashed border-gray-200">
                      <div className="rounded-full bg-gray-100 p-2">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">No direct reports</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {!effectiveCompanyId ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No company selected. Please select a company from the dropdown above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <OrgTreeView
            units={hierarchy || []}
            onEdit={handleOpenDialog}
            onDelete={setDeletingUnit}
            isHRAdmin={isHRAdmin}
          />
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isOrgUnitDialogOpen} onOpenChange={setIsOrgUnitDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="org-unit-dialog">
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? "Edit Organizational Unit" : "Create Organizational Unit"}
            </DialogTitle>
            <DialogDescription>
              {editingUnit
                ? "Update the details of this organizational unit"
                : "Add a new unit to the organizational structure"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CEO, Clinic Director" {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of this role or unit"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company *</FormLabel>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-company">
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Qanzak Global</SelectItem>
                          <SelectItem value="2">Meeting Matters Clinic</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parentUnitId"
                  render={({ field }) => {
                    // Calculate excluded unit IDs outside the render loop
                    const excludedIds = new Set<number>();
                    if (editingUnit && hierarchy) {
                      excludedIds.add(editingUnit.id);
                      getAllDescendantIds(editingUnit.id, hierarchy).forEach(id => excludedIds.add(id));
                    }

                    return (
                      <FormItem>
                        <FormLabel>Reports To</FormLabel>
                        <Select
                          value={field.value === null ? "none" : field.value?.toString() || "none"}
                          onValueChange={(value) =>
                            field.onChange(value === "none" ? null : parseInt(value))
                          }
                          disabled={!hierarchy}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-parent">
                              <SelectValue placeholder={hierarchy ? "None (Top Level)" : "Loading..."} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None (Top Level)</SelectItem>
                            {hierarchy?.filter((unit) => !excludedIds.has(unit.id)).map((unit) => (
                              <SelectItem key={unit.id} value={unit.id.toString()}>
                                {unit.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Select which unit this reports to</FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Main Office" {...field} data-testid="input-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orderIndex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-order"
                        />
                      </FormControl>
                      <FormDescription>Lower numbers appear first</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="responsibilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsibilities</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Key responsibilities of this role"
                        {...field}
                        data-testid="input-responsibilities"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOrgUnitDialogOpen(false);
                    setEditingUnit(null);
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUnit} onOpenChange={() => setDeletingUnit(null)}>
        <AlertDialogContent data-testid="delete-confirmation-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the organizational unit "{deletingUnit?.title}". This action cannot be
              undone. Employees in this unit will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingUnit && deleteMutation.mutate(deletingUnit.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
