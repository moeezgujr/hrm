import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Palette, 
  Type, 
  Image, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  Eye,
  Copy,
  ExternalLink,
  Zap,
  Target,
  Users,
  FileText
} from 'lucide-react';

interface BrandGuidelinesProps {
  brandGuidelines: any[];
}

export function BrandGuidelines({ brandGuidelines }: BrandGuidelinesProps) {
  const [selectedBrand, setSelectedBrand] = useState<any>(brandGuidelines[0] || null);
  const [newGuidelineOpen, setNewGuidelineOpen] = useState(false);
  const [editGuidelineOpen, setEditGuidelineOpen] = useState(false);
  const [guidelineFormData, setGuidelineFormData] = useState({
    brandName: '',
    description: '',
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    accentColor: '#0066cc',
    fontPrimary: '',
    fontSecondary: '',
    logoUrl: '',
    toneOfVoice: '',
    targetAudience: '',
    brandValues: '',
    doAndDonts: '',
    socialMediaGuidelines: '',
    hashtagGuidelines: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const colorPalettes = [
    { name: 'Professional', colors: ['#1E3A8A', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'] },
    { name: 'Creative', colors: ['#7C3AED', '#A855F7', '#C084FC', '#DDD6FE', '#F3E8FF'] },
    { name: 'Energetic', colors: ['#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FEE2E2'] },
    { name: 'Natural', colors: ['#059669', '#10B981', '#34D399', '#6EE7B7', '#D1FAE5'] },
    { name: 'Elegant', colors: ['#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F9FAFB'] }
  ];

  const fonts = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
    'Source Sans Pro', 'Nunito', 'Playfair Display', 'Merriweather'
  ];

  const createGuidelineMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/social-media/brand-guidelines', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/brand-guidelines'] });
      toast({
        title: "Success",
        description: "Brand guideline created successfully",
      });
      setNewGuidelineOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create brand guideline",
        variant: "destructive",
      });
    }
  });

  const updateGuidelineMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PATCH', `/api/social-media/brand-guidelines/${selectedBrand.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/brand-guidelines'] });
      toast({
        title: "Success",
        description: "Brand guideline updated successfully",
      });
      setEditGuidelineOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update brand guideline",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setGuidelineFormData({
      brandName: '',
      description: '',
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      accentColor: '#0066cc',
      fontPrimary: '',
      fontSecondary: '',
      logoUrl: '',
      toneOfVoice: '',
      targetAudience: '',
      brandValues: '',
      doAndDonts: '',
      socialMediaGuidelines: '',
      hashtagGuidelines: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guidelineFormData.brandName || !guidelineFormData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const colorPalette = [
      guidelineFormData.primaryColor,
      guidelineFormData.secondaryColor,
      guidelineFormData.accentColor
    ];

    const fonts = [guidelineFormData.fontPrimary, guidelineFormData.fontSecondary].filter(Boolean);

    createGuidelineMutation.mutate({
      ...guidelineFormData,
      colorPalette,
      fonts
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guidelineFormData.brandName || !guidelineFormData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const colorPalette = [
      guidelineFormData.primaryColor,
      guidelineFormData.secondaryColor,
      guidelineFormData.accentColor
    ];

    const fonts = [guidelineFormData.fontPrimary, guidelineFormData.fontSecondary].filter(Boolean);

    updateGuidelineMutation.mutate({
      ...guidelineFormData,
      colorPalette,
      fonts
    });
  };

  const handleEditClick = () => {
    if (!selectedBrand) return;
    
    const colorPalette = selectedBrand.colorPalette ? 
      (typeof selectedBrand.colorPalette === 'string' ? 
        JSON.parse(selectedBrand.colorPalette) : 
        selectedBrand.colorPalette
      ) : ['#000000', '#ffffff', '#0066cc'];
    
    const fonts = selectedBrand.fonts ? 
      (typeof selectedBrand.fonts === 'string' ? 
        JSON.parse(selectedBrand.fonts) : 
        selectedBrand.fonts
      ) : [];

    setGuidelineFormData({
      brandName: selectedBrand.brandName || '',
      description: selectedBrand.description || '',
      primaryColor: colorPalette[0] || '#000000',
      secondaryColor: colorPalette[1] || '#ffffff',
      accentColor: colorPalette[2] || '#0066cc',
      fontPrimary: fonts[0] || '',
      fontSecondary: fonts[1] || '',
      logoUrl: selectedBrand.logoUrl || '',
      toneOfVoice: selectedBrand.toneOfVoice || '',
      targetAudience: selectedBrand.targetAudience || '',
      brandValues: selectedBrand.brandValues || '',
      doAndDonts: selectedBrand.doAndDonts || '',
      socialMediaGuidelines: selectedBrand.socialMediaGuidelines || '',
      hashtagGuidelines: selectedBrand.hashtagGuidelines || ''
    });
    
    setEditGuidelineOpen(true);
  };

  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    toast({
      title: "Color Copied",
      description: `${color} copied to clipboard`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Brand Guidelines</h2>
        <Button onClick={() => setNewGuidelineOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Brand Guide
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Brand Selection Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Brands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {brandGuidelines.map((brand: any) => (
                <Button
                  key={brand.id}
                  variant={selectedBrand?.id === brand.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedBrand(brand)}
                >
                  <Palette className="h-4 w-4 mr-2" />
                  {brand.brandName}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Brand Guidelines Detail */}
        <div className="lg:col-span-3">
          {selectedBrand ? (
            <div className="space-y-6">
              {/* Brand Overview */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{selectedBrand.brandName}</CardTitle>
                      <p className="text-muted-foreground mt-1">{selectedBrand.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleEditClick}
                        data-testid="edit-brand-guideline-btn"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Target Audience
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedBrand.targetAudience || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Brand Values
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedBrand.brandValues || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Color Palette */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Color Palette
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {(selectedBrand.colorPalette ? 
                      (typeof selectedBrand.colorPalette === 'string' ? 
                        JSON.parse(selectedBrand.colorPalette) : 
                        selectedBrand.colorPalette
                      ) : []
                    ).map((color: string, index: number) => (
                      <div key={index} className="text-center">
                        <div
                          className="w-full h-20 rounded-lg border-2 border-gray-200 cursor-pointer hover:scale-105 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => copyColor(color)}
                          title="Click to copy"
                        />
                        <div className="mt-2">
                          <p className="text-sm font-medium">{color}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => copyColor(color)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Typography */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Typography
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(selectedBrand.fonts ? 
                      (typeof selectedBrand.fonts === 'string' ? 
                        JSON.parse(selectedBrand.fonts) : 
                        selectedBrand.fonts
                      ) : []
                    ).map((font: string, index: number) => (
                      <div key={index} className="space-y-2">
                        <h4 className="font-medium">
                          {index === 0 ? 'Primary Font' : 'Secondary Font'}
                        </h4>
                        <div className="p-4 border rounded-lg">
                          <p style={{ fontFamily: font }} className="text-2xl font-bold">
                            {font}
                          </p>
                          <p style={{ fontFamily: font }} className="text-lg">
                            The quick brown fox jumps over the lazy dog
                          </p>
                          <p style={{ fontFamily: font }} className="text-sm text-muted-foreground">
                            ABCDEFGHIJKLMNOPQRSTUVWXYZ 1234567890
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Voice & Tone */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Voice & Tone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Tone of Voice</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedBrand.toneOfVoice || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Social Media Guidelines</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedBrand.socialMediaGuidelines || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Hashtag Guidelines</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedBrand.hashtagGuidelines || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Do's and Don'ts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Do's and Don'ts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 text-green-600">✓ Do's</h4>
                      <div className="space-y-2">
                        {(typeof selectedBrand.doAndDonts === 'string' ? selectedBrand.doAndDonts : 'Use consistent brand colors\nMaintain professional tone\nInclude brand hashtags').split('\n').filter(Boolean).map((item: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                            <p className="text-sm">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3 text-red-600">✗ Don'ts</h4>
                      <div className="space-y-2">
                        {['Use unauthorized fonts', 'Modify logo proportions', 'Post without approval'].map((item: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                            <p className="text-sm">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Brand Selected</h3>
                  <p className="text-muted-foreground">Select a brand from the sidebar to view guidelines</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Guideline Modal */}
      {editGuidelineOpen && (
        <Dialog open={editGuidelineOpen} onOpenChange={setEditGuidelineOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Brand Guideline</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-brandName">Brand Name *</Label>
                  <Input
                    id="edit-brandName"
                    value={guidelineFormData.brandName}
                    onChange={(e) => setGuidelineFormData(prev => ({ ...prev, brandName: e.target.value }))}
                    placeholder="Enter brand name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-logoUrl">Logo URL</Label>
                  <Input
                    id="edit-logoUrl"
                    value={guidelineFormData.logoUrl}
                    onChange={(e) => setGuidelineFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={guidelineFormData.description}
                  onChange={(e) => setGuidelineFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the brand"
                  className="h-20"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-primaryColor"
                      type="color"
                      value={guidelineFormData.primaryColor}
                      onChange={(e) => setGuidelineFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={guidelineFormData.primaryColor}
                      onChange={(e) => setGuidelineFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-secondaryColor"
                      type="color"
                      value={guidelineFormData.secondaryColor}
                      onChange={(e) => setGuidelineFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={guidelineFormData.secondaryColor}
                      onChange={(e) => setGuidelineFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-accentColor"
                      type="color"
                      value={guidelineFormData.accentColor}
                      onChange={(e) => setGuidelineFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={guidelineFormData.accentColor}
                      onChange={(e) => setGuidelineFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                      placeholder="#0066cc"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-fontPrimary">Primary Font</Label>
                  <Select 
                    value={guidelineFormData.fontPrimary} 
                    onValueChange={(value) => setGuidelineFormData(prev => ({ ...prev, fontPrimary: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary font" />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map(font => (
                        <SelectItem key={font} value={font}>{font}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-fontSecondary">Secondary Font</Label>
                  <Select 
                    value={guidelineFormData.fontSecondary} 
                    onValueChange={(value) => setGuidelineFormData(prev => ({ ...prev, fontSecondary: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select secondary font" />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map(font => (
                        <SelectItem key={font} value={font}>{font}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-targetAudience">Target Audience</Label>
                  <Textarea
                    id="edit-targetAudience"
                    value={guidelineFormData.targetAudience}
                    onChange={(e) => setGuidelineFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                    placeholder="Describe your target audience"
                    className="h-20"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-brandValues">Brand Values</Label>
                  <Textarea
                    id="edit-brandValues"
                    value={guidelineFormData.brandValues}
                    onChange={(e) => setGuidelineFormData(prev => ({ ...prev, brandValues: e.target.value }))}
                    placeholder="Core brand values and principles"
                    className="h-20"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-toneOfVoice">Tone of Voice</Label>
                <Textarea
                  id="edit-toneOfVoice"
                  value={guidelineFormData.toneOfVoice}
                  onChange={(e) => setGuidelineFormData(prev => ({ ...prev, toneOfVoice: e.target.value }))}
                  placeholder="Describe the brand's communication style"
                  className="h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setEditGuidelineOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateGuidelineMutation.isPending}>
                  {updateGuidelineMutation.isPending ? 'Updating...' : 'Update Guideline'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Guideline Modal */}
      {newGuidelineOpen && (
        <Dialog open={newGuidelineOpen} onOpenChange={setNewGuidelineOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Brand Guideline</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brandName">Brand Name *</Label>
                  <Input
                    id="brandName"
                    value={guidelineFormData.brandName}
                    onChange={(e) => setGuidelineFormData(prev => ({ ...prev, brandName: e.target.value }))}
                    placeholder="Enter brand name"
                  />
                </div>
                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={guidelineFormData.logoUrl}
                    onChange={(e) => setGuidelineFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={guidelineFormData.description}
                  onChange={(e) => setGuidelineFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the brand"
                  className="h-20"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={guidelineFormData.primaryColor}
                      onChange={(e) => setGuidelineFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={guidelineFormData.primaryColor}
                      onChange={(e) => setGuidelineFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={guidelineFormData.secondaryColor}
                      onChange={(e) => setGuidelineFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={guidelineFormData.secondaryColor}
                      onChange={(e) => setGuidelineFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={guidelineFormData.accentColor}
                      onChange={(e) => setGuidelineFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={guidelineFormData.accentColor}
                      onChange={(e) => setGuidelineFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                      placeholder="#0066cc"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fontPrimary">Primary Font</Label>
                  <Select 
                    value={guidelineFormData.fontPrimary} 
                    onValueChange={(value) => setGuidelineFormData(prev => ({ ...prev, fontPrimary: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary font" />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map(font => (
                        <SelectItem key={font} value={font}>{font}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fontSecondary">Secondary Font</Label>
                  <Select 
                    value={guidelineFormData.fontSecondary} 
                    onValueChange={(value) => setGuidelineFormData(prev => ({ ...prev, fontSecondary: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select secondary font" />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map(font => (
                        <SelectItem key={font} value={font}>{font}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Textarea
                    id="targetAudience"
                    value={guidelineFormData.targetAudience}
                    onChange={(e) => setGuidelineFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                    placeholder="Describe your target audience"
                    className="h-20"
                  />
                </div>
                <div>
                  <Label htmlFor="brandValues">Brand Values</Label>
                  <Textarea
                    id="brandValues"
                    value={guidelineFormData.brandValues}
                    onChange={(e) => setGuidelineFormData(prev => ({ ...prev, brandValues: e.target.value }))}
                    placeholder="Core brand values and principles"
                    className="h-20"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="toneOfVoice">Tone of Voice</Label>
                <Textarea
                  id="toneOfVoice"
                  value={guidelineFormData.toneOfVoice}
                  onChange={(e) => setGuidelineFormData(prev => ({ ...prev, toneOfVoice: e.target.value }))}
                  placeholder="Describe the brand's communication style"
                  className="h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setNewGuidelineOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createGuidelineMutation.isPending}>
                  {createGuidelineMutation.isPending ? 'Creating...' : 'Create Guideline'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}