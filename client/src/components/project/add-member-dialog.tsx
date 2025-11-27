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
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

const addMemberSchema = z.object({
  userId: z.number().min(1, "Please select a user"),
  role: z.enum(["member", "manager", "lead", "contributor"]).default("member"),
});

type AddMemberForm = z.infer<typeof addMemberSchema>;

interface AddMemberDialogProps {
  projectId: number;
  open: boolean;
  onClose: () => void;
}

export default function AddMemberDialog({ projectId, open, onClose }: AddMemberDialogProps) {
  const { toast } = useToast();

  const form = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      role: "member",
    },
  });

  // Fetch users
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: open,
  });

  // Fetch existing project members to exclude them
  const { data: existingMembers } = useQuery({
    queryKey: ["/api/projects", projectId, "members"],
    enabled: open,
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: AddMemberForm) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/members`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Member added",
        description: "The team member has been added to the project successfully.",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add member",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddMemberForm) => {
    addMemberMutation.mutate(data);
  };

  // Allow all users (same user can have multiple roles)
  const availableUsers = users || [];
  
  // Get existing member info for display purposes
  const existingMemberInfo = Array.isArray(existingMembers) ? existingMembers.reduce((acc: any, m: any) => {
    if (!acc[m.userId]) acc[m.userId] = [];
    acc[m.userId].push(m.role);
    return acc;
  }, {}) : {};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add a new member to the project team. Users can have multiple roles in the same project.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select User</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(availableUsers || []).map((user) => {
                        const currentRoles = existingMemberInfo[user.id] || [];
                        return (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            <div className="flex flex-col">
                              <span>{user.firstName} {user.lastName} ({user.email})</span>
                              {currentRoles.length > 0 && (
                                <span className="text-xs text-blue-600 font-medium">
                                  Current roles: {currentRoles.join(', ')}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="contributor">Contributor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMemberMutation.isPending}>
                {addMemberMutation.isPending ? "Adding..." : "Add Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}