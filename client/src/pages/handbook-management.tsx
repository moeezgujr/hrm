import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, Plus, Upload, Edit, Trash2, FileText, Users, 
  CheckCircle, Clock, HelpCircle, Save, Eye, Settings 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const handbookSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  version: z.string().min(1, 'Version is required')
});

const sectionSchema = z.object({
  title: z.string().min(2, 'Section title is required'),
  content: z.string().min(20, 'Section content must be at least 20 characters'),
  estimatedReadingTime: z.number().min(1).max(60)
});

const quizQuestionSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters'),
  optionA: z.string().min(2, 'Option A is required'),
  optionB: z.string().min(2, 'Option B is required'),
  optionC: z.string().min(2, 'Option C is required'),
  optionD: z.string().min(2, 'Option D is required'),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(10, 'Explanation is required')
});

type HandbookData = z.infer<typeof handbookSchema>;
type SectionData = z.infer<typeof sectionSchema>;
type QuizQuestionData = z.infer<typeof quizQuestionSchema>;

export default function HandbookManagement() {
  const [showHandbookModal, setShowHandbookModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedHandbook, setSelectedHandbook] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [editingHandbook, setEditingHandbook] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch handbooks
  const { data: handbooks = [], isLoading } = useQuery({
    queryKey: ['/api/handbooks'],
  });

  // Fetch sections for selected handbook
  const { data: sections = [] } = useQuery({
    queryKey: ['/api/handbooks', selectedHandbook?.id, 'sections'],
    enabled: !!selectedHandbook?.id,
  });

  // Fetch quiz questions for selected section
  const { data: quizQuestions = [] } = useQuery({
    queryKey: ['/api/handbooks', selectedSection?.id, 'quiz'],
    enabled: !!selectedSection?.id,
  });

  const handbookForm = useForm<HandbookData>({
    resolver: zodResolver(handbookSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      version: '1.0'
    }
  });

  const sectionForm = useForm<SectionData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      title: '',
      content: '',
      estimatedReadingTime: 5
    }
  });

  const quizForm = useForm<QuizQuestionData>({
    resolver: zodResolver(quizQuestionSchema),
    defaultValues: {
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: ''
    }
  });

  // Create/Update handbook
  const createHandbookMutation = useMutation({
    mutationFn: async (data: HandbookData) => {
      if (editingHandbook) {
        return await apiRequest('PUT', `/api/handbooks/${editingHandbook.id}`, data);
      }
      return await apiRequest('POST', '/api/handbooks', data);
    },
    onSuccess: () => {
      toast({
        title: "Handbook Saved",
        description: editingHandbook ? "Handbook updated successfully" : "New handbook created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/handbooks'] });
      setShowHandbookModal(false);
      setEditingHandbook(null);
      handbookForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save handbook",
        variant: "destructive",
      });
    },
  });

  // Create section
  const createSectionMutation = useMutation({
    mutationFn: async (data: SectionData & { handbookId: number }) => {
      return await apiRequest('POST', `/api/handbooks/${data.handbookId}/sections`, data);
    },
    onSuccess: () => {
      toast({
        title: "Section Added",
        description: "New section added to handbook successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/handbooks', selectedHandbook?.id, 'sections'] });
      setShowSectionModal(false);
      sectionForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save section",
        variant: "destructive",
      });
    },
  });

  // Create quiz question
  const createQuizMutation = useMutation({
    mutationFn: async (data: QuizQuestionData & { sectionId: number; handbookId: number }) => {
      return await apiRequest('POST', `/api/handbooks/quiz`, data);
    },
    onSuccess: () => {
      toast({
        title: "Quiz Question Added",
        description: "New quiz question created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/handbooks', selectedSection?.id, 'quiz'] });
      setShowQuizModal(false);
      quizForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save quiz question",
        variant: "destructive",
      });
    },
  });

  // Delete handbook
  const deleteHandbookMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/handbooks/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Handbook Deleted",
        description: "Handbook and all associated data deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/handbooks'] });
      setSelectedHandbook(null);
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete handbook",
        variant: "destructive",
      });
    },
  });

  const handleEditHandbook = (handbook: any) => {
    setEditingHandbook(handbook);
    handbookForm.reset({
      title: handbook.title,
      description: handbook.description,
      content: handbook.content,
      version: handbook.version
    });
    setShowHandbookModal(true);
  };

  const handleDeleteHandbook = (handbook: any) => {
    if (window.confirm(`Are you sure you want to delete "${handbook.title}"? This will remove all sections and quiz questions.`)) {
      deleteHandbookMutation.mutate(handbook.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Handbook Management</h1>
          <p className="text-gray-600">Create and manage company handbooks with automated quizzes</p>
        </div>
        <Button onClick={() => setShowHandbookModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Handbook
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Handbooks List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Handbooks ({handbooks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {handbooks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No handbooks created yet</p>
            ) : (
              handbooks.map((handbook: any) => (
                <div
                  key={handbook.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedHandbook?.id === handbook.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedHandbook(handbook)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{handbook.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{handbook.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary">v{handbook.version}</Badge>
                        {handbook.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditHandbook(handbook);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHandbook(handbook);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Sections Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Sections
              </div>
              {selectedHandbook && (
                <Button 
                  size="sm" 
                  onClick={() => setShowSectionModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedHandbook ? (
              <p className="text-gray-500 text-center py-4">Select a handbook to view sections</p>
            ) : sections.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No sections created yet</p>
            ) : (
              <div className="space-y-3">
                {sections.map((section: any) => (
                  <div
                    key={section.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSection?.id === section.id 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedSection(section)}
                  >
                    <h4 className="font-medium text-gray-900">{section.title}</h4>
                    <div className="flex items-center space-x-2 mt-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{section.estimatedReadingTime} min read</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <HelpCircle className="w-5 h-5 mr-2" />
                Quiz Questions
              </div>
              {selectedSection && (
                <Button 
                  size="sm" 
                  onClick={() => setShowQuizModal(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedSection ? (
              <p className="text-gray-500 text-center py-4">Select a section to view quiz questions</p>
            ) : quizQuestions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No quiz questions created yet</p>
            ) : (
              <div className="space-y-3">
                {quizQuestions.map((question: any, index: number) => (
                  <div key={question.id} className="p-3 border rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">
                      {index + 1}. {question.question}
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className={question.correctAnswer === 'A' ? 'text-green-600 font-medium' : 'text-gray-600'}>
                        A) {question.optionA}
                      </div>
                      <div className={question.correctAnswer === 'B' ? 'text-green-600 font-medium' : 'text-gray-600'}>
                        B) {question.optionB}
                      </div>
                      <div className={question.correctAnswer === 'C' ? 'text-green-600 font-medium' : 'text-gray-600'}>
                        C) {question.optionC}
                      </div>
                      <div className={question.correctAnswer === 'D' ? 'text-green-600 font-medium' : 'text-gray-600'}>
                        D) {question.optionD}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Handbook Modal */}
      <Dialog open={showHandbookModal} onOpenChange={setShowHandbookModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingHandbook ? 'Edit Handbook' : 'Create New Handbook'}</DialogTitle>
          </DialogHeader>
          
          <Form {...handbookForm}>
            <form onSubmit={handbookForm.handleSubmit((data) => createHandbookMutation.mutate(data))} className="space-y-4">
              <FormField
                control={handbookForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Handbook Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Employee Handbook 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={handbookForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of what this handbook covers..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={handbookForm.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version</FormLabel>
                    <FormControl>
                      <Input placeholder="1.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={handbookForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Introduction Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Welcome message and general introduction to the handbook..."
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowHandbookModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createHandbookMutation.isPending}>
                  {createHandbookMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingHandbook ? 'Update' : 'Create'} Handbook
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Section Modal */}
      <Dialog open={showSectionModal} onOpenChange={setShowSectionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Section to {selectedHandbook?.title}</DialogTitle>
          </DialogHeader>
          
          <Form {...sectionForm}>
            <form onSubmit={sectionForm.handleSubmit((data) => 
              createSectionMutation.mutate({ ...data, handbookId: selectedHandbook.id })
            )} className="space-y-4">
              <FormField
                control={sectionForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Code of Conduct" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={sectionForm.control}
                name="estimatedReadingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Reading Time (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="60" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={sectionForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed content for this section..."
                        rows={8}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowSectionModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSectionMutation.isPending}>
                  {createSectionMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Add Section
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Quiz Question Modal */}
      <Dialog open={showQuizModal} onOpenChange={setShowQuizModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Quiz Question for {selectedSection?.title}</DialogTitle>
          </DialogHeader>
          
          <Form {...quizForm}>
            <form onSubmit={quizForm.handleSubmit((data) => 
              createQuizMutation.mutate({ 
                ...data, 
                sectionId: selectedSection.id,
                handbookId: selectedHandbook.id 
              })
            )} className="space-y-4">
              <FormField
                control={quizForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What is the company policy on..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={quizForm.control}
                  name="optionA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Option A</FormLabel>
                      <FormControl>
                        <Input placeholder="First option..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={quizForm.control}
                  name="optionB"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Option B</FormLabel>
                      <FormControl>
                        <Input placeholder="Second option..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={quizForm.control}
                  name="optionC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Option C</FormLabel>
                      <FormControl>
                        <Input placeholder="Third option..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={quizForm.control}
                  name="optionD"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Option D</FormLabel>
                      <FormControl>
                        <Input placeholder="Fourth option..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={quizForm.control}
                name="correctAnswer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correct Answer</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">Option A</SelectItem>
                        <SelectItem value="B">Option B</SelectItem>
                        <SelectItem value="C">Option C</SelectItem>
                        <SelectItem value="D">Option D</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={quizForm.control}
                name="explanation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explanation</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explain why this is the correct answer..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowQuizModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createQuizMutation.isPending}>
                  {createQuizMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Add Question
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}