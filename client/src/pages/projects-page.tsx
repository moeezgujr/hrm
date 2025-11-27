import { useState } from "react";
import { useQuery, useMutation, UseQueryResult } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Calendar, DollarSign, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import type { Project, User } from "@shared/schema";
import CreateProjectDialog from "@/components/project/create-project-dialog";
import ProjectDetailsDialog from "@/components/project/project-details-dialog";
import ProjectDashboard from "@/components/project/project-dashboard";

type ProjectWithDetails = Project & {
  projectManager: User;
  memberCount: number;
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithDetails | null>(null);

  const { data: projects, isLoading }: UseQueryResult<ProjectWithDetails[]> = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  const checkStartDatesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/projects/check-start-dates"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project start dates have been checked and updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check project start dates",
        variant: "destructive",
      });
    },
  });

  const markProjectCompletedMutation = useMutation({
    mutationFn: (projectId: number) => apiRequest("PATCH", `/api/projects/${projectId}/complete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project marked as completed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark project as completed",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning": return "bg-blue-100 text-blue-800";
      case "active": return "bg-green-100 text-green-800";
      case "on_hold": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "urgent": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const canCreateProject = user?.role === "hr_admin" || user?.role === "branch_manager" || user?.username === "admin";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-600 mt-2">
            Manage and track project progress across your organization
          </p>
        </div>
        <div className="flex gap-2">
          {user?.role === "hr_admin" && (
            <Button 
              variant="outline" 
              onClick={() => checkStartDatesMutation.mutate()}
              disabled={checkStartDatesMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${checkStartDatesMutation.isPending ? 'animate-spin' : ''}`} />
              Check Start Dates
            </Button>
          )}
          {canCreateProject && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </div>
      </div>

      {projects?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Get started by creating your first project to manage tasks and team collaboration.
            </p>
            {canCreateProject && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project) => (
            <Card 
              key={project.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedProject(project)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.replace("_", " ")}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Project Manager</span>
                  <span className="text-gray-600">
                    {project.projectManager?.username || 'Unassigned'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-gray-400" />
                    <span>Team Size</span>
                  </div>
                  <span className="font-medium">{project.memberCount} members</span>
                </div>

                {project.budget && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                      <span>Budget</span>
                    </div>
                    <span className="font-medium">${Number(project.budget).toLocaleString()}</span>
                  </div>
                )}

                {project.startDate && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      <span>Start Date</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-gray-600">
                        {new Date(project.startDate).toLocaleDateString()}
                      </span>
                      {project.status === 'planning' && new Date(project.startDate) <= new Date() && (
                        <span className="text-xs text-orange-600 font-medium">
                          Ready to start
                        </span>
                      )}
                      {project.status === 'planning' && new Date(project.startDate) > new Date() && (
                        <span className="text-xs text-blue-600">
                          {Math.ceil((new Date(project.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days to go
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm">Priority</span>
                  <Badge className={getPriorityColor(project.priority)}>
                    {project.priority}
                  </Badge>
                </div>

                {project.clientName && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-gray-500">Client: {project.clientName}</span>
                  </div>
                )}

                {/* HR Admin completion button */}
                {user?.role === "hr_admin" && project.status !== "completed" && project.status !== "cancelled" && (
                  <div className="pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-green-700 border-green-300 hover:bg-green-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        markProjectCompletedMutation.mutate(project.id);
                      }}
                      disabled={markProjectCompletedMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Completed
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateDialog && (
        <CreateProjectDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />
      )}

      {selectedProject && (
        <ProjectDashboard
          projectId={selectedProject.id}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}