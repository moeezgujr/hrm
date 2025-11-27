import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Plus, X, Users, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@shared/schema";

interface TeamMember {
  userId: number;
  user: User;
  role: string;
}

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  projectManagerId: z.number().min(1, "Project manager is required"),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).default("planning"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  budget: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  clientName: z.string().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateProjectDialog({ open, onClose }: CreateProjectDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projectManagers, setProjectManagers] = useState<TeamMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [selectedManagerId, setSelectedManagerId] = useState<number>(0);

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "planning",
      priority: "medium",
      projectManagerId: user?.id || 22, // Default to current user (ensures valid manager)
    },
  });

  // Fetch users for project manager selection
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: open,
  });



  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectForm) => {
      const projectData = {
        ...data,
        startDate: data.startDate?.toISOString(),
        endDate: data.endDate?.toISOString(),
      };
      
      const response = await apiRequest("POST", "/api/projects", projectData);
      const project = await response.json();
      
      // Add project managers after project creation
      if (projectManagers.length > 0) {
        for (const manager of projectManagers) {
          await apiRequest("POST", `/api/projects/${project.id}/members`, {
            userId: manager.userId,
            role: "manager",
          });
        }
      }
      
      // Add team members after project creation
      if (teamMembers.length > 0) {
        for (const member of teamMembers) {
          await apiRequest("POST", `/api/projects/${project.id}/members`, {
            userId: member.userId,
            role: member.role,
          });
        }
      }
      
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project created",
        description: "The project has been created successfully with team members.",
      });
      onClose();
      form.reset();
      setTeamMembers([]);
      setProjectManagers([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const addProjectManager = () => {
    if (selectedManagerId > 0) {
      const user = users?.find(u => u.id === selectedManagerId);
      if (user) {
        setProjectManagers([...projectManagers, {
          userId: selectedManagerId,
          user,
          role: "manager",
        }]);
        setSelectedManagerId(0);
      }
    }
  };

  const removeProjectManager = (userId: number) => {
    setProjectManagers(projectManagers.filter(m => m.userId !== userId));
  };

  const addTeamMember = () => {
    if (selectedUserId > 0) {
      const user = users?.find(u => u.id === selectedUserId);
      if (user) {
        setTeamMembers([...teamMembers, {
          userId: selectedUserId,
          user,
          role: selectedRole,
        }]);
        setSelectedUserId(0);
        setSelectedRole("member");
      }
    }
  };

  const removeTeamMember = (userId: number) => {
    setTeamMembers(teamMembers.filter(m => m.userId !== userId));
  };

  const onSubmit = (data: CreateProjectForm) => {
    createProjectMutation.mutate(data);
  };



  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new project with team members and tasks to track progress. Users can have multiple roles (e.g., both manager and team member).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the project goals and objectives"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setStartDateOpen(false);
                          }}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setEndDateOpen(false);
                          }}
                          disabled={(date) => {
                            const startDate = form.getValues("startDate");
                            return startDate ? date < startDate : date < new Date();
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Project budget in USD
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Client or department name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Project Managers Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Project Managers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Project Manager */}
                <div className="grid grid-cols-2 gap-2">
                  <Select 
                    value={selectedManagerId.toString()} 
                    onValueChange={(value) => setSelectedManagerId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.username} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    type="button" 
                    onClick={addProjectManager}
                    disabled={selectedManagerId === 0}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manager
                  </Button>
                </div>

                {/* Project Managers List */}
                {projectManagers.length > 0 && (
                  <div className="space-y-2">
                    <Separator />
                    <div className="text-sm font-medium">Selected Project Managers:</div>
                    <ScrollArea className="h-32">
                      <div className="space-y-2 pr-4" style={{paddingBottom: '3rem'}}>
                        {projectManagers.map((manager) => (
                          <div key={manager.userId} className="flex items-center justify-between p-2 border rounded bg-blue-50">
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4 text-blue-600" />
                              <div className="font-medium">{manager.user.username}</div>
                              <Badge variant="outline" className="bg-blue-100 text-blue-700">Manager</Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProjectManager(manager.userId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {/* Extra spacer to ensure last item is fully visible */}
                        <div className="h-8"></div>
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Members Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Team Member */}
                <div className="grid grid-cols-3 gap-2">
                  <Select 
                    value={selectedUserId.toString()} 
                    onValueChange={(value) => setSelectedUserId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.username} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="lead">Team Lead</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                      <SelectItem value="tester">Tester</SelectItem>
                      <SelectItem value="analyst">Analyst</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    type="button" 
                    onClick={addTeamMember}
                    disabled={selectedUserId === 0}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {/* Team Members List */}
                {teamMembers.length > 0 && (
                  <div className="space-y-2">
                    <Separator />
                    <div className="text-sm font-medium">Selected Team Members:</div>
                    <ScrollArea className="h-32">
                      <div className="space-y-2 pr-4" style={{paddingBottom: '3rem'}}>
                        {teamMembers.map((member) => (
                          <div key={member.userId} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{member.user.username}</div>
                              <Badge variant="outline">{member.role}</Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTeamMember(member.userId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {/* Extra spacer to ensure last item is fully visible */}
                        <div className="h-8"></div>
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProjectMutation.isPending}>
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}