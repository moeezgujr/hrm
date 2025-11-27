import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Brain, Clock, AlertTriangle } from 'lucide-react';
import { OnboardingChecklist } from '@shared/schema';
import PsychometricTestModal from '../psychometric-test-modal';

interface PsychometricAssessmentCardProps {
  item: OnboardingChecklist;
  employeeId: number;
  onToggleComplete: (id: number, isCompleted: boolean) => void;
}

export function PsychometricAssessmentCard({ item, employeeId, onToggleComplete }: PsychometricAssessmentCardProps) {
  const [showTestModal, setShowTestModal] = useState(false);

  // Map test titles to specific test types to find the correct test ID
  const getTestIdByTitle = (title: string): number => {
    // Debug: Log which test ID is being used
    console.log('PsychometricAssessmentCard - getTestIdByTitle:', {
      title: title,
      psychometricTestId: item.psychometricTestId,
      willUse: item.psychometricTestId ? item.psychometricTestId : 'fallback mapping'
    });

    // Prefer the database value from psychometricTestId first
    if (item.psychometricTestId) {
      return item.psychometricTestId;
    }
    
    // Fallback mappings if psychometricTestId is not available
    if (title.includes("Personality")) return 54; // Personality Assessment (20 questions)
    if (title.includes("Cognitive")) return 55; // Cognitive Abilities Assessment  
    if (title.includes("Communication")) return 56; // Communication Skills Assessment
    if (title.includes("Technical")) return 57; // Technical Skills Assessment
    if (title.includes("Cultural") || title.includes("Culture")) return 58; // Values and Culture Fit Assessment
    
    // Final fallback
    return 54; // Default to Personality Assessment (20 questions)
  };

  const testId = getTestIdByTitle(item.itemTitle);

  return (
    <>
      <Card className="border border-purple-200 bg-purple-50/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`mt-1 ${item.isCompleted ? 'text-green-600' : 'text-purple-600'}`}>
                {item.isCompleted ? <CheckCircle className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.itemTitle}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                
                {item.isCompleted ? (
                  <div className="mt-3 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Assessment Completed</span>
                    {item.completedAt && (
                      <span className="text-xs text-gray-500">
                        on {new Date(item.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-600">Time limit: 30 seconds per question</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">Assessment results visible to HR only</span>
                    </div>
                    <Button
                      onClick={() => setShowTestModal(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Take Psychometric Assessment
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

      <PsychometricTestModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        testId={testId}
        testName={item.itemTitle}
        candidateEmail=""
        candidateName=""
        employeeId={employeeId}
        onComplete={() => {
          setShowTestModal(false);
          onToggleComplete(item.id, true);
        }}
      />
    </>
  );
}