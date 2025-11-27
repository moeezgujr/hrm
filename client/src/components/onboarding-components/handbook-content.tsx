import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BookOpen, CheckCircle, Clock, FileText, Users, Shield, Heart, Award } from 'lucide-react';
import { OnboardingChecklist } from '@shared/schema';

interface HandbookContentProps {
  item: OnboardingChecklist | null;
  onComplete: () => void;
}

export function HandbookContent({ item, onComplete }: HandbookContentProps) {
  const [readSections, setReadSections] = useState<{ [key: string]: boolean }>({});
  const [acknowledgedPolicies, setAcknowledgedPolicies] = useState<{ [key: string]: boolean }>({});
  const [handbookQuizAnswers, setHandbookQuizAnswers] = useState<{ [key: string]: string }>({});
  const [finalAcknowledgment, setFinalAcknowledgment] = useState('');

  const handbookSections = [
    {
      id: 'welcome',
      title: 'Welcome & Company Overview',
      icon: Heart,
      estimatedTime: '5 minutes',
      content: 'Welcome to our company! Learn about our history, mission, vision, and the values that guide our daily operations.',
      keyPoints: [
        'Company history and founding principles',
        'Mission statement and core values',
        'Organizational structure and leadership team',
        'Company culture and work environment'
      ]
    },
    {
      id: 'policies',
      title: 'HR Policies & Procedures',
      icon: Shield,
      estimatedTime: '15 minutes',
      content: 'Essential HR policies covering employment practices, workplace conduct, and employee rights.',
      keyPoints: [
        'Equal opportunity and non-discrimination policies',
        'Workplace harassment and bullying prevention',
        'Code of conduct and professional behavior',
        'Disciplinary procedures and grievance process'
      ]
    },
    {
      id: 'benefits',
      title: 'Employee Benefits & Compensation',
      icon: Award,
      estimatedTime: '10 minutes',
      content: 'Comprehensive overview of your compensation package, benefits, and employee perks.',
      keyPoints: [
        'Salary structure and payment schedules',
        'Health insurance and medical benefits',
        'Retirement plans and savings programs',
        'Paid time off and leave policies'
      ]
    },
    {
      id: 'safety',
      title: 'Workplace Safety & Security',
      icon: Shield,
      estimatedTime: '8 minutes',
      content: 'Important safety protocols, emergency procedures, and security guidelines.',
      keyPoints: [
        'Emergency evacuation procedures',
        'Workplace safety guidelines and protocols',
        'Security policies and access controls',
        'Incident reporting procedures'
      ]
    },
    {
      id: 'communication',
      title: 'Communication & Collaboration',
      icon: Users,
      estimatedTime: '7 minutes',
      content: 'Guidelines for effective communication, meeting protocols, and collaboration tools.',
      keyPoints: [
        'Communication channels and protocols',
        'Meeting etiquette and scheduling',
        'Collaboration tools and platforms',
        'Documentation and file sharing guidelines'
      ]
    }
  ];

  const criticalPolicies = [
    {
      id: 'conduct',
      title: 'Code of Conduct',
      description: 'I understand and agree to abide by the company code of conduct and professional behavior standards.'
    },
    {
      id: 'confidentiality',
      title: 'Confidentiality Agreement',
      description: 'I understand my obligations regarding confidential information and intellectual property protection.'
    },
    {
      id: 'harassment',
      title: 'Anti-Harassment Policy',
      description: 'I understand the company\'s zero-tolerance policy regarding harassment and discrimination.'
    },
    {
      id: 'safety',
      title: 'Safety Compliance',
      description: 'I understand and will comply with all workplace safety protocols and emergency procedures.'
    }
  ];

  const quizQuestions = [
    {
      id: 'values',
      question: 'What are the core values that guide our company culture?',
      options: ['Profit above all', 'Innovation, Integrity, Collaboration, Excellence, Customer Focus', 'Individual achievement only', 'Competition over cooperation'],
      correct: 1
    },
    {
      id: 'harassment',
      question: 'What should you do if you witness workplace harassment?',
      options: ['Ignore it', 'Report it immediately to HR or management', 'Handle it yourself', 'Wait and see if it continues'],
      correct: 1
    },
    {
      id: 'confidentiality',
      question: 'When can you share confidential company information?',
      options: ['With close friends', 'On social media', 'Only when authorized and necessary for work', 'Whenever you want'],
      correct: 2
    }
  ];

  const handleSectionRead = (sectionId: string) => {
    setReadSections(prev => ({ ...prev, [sectionId]: true }));
  };

  const handlePolicyAcknowledge = (policyId: string) => {
    setAcknowledgedPolicies(prev => ({ ...prev, [policyId]: !prev[policyId] }));
  };

  const handleQuizAnswer = (questionId: string, answerIndex: number) => {
    setHandbookQuizAnswers(prev => ({ ...prev, [questionId]: answerIndex.toString() }));
  };

  const getProgress = () => {
    const sectionsRead = Object.values(readSections).filter(Boolean).length;
    const policiesAcknowledged = Object.values(acknowledgedPolicies).filter(Boolean).length;
    const questionsAnswered = Object.keys(handbookQuizAnswers).length;
    
    const totalItems = handbookSections.length + criticalPolicies.length + quizQuestions.length;
    const completedItems = sectionsRead + policiesAcknowledged + questionsAnswered;
    
    return (completedItems / totalItems) * 100;
  };

  const canComplete = () => {
    const allSectionsRead = handbookSections.every(section => readSections[section.id]);
    const allPoliciesAcknowledged = criticalPolicies.every(policy => acknowledgedPolicies[policy.id]);
    const allQuestionsAnswered = quizQuestions.every(question => handbookQuizAnswers[question.id]);
    const hasAcknowledgment = finalAcknowledgment.trim().length > 0;
    
    return allSectionsRead && allPoliciesAcknowledged && allQuestionsAnswered && hasAcknowledgment;
  };

  const progress = getProgress();

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <BookOpen className="w-5 h-5" />
            <span>Employee Handbook Review Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progress: {Math.round(progress)}% Complete</span>
              <Badge variant={progress === 100 ? "default" : "secondary"}>
                {progress === 100 ? "Review Complete" : "In Progress"}
              </Badge>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Handbook Sections */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Handbook Sections</h3>
        {handbookSections.map((section) => {
          const isRead = readSections[section.id];
          const IconComponent = section.icon;
          
          return (
            <Card key={section.id} className={`${isRead ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 ${isRead ? 'text-green-600' : 'text-orange-600'}`}>
                      {isRead ? <CheckCircle className="w-6 h-6" /> : <IconComponent className="w-6 h-6" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500">{section.estimatedTime}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{section.content}</p>
                    </div>
                  </div>
                  <Badge variant={isRead ? "default" : "secondary"}>
                    {isRead ? "Read" : "Unread"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Key Topics Covered:</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {section.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`read-${section.id}`}
                      checked={isRead}
                      onCheckedChange={() => handleSectionRead(section.id)}
                    />
                    <Label htmlFor={`read-${section.id}`} className="cursor-pointer">
                      I have read and understood this section
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Critical Policy Acknowledgments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Policy Acknowledgments</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Please acknowledge your understanding of these critical company policies.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {criticalPolicies.map((policy) => {
              const isAcknowledged = acknowledgedPolicies[policy.id];
              
              return (
                <div key={policy.id} className={`p-4 border rounded-lg ${isAcknowledged ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={`policy-${policy.id}`}
                      checked={isAcknowledged}
                      onCheckedChange={() => handlePolicyAcknowledge(policy.id)}
                    />
                    <div>
                      <Label htmlFor={`policy-${policy.id}`} className="font-medium cursor-pointer">
                        {policy.title}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{policy.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Check Quiz */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Knowledge Check</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Answer these questions to confirm your understanding of key policies.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {quizQuestions.map((question, index) => (
              <div key={question.id} className="space-y-3">
                <h4 className="font-medium">{index + 1}. {question.question}</h4>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-2">
                      <Checkbox
                        id={`quiz-${question.id}-${optionIndex}`}
                        checked={handbookQuizAnswers[question.id] === optionIndex.toString()}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleQuizAnswer(question.id, optionIndex);
                          }
                        }}
                      />
                      <Label htmlFor={`quiz-${question.id}-${optionIndex}`} className="cursor-pointer text-sm">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Final Acknowledgment */}
      <Card>
        <CardHeader>
          <CardTitle>Final Acknowledgment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label htmlFor="final-acknowledgment">
              Please confirm your understanding by typing "I acknowledge" below:
            </Label>
            <Textarea
              id="final-acknowledgment"
              value={finalAcknowledgment}
              onChange={(e) => setFinalAcknowledgment(e.target.value)}
              placeholder="Type your acknowledgment here..."
              className="h-20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Complete Review Button */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            {canComplete() ? "Handbook Review Complete!" : "Complete Handbook Review"}
          </h3>
          <p className="text-green-700 mb-4">
            {canComplete() 
              ? "You have successfully reviewed all sections and acknowledged the company policies."
              : "Please complete all sections, acknowledge policies, and answer quiz questions."
            }
          </p>
          <Button
            onClick={onComplete}
            disabled={!canComplete()}
            className="bg-green-600 hover:bg-green-700"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Complete Handbook Review
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}