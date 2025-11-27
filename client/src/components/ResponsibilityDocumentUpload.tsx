import { useState, useEffect, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText, FileAudio, FileVideo, Download, Loader2 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ResponsibilityDocument {
  filename: string;
  originalName: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: number;
}

interface Props {
  employeeId?: number;
  documents?: ResponsibilityDocument[];
  onDocumentsChange?: (documents: ResponsibilityDocument[]) => void;
  isEditing?: boolean;
}

export function ResponsibilityDocumentUpload({ 
  employeeId, 
  documents = [], 
  onDocumentsChange,
  isEditing = false 
}: Props) {
  const { toast } = useToast();
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [localDocuments, setLocalDocuments] = useState<ResponsibilityDocument[]>(documents);

  useEffect(() => {
    setLocalDocuments(documents);
  }, [documents]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('audio/')) return FileAudio;
    if (type.startsWith('video/')) return FileVideo;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const validateFile = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'mp3', 'wav', 'ogg', 'webm', 'mp4', 'mpeg', 'mov', 'm4a', 'aac'];
    
    const isPDF = file.type === 'application/pdf' || fileExtension === 'pdf';
    const isAudio = file.type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(fileExtension || '');
    const isVideo = file.type.startsWith('video/') || ['mp4', 'webm', 'mov', 'mpeg'].includes(fileExtension || '');
    
    if (!isPDF && !isAudio && !isVideo) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, audio (MP3, WAV, OGG), and video (MP4, WebM, MOV) files are allowed.",
        variant: "destructive",
      });
      return false;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "File size must be less than 50MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!validateFile(file)) return;

    if (!employeeId) {
      toast({
        title: "Employee not saved",
        description: "Please save the employee first before uploading documents.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Use FormData for efficient file upload (no base64 encoding needed!)
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/employees/${employeeId}/upload-responsibility-document`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      if (result.success) {
        const updatedDocs = [...localDocuments, result.file];
        setLocalDocuments(updatedDocs);
        if (onDocumentsChange) {
          onDocumentsChange(updatedDocs);
        }
        
        queryClient.invalidateQueries({ queryKey: ['/api/employees'] });

        toast({
          title: "Document uploaded",
          description: `${file.name} has been uploaded successfully.`,
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }

    event.target.value = '';
  };

  const handleDelete = async (document: ResponsibilityDocument) => {
    if (!employeeId) return;

    try {
      const filename = document.url.split('/').pop();
      await apiRequest('DELETE', `/api/employees/${employeeId}/responsibility-documents/${filename}`, {});
      
      const updatedDocs = localDocuments.filter(doc => doc.url !== document.url);
      setLocalDocuments(updatedDocs);
      if (onDocumentsChange) {
        onDocumentsChange(updatedDocs);
      }

      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });

      toast({
        title: "Document deleted",
        description: `${document.originalName} has been removed.`,
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (document: ResponsibilityDocument) => {
    if (!employeeId) return;

    try {
      const filename = document.url.split('/').pop();
      const downloadUrl = `/api/employees/${employeeId}/responsibility-documents/${filename}`;
      
      const link = window.document.createElement('a');
      link.href = downloadUrl;
      link.download = document.originalName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      toast({
        title: "Download started",
        description: `Downloading ${document.originalName}...`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Attached Documents</h4>
        {isEditing && employeeId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => document.getElementById(inputId)?.click()}
            data-testid="button-upload-responsibility-doc"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        )}
      </div>

      <input
        id={inputId}
        type="file"
        className="hidden"
        accept=".pdf,audio/*,video/*"
        onChange={handleFileUpload}
      />

      {localDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No documents attached yet.
            {isEditing && employeeId && (
              <span className="block mt-2">Upload PDF, audio, or video files to document responsibilities.</span>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {localDocuments.map((doc, index) => {
            const Icon = getFileIcon(doc.type);
            return (
              <Card key={index}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" data-testid={`text-doc-name-${index}`}>
                        {doc.originalName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      data-testid={`button-download-doc-${index}`}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc)}
                        data-testid={`button-delete-doc-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!employeeId && isEditing && (
        <p className="text-xs text-muted-foreground">
          Save the employee first to enable document uploads.
        </p>
      )}
    </div>
  );
}
