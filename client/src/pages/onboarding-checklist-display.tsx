import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Clock, AlertCircle, FileCheck, Eye, Brain, Edit, UserCheck, Upload, FileText } from 'lucide-react';
import { ChecklistItemCard } from '@/components/ChecklistItemCard';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { OnboardingChecklist } from '@shared/schema';
import PersonalProfileForm from '../components/personal-profile-form';
import { PsychometricAssessmentCard } from '../components/onboarding-components/psychometric-assessment-card';
import { DocumentUploadCard } from '../components/onboarding-components/document-upload-card';
import { TrainingCard } from '../components/onboarding-components/training-card';
import { EquipmentSetupCard } from '../components/onboarding-components/equipment-setup-card';
import { MeetingCard } from '../components/onboarding-components/meeting-card';
import { HandbookCard } from '../components/onboarding-components/handbook-card';
import { EmergencyContactCard } from '../components/onboarding-components/emergency-contact-card';
import { ProfilePictureCard } from '../components/onboarding-components/profile-picture-card';
import { DirectDepositCard } from '../components/onboarding-components/direct-deposit-card';
import { TeamMeetingCard } from '../components/onboarding-components/team-meeting-card';
import { TrainingModuleContent } from '../components/onboarding-components/training-module-content';
import { EquipmentSetupContent } from '../components/onboarding-components/equipment-setup-content';
import { MeetingContent } from '../components/onboarding-components/meeting-content';
import { HandbookContent } from '../components/onboarding-components/handbook-content';
import { BankingInformationContent } from '../components/onboarding-components/banking-information-content';

interface OnboardingChecklistDisplayProps {
  employeeId?: number;
  isHRView?: boolean;
  onEdit?: (checklist: OnboardingChecklist) => void;
  customChecklists?: OnboardingChecklist[];
}

