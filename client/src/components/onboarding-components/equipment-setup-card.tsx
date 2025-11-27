import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, Monitor, Wifi, Key, Smartphone, Headphones } from 'lucide-react';
import { OnboardingChecklist } from '@shared/schema';

interface EquipmentSetupCardProps {
  item: OnboardingChecklist;
  onToggleComplete: (id: number, isCompleted: boolean) => void;
}

const equipmentItems = [
  {
    id: 'laptop',
    title: "Laptop/Computer Setup",
    description: "Receive and configure your assigned laptop with necessary software",
    icon: Monitor,
    steps: ["Receive laptop", "Initial setup", "Install required software", "Set up user account"]
  },
  {
    id: 'network',
    title: "Network Access",
    description: "Configure WiFi, VPN, and network permissions",
    icon: Wifi,
    steps: ["Connect to company WiFi", "Install VPN client", "Test network access", "Configure email client"]
  },
  {
    id: 'access_cards',
    title: "Access Cards & Keys",
    description: "Receive building access cards and office keys",
    icon: Key,
    steps: ["Receive building access card", "Test card access", "Receive office/desk keys", "Security briefing"]
  },
  {
    id: 'phone',
    title: "Phone Setup",
    description: "Configure office phone and mobile device if applicable",
    icon: Smartphone,
    steps: ["Set up desk phone", "Configure voicemail", "Mobile device setup", "Contact directory access"]
  },
  {
    id: 'accessories',
    title: "Accessories & Peripherals",
    description: "Receive additional equipment like headsets, monitors, etc.",
    icon: Headphones,
    steps: ["Receive accessories", "Set up additional monitors", "Configure peripherals", "Ergonomic adjustments"]
  }
];

export function EquipmentSetupCard({ item, onToggleComplete }: EquipmentSetupCardProps) {
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [completedItems, setCompletedItems] = useState<Record<string, boolean[]>>({});

  const handleStepComplete = (itemId: string, stepIndex: number, completed: boolean) => {
    setCompletedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [stepIndex]: completed
      }
    }));
  };

  const isItemComplete = (itemId: string) => {
    const item = equipmentItems.find(eq => eq.id === itemId);
    if (!item) return false;
    
    const completedSteps = completedItems[itemId] || {};
    return item.steps.every((_, index) => completedSteps[index] === true);
  };

  const getCompletedItemsCount = () => {
    return equipmentItems.filter(item => isItemComplete(item.id)).length;
  };

  const allItemsCompleted = getCompletedItemsCount() === equipmentItems.length;

  const handleCompleteSetup = () => {
    onToggleComplete(item.id, true);
    setShowSetupModal(false);
  };

  return (
    <>
      <Card className="border border-indigo-200 bg-indigo-50/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`mt-1 ${item.isCompleted ? 'text-green-600' : 'text-indigo-600'}`}>
                {item.isCompleted ? <CheckCircle className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.itemTitle}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                
                {item.isCompleted ? (
                  <div className="mt-3 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Equipment Setup Complete</span>
                    {item.completedAt && (
                      <span className="text-xs text-gray-500">
                        on {new Date(item.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="mb-3">
                      <span className="text-sm text-indigo-600">
                        {equipmentItems.length} equipment categories to configure
                      </span>
                    </div>
                    <Button
                      onClick={() => setShowSetupModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Monitor className="w-4 h-4 mr-2" />
                      Start Equipment Setup
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

      <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="equipment-description">
          <DialogHeader>
            <DialogTitle>Equipment Setup Checklist</DialogTitle>
            <p id="equipment-description" className="text-sm text-gray-600 mt-2">
              Complete all equipment setup tasks to fulfill this onboarding requirement.
              Progress: {getCompletedItemsCount()}/{equipmentItems.length} categories completed.
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            {equipmentItems.map((equipmentItem) => {
              const ItemIcon = equipmentItem.icon;
              const itemCompleted = isItemComplete(equipmentItem.id);
              
              return (
                <Card key={equipmentItem.id} className={`border ${
                  itemCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`mt-1 ${itemCompleted ? 'text-green-600' : 'text-indigo-600'}`}>
                        {itemCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <ItemIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{equipmentItem.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{equipmentItem.description}</p>
                        
                        <div className="mt-3 space-y-2">
                          {equipmentItem.steps.map((step, stepIndex) => {
                            const stepCompleted = completedItems[equipmentItem.id]?.[stepIndex] || false;
                            
                            return (
                              <div key={stepIndex} className="flex items-center space-x-3">
                                <Checkbox
                                  id={`${equipmentItem.id}-step-${stepIndex}`}
                                  checked={stepCompleted}
                                  onCheckedChange={(checked) => 
                                    handleStepComplete(equipmentItem.id, stepIndex, checked === true)
                                  }
                                />
                                <label
                                  htmlFor={`${equipmentItem.id}-step-${stepIndex}`}
                                  className={`text-sm ${
                                    stepCompleted ? 'line-through text-gray-500' : 'text-gray-700'
                                  }`}
                                >
                                  {step}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                        
                        {itemCompleted && (
                          <div className="mt-3 flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">Category Complete</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {allItemsCompleted && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">All equipment setup completed!</span>
                  </div>
                  <Button
                    onClick={handleCompleteSetup}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Setup
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