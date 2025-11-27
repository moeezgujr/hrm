import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, CheckCircle, Clock, FileText, Video, Users } from 'lucide-react';
import { OnboardingChecklist } from '@shared/schema';

interface TrainingModuleContentProps {
  item: OnboardingChecklist | null;
  onComplete: () => void;
}

export function TrainingModuleContent({ item, onComplete }: TrainingModuleContentProps) {
  const [currentModule, setCurrentModule] = useState(0);
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: string }>({});

  const trainingModules = [
    {
      id: 1,
      title: "Company Culture & Values",
      type: "video",
      duration: "15 minutes",
      description: "Learn about our company mission, vision, and core values that guide our daily operations.",
      content: "Our company is built on five core values: Innovation, Integrity, Collaboration, Excellence, and Customer Focus. These values shape every decision we make and every interaction we have.",
      quiz: {
        question: "Which of the following is NOT one of our core company values?",
        options: ["Innovation", "Competition", "Integrity", "Excellence"],
        correct: 1
      }
    },
    {
      id: 2,
      title: "Workplace Safety Guidelines",
      type: "document",
      duration: "10 minutes",
      description: "Essential safety protocols and emergency procedures for all employees.",
      content: "Safety is our top priority. Always report hazards immediately, use proper PPE when required, know emergency exits, and follow the buddy system for dangerous tasks.",
      quiz: {
        question: "What should you do if you notice a safety hazard?",
        options: ["Ignore it if it's small", "Report it immediately", "Fix it yourself", "Tell a colleague later"],
        correct: 1
      }
    },
    {
      id: 3,
      title: "Communication Protocols",
      type: "interactive",
      duration: "8 minutes",
      description: "Learn effective communication channels and professional etiquette.",
      content: "Use email for formal communication, Slack for quick updates, schedule meetings for complex discussions, and always be respectful and professional in all interactions.",
      quiz: {
        question: "What is the preferred channel for quick team updates?",
        options: ["Email", "Slack", "Phone calls", "In-person meetings"],
        correct: 1
      }
    }
  ];

  const handleModuleComplete = (moduleId: number) => {
    if (!completedModules.includes(moduleId)) {
      setCompletedModules([...completedModules, moduleId]);
    }
  };

  const handleQuizAnswer = (moduleId: number, answerIndex: number) => {
    setQuizAnswers({ ...quizAnswers, [moduleId]: answerIndex.toString() });
  };

  const canCompleteTraining = () => {
    return completedModules.length === trainingModules.length && 
           Object.keys(quizAnswers).length === trainingModules.length;
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      case 'interactive': return <Users className="w-5 h-5" />;
      default: return <PlayCircle className="w-5 h-5" />;
    }
  };

  const progress = (completedModules.length / trainingModules.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Training Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Completed: {completedModules.length} of {trainingModules.length} modules</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Training Modules */}
      <div className="space-y-4">
        {trainingModules.map((module, index) => {
          const isCompleted = completedModules.includes(module.id);
          const isActive = currentModule === index;
          
          return (
            <Card key={module.id} className={`${isActive ? 'ring-2 ring-blue-500' : ''} ${isCompleted ? 'bg-green-50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : getModuleIcon(module.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="secondary">{module.type}</Badge>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{module.duration}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{module.description}</p>
                    </div>
                  </div>
                  <Badge variant={isCompleted ? "default" : "secondary"}>
                    {isCompleted ? "Completed" : "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              
              {isActive && (
                <CardContent>
                  <div className="space-y-4">
                    {/* Module Content */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Module Content:</h4>
                      <p className="text-gray-700">{module.content}</p>
                    </div>

                    {/* Quiz Section */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-3">Knowledge Check:</h4>
                      <p className="mb-3">{module.quiz.question}</p>
                      <div className="space-y-2">
                        {module.quiz.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <Checkbox
                              id={`quiz-${module.id}-${optionIndex}`}
                              checked={quizAnswers[module.id] === optionIndex.toString()}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleQuizAnswer(module.id, optionIndex);
                                }
                              }}
                            />
                            <label 
                              htmlFor={`quiz-${module.id}-${optionIndex}`}
                              className="text-sm cursor-pointer"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentModule(Math.max(0, currentModule - 1))}
                        disabled={currentModule === 0}
                      >
                        Previous
                      </Button>
                      <div className="space-x-2">
                        <Button
                          onClick={() => handleModuleComplete(module.id)}
                          disabled={!quizAnswers[module.id] || isCompleted}
                          variant={isCompleted ? "secondary" : "default"}
                        >
                          {isCompleted ? "Completed" : "Mark Complete"}
                        </Button>
                        {currentModule < trainingModules.length - 1 && (
                          <Button
                            onClick={() => setCurrentModule(currentModule + 1)}
                            disabled={!isCompleted}
                          >
                            Next Module
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
              
              {!isActive && (
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentModule(index)}
                    disabled={isCompleted}
                  >
                    {isCompleted ? "Review Module" : "Start Module"}
                  </Button>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Complete Training Button */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            {canCompleteTraining() ? "Training Completed!" : "Complete All Modules"}
          </h3>
          <p className="text-green-700 mb-4">
            {canCompleteTraining() 
              ? "You have successfully completed all training modules and assessments."
              : "Finish all modules and knowledge checks to complete your training."
            }
          </p>
          <Button
            onClick={onComplete}
            disabled={!canCompleteTraining()}
            className="bg-green-600 hover:bg-green-700"
          >
            Complete Training
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}