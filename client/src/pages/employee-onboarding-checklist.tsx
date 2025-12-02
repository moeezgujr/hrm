import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  Clock, 
  Upload,
  Download,
  FileText,
  Calendar,
  Brain,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OnboardingChecklist } from '@shared/schema';

interface EmployeeData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
}

interface OnboardingData {
  employee: EmployeeData;
  checklists: OnboardingChecklist[];
  totalItems: number;
  completedItems: number;
}

export default function EmployeeOnboardingChecklist() {
  const [token, setToken] = useState<string | null>(null);
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; itemId?: number }>({ open: false });
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-save to localStorage
  useEffect(() => {
    if (onboardingData && token) {
      const saveData = {
        token,
        timestamp: new Date().toISOString(),
        progress: {
          totalItems: onboardingData.totalItems,
          completedItems: onboardingData.completedItems,
          checklists: onboardingData.checklists.map(item => ({
            id: item.id,
            isCompleted: item.isCompleted,
            completedAt: item.completedAt
          }))
        }
      };
      localStorage.setItem('onboarding-progress', JSON.stringify(saveData));
      setLastSaved(new Date());
    }
  }, [onboardingData, token]);

  // Restore from localStorage on load
  useEffect(() => {
    const saved = localStorage.getItem('onboarding-progress');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.timestamp) {
          const savedDate = new Date(data.timestamp);
          const hoursSince = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60);
          
          // Show restoration message if data is less than 24 hours old
          if (hoursSince < 24) {
            toast({
              title: "Progress Restored",
              description: `Your onboarding progress from ${savedDate.toLocaleString()} has been restored.`,
            });
          }
        }
      } catch (e) {
        console.error('Failed to restore onboarding progress:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      // Don't show error immediately, give option to enter token manually
      setShowTokenInput(true);
    }
  }, []);

  // Fetch onboarding data
  const { data: onboardingData, isLoading, error } = useQuery<OnboardingData>({
    queryKey: ['/api/public/onboarding', token],
    queryFn: async () => {
      if (!token) throw new Error('No token available');
      const response = await fetch(`/api/public/onboarding/${token}`);
      if (!response.ok) {
        throw new Error('Failed to fetch onboarding data');
      }
      return response.json();
    },
    enabled: !!token,
  });

  const handleTokenSubmit = () => {
    if (!tokenInput.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter your onboarding token",
        variant: "destructive",
      });
      return;
    }
    setToken(tokenInput.trim());
    setShowTokenInput(false);
  };

  // Update checklist item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, isCompleted, documentUrl, documentName }: {
      itemId: number;
      isCompleted: boolean;
      documentUrl?: string;
      documentName?: string;
    }) => {
      if (!token) throw new Error('No token available');
      const response = await fetch(`/api/public/onboarding/${token}/item/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isCompleted,
          documentUrl,
          documentName,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update checklist item');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/public/onboarding', token] });
      if (data.allCompleted) {
        toast({
          title: "Congratulations!",
          description: data.message,
        });
      } else {
        toast({
          title: "Progress Updated",
          description: data.message,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update item",
        variant: "destructive",
      });
    }
  });

  const handleItemToggle = (itemId: number, isCompleted: boolean) => {
    updateItemMutation.mutate({ itemId, isCompleted });
  };

  const handleDocumentUpload = async (itemId: number) => {
    if (!documentFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    // Convert file to base64 for storage
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      updateItemMutation.mutate({
        itemId,
        isCompleted: true,
        documentUrl: base64,
        documentName: documentFile.name,
      });
      setUploadDialog({ open: false });
      setDocumentFile(null);
    };
    reader.readAsDataURL(documentFile);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your onboarding checklist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Access Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 mb-4">Unable to access onboarding checklist</p>
            <p className="text-sm text-gray-500 mb-4">
              {error instanceof Error ? error.message : "Please check your onboarding link or contact HR for assistance."}
            </p>
            <Button 
              onClick={() => {
                setToken(null);
                setShowTokenInput(true);
                setTokenInput('');
              }}
              variant="outline"
              className="w-full"
            >
              Try Different Token
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!onboardingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <CardTitle>No Data Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 mb-4">No onboarding data found for this token</p>
            <Button 
              onClick={() => {
                setToken(null);
                setShowTokenInput(true);
                setTokenInput('');
              }}
              variant="outline"
              className="w-full"
            >
              Try Different Token
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { employee, checklists, totalItems, completedItems } = onboardingData;
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome to Q361</h1>
              <p className="text-gray-600">Complete your onboarding checklist to get started</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Progress</div>
              <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Employee Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Employee Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">{employee.firstName} {employee.lastName}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-2 text-gray-500" />
                <span>{employee.department} - {employee.position}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Onboarding Progress
              </CardTitle>
              {lastSaved && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span>Auto-saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{completedItems} of {totalItems} items completed</span>
                <span>{progressPercentage}% complete</span>
              </div>
              {progressPercentage === 100 && (
                <div className="flex items-center text-green-600 font-medium">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Onboarding Complete! You can now access your account.
                </div>
              )}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  Your progress is automatically saved
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist Items */}
        <div className="space-y-4">
          {checklists.map((item) => (
            <Card key={item.id} className={`${item.isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={!!item.isCompleted}
                    onCheckedChange={(checked) => 
                      handleItemToggle(item.id, checked === true)
                    }
                    disabled={updateItemMutation.isPending}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <label 
                        htmlFor={`item-${item.id}`}
                        className={`text-lg font-medium cursor-pointer ${
                          item.isCompleted ? 'text-green-700 line-through' : 'text-gray-900'
                        }`}
                      >
                        {item.itemTitle}
                      </label>
                      <div className="flex items-center space-x-2">
                        {item.requiresDocument && (
                          <Badge variant="secondary" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            Document Required
                          </Badge>
                        )}
                        {item.requiresPsychometricTest && (
                          <Badge variant="secondary" className="text-xs">
                            <Brain className="h-3 w-3 mr-1" />
                            Assessment
                          </Badge>
                        )}
                        {item.isCompleted && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600">{item.description}</p>
                    
                    {item.requiresDocument && !item.isCompleted && (
                      <div className="pt-2">
                        <Dialog open={uploadDialog.open && uploadDialog.itemId === item.id} onOpenChange={(open) => setUploadDialog({ open, itemId: open ? item.id : undefined })}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Document
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Upload Document</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="document">Select Document</Label>
                                <Input
                                  id="document"
                                  type="file"
                                  onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setUploadDialog({ open: false })}>
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={() => handleDocumentUpload(item.id)}
                                  disabled={!documentFile || updateItemMutation.isPending}
                                >
                                  {updateItemMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <Upload className="h-4 w-4 mr-2" />
                                  )}
                                  Upload
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                    
                    {item.documentUrl && item.documentName && (
                      <div className="flex items-center text-sm text-green-600">
                        <FileText className="h-4 w-4 mr-1" />
                        Document uploaded: {item.documentName}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Completion Message */}
        {progressPercentage === 100 && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-700 mb-2">
                Congratulations! Your onboarding is complete!
              </h3>
              <p className="text-green-600 mb-4">
                You have successfully completed all onboarding requirements. 
                Your account has been activated and you can now access the HR system.
              </p>
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="bg-green-600 hover:bg-green-700"
              >
                Access Your Account
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}