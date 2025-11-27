import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Monitor, Keyboard, Mouse, Headphones, CheckCircle, AlertTriangle, Wifi, Shield } from 'lucide-react';
import { OnboardingChecklist } from '@shared/schema';

interface EquipmentSetupContentProps {
  item: OnboardingChecklist | null;
  onComplete: () => void;
}

export function EquipmentSetupContent({ item, onComplete }: EquipmentSetupContentProps) {
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [notes, setNotes] = useState('');

  const equipmentItems = [
    {
      id: 'laptop',
      icon: Monitor,
      title: 'Laptop/Desktop Setup',
      description: 'Receive and configure your assigned computer',
      tasks: [
        'Laptop/desktop received and powered on',
        'Operating system setup completed',
        'Company email account configured',
        'VPN access established and tested',
        'Essential software installed (Office, Teams, etc.)'
      ]
    },
    {
      id: 'peripherals',
      icon: Keyboard,
      title: 'Peripherals & Accessories',
      description: 'Set up keyboard, mouse, and other accessories',
      tasks: [
        'Keyboard connected and functional',
        'Mouse connected and configured',
        'Monitor(s) connected and properly positioned',
        'Webcam and microphone tested',
        'Ergonomic setup adjusted (chair, desk height)'
      ]
    },
    {
      id: 'network',
      icon: Wifi,
      title: 'Network & Security',
      description: 'Configure network access and security settings',
      tasks: [
        'Wireless network access configured',
        'Company firewall and security policies applied',
        'Two-factor authentication enabled',
        'Password manager installed and configured',
        'Security awareness training completed'
      ]
    },
    {
      id: 'software',
      icon: Shield,
      title: 'Software & Applications',
      description: 'Install and configure required business applications',
      tasks: [
        'Project management tools installed',
        'Communication apps (Slack, Teams) configured',
        'Development tools installed (if applicable)',
        'Cloud storage access configured',
        'Backup solution configured and tested'
      ]
    }
  ];

  const handleItemCheck = (categoryId: string, taskIndex: number) => {
    const key = `${categoryId}-${taskIndex}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getCategoryProgress = (categoryId: string, tasksCount: number) => {
    const checkedCount = Array.from({ length: tasksCount }, (_, i) => 
      checkedItems[`${categoryId}-${i}`]
    ).filter(Boolean).length;
    return (checkedCount / tasksCount) * 100;
  };

  const getTotalProgress = () => {
    const totalTasks = equipmentItems.reduce((sum, item) => sum + item.tasks.length, 0);
    const completedTasks = Object.values(checkedItems).filter(Boolean).length;
    return (completedTasks / totalTasks) * 100;
  };

  const canComplete = () => {
    return getTotalProgress() >= 90; // Allow completion at 90% to account for optional items
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-indigo-800">
            <Monitor className="w-5 h-5" />
            <span>IT Equipment Setup Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-indigo-700">Overall Progress: {Math.round(getTotalProgress())}%</span>
            <Badge variant={canComplete() ? "default" : "secondary"}>
              {canComplete() ? "Ready to Complete" : "In Progress"}
            </Badge>
          </div>
          <div className="w-full bg-indigo-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getTotalProgress()}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Equipment Categories */}
      <div className="space-y-4">
        {equipmentItems.map((category) => {
          const progress = getCategoryProgress(category.id, category.tasks.length);
          const isComplete = progress === 100;
          const IconComponent = category.icon;

          return (
            <Card key={category.id} className={`${isComplete ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 ${isComplete ? 'text-green-600' : 'text-indigo-600'}`}>
                      {isComplete ? <CheckCircle className="w-6 h-6" /> : <IconComponent className="w-6 h-6" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress: {Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isComplete ? 'bg-green-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge variant={isComplete ? "default" : "secondary"}>
                    {isComplete ? "Complete" : "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {category.tasks.map((task, taskIndex) => {
                    const isChecked = checkedItems[`${category.id}-${taskIndex}`] || false;
                    
                    return (
                      <div key={taskIndex} className="flex items-center space-x-3">
                        <Checkbox
                          id={`${category.id}-${taskIndex}`}
                          checked={isChecked}
                          onCheckedChange={() => handleItemCheck(category.id, taskIndex)}
                        />
                        <label 
                          htmlFor={`${category.id}-${taskIndex}`}
                          className={`text-sm cursor-pointer flex-1 ${
                            isChecked ? 'line-through text-gray-500' : 'text-gray-700'
                          }`}
                        >
                          {task}
                        </label>
                        {isChecked && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Support Information */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Need IT Support?</h4>
              <p className="text-sm text-yellow-700 mt-1">
                If you encounter any issues during setup, contact IT Support at:
                <br />
                📧 it-support@company.com | 📞 ext. 1234 | 💬 #it-help Slack channel
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about your equipment setup, issues encountered, or special requirements..."
            className="w-full p-3 border rounded-md resize-none h-24"
          />
        </CardContent>
      </Card>

      {/* Complete Setup Button */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            {canComplete() ? "Setup Complete!" : "Complete Equipment Setup"}
          </h3>
          <p className="text-green-700 mb-4">
            {canComplete() 
              ? "Your IT equipment has been successfully configured and is ready for use."
              : `Complete ${Math.round((100 - getTotalProgress()))}% more items to finish your setup.`
            }
          </p>
          <Button
            onClick={onComplete}
            disabled={!canComplete()}
            className="bg-green-600 hover:bg-green-700"
          >
            Confirm Equipment Setup Complete
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}