export function OnboardingChecklistDisplay({ employeeId, isHRView = false, onEdit, customChecklists }: OnboardingChecklistDisplayProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPersonalProfileModal, setShowPersonalProfileModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showHandbookModal, setShowHandbookModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showBankingModal, setShowBankingModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OnboardingChecklist | null>(null);

  const { data: fetchedChecklists, isLoading } = useQuery({
    queryKey: [`/api/onboarding/${employeeId}`],
    retry: false,
    enabled: !!employeeId && !customChecklists, // Only fetch if we don't have custom checklists
  });

  // Use custom checklists if provided, otherwise use fetched data
  const checklists = customChecklists || fetchedChecklists;

  const toggleItemMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: number; isCompleted: boolean }) => {
      return await apiRequest('PUT', `/api/onboarding-checklists/${id}`, { isCompleted });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/onboarding/${employeeId}`] });
      toast({
        title: "Success",
        description: "Checklist item updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update checklist item",
        variant: "destructive",
      });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ itemId, fileData }: { itemId: number; fileData: { url: string; name: string } }) => {
      // Extract base64 content from data URL for server processing
      const base64Content = fileData.url.includes(',') ? fileData.url.split(',')[1] : fileData.url;
      
      return await apiRequest('POST', `/api/onboarding-checklists/${itemId}/upload`, {
        fileName: fileData.name,
        fileContent: base64Content,
        fileSize: base64Content.length
      });
    },
    onSuccess: () => {
      // Invalidate multiple related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: [`/api/onboarding/${employeeId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-onboarding'] });
      queryClient.invalidateQueries({ queryKey: [`/api/public/onboarding/${employeeId}`] });
      
      toast({
        title: "Success",
        description: "Document uploaded and verified successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const verifyDocumentMutation = useMutation({
    mutationFn: async ({ itemId, isVerified, notes }: { itemId: number; isVerified: boolean; notes?: string }) => {
      return await apiRequest('POST', `/api/onboarding-checklists/${itemId}/verify`, {
        isVerified,
        verificationNotes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/onboarding/${employeeId}`] });
      toast({
        title: "Success",
        description: "Document verification updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to verify document",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!checklists || !Array.isArray(checklists) || checklists.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No checklist items found</h3>
          <p className="text-gray-600">
            No onboarding checklist has been created for this employee yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalItems = checklists.length;
  const completedItems = checklists.filter((item: OnboardingChecklist) => item.isCompleted).length;
  const pendingDocuments = checklists.filter((item: OnboardingChecklist) => 
    item.requiresDocument && item.documentUrl && !item.isDocumentVerified
  ).length;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Group checklist items by category based on order
  const groupedItems = (checklists as OnboardingChecklist[]).reduce((groups: Record<string, OnboardingChecklist[]>, item: OnboardingChecklist) => {
    let category = 'Other';
    const order = item.order || 0;
    if (order <= 5) category = 'Pre-arrival Setup';
    else if (order <= 11) category = 'Day 1 - Welcome & Orientation';
    else if (order <= 18) category = 'Week 1 - Documentation & Training';
    else if (order <= 23) category = 'Week 2 - Role-Specific Training';
    else if (order <= 28) category = 'Month 1 - Integration & Assessment';
    else if (order <= 32) category = 'Ongoing - Long-term Integration';
    
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {});

  const handleToggleComplete = (id: number, isCompleted: boolean) => {
    toggleItemMutation.mutate({ id, isCompleted });
  };

  const handleFileUploaded = (itemId: number, fileData: { url: string; name: string }) => {
    uploadDocumentMutation.mutate({ itemId, fileData });
  };

  const handleVerifyDocument = (itemId: number, isVerified: boolean, notes?: string) => {
    verifyDocumentMutation.mutate({ itemId, isVerified, notes });
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Onboarding Progress</span>
            <Badge variant={progress === 100 ? "default" : "secondary"}>
              {completedItems}/{totalItems} Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{progress}% Complete</span>
              {pendingDocuments > 0 && (
                <span className="text-yellow-600">
                  <FileCheck className="w-4 h-4 inline mr-1" />
                  {pendingDocuments} documents pending verification
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items by Category */}
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{category}</h3>
          <div className="space-y-4">
            {(items as OnboardingChecklist[]).map((item: OnboardingChecklist) => (
              <div key={item.id} className="relative">
                {/* Specialized onboarding step components */}
                {(() => {
                  // Personal Profile
                  if (item.itemTitle === "Complete Personal Profile") {
                    return (
                      <Card className="border border-blue-200 bg-blue-50/50">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className={`mt-1 ${item.isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                                {item.isCompleted ? <CheckCircle className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{item.itemTitle}</h4>
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                {item.isCompleted ? (
                                  <div className="mt-3 flex items-center space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-green-600 font-medium">Profile Completed</span>
                                    {item.completedAt && (
                                      <span className="text-xs text-gray-500">
                                        on {new Date(item.completedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="mt-3">
                                    <Button
                                      onClick={() => {
                                        setSelectedItem(item);
                                        setShowPersonalProfileModal(true);
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      <UserCheck className="w-4 h-4 mr-2" />
                                      Complete Personal Profile
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge variant={item.isCompleted ? "default" : "secondary"}>
                              {item.isCompleted ? "Complete" : "Pending"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  // Psychometric Assessments
                  if (item.itemTitle?.includes("Assessment") || 
                      item.itemTitle?.includes("Test") ||
                      item.itemTitle?.includes("Evaluation") ||
                      item.itemTitle?.includes("Personality") ||
                      item.itemTitle?.includes("Cognitive") ||
                      item.itemTitle?.includes("Communication Style") ||
                      item.itemTitle?.includes("Technical Skills") ||
                      item.itemTitle?.includes("Cultural Fit")) {
                    return (
                      <PsychometricAssessmentCard
                        key={item.id}
                        item={item}
                        employeeId={employeeId || 0}
                        onToggleComplete={handleToggleComplete}
                      />
                    );
                  }
                  
                  // Training Modules
                  if (item.itemTitle?.includes("Training") || item.itemTitle?.includes("Orientation")) {
                    return (
                      <Card key={item.id} className="mb-4 border-l-4 border-l-green-500 hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className={`${item.isCompleted ? 'text-green-600' : 'text-green-600'}`}>
                                  {item.isCompleted ? <CheckCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900">{item.itemTitle}</h4>
                                <Badge 
                                  variant={item.isCompleted ? "default" : "secondary"}
                                  className={item.isCompleted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                                >
                                  {item.isCompleted ? "Completed" : "Pending"}
                                </Badge>
                              </div>
                              {item.description && (
                                <p className="text-gray-600 mb-3">{item.description}</p>
                              )}
                              <Button 
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowTrainingModal(true);
                                }}
                                className="bg-green-600 hover:bg-green-700"
                                disabled={!!item.isCompleted}
                              >
                                {item.isCompleted ? "Training Completed" : "Start Training Module"}
                              </Button>
                            </div>
                            {item.isCompleted && (
                              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  // Equipment & IT Setup
                  if (item.itemTitle?.includes("IT Equipment") || item.itemTitle?.includes("Equipment") || item.itemTitle?.includes("Setup")) {
                    return (
                      <Card key={item.id} className="mb-4 border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className={`${item.isCompleted ? 'text-green-600' : 'text-indigo-600'}`}>
                                  {item.isCompleted ? <CheckCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900">{item.itemTitle}</h4>
                                <Badge 
                                  variant={item.isCompleted ? "default" : "secondary"}
                                  className={item.isCompleted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                                >
                                  {item.isCompleted ? "Completed" : "Pending"}
                                </Badge>
                              </div>
                              {item.description && (
                                <p className="text-gray-600 mb-3">{item.description}</p>
                              )}
                              <Button 
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowEquipmentModal(true);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700"
                                disabled={!!item.isCompleted}
                              >
                                {item.isCompleted ? "Equipment Setup Completed" : "Begin Equipment Setup"}
                              </Button>
                            </div>
                            {item.isCompleted && (
                              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  // Employee Handbook - Check BEFORE meetings to avoid "Review" conflict
                  if (item.itemTitle?.includes("Handbook") || item.itemTitle?.includes("Employee Handbook Review")) {
                    return (
                      <HandbookCard
                        key={item.id}
                        item={item}
                        employeeId={employeeId || 0}
                        onToggleComplete={handleToggleComplete}
                      />
                    );
                  }
                  
                  // Meetings
                  if (item.itemTitle?.includes("Meeting") || item.itemTitle?.includes("Check-in") || item.itemTitle?.includes("Review")) {
                    return (
                      <Card key={item.id} className="mb-4 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className={`${item.isCompleted ? 'text-green-600' : 'text-purple-600'}`}>
                                  {item.isCompleted ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900">{item.itemTitle}</h4>
                                <Badge 
                                  variant={item.isCompleted ? "default" : "secondary"}
                                  className={item.isCompleted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                                >
                                  {item.isCompleted ? "Completed" : "Pending"}
                                </Badge>
                              </div>
                              {item.description && (
                                <p className="text-gray-600 mb-3">{item.description}</p>
                              )}
                              <Button 
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowMeetingModal(true);
                                }}
                                className="bg-purple-600 hover:bg-purple-700"
                                disabled={!!item.isCompleted}
                              >
                                {item.isCompleted ? "Meeting Completed" : "Schedule Meeting"}
                              </Button>
                            </div>
                            {item.isCompleted && (
                              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }


                  // Team Introduction Meeting
                  if (item.itemTitle?.includes("Team Introduction") || item.itemTitle?.includes("Team Meeting")) {
                    return (
                      <TeamMeetingCard
                        item={item}
                        employeeId={employeeId || 0}
                        onToggleComplete={handleToggleComplete}
                      />
                    );
                  }
                  
                  // Emergency Contact Information
                  if (item.itemTitle?.includes("Emergency Contact")) {
                    return (
                      <EmergencyContactCard
                        item={item}
                        employeeId={employeeId || 0}
                        onToggleComplete={handleToggleComplete}
                      />
                    );
                  }
                  
                  // Personal Profile Form
                  if (item.itemTitle?.includes("Complete Personal Profile") || 
                      item.itemTitle?.includes("Personal Information Form") ||
                      item.itemTitle?.includes("Personal Profile")) {
                    return (
                      <Card key={item.id} className="mb-4 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <UserCheck className="w-5 h-5 text-blue-600" />
                                <h4 className="text-lg font-semibold text-gray-900">{item.itemTitle}</h4>
                                <Badge 
                                  variant={item.isCompleted ? "default" : "secondary"}
                                  className={item.isCompleted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                                >
                                  {item.isCompleted ? "Completed" : "Pending"}
                                </Badge>
                              </div>
                              {item.description && (
                                <p className="text-gray-600 mb-3">{item.description}</p>
                              )}
                              <Button 
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowPersonalProfileModal(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={!!item.isCompleted}
                              >
                                {item.isCompleted ? "Profile Completed" : "Complete Personal Profile"}
                              </Button>
                            </div>
                            {item.isCompleted && (
                              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  // Profile Picture Upload
                  if (item.itemTitle?.includes("Profile Picture")) {
                    return (
                      <ProfilePictureCard
                        item={item}
                        employeeId={employeeId || 0}
                        onToggleComplete={handleToggleComplete}
                      />
                    );
                  }
                  
                  // Banking/Financial Information
                  if (item.itemTitle?.includes("Banking") || item.itemTitle?.includes("Direct Deposit") || item.itemTitle?.includes("Financial")) {
                    return (
                      <Card key={item.id} className="mb-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className={`${item.isCompleted ? 'text-green-600' : 'text-emerald-600'}`}>
                                  {item.isCompleted ? <CheckCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900">{item.itemTitle}</h4>
                                <Badge 
                                  variant={item.isCompleted ? "default" : "secondary"}
                                  className={item.isCompleted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                                >
                                  {item.isCompleted ? "Completed" : "Pending"}
                                </Badge>
                              </div>
                              {item.description && (
                                <p className="text-gray-600 mb-3">{item.description}</p>
                              )}
                              <Button 
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowBankingModal(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={!!item.isCompleted}
                              >
                                {item.isCompleted ? "Banking Information Completed" : "Complete Banking Information"}
                              </Button>
                            </div>
                            {item.isCompleted && (
                              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  // Document Upload Requirements
                  if (item.requiresDocument || item.itemTitle?.includes("Document") || item.itemTitle?.includes("Upload")) {
                    return (
                      <Card key={item.id} className="mb-4 border-l-4 border-l-red-500 hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className={`${item.isCompleted ? 'text-green-600' : 'text-red-600'}`}>
                                  {item.isCompleted ? <CheckCircle className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900">{item.itemTitle}</h4>
                                <Badge 
                                  variant={item.isCompleted ? "default" : "secondary"}
                                  className={item.isCompleted ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                >
                                  {item.isCompleted ? "Completed" : "Required"}
                                </Badge>
                              </div>
                              {item.description && (
                                <p className="text-gray-600 mb-3">{item.description}</p>
                              )}
                              <Button 
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowDocumentModal(true);
                                }}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={!!item.isCompleted}
                              >
                                {item.isCompleted ? "Documents Uploaded" : "Upload Documents"}
                              </Button>
                            </div>
                            {item.isCompleted && (
                              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  // Default regular checklist item
                  return (
                    <ChecklistItemCard
                      item={item}
                      onToggleComplete={handleToggleComplete}
                      onFileUploaded={handleFileUploaded}
                      disabled={toggleItemMutation.isPending || uploadDocumentMutation.isPending}
                    />
                  );
                })()}
                {isHRView && onEdit && (
                  <div className="absolute top-2 right-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onEdit(item)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {isHRView && item.requiresDocument && item.documentUrl && (
                  <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">HR Verification Required</span>
                      <div className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerifyDocument(item.id, false, "Document needs revision")}
                          disabled={verifyDocumentMutation.isPending}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleVerifyDocument(item.id, true, "Document approved")}
                          disabled={verifyDocumentMutation.isPending}
                        >
                          <FileCheck className="w-4 h-4 mr-1" />
                          Verify
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Personal Profile Modal */}
      <Dialog open={showPersonalProfileModal} onOpenChange={setShowPersonalProfileModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="personal-profile-description">
          <DialogHeader>
            <DialogTitle>Complete Personal Profile</DialogTitle>
            <p id="personal-profile-description" className="text-sm text-gray-600 mt-2">
              Fill out all required information to complete your personal profile and advance your onboarding progress.
            </p>
          </DialogHeader>
          <PersonalProfileForm 
            onComplete={() => {
              if (selectedItem) {
                handleToggleComplete(selectedItem.id, true);
              }
              setShowPersonalProfileModal(false);
              queryClient.invalidateQueries({ queryKey: [`/api/onboarding/${employeeId}`] });
              queryClient.invalidateQueries({ queryKey: ['/api/my-onboarding'] });
              toast({
                title: "Profile Completed",
                description: "Your personal profile has been successfully completed and the onboarding step has been marked as complete.",
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Training Module Modal */}
      <Dialog open={showTrainingModal} onOpenChange={setShowTrainingModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="training-description">
          <DialogHeader>
            <DialogTitle>{selectedItem?.itemTitle}</DialogTitle>
            <p id="training-description" className="text-sm text-gray-600 mt-2">
              Complete the training module by reviewing all materials and passing the assessment.
            </p>
          </DialogHeader>
          <TrainingModuleContent 
            item={selectedItem}
            onComplete={() => {
              if (selectedItem) {
                handleToggleComplete(selectedItem.id, true);
                setShowTrainingModal(false);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Equipment Setup Modal */}
      <Dialog open={showEquipmentModal} onOpenChange={setShowEquipmentModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="equipment-description">
          <DialogHeader>
            <DialogTitle>{selectedItem?.itemTitle}</DialogTitle>
            <p id="equipment-description" className="text-sm text-gray-600 mt-2">
              Follow the IT equipment setup instructions and confirm completion.
            </p>
          </DialogHeader>
          <EquipmentSetupContent 
            item={selectedItem}
            onComplete={() => {
              if (selectedItem) {
                handleToggleComplete(selectedItem.id, true);
                setShowEquipmentModal(false);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Meeting Scheduling Modal */}
      <Dialog open={showMeetingModal} onOpenChange={setShowMeetingModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="meeting-description">
          <DialogHeader>
            <DialogTitle>{selectedItem?.itemTitle}</DialogTitle>
            <p id="meeting-description" className="text-sm text-gray-600 mt-2">
              Schedule and complete your required meeting with HR or your team lead.
            </p>
          </DialogHeader>
          <MeetingContent 
            item={selectedItem}
            onComplete={() => {
              if (selectedItem) {
                handleToggleComplete(selectedItem.id, true);
                setShowMeetingModal(false);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Employee Handbook Modal */}
      <Dialog open={showHandbookModal} onOpenChange={setShowHandbookModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="handbook-description">
          <DialogHeader>
            <DialogTitle>{selectedItem?.itemTitle}</DialogTitle>
            <p id="handbook-description" className="text-sm text-gray-600 mt-2">
              Review the employee handbook and acknowledge understanding of company policies.
            </p>
          </DialogHeader>
          <HandbookContent 
            item={selectedItem}
            onComplete={() => {
              if (selectedItem) {
                handleToggleComplete(selectedItem.id, true);
                setShowHandbookModal(false);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Document Upload Modal */}
      <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="document-description">
          <DialogHeader>
            <DialogTitle>{selectedItem?.itemTitle}</DialogTitle>
            <p id="document-description" className="text-sm text-gray-600 mt-2">
              Upload all required documents with separate spaces for CV, CNIC copy, and profile picture.
            </p>
          </DialogHeader>
          {selectedItem && (
            <DocumentUploadCard
              item={selectedItem}
              onFileUploaded={handleFileUploaded}
              disabled={toggleItemMutation.isPending || uploadDocumentMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Banking Information Modal */}
      <Dialog open={showBankingModal} onOpenChange={setShowBankingModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="banking-description">
          <DialogHeader>
            <DialogTitle>{selectedItem?.itemTitle}</DialogTitle>
            <p id="banking-description" className="text-sm text-gray-600 mt-2">
              Provide your banking information for direct deposit setup and payroll processing.
            </p>
          </DialogHeader>
          <BankingInformationContent 
            item={selectedItem}
            employeeId={employeeId || 0}
            onComplete={() => {
              if (selectedItem) {
                handleToggleComplete(selectedItem.id, true);
                setShowBankingModal(false);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}