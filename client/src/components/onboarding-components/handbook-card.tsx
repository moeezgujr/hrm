import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, BookOpen, FileText, Clock, Award } from 'lucide-react';
import { OnboardingChecklist } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface HandbookCardProps {
  item: OnboardingChecklist;
  employeeId: number;
  onToggleComplete: (id: number, isCompleted: boolean) => void;
}

const handbookSections = [
  {
    id: 1,
    title: "Introduction & Mission",
    content: `Meeting Matters is a therapeutic and counseling clinic that aims to target individuals with mental health distress, create therapeutic interventions and reduce stigma. Founded in 2010 by Mr. Muhammad Naushad Anjum (CEO), we consist of foreign qualified clinical and counseling psychologists, therapists and positive motivational interviewers.

Our mission is to provide high quality counseling and therapy to individuals and families suffering from mental distress and disorders. We focus on developing therapeutic client relationships to help clients deal with mental distress, blockages and frustrations.`,
    estimatedReadingTime: 5
  },
  {
    id: 2,
    title: "Services Provided",
    content: `Meeting Matters offers comprehensive therapeutic services including:

• Marital/Relationship counseling
• Cognitive Behavioral Therapy (CBT)
• Psychodynamic Psychotherapy
• Child/Adolescent Therapy
• Dialectical Behavior Therapy
• Mindfulness
• Online Counseling

Educational Services:
• Psychotherapy Clinical Supervision
• Internee and new hire training
• Assessment and psychological evaluation
• Evidence-based intervention strategies`,
    estimatedReadingTime: 8
  },
  {
    id: 3,
    title: "Organizational Structure & Roles",
    content: `CEO: Mr. Muhammad Naushad Anjum - Chief Executive Officer and lead Psychologist

Key Leadership Roles:
• Clinic Director - Oversees clinical and administrative activities
• Business Development Manager - Collaborates with administration team
• Human Resource Manager - Maintains staff decorum and handles hiring
• Training Manager - Ensures training of all employees and internees

Each role has specific responsibilities for maintaining our high standards of care and professional development.`,
    estimatedReadingTime: 10
  },
  {
    id: 4,
    title: "Professional Standards & Ethics",
    content: `All staff must adhere to professional standards including:

• Maintaining client confidentiality
• Following evidence-based therapeutic practices
• Continuing professional development
• Ethical decision-making in all client interactions
• Compliance with professional association guidelines (BPS, APA, PPA)

Training Requirements:
• All new hires undergo 2-week comprehensive training
• Academic and practical training components
• Supervised observation of client sessions
• Ongoing professional development opportunities`,
    estimatedReadingTime: 12
  },
  {
    id: 5,
    title: "Policies & Procedures",
    content: `Important policies all employees must understand:

Work Environment:
• Maintain professional decorum at all times
• Punctuality and attendance requirements
• Emergency leave procedures
• Safety and health guidelines

Client Relations:
• Respect client dignity and autonomy
• Maintain therapeutic boundaries
• Document all client interactions appropriately
• Follow clinic protocols for client care

Quality Assurance:
• Regular feedback and evaluation processes
• Adherence to clinic standards
• Continuous improvement initiatives`,
    estimatedReadingTime: 15
  },
  {
    id: 6,
    title: "Employee Development & Growth",
    content: `Meeting Matters is committed to employee growth through:

Training Programs:
• Comprehensive onboarding for new hires
• Ongoing professional development workshops
• Clinical supervision and mentoring
• Research and publication opportunities

Career Development:
• Performance evaluation and feedback
• Advancement opportunities within the organization
• Support for continuing education
• Professional networking opportunities

The clinic values teamwork, professional excellence, and dedication to improving mental health services in our community.`,
    estimatedReadingTime: 10
  }
];

