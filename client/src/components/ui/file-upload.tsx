import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Video, 
  Music, 
  Archive,
  X,
  Paperclip
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface FileUploadProps {
  onFileSelect: (file: File, base64: string, uploadResult?: any) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  disabled?: boolean;
  currentFile?: { name: string; size?: number };
  variant?: 'default' | 'compact' | 'minimal';
  placeholder?: string;
  projectId?: number; // For associating with specific projects
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = "*/*",
  maxSizeMB = 10,
  multiple = false,
  disabled = false,
  currentFile,
  variant = 'default',
  placeholder = "Click to upload or drag and drop",
  projectId
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Image className="h-4 w-4" />;
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return <FileText className="h-4 w-4" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return <Video className="h-4 w-4" />;
      case 'mp3':
      case 'wav':
      case 'flac':
        return <Music className="h-4 w-4" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        title: "File Too Large",
        description: `Please upload a file smaller than ${maxSizeMB}MB.`,
        variant: "destructive",
      });
      return false;
    }

    // Check file type if accept is specified and not wildcard
    if (accept !== "*/*" && accept !== "") {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const isValidType = acceptedTypes.some(acceptedType => {
        if (acceptedType.includes('/')) {
          return file.type === acceptedType;
        } else if (acceptedType.startsWith('.')) {
          return file.name.toLowerCase().endsWith(acceptedType.toLowerCase());
        }
        return false;
      });

      if (!isValidType) {
        toast({
          title: "Invalid File Type",
          description: `Please upload a file of type: ${accept}`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64String = e.target?.result as string;
          
          // Upload to server using the API with credentials
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include authentication cookies
            body: JSON.stringify({
              fileData: base64String,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              projectId: projectId || null
            }),
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const uploadResult = await response.json();
          
          // Pass file info and upload result to parent
          onFileSelect(file, base64String, uploadResult);
          setUploading(false);
          
          toast({
            title: "Upload Successful",
            description: `${file.name} uploaded successfully.`,
          });
        } catch (uploadError) {
          console.error('Server upload error:', uploadError);
          setUploading(false);
          toast({
            title: "Upload Failed",
            description: "Failed to upload file to server. Please try again.",
            variant: "destructive",
          });
        }
      };
      reader.onerror = () => {
        setUploading(false);
        toast({
          title: "Upload Failed",
          description: "Failed to read file. Please try again.",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploading(false);
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Minimal variant for inline use
  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={openFileDialog}
          disabled={disabled || uploading}
          data-testid="file-upload-minimal"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        {currentFile && (
          <div className="flex items-center gap-1">
            {getFileIcon(currentFile.name)}
            <span className="text-xs text-gray-600 truncate max-w-20">
              {currentFile.name}
            </span>
            {onFileRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onFileRemove}
                className="h-4 w-4 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
        {uploading && <span className="text-xs text-gray-500">Uploading...</span>}
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={openFileDialog}
          disabled={disabled || uploading}
          className="w-full"
          data-testid="file-upload-compact"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : "Upload File"}
        </Button>
        {currentFile && (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
            <div className="flex items-center gap-2">
              {getFileIcon(currentFile.name)}
              <span className="text-sm font-medium">{currentFile.name}</span>
              {currentFile.size && (
                <Badge variant="secondary" className="text-xs">
                  {formatFileSize(currentFile.size)}
                </Badge>
              )}
            </div>
            {onFileRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onFileRemove}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default variant - full upload area
  return (
    <div className="space-y-4">
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
      />
      
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!disabled ? openFileDialog : undefined}
        data-testid="file-upload-default"
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 mb-1">
          {uploading ? "Uploading..." : placeholder}
        </p>
        <p className="text-xs text-gray-500">
          Max size: {maxSizeMB}MB
        </p>
        {uploading && (
          <Progress value={undefined} className="w-full mt-2" />
        )}
      </div>

      {currentFile && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
          <div className="flex items-center gap-3">
            {getFileIcon(currentFile.name)}
            <div>
              <p className="text-sm font-medium">{currentFile.name}</p>
              {currentFile.size && (
                <p className="text-xs text-gray-500">{formatFileSize(currentFile.size)}</p>
              )}
            </div>
          </div>
          {onFileRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onFileRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}