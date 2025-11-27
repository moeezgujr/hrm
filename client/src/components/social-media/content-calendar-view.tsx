import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  CalendarDays,
  Clock,
  Video,
  FileText,
  Image,
  Users,
  AlertCircle,
  CheckCircle,
  Edit,
  Plus,
  MessageSquare,
  Trash2
} from 'lucide-react';
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface ContentItem {
  id: number;
  title: string;
  contentType: string;
  platform: string;
  scheduledDate: string;
  status: string;
  assignedTo?: number;
  hashtags?: string;
  description?: string;
  content?: string;
}

interface ContentCalendarViewProps {
  contentItems: ContentItem[];
  onEditContent?: (content: ContentItem) => void;
  onDeleteContent?: (contentId: number) => void;
}

export function ContentCalendarView({ contentItems, onEditContent, onDeleteContent }: ContentCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video_content':
        return <Video className="h-4 w-4" />;
      case 'social_media_post':
        return <MessageSquare className="h-4 w-4" />;
      case 'blog_article':
        return <FileText className="h-4 w-4" />;
      case 'graphic_design':
        return <Image className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContentForDate = (date: Date) => {
    return contentItems.filter(item => 
      item.scheduledDate && isSameDay(new Date(item.scheduledDate), date)
    );
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();
    
    return (
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayContent = getContentForDate(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={day.toISOString()} className="min-h-48">
              <div className={`p-3 rounded-lg border ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`font-medium ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                    {format(day, 'EEE d')}
                  </h3>
                  {isToday && <Badge variant="outline" className="text-xs">Today</Badge>}
                </div>
                
                <div className="space-y-2">
                  {dayContent.map((content) => (
                    <div
                      key={content.id}
                      className="p-2 rounded border bg-white hover:shadow-sm hover:border-blue-300 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2 flex-1">
                          <div className="p-1 rounded bg-blue-100">
                            {getContentTypeIcon(content.contentType)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {content.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {content.platform}
                            </p>
                            <p className="text-xs text-gray-500">
                              {content.scheduledDate ? format(new Date(content.scheduledDate), 'h:mm a') : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge className={`text-xs ${getStatusColor(content.status)}`}>
                          {content.status}
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditContent?.(content);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteContent?.(content.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {dayContent.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-400 mb-2">No content scheduled</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-6 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Could trigger content creation for this specific date
                          console.log('Add content for date:', format(day, 'yyyy-MM-dd'));
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>
              Content for {format(selectedDate, 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getContentForDate(selectedDate).map((content) => (
                <div
                  key={content.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="p-2 rounded bg-blue-100">
                        {getContentTypeIcon(content.contentType)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{content.title}</h4>
                        <p className="text-sm text-gray-600">{content.platform}</p>
                        <p className="text-sm text-gray-500">
                          {content.scheduledDate ? format(new Date(content.scheduledDate), 'h:mm a') : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className={getStatusColor(content.status)}>
                        {content.status}
                      </Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onEditContent?.(content)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          onClick={() => onDeleteContent?.(content.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {content.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {content.description}
                    </p>
                  )}
                </div>
              ))}
              
              {getContentForDate(selectedDate).length === 0 && (
                <div className="text-center py-8">
                  <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No content scheduled for this date</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Content
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Quick Tutorial Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">How to Use Content Calendar</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Create Content:</strong> Click "Create Content" button above to add new posts</p>
                <p>• <strong>Edit Content:</strong> Click on any content card to edit title, description, scheduling, and platforms</p>
                <p>• <strong>Schedule Content:</strong> Set specific dates and times for automatic posting</p>
                <p>• <strong>Track Status:</strong> Monitor content from draft → review → approved → scheduled</p>
                <p>• <strong>View Modes:</strong> Switch between Week and Month views to see your content schedule</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header with View Toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Content Calendar</h2>
          <p className="text-gray-600">Plan and coordinate content delivery schedules</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Week View
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Month View
          </Button>
        </div>
      </div>

      {/* Navigation */}
      {viewMode === 'week' && (
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 7);
                setSelectedDate(newDate);
              }}
            >
              Previous Week
            </Button>
            <h3 className="text-lg font-medium">
              {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')} - {' '}
              {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}
            </h3>
            <Button
              variant="outline"
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 7);
                setSelectedDate(newDate);
              }}
            >
              Next Week
            </Button>
          </div>
          
          <Button onClick={() => setSelectedDate(new Date())}>
            Today
          </Button>
        </div>
      )}

      {/* Content Calendar Display */}
      {viewMode === 'week' ? renderWeekView() : renderMonthView()}

      {/* Content Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Production Pipeline Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Draft</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {contentItems.filter(item => item.status === 'draft').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">In Review</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {contentItems.filter(item => item.status === 'in_review').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {contentItems.filter(item => item.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Scheduled</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {contentItems.filter(item => item.status === 'scheduled').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}