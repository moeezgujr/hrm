import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, Edit, Trash, Sparkles, Link as LinkIcon, FileUp, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AssetFormData {
  name: string;
  description: string;
  assetType: 'image' | 'video' | 'audio' | 'document' | 'template' | 'logo' | 'icon' | 'font' | 'other';
  fileUrl: string;
  thumbnailUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  tags: string[];
  brandId: number | null;
}

const ASSET_FORM_DEFAULT: AssetFormData = {
  name: '',
  description: '',
  assetType: 'image',
  fileUrl: '',
  thumbnailUrl: '',
  fileName: '',
  fileSize: 0,
  mimeType: '',
  category: '',
  tags: [],
  brandId: null,
};

export function AssetLibraryTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [assetFormData, setAssetFormData] = useState<AssetFormData>(ASSET_FORM_DEFAULT);
  const [tagsInput, setTagsInput] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query to fetch all assets
  const { data: assets = [], isLoading: assetsLoading } = useQuery<any[]>({
    queryKey: ['/api/studio/assets'],
  });

  // Mutation to create/update asset
  const assetMutation = useMutation({
    mutationFn: async (data: AssetFormData) => {
      const payload = {
        ...data,
        tags: tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [],
      };

      console.log('Submitting asset payload:', payload);

      try {
        if (editingAsset) {
          return await apiRequest('PUT', `/api/studio/assets/${editingAsset.id}`, payload);
        } else {
          const result = await apiRequest('POST', '/api/studio/assets', payload);
          console.log('Asset creation successful:', result);
          return result;
        }
      } catch (error) {
        console.error('Asset mutation error in mutationFn:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studio/assets'] });
      toast({
        title: editingAsset ? "Asset updated successfully" : "Asset created successfully",
      });
      setAssetDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Asset mutation error:', error);
      const errorMessage = error?.message || (editingAsset ? "Failed to update asset" : "Failed to create asset");
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setAssetFormData(ASSET_FORM_DEFAULT);
    setEditingAsset(null);
    setTagsInput('');
    setUploadMethod('url');
    setSelectedFile(null);
    setUploadingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadingFile(true);

    try {
      // Upload file to server
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/studio/assets/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const uploadData = await response.json();

      // Auto-fill form with uploaded file metadata
      // Store the storage path as fileUrl (will be used to download via proxy)
      setAssetFormData({
        ...assetFormData,
        fileUrl: uploadData.storagePath, // Store internal storage path
        fileName: uploadData.fileName,
        fileSize: uploadData.fileSize,
        mimeType: uploadData.mimeType,
        name: assetFormData.name || uploadData.originalName.replace(/\.[^/.]+$/, ''), // Use original name without extension if no name set
      });

      toast({
        title: "File uploaded successfully",
        description: `${uploadData.originalName} (${(uploadData.fileSize / 1024 / 1024).toFixed(2)} MB)`,
      });

    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
      setSelectedFile(null);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', assetFormData);
    console.log('Tags input:', tagsInput);
    assetMutation.mutate(assetFormData);
  };

  const handleOpenDialog = (asset?: any) => {
    if (asset) {
      setAssetFormData({
        name: asset.name,
        description: asset.description || '',
        assetType: asset.assetType,
        fileUrl: asset.fileUrl,
        thumbnailUrl: asset.thumbnailUrl || '',
        fileName: asset.fileName,
        fileSize: asset.fileSize || 0,
        mimeType: asset.mimeType || '',
        category: asset.category || '',
        tags: asset.tags || [],
        brandId: asset.brandId || null,
      });
      setTagsInput(asset.tags ? asset.tags.join(', ') : '');
      setEditingAsset(asset);
    } else {
      resetForm();
    }
    setAssetDialogOpen(true);
  };

  const handleDelete = async (assetId: number) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await apiRequest('DELETE', `/api/studio/assets/${assetId}`);
        queryClient.invalidateQueries({ queryKey: ['/api/studio/assets'] });
        toast({ title: "Asset deleted successfully" });
      } catch (error) {
        toast({ title: "Failed to delete asset", variant: "destructive" });
      }
    }
  };

  const handleDownload = async (asset: any) => {
    try {
      // Add ?download=true parameter to force download instead of inline display
      const baseUrl = getAssetDisplayUrl(asset);
      const downloadUrl = baseUrl + '?download=true';
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = asset.fileName || asset.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Download started" });
    } catch (error) {
      toast({ 
        title: "Download failed", 
        description: "Failed to download asset",
        variant: "destructive" 
      });
    }
  };

  // Helper function to get the display URL for an asset
  const getAssetDisplayUrl = (asset: any) => {
    if (!asset.fileUrl) return '';
    
    // Check if this is a storage path (starts with studio_assets/)
    // Storage paths look like: studio_assets/org_id/timestamp_filename.ext
    if (asset.fileUrl.startsWith('studio_assets/')) {
      // Use download proxy endpoint
      return `/api/studio/assets/download/${asset.id}`;
    }
    
    // Otherwise it's a direct URL
    return asset.fileUrl;
  };

  const assetCounts = {
    image: assets?.filter((a: any) => a.assetType === 'image').length || 0,
    video: assets?.filter((a: any) => a.assetType === 'video').length || 0,
    document: assets?.filter((a: any) => a.assetType === 'document').length || 0,
    template: assets?.filter((a: any) => a.assetType === 'template').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Asset Library
          </h2>
          <p className="text-gray-600 mt-1">Centralized media storage for all your creative assets</p>
        </div>
        <Button
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          onClick={() => handleOpenDialog()}
          data-testid="button-upload-asset"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Assets
        </Button>
      </div>

      {/* Asset Type Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Images', type: 'image', count: assetCounts.image },
          { label: 'Videos', type: 'video', count: assetCounts.video },
          { label: 'Documents', type: 'document', count: assetCounts.document },
          { label: 'Templates', type: 'template', count: assetCounts.template },
        ].map(({ label, type, count }) => (
          <Card
            key={type}
            className="border-blue-200 hover:border-blue-400 transition-colors cursor-pointer"
            data-testid={`card-asset-type-${type}`}
          >
            <CardContent className="p-4">
              <div className="text-center">
                <Image className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-2xl font-bold text-blue-600" data-testid={`count-${type}`}>
                  {count}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assets Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Assets</CardTitle>
        </CardHeader>
        <CardContent>
          {assetsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading assets...</p>
            </div>
          ) : assets && assets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset: any) => (
                <Card key={asset.id} className="border-blue-200" data-testid={`card-asset-${asset.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-semibold truncate" data-testid={`text-asset-name-${asset.id}`}>
                          {asset.name}
                        </CardTitle>
                        <p className="text-xs text-gray-500 mt-1">{asset.assetType}</p>
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(asset)}
                          data-testid={`button-download-asset-${asset.id}`}
                          title="Download asset"
                          className="h-7 w-7 p-0"
                        >
                          <Download className="h-3.5 w-3.5 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDialog(asset)}
                          data-testid={`button-edit-asset-${asset.id}`}
                          title="Edit asset"
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(asset.id)}
                          data-testid={`button-delete-asset-${asset.id}`}
                          title="Delete asset"
                          className="h-7 w-7 p-0"
                        >
                          <Trash className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {asset.assetType === 'image' && asset.fileUrl && (
                      <div className="mb-2 rounded overflow-hidden bg-gray-100">
                        <img src={getAssetDisplayUrl(asset)} alt={asset.name} className="w-full h-32 object-cover" />
                      </div>
                    )}
                    {asset.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{asset.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {asset.tags && asset.tags.length > 0 && asset.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{asset.category || 'Uncategorized'}</span>
                      {asset.fileSize && <span>{(asset.fileSize / 1024 / 1024).toFixed(2)} MB</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Image className="h-12 w-12 mx-auto mb-4 text-blue-400" />
              <p className="font-semibold mb-2">No assets uploaded</p>
              <p className="text-sm">Upload images, videos, and templates to build your library</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => handleOpenDialog()}
                data-testid="button-upload-asset-empty"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Your First Asset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Asset Upload/Edit Dialog */}
      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              {editingAsset ? 'Edit Asset' : 'Upload New Asset'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="asset-name">Asset Name *</Label>
                <Input
                  id="asset-name"
                  value={assetFormData.name}
                  onChange={(e) => setAssetFormData({ ...assetFormData, name: e.target.value })}
                  required
                  data-testid="input-asset-name"
                />
              </div>

              <div>
                <Label htmlFor="asset-type">Asset Type *</Label>
                <Select
                  value={assetFormData.assetType}
                  onValueChange={(value: any) => setAssetFormData({ ...assetFormData, assetType: value })}
                >
                  <SelectTrigger id="asset-type" data-testid="select-asset-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="logo">Logo</SelectItem>
                    <SelectItem value="icon">Icon</SelectItem>
                    <SelectItem value="font">Font</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Upload Method Toggle */}
              <div className="space-y-2">
                <Label>Upload Method *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={uploadMethod === 'url' ? 'default' : 'outline'}
                    onClick={() => setUploadMethod('url')}
                    className={uploadMethod === 'url' ? 'bg-blue-600' : ''}
                    data-testid="button-upload-method-url"
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Link URL
                  </Button>
                  <Button
                    type="button"
                    variant={uploadMethod === 'file' ? 'default' : 'outline'}
                    onClick={() => setUploadMethod('file')}
                    className={uploadMethod === 'file' ? 'bg-blue-600' : ''}
                    data-testid="button-upload-method-file"
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                </div>
              </div>

              {/* URL Input Method */}
              {uploadMethod === 'url' && (
                <>
                  <div>
                    <Label htmlFor="file-url">File URL *</Label>
                    <Input
                      id="file-url"
                      value={assetFormData.fileUrl}
                      onChange={(e) => setAssetFormData({ ...assetFormData, fileUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      required
                      data-testid="input-file-url"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter the direct URL to your asset file</p>
                  </div>

                  <div>
                    <Label htmlFor="file-name">File Name *</Label>
                    <Input
                      id="file-name"
                      value={assetFormData.fileName}
                      onChange={(e) => setAssetFormData({ ...assetFormData, fileName: e.target.value })}
                      placeholder="image.jpg"
                      required
                      data-testid="input-file-name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="file-size">File Size (bytes)</Label>
                      <Input
                        id="file-size"
                        type="number"
                        value={assetFormData.fileSize}
                        onChange={(e) => setAssetFormData({ ...assetFormData, fileSize: parseInt(e.target.value) || 0 })}
                        data-testid="input-file-size"
                      />
                    </div>

                    <div>
                      <Label htmlFor="mime-type">MIME Type</Label>
                      <Input
                        id="mime-type"
                        value={assetFormData.mimeType}
                        onChange={(e) => setAssetFormData({ ...assetFormData, mimeType: e.target.value })}
                        placeholder="image/jpeg"
                        data-testid="input-mime-type"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* File Upload Method */}
              {uploadMethod === 'file' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Select File *</Label>
                    <div className="mt-2">
                      <Input
                        id="file-upload"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        disabled={uploadingFile}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                        data-testid="input-file-upload"
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Supported: Images, Videos, Audio, Documents (Max 50MB)
                      </p>
                    </div>
                  </div>

                  {uploadingFile && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Uploading file...</span>
                    </div>
                  )}

                  {selectedFile && !uploadingFile && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <FileUp className="h-4 w-4" />
                        <span className="text-sm font-medium">File uploaded successfully!</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={assetFormData.category}
                  onChange={(e) => setAssetFormData({ ...assetFormData, category: e.target.value })}
                  placeholder="Marketing, Social Media, etc."
                  data-testid="input-category"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="logo, brand, social"
                  data-testid="input-tags"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={assetFormData.description}
                  onChange={(e) => setAssetFormData({ ...assetFormData, description: e.target.value })}
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>

              <div>
                <Label htmlFor="thumbnail-url">Thumbnail URL (optional)</Label>
                <Input
                  id="thumbnail-url"
                  value={assetFormData.thumbnailUrl}
                  onChange={(e) => setAssetFormData({ ...assetFormData, thumbnailUrl: e.target.value })}
                  placeholder="https://example.com/thumbnail.jpg"
                  data-testid="input-thumbnail-url"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAssetDialogOpen(false);
                  resetForm();
                }}
                data-testid="button-cancel-asset"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
                disabled={assetMutation.isPending}
                data-testid="button-submit-asset"
              >
                {assetMutation.isPending ? 'Saving...' : (editingAsset ? 'Update Asset' : 'Create Asset')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
