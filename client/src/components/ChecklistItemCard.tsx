import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, FileText, Upload, Brain } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { OnboardingChecklist } from '@shared/schema';
import PsychometricTestModal from './psychometric-test-modal';

interface ChecklistItemCardProps {
  item: OnboardingChecklist;
  onToggleComplete: (id: number, isCompleted: boolean) => void;
  onFileUploaded: (itemId: number, fileData: { url: string; name: string }) => void;
  disabled?: boolean;
}

export function ChecklistItemCard({ 
  item, 
  onToggleComplete, 
  onFileUploaded, 
  disabled 
}: ChecklistItemCardProps) {
  const [showTestModal, setShowTestModal] = useState(false);
  const getStatusBadge = () => {
    if (item.isCompleted) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
    
    if (item.requiresPsychometricTest && !item.psychometricTestCompleted) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <Brain className="w-3 h-3 mr-1" />
          Assessment Required
        </Badge>
      );
    }
    
    if (item.requiresDocument && !item.documentUrl) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Document Required
        </Badge>
      );
    }
    
    if (item.requiresDocument && item.documentUrl && !item.isDocumentVerified) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending Verification
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const canComplete = () => {
    if (item.requiresPsychometricTest && !item.psychometricTestCompleted) return false;
    if (!item.requiresDocument) return true;
    return item.documentUrl && item.isDocumentVerified;
  };

  const currentDocument = item.documentUrl ? {
    url: item.documentUrl,
    name: item.documentName || 'Uploaded Document',
    isVerified: item.isDocumentVerified || false,
    verificationNotes: item.verificationNotes || undefined
  } : undefined;

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">{item.itemTitle}</CardTitle>
          {getStatusBadge()}
        </div>
        {item.description && (
          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {item.requiresPsychometricTest && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">
                Psychometric Assessment Required
              </span>
            </div>
            
            {!item.psychometricTestCompleted ? (
              <div className="bg-purple-50 p-3 rounded border border-purple-200">
                <p className="text-sm text-purple-700 mb-3">
                  Complete your psychometric assessment to proceed with onboarding.
                </p>
                <Button
                  onClick={() => setShowTestModal(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={disabled}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Take Assessment
                </Button>
              </div>
            ) : (
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Assessment Completed</span>
                  {item.psychometricTestScore && (
                    <span className="ml-2 text-sm text-green-700">
                      Score: {item.psychometricTestScore}%
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {item.requiresDocument && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                Document Required: {item.documentType === 'image' ? 'Image' : item.documentType === 'pdf' ? 'PDF' : 'Any Document'}
              </span>
            </div>
            
            <FileUpload
              itemId={item.id}
              itemTitle={item.itemTitle}
              documentType={item.documentType || undefined}
              currentDocument={currentDocument}
              onFileUploaded={(fileData) => onFileUploaded(item.id, fileData)}
              disabled={disabled}
            />
          </div>
        )}
        
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`item-${item.id}`}
              checked={item.isCompleted || false}
              onCheckedChange={(checked) => onToggleComplete(item.id, checked as boolean)}
              disabled={disabled || !canComplete()}
            />
            <label 
              htmlFor={`item-${item.id}`} 
              className={`text-sm font-medium cursor-pointer ${
                item.isCompleted ? 'text-green-700' : 'text-gray-700'
              }`}
            >
              Mark as complete
            </label>
          </div>
          
          {!canComplete() && (
            <span className="text-xs text-gray-500">
              {item.requiresPsychometricTest && !item.psychometricTestCompleted 
                ? 'Complete assessment first'
                : item.requiresDocument && !item.documentUrl 
                ? 'Upload document first' 
                : 'Awaiting verification'}
            </span>
          )}
        </div>
        
        {item.isCompleted && item.completedAt && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Completed on {new Date(item.completedAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
      
      {/* Psychometric Test Modal */}
      {item.psychometricTestId && (
        <PsychometricTestModal
          isOpen={showTestModal}
          onClose={() => setShowTestModal(false)}
          testId={item.psychometricTestId}
          testName={`Assessment for ${item.itemTitle}`}
          candidateEmail="employee@example.com"
          candidateName="Employee"
        />
      )}
    </Card>
  );
}