export function HandbookCard({ item, employeeId, onToggleComplete }: HandbookCardProps) {
  const [showHandbookModal, setShowHandbookModal] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [readSections, setReadSections] = useState<number[]>([]);
  const [acknowledgmentChecked, setAcknowledgmentChecked] = useState(false);
  const { toast } = useToast();

  const handleSectionRead = (sectionIndex: number) => {
    if (!readSections.includes(sectionIndex)) {
      setReadSections(prev => [...prev, sectionIndex]);
    }
  };

  const canComplete = readSections.length === handbookSections.length && acknowledgmentChecked;

  const handleCompleteHandbook = () => {
    if (canComplete) {
      onToggleComplete(item.id, true);
      setShowHandbookModal(false);
    }
  };

  return (
    <>
      <Card className="border border-green-200 bg-green-50/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`mt-1 ${item.isCompleted ? 'text-green-600' : 'text-green-700'}`}>
                {item.isCompleted ? <CheckCircle className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.itemTitle}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                
                {item.isCompleted ? (
                  <div className="mt-3 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Handbook Reviewed</span>
                    {item.completedAt && (
                      <span className="text-xs text-gray-500">
                        on {new Date(item.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="flex items-center space-x-4 mb-3 text-sm text-green-700">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>~80 minutes total</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>HR & Training Manual PDF</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button
                        onClick={() => window.open('/handbook/HR & Training Manual.docx_1755078237452.pdf', '_blank')}
                        className="bg-blue-600 hover:bg-blue-700 text-white mr-2"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Open HR & Training Manual (PDF)
                      </Button>
                      <Button
                        onClick={() => setShowHandbookModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Interactive Review Checklist
                      </Button>
                    </div>
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

      <Dialog open={showHandbookModal} onOpenChange={setShowHandbookModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="handbook-description">
          <DialogHeader>
            <DialogTitle>Employee Handbook Review</DialogTitle>
            <p id="handbook-description" className="text-sm text-gray-600 mt-2">
              Please review the official HR & Training Manual PDF document which contains detailed policies, procedures, and leave policies. 
              Then complete this interactive checklist below to confirm your understanding.
              Progress: {readSections.length}/{handbookSections.length} sections completed.
            </p>
            <div className="mt-3">
              <Button
                onClick={() => window.open('/handbook/HR & Training Manual.docx_1755078237452.pdf', '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Open Official HR & Training Manual PDF
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            {handbookSections.map((section, index) => {
                const isRead = readSections.includes(index);
                const isCurrentSection = index === currentSection;
                
                return (
                  <Card key={section.id} className={`border ${
                    isCurrentSection ? 'border-blue-500 bg-blue-50' :
                    isRead ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`mt-1 ${
                            isRead ? 'text-green-600' : 
                            isCurrentSection ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                            {isRead ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <FileText className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{section.title}</h4>
                            
                            {isCurrentSection && (
                              <div className="mt-3 p-3 bg-white border border-gray-200 rounded text-sm text-gray-700">
                                {section.content}
                              </div>
                            )}
                            
                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-500">{section.estimatedReadingTime} min read</span>
                              </div>
                              {isRead && (
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="text-sm text-green-600 font-medium">Section Read</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {!isCurrentSection && (
                            <Button
                              onClick={() => setCurrentSection(index)}
                              size="sm"
                              variant="outline"
                            >
                              Read Section
                            </Button>
                          )}
                          {isCurrentSection && !isRead && (
                            <Button
                              onClick={() => handleSectionRead(index)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Mark as Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {/* Navigation Controls */}
              <div className="flex justify-between items-center mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <Button
                  onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                  disabled={currentSection === 0}
                  variant="outline"
                  size="sm"
                >
                  ← Previous Section
                </Button>
                <span className="text-sm text-gray-600">
                  Section {currentSection + 1} of {handbookSections.length}
                </span>
                <Button
                  onClick={() => setCurrentSection(Math.min(handbookSections.length - 1, currentSection + 1))}
                  disabled={currentSection === handbookSections.length - 1}
                  variant="outline"
                  size="sm"
                >
                  Next Section →
                </Button>
              </div>
              
              {readSections.length === handbookSections.length && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Award className="w-5 h-5 text-blue-600 mt-1" />
                      <div>
                        <h4 className="font-medium text-blue-900">Handbook Review Complete!</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          You have successfully read all sections. Please provide your final acknowledgment.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="handbook-acknowledgment"
                        checked={acknowledgmentChecked}
                        onCheckedChange={(checked) => setAcknowledgmentChecked(checked === true)}
                      />
                      <label
                        htmlFor="handbook-acknowledgment"
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        I acknowledge that I have read, understood, and agree to comply with all policies and procedures 
                        outlined in the employee handbook.
                      </label>
                    </div>
                    
                    {canComplete && (
                      <Button
                        onClick={handleCompleteHandbook}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete Handbook Review
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}