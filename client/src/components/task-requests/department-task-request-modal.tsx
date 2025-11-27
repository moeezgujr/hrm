import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Calendar, Clock, AlertCircle } from "lucide-react";

interface DepartmentTaskRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentId?: string;
}

export function DepartmentTaskRequestModal({ open, onOpenChange, departmentId }: DepartmentTaskRequestModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    requestTitle: "",
    requestDescription: "",
    estimatedHours: "",
    dueDate: "",
    urgencyLevel: "medium",
    departmentId: departmentId || ""
  });

  // Fetch departments for selection
  const { data: departments = [] } = useQuery({
    queryKey: ['/api/departments'],
  });

  // Fetch employees for assignment
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  const createTaskRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/task-requests', {
        ...data,
        requestType: 'department_task_request',
        estimatedHours: data.estimatedHours ? parseInt(data.estimatedHours) : null,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/task-requests'] });
      toast({
        title: "Success",
        description: "Department task request submitted successfully",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit task request",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      requestTitle: "",
      requestDescription: "",
      estimatedHours: "",
      dueDate: "",
      urgencyLevel: "medium",
      departmentId: departmentId || ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.requestTitle || !formData.requestDescription || !formData.departmentId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createTaskRequestMutation.mutate(formData);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Request Department Task
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {(departments as any[]).map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="urgencyLevel">Urgency Level</Label>
              <Select
                value={formData.urgencyLevel}
                onValueChange={(value) => setFormData(prev => ({ ...prev, urgencyLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Low Priority
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      Medium Priority
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      High Priority
                    </span>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      Urgent
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestTitle">Task Title *</Label>
            <Input
              id="requestTitle"
              value={formData.requestTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, requestTitle: e.target.value }))}
              placeholder="Brief title for the requested task"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestDescription">Task Description *</Label>
            <Textarea
              id="requestDescription"
              value={formData.requestDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, requestDescription: e.target.value }))}
              placeholder="Detailed description of what needs to be done, objectives, and expected outcomes"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="1"
                value={formData.estimatedHours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                placeholder="Expected time to complete"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Preferred Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Task Request Process</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Your request will be reviewed by HR who will assign it to the appropriate employee. 
                  You'll receive updates on the status and can track progress through the system.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTaskRequestMutation.isPending}
              className="min-w-[120px]"
            >
              {createTaskRequestMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}