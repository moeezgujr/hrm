import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock,
  Video,
  FileText,
  Camera,
  Edit,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';

interface ProductionTimelineProps {
  contentItems: any[];
}

export function ContentProductionTimeline({ contentItems }: ProductionTimelineProps) {
  // Calculate production timeline for video content
  const getProductionStages = (contentItem: any) => {
    if (contentItem.contentType !== 'video_content') return [];
    
    const publishDate = new Date(contentItem.scheduledDate);
    
    return [
      {
        stage: 'Script Writing',
        dueDate: subDays(publishDate, 14),
        status: 'completed',
        assignee: 'Content Writer',
        duration: '2-3 days'
      },
      {
        stage: 'Storyboard & Planning',
        dueDate: subDays(publishDate, 12),
        status: 'completed',
        assignee: 'Creative Director',
        duration: '1-2 days'
      },
      {
        stage: 'Video Production',
        dueDate: subDays(publishDate, 10),
        status: 'in_progress',
        assignee: 'Video Producer',
        duration: '3-4 days'
      },
      {
        stage: 'Post-Production & Editing',
        dueDate: subDays(publishDate, 6),
        status: 'pending',
        assignee: 'Video Editor',
        duration: '2-3 days'
      },
      {
        stage: 'Review & Approval',
        dueDate: subDays(publishDate, 3),
        status: 'pending',
        assignee: 'Content Manager',
        duration: '1-2 days'
      },
      {
        stage: 'Final Upload & Scheduling',
        dueDate: subDays(publishDate, 1),
        status: 'pending',
        assignee: 'Social Media Specialist',
        duration: '1 day'
      },
      {
        stage: 'Publication',
        dueDate: publishDate,
        status: 'scheduled',
        assignee: 'Automated',
        duration: '0 days'
      }
    ];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const videoContent = contentItems.filter(item => item.contentType === 'video_content');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Video Production Timeline</h2>
          <p className="text-gray-600">Track video content from concept to publication</p>
        </div>
      </div>

      {videoContent.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Video Content Scheduled</h3>
            <p className="text-gray-500 mb-4">Create video content to see production timelines</p>
            <Button>
              <Video className="h-4 w-4 mr-2" />
              Schedule Video Content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {videoContent.map((content) => {
            const stages = getProductionStages(content);
            
            return (
              <Card key={content.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Video className="h-5 w-5" />
                        <span>{content.title}</span>
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Target Publication: {format(new Date(content.scheduledDate), 'MMM d, yyyy h:mm a')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Platform: {content.platform}
                      </p>
                    </div>
                    <Badge className={getStatusColor(content.status)}>
                      {content.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {stages.map((stage, index) => (
                      <div key={stage.stage} className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {getStatusIcon(stage.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {stage.stage}
                              </p>
                              <p className="text-sm text-gray-500">
                                Due: {format(stage.dueDate, 'MMM d, yyyy')} • {stage.duration}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <User className="h-3 w-3" />
                                <span>{stage.assignee}</span>
                              </div>
                              <Badge className={`text-xs ${getStatusColor(stage.status)}`}>
                                {stage.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Production started {stages.length > 0 ? format(stages[0].dueDate, 'MMM d') : ''} • 
                        Estimated completion {format(new Date(content.scheduledDate), 'MMM d')}
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Update Timeline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Content Team Coordination</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">Script & Planning</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Scripts and storyboards need to be ready 2 weeks before publication
              </p>
              <Button variant="outline" size="sm" className="w-full">
                View Scripts
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Camera className="h-5 w-5 text-green-500" />
                <h3 className="font-medium">Production Schedule</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Video shooting and recording schedule with team availability
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Book Studio Time
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Video className="h-5 w-5 text-purple-500" />
                <h3 className="font-medium">Post-Production</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Video editing and final review process management
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Edit Queue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}