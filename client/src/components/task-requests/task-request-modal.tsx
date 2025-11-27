import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, Clock, FileText, AlertCircle } from "lucide-react";

const taskRequestSchema = z.object({
  requestType: z.enum(['time_extension', 'document_request', 'help_request', 'clarification', 'hr_task_request']),
  requestTitle: z.string().min(1, "Title is required"),
  requestDescription: z.string().min(10, "Description must be at least 10 characters"),
  requestedExtension: z.number().optional(),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  estimatedHours: z.number().optional(),
  dueDate: z.string().optional(),
});

type TaskRequestFormData = z.infer<typeof taskRequestSchema>;

interface TaskRequestModalProps {
  taskId: number;
  taskTitle: string;
  requesterId: string;
  trigger?: React.ReactNode;
}

export function TaskRequestModal({ taskId, taskTitle, requesterId, trigger }: TaskRequestModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TaskRequestFormData>({
    resolver: zodResolver(taskRequestSchema),
    defaultValues: {
      requestType: 'help_request',
      requestTitle: '',
      requestDescription: '',
      urgencyLevel: 'medium',
    },
  });

  const requestType = form.watch('requestType');

  const createTaskRequestMutation = useMutation({
    mutationFn: async (data: TaskRequestFormData) => {
      const requestData = {
        ...data,
        taskId,
        requesterId,
      };
      return apiRequest('/api/task-requests', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Request submitted",
        description: "Your request has been sent to your supervisor.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/task-requests'] });
      form.reset();
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TaskRequestFormData) => {
    createTaskRequestMutation.mutate(data);
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'time_extension':
        return <Clock className="h-4 w-4" />;
      case 'document_request':
        return <FileText className="h-4 w-4" />;
      case 'help_request':
        return <HelpCircle className="h-4 w-4" />;
      case 'clarification':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Request Help
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Assistance</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Task: {taskTitle}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="requestType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="time_extension">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Time Extension
                        </div>
                      </SelectItem>
                      <SelectItem value="document_request">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Document Request
                        </div>
                      </SelectItem>
                      <SelectItem value="help_request">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Help Request
                        </div>
                      </SelectItem>
                      <SelectItem value="clarification">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Clarification
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Brief description of your request" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requestType === 'time_extension' && (
              <FormField
                control={form.control}
                name="requestedExtension"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Days Needed</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="30"
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        placeholder="Number of extra days" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="urgencyLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urgency Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low - Can wait</SelectItem>
                      <SelectItem value="medium">Medium - Normal priority</SelectItem>
                      <SelectItem value="high">High - Important</SelectItem>
                      <SelectItem value="urgent">Urgent - Immediate attention</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Provide detailed information about your request..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createTaskRequestMutation.isPending}
              >
                {createTaskRequestMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}