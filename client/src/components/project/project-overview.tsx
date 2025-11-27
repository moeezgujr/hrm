import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Save, 
  Edit, 
  FileIcon,
  CalendarIcon,
  Target,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";


interface ProjectOverviewProps {
  projectId: number;
  projectName: string;
  isManager: boolean;
}

interface ProjectOverview {
  id: number;
  projectId: number;
  overview?: string;
  objectives?: string[];
  deliverables?: string[];
  milestones?: string[];
  risks?: string[];
  resources?: string[];
  timeline?: string;
  budget?: string;
  stakeholders?: string[];
  successCriteria?: string[];
  dependencies?: string[];
  assumptions?: string[];
  lastUpdated: string;
  updatedBy: number;
}

interface ProjectFile {
  id: number;
  projectId: number;
  fileName: string;
  fileContent: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  description?: string;
  uploader: {
    id: number;
    username: string;
    email: string;
  };
}

export function ProjectOverview({ projectId, projectName, isManager }: ProjectOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableOverview, setEditableOverview] = useState<Partial<ProjectOverview>>({});
  const [newFile, setNewFile] = useState({ name: "", content: "", description: "", fileType: "text/plain" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch project overview
  const { data: overview, isLoading: overviewLoading } = useQuery<ProjectOverview>({
    queryKey: [`/api/projects/${projectId}/overview`],
    enabled: !!projectId
  });

  // Fetch project files
  const { data: files = [], isLoading: filesLoading } = useQuery<ProjectFile[]>({
    queryKey: [`/api/projects/${projectId}/files`],
    enabled: !!projectId
  });

  // Save project overview
  const saveOverviewMutation = useMutation({
    mutationFn: (data: Partial<ProjectOverview>) => 
      apiRequest('POST', `/api/projects/${projectId}/overview`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/overview`] });
      setIsEditing(false);
    }
  });

  // Upload file
  const uploadFileMutation = useMutation({
    mutationFn: (fileData: { fileName: string; fileContent: string; fileType: string; description?: string }) => 
      apiRequest('POST', `/api/projects/${projectId}/files`, {
        fileName: fileData.fileName,
        fileContent: fileData.fileContent, // Already base64 encoded
        fileType: fileData.fileType,
        description: fileData.description
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/files`] });
      setNewFile({ name: "", content: "", description: "", fileType: "text/plain" });
      setSelectedFile(null);
      setShowFileUpload(false);
    },
    onError: (error) => {
      console.error('Error uploading file:', error);
    }
  });

  // Delete file
  const deleteFileMutation = useMutation({
    mutationFn: (fileId: number) => 
      apiRequest('DELETE', `/api/projects/${projectId}/files/${fileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/files`] });
    }
  });

  useEffect(() => {
    if (overview) {
      setEditableOverview(overview);
    }
  }, [overview]);

  const handleSave = () => {
    saveOverviewMutation.mutate(editableOverview);
  };

  const handleFileUpload = () => {
    if (selectedFile) {
      // Handle file upload for binary files
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64Content = result.split(',')[1]; // Remove data:type;base64, prefix
        
        uploadFileMutation.mutate({
          fileName: selectedFile.name,
          fileContent: base64Content,
          fileType: selectedFile.type || 'application/octet-stream',
          description: newFile.description
        });
      };
      reader.readAsDataURL(selectedFile);
    } else if (newFile.name && newFile.content) {
      // Handle text file upload
      uploadFileMutation.mutate({
        fileName: newFile.name,
        fileContent: btoa(newFile.content), // Base64 encode text
        fileType: 'text/plain',
        description: newFile.description
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewFile({ ...newFile, name: file.name });
    }
  };

  const downloadFile = (file: ProjectFile) => {
    try {
      // Convert base64 back to binary data
      const byteCharacters = atob(file.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      const blob = new Blob([byteArray], { type: file.fileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const addArrayItem = (field: keyof ProjectOverview, value: string) => {
    if (value.trim()) {
      const currentArray = (editableOverview[field] as string[]) || [];
      setEditableOverview({
        ...editableOverview,
        [field]: [...currentArray, value.trim()]
      });
    }
  };

  const removeArrayItem = (field: keyof ProjectOverview, index: number) => {
    const currentArray = (editableOverview[field] as string[]) || [];
    setEditableOverview({
      ...editableOverview,
      [field]: currentArray.filter((_, i) => i !== index)
    });
  };

  const ArrayFieldEditor = ({ 
    field, 
    title, 
    icon: Icon, 
    placeholder 
  }: { 
    field: keyof ProjectOverview; 
    title: string; 
    icon: any; 
    placeholder: string; 
  }) => {
    const [newItem, setNewItem] = useState("");
    const items = (editableOverview[field] as string[]) || [];

    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 p-2 bg-gray-50 rounded text-sm">
                {item}
              </div>
              {isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeArrayItem(field, index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {isEditing && (
            <div className="flex gap-2">
              <Input
                placeholder={placeholder}
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addArrayItem(field, newItem);
                    setNewItem("");
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  addArrayItem(field, newItem);
                  setNewItem("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
          {items.length === 0 && !isEditing && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No {title.toLowerCase()} defined yet
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (overviewLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{projectName} - Complete Overview</h1>
          <p className="text-gray-600">Comprehensive project documentation and file management</p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={saveOverviewMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Overview
              </Button>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Project Overview</TabsTrigger>
          <TabsTrigger value="files">Files & Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pb-12">
          {/* Project Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  placeholder="Describe the project overview, goals, and scope..."
                  value={editableOverview.overview || ""}
                  onChange={(e) => setEditableOverview({ ...editableOverview, overview: e.target.value })}
                  rows={4}
                />
              ) : (
                <p className="text-gray-700">
                  {overview?.overview || "No project overview provided yet."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timeline & Budget */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Timeline & Budget
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Timeline</label>
                  {isEditing ? (
                    <Input
                      placeholder="e.g., 6 months, Q1 2024 - Q3 2024"
                      value={editableOverview.timeline || ""}
                      onChange={(e) => setEditableOverview({ ...editableOverview, timeline: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-gray-700">{overview?.timeline || "Not specified"}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Budget</label>
                  {isEditing ? (
                    <Input
                      placeholder="e.g., $50,000, 500 hours"
                      value={editableOverview.budget || ""}
                      onChange={(e) => setEditableOverview({ ...editableOverview, budget: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-gray-700">{overview?.budget || "Not specified"}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Last Updated */}
            <Card>
              <CardHeader>
                <CardTitle>Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                {overview?.lastUpdated ? (
                  <p className="text-gray-700">
                    {new Date(overview.lastUpdated).toLocaleDateString()} at{" "}
                    {new Date(overview.lastUpdated).toLocaleTimeString()}
                  </p>
                ) : (
                  <p className="text-gray-500">Never updated</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ArrayFieldEditor 
              field="objectives" 
              title="Objectives" 
              icon={Target} 
              placeholder="Add project objective..." 
            />
            <ArrayFieldEditor 
              field="deliverables" 
              title="Deliverables" 
              icon={CheckCircle} 
              placeholder="Add deliverable..." 
            />
            <ArrayFieldEditor 
              field="milestones" 
              title="Milestones" 
              icon={CalendarIcon} 
              placeholder="Add milestone..." 
            />
            <ArrayFieldEditor 
              field="stakeholders" 
              title="Stakeholders" 
              icon={Users} 
              placeholder="Add stakeholder..." 
            />
            <ArrayFieldEditor 
              field="risks" 
              title="Risks" 
              icon={AlertTriangle} 
              placeholder="Add risk..." 
            />
            <ArrayFieldEditor 
              field="dependencies" 
              title="Dependencies" 
              icon={FileText} 
              placeholder="Add dependency..." 
            />
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-6 pb-12">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Project Files & Documents</h3>
            {isManager && (
              <Button onClick={() => setShowFileUpload(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            )}
          </div>

          {/* File Upload Form */}
          {showFileUpload && (
            <Card>
              <CardHeader>
                <CardTitle>Upload New File</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Choose Upload Type</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Upload File (PDF, Images, Documents, etc.)</label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.zip,.rar"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {selectedFile && (
                        <div className="text-sm text-gray-600">
                          Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Create Text File</label>
                      <Input
                        placeholder="File name (e.g., notes.txt)"
                        value={newFile.name}
                        onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                        disabled={!!selectedFile}
                      />
                      <Textarea
                        placeholder="Type your content here..."
                        value={newFile.content}
                        onChange={(e) => setNewFile({ ...newFile, content: e.target.value })}
                        rows={4}
                        disabled={!!selectedFile}
                      />
                    </div>
                  </div>
                </div>
                
                <Input
                  placeholder="Description (optional)"
                  value={newFile.description}
                  onChange={(e) => setNewFile({ ...newFile, description: e.target.value })}
                />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleFileUpload} 
                    disabled={(!selectedFile && (!newFile.name || !newFile.content)) || uploadFileMutation.isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadFileMutation.isPending ? 'Uploading...' : 'Upload File'}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowFileUpload(false);
                    setSelectedFile(null);
                    setNewFile({ name: "", content: "", description: "", fileType: "text/plain" });
                  }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Files List */}
          <div className="space-y-3">
            {files.map((file: ProjectFile) => (
              <Card key={file.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">{file.fileName}</div>
                        {file.description && (
                          <div className="text-sm text-gray-600">{file.description}</div>
                        )}
                        <div className="text-xs text-gray-500">
                          {file.fileType} • {(file.fileSize / 1024).toFixed(1)} KB • Uploaded by {file.uploader.username} on{" "}
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => downloadFile(file)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {isManager && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => deleteFileMutation.mutate(file.id)}
                          disabled={deleteFileMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {files.length === 0 && !filesLoading && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-600">No files uploaded yet</div>
                  <div className="text-sm text-gray-500">Upload PDFs, images, documents, and other files to document your project</div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}