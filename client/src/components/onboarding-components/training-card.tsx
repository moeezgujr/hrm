import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, BookOpen, PlayCircle, Clock, CheckSquare } from 'lucide-react';
import { OnboardingChecklist } from '@shared/schema';

interface TrainingCardProps {
  item: OnboardingChecklist;
  onToggleComplete: (id: number, isCompleted: boolean) => void;
}

const trainingModules = [
  {
    title: "Company Overview & Culture",
    duration: "15 minutes",
    description: "Learn about our company history, mission, values, and workplace culture"
  },
  {
    title: "Workplace Safety Guidelines",
    duration: "20 minutes", 
    description: "Essential safety protocols, emergency procedures, and health regulations"
  },
  {
    title: "IT Security & Data Protection",
    duration: "25 minutes",
    description: "Cybersecurity best practices, password policies, and data handling procedures"
  },
  {
    title: "HR Policies & Code of Conduct",
    duration: "30 minutes",
    description: "Employee handbook, behavioral expectations, and compliance requirements"
  },
  {
    title: "Department-Specific Training",
    duration: "45 minutes",
    description: "Role-specific procedures, tools, and departmental workflows"
  }
];

export function TrainingCard({ item, onToggleComplete }: TrainingCardProps) {
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [completedModules, setCompletedModules] = useState<number[]>([]);

  const handleModuleComplete = (moduleIndex: number) => {
    if (!completedModules.includes(moduleIndex)) {
      setCompletedModules([...completedModules, moduleIndex]);
    }
  };

  const handleCompleteTraining = () => {
    onToggleComplete(item.id, true);
    setShowTrainingModal(false);
  };

  const allModulesCompleted = completedModules.length === trainingModules.length;

  return (
    <>
      <Card className="border border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`mt-1 ${item.isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                {item.isCompleted ? <CheckCircle className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.itemTitle}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                
                {item.isCompleted ? (
                  <div className="mt-3 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Training Completed</span>
                    {item.completedAt && (
                      <span className="text-xs text-gray-500">
                        on {new Date(item.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-600">Estimated time: 2-3 hours total</span>
                    </div>
                    <Button
                      onClick={() => setShowTrainingModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Start Training Modules
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

      <Dialog open={showTrainingModal} onOpenChange={setShowTrainingModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="training-description">
          <DialogHeader>
            <DialogTitle>Training Modules</DialogTitle>
            <p id="training-description" className="text-sm text-gray-600 mt-2">
              Complete all training modules to fulfill this onboarding requirement.
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            {trainingModules.map((module, index) => (
              <Card key={index} className={`border ${
                completedModules.includes(index) ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`mt-1 ${
                        completedModules.includes(index) ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {completedModules.includes(index) ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <PlayCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{module.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-blue-600 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {module.duration}
                          </span>
                          {completedModules.includes(index) && (
                            <span className="text-sm text-green-600 flex items-center">
                              <CheckSquare className="w-4 h-4 mr-1" />
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!completedModules.includes(index) && (
                      <Button
                        onClick={() => handleModuleComplete(index)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Start Module
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {allModulesCompleted && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">All modules completed!</span>
                  </div>
                  <Button
                    onClick={handleCompleteTraining}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Complete Training
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}