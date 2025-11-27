import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  itemId: number;
  itemTitle: string;
  documentType?: string;
  currentDocument?: {
    url: string;
    name: string;
    isVerified: boolean;
    verificationNotes?: string;
  };
  onFileUploaded: (fileData: { url: string; name: string }) => void;
  disabled?: boolean;
}

export function FileUpload({ 
  itemId, 
  itemTitle, 
  documentType, 
  currentDocument, 
  onFileUploaded, 
  disabled 
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getAcceptedTypes = () => {
    switch (documentType) {
      case 'image':
        return 'image/*';
      case 'pdf':
        return '.pdf';
      default:
        return '.pdf,image/*,.doc,.docx';
    }
  };

  const getTypeDescription = () => {
    switch (documentType) {
      case 'image':
        return 'Images (JPG, PNG, etc.)';
      case 'pdf':
        return 'PDF documents only';
      default:
        return 'Documents and images';
    }
  };

  const validateFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return false;
    }

    if (documentType === 'image' && !file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return false;
    }

    if (documentType === 'pdf' && file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFile = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    try {
      // Simulate file upload - in real implementation, upload to cloud storage
      const formData = new FormData();
      formData.append('file', file);
      formData.append('itemId', itemId.toString());
      formData.append('itemTitle', itemTitle);

      // For demonstration, we'll create a mock URL
      const mockUrl = URL.createObjectURL(file);
      
      // In real implementation, you would:
      // const response = await fetch('/api/upload', { method: 'POST', body: formData });
      // const result = await response.json();
      
      onFileUploaded({
        url: mockUrl,
        name: file.name
      });

      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded and is pending verification`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const getVerificationStatus = () => {
    if (!currentDocument) return null;
    
    if (currentDocument.isVerified) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending Verification
        </Badge>
      );
    }
  };

  if (currentDocument) {
    return (
      <Card className="border-2 border-dashed border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-medium text-sm">{currentDocument.name}</p>
                <p className="text-xs text-gray-500">Uploaded document</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getVerificationStatus()}
              {!disabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Replace
                </Button>
              )}
            </div>
          </div>
          {currentDocument.verificationNotes && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
              <p className="font-medium">Verification Notes:</p>
              <p>{currentDocument.verificationNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`border-2 border-dashed transition-colors ${
        dragActive 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDrop={handleDrop}
      onDragOver={handleDrag}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
    >
      <CardContent className="p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptedTypes()}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
        
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          {isUploading 
            ? 'Please wait while we upload your file...'
            : `Drag and drop your file here, or click to browse`
          }
        </p>
        
        <p className="text-xs text-gray-500">
          Accepted: {getTypeDescription()} • Max size: 10MB
        </p>
        
        {!disabled && !isUploading && (
          <Button className="mt-4" size="sm">
            Choose File
          </Button>
        )}
      </CardContent>
    </Card>
  );
}