import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle, Upload, FileText, AlertCircle, User, CreditCard, FileImage } from 'lucide-react';
import { OnboardingChecklist } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadCardProps {
  item: OnboardingChecklist;
  onFileUploaded: (itemId: number, fileData: { url: string; name: string }) => void;
  disabled?: boolean;
}

interface DocumentSection {
  id: string;
  title: string;
  description: string;
  allowedTypes: string[];
  maxSizeMB: number;
  icon: React.ComponentType<any>;
  uploaded: boolean;
  fileName?: string;
}

export function DocumentUploadCard({ item, onFileUploaded, disabled }: DocumentUploadCardProps) {
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  // Define document sections for required documents
  const documentSections: DocumentSection[] = [
    {
      id: 'cv',
      title: 'Curriculum Vitae (CV)',
      description: 'Upload your complete CV/Resume in PDF format',
      allowedTypes: ['application/pdf'],
      maxSizeMB: 15,
      icon: FileText,
      uploaded: false,
    },
    {
      id: 'cnic',
      title: 'CNIC Copy',
      description: 'Upload a clear copy of your CNIC (front and back)',
      allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
      maxSizeMB: 10,
      icon: CreditCard,
      uploaded: false,
    },
    {
      id: 'profile_picture',
      title: 'Profile Picture',
      description: 'Upload a professional profile photo',
      allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
      maxSizeMB: 5,
      icon: User,
      uploaded: false,
    }
  ];

  const handleFileUpload = async (sectionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const section = documentSections.find(s => s.id === sectionId);
    if (!section) return;

    // Validate file type
    if (!section.allowedTypes.includes(file.type)) {
      const typeList = section.allowedTypes
        .map(type => type.split('/')[1].toUpperCase())
        .join(', ');
      toast({
        title: "Invalid File Type",
        description: `Please upload a ${typeList} file.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    const maxSizeBytes = section.maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        title: "File Too Large",
        description: `Please upload a file smaller than ${section.maxSizeMB}MB.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(prev => ({ ...prev, [sectionId]: true }));
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        onFileUploaded(item.id, {
          url: base64String,
          name: `${sectionId}_${file.name}`
        });
        
        toast({
          title: "Upload Successful",
          description: `${section.title} uploaded successfully.`,
        });
        
        setUploading(prev => ({ ...prev, [sectionId]: false }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${section.title}. Please try again.`,
        variant: "destructive",
      });
      setUploading(prev => ({ ...prev, [sectionId]: false }));
    }
  };

  const getDocumentStatus = () => {
    if (item.isCompleted) return 'complete';
    if (item.documentUrl && !item.isDocumentVerified) return 'pending_verification';
    return 'required';
  };

  const status = getDocumentStatus();

  return (
    <Card className={`border ${
      status === 'complete' 
        ? 'border-green-200 bg-green-50/50' 
        : status === 'pending_verification'
        ? 'border-yellow-200 bg-yellow-50/50'
        : 'border-orange-200 bg-orange-50/50'
    }`}>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className={`${
            status === 'complete' 
              ? 'text-green-600' 
              : status === 'pending_verification'
              ? 'text-yellow-600'
              : 'text-orange-600'
          }`}>
            {status === 'complete' ? (
              <CheckCircle className="w-6 h-6" />
            ) : status === 'pending_verification' ? (
              <AlertCircle className="w-6 h-6" />
            ) : (
              <FileText className="w-6 h-6" />
            )}
          </div>
          <div>
            <CardTitle className="text-lg">{item.itemTitle}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {status === 'complete' ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">All Documents Verified</h3>
            <p className="text-green-600">Your documents have been successfully uploaded and verified by HR.</p>
            {item.completedAt && (
              <p className="text-sm text-gray-500 mt-2">
                Completed on {new Date(item.completedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {documentSections.map((section) => {
              const isUploading = uploading[section.id];
              const IconComponent = section.icon;
              
              return (
                <div key={section.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-gray-900 mb-1">
                        {section.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {section.description}
                      </p>
                      
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={disabled || isUploading}
                          onClick={() => {
                            const input = document.getElementById(`file-input-${section.id}`) as HTMLInputElement;
                            input?.click();
                          }}
                          className="flex items-center space-x-2"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{isUploading ? 'Uploading...' : 'Choose File'}</span>
                        </Button>
                        
                        <div className="text-xs text-gray-500">
                          Max {section.maxSizeMB}MB • {section.allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}
                        </div>
                      </div>
                      
                      <Input
                        id={`file-input-${section.id}`}
                        type="file"
                        accept={section.allowedTypes.join(',')}
                        onChange={(e) => handleFileUpload(section.id, e)}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            
            {status === 'pending_verification' && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-yellow-800 font-medium">Pending HR Verification</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Documents uploaded: {item.documentName}. HR will review and verify your documents soon.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}