import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Camera, Upload, User, Crop, RotateCw, Image as ImageIcon } from 'lucide-react';
import { OnboardingChecklist } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ProfilePictureCardProps {
  item: OnboardingChecklist;
  employeeId: number;
  onToggleComplete: (id: number, isCompleted: boolean) => void;
}

export function ProfilePictureCard({ item, employeeId, onToggleComplete }: ProfilePictureCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (imageData: string) => {
      return await apiRequest('PUT', `/api/employees/${employeeId}/profile-picture`, {
        profileImage: imageData
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been successfully uploaded.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/personal-profile/${employeeId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-onboarding'] });
      onToggleComplete(item.id, true);
      setShowModal(false);
      setSelectedImage(null);
      setPreviewImage(null);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile picture.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, etc.).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setSelectedImage(imageData);
      setPreviewImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!selectedImage) return;
    setIsUploading(true);
    uploadMutation.mutate(selectedImage);
  };

  const handleRetake = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Card className="border border-cyan-200 bg-cyan-50/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`mt-1 ${item.isCompleted ? 'text-green-600' : 'text-cyan-600'}`}>
                {item.isCompleted ? <CheckCircle className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.itemTitle}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                
                {item.isCompleted ? (
                  <div className="mt-3 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Profile Picture Added</span>
                    {item.completedAt && (
                      <span className="text-xs text-gray-500">
                        on {new Date(item.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="flex items-center space-x-4 mb-3 text-sm text-cyan-700">
                      <div className="flex items-center space-x-1">
                        <ImageIcon className="w-4 h-4" />
                        <span>Professional headshot recommended</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>Max 2MB</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowModal(true)}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Profile Picture
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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl" aria-describedby="profile-picture-description">
          <DialogHeader>
            <DialogTitle>Upload Profile Picture</DialogTitle>
            <p id="profile-picture-description" className="text-sm text-gray-600 mt-2">
              Upload a professional profile picture that will be used across company systems.
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Image Guidelines */}
            <Card className="border border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-medium text-blue-900 mb-2">Photo Guidelines</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Professional headshot (shoulders and up)</li>
                  <li>• Clear, well-lit photo with plain background</li>
                  <li>• Face should be centered and clearly visible</li>
                  <li>• Business or business casual attire recommended</li>
                  <li>• Accepted formats: JPG, PNG, GIF (Max 2MB)</li>
                </ul>
              </CardContent>
            </Card>

            {/* Image Upload/Preview Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {previewImage ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-48 h-48 rounded-full overflow-hidden border-4 border-gray-200">
                    <img
                      src={previewImage}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-x-3">
                    <Button
                      onClick={handleRetake}
                      variant="outline"
                      disabled={isUploading || uploadMutation.isPending}
                    >
                      <RotateCw className="w-4 h-4 mr-2" />
                      Choose Different Photo
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading || uploadMutation.isPending}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      {isUploading || uploadMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">
                    Click to select a professional profile picture
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Photo
                  </Button>
                </div>
              )}
            </div>

            {/* Additional Options */}
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-900 mb-3">Photo Tips</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <h4 className="font-medium text-green-600 mb-1">✓ Good Photos:</h4>
                    <ul className="space-y-1">
                      <li>• Natural lighting or soft studio lighting</li>
                      <li>• Neutral background (white, gray, blue)</li>
                      <li>• Professional attire</li>
                      <li>• Smiling, approachable expression</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-600 mb-1">✗ Avoid:</h4>
                    <ul className="space-y-1">
                      <li>• Casual/vacation photos</li>
                      <li>• Sunglasses or hats</li>
                      <li>• Busy backgrounds</li>
                      <li>• Group photos or selfies</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}