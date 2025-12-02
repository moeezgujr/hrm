import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface PDFStatus {
  exists: boolean;
  size?: number;
  created?: string;
  downloadUrl?: string;
}

export default function DownloadPDF() {
  const [isDownloading, setIsDownloading] = useState(false);

  // Check PDF status
  const { data: pdfStatus, isLoading } = useQuery<PDFStatus>({
    queryKey: ['/api/pdf-status'],
    refetchInterval: 5000, // Check every 5 seconds
  });

  const handleDownload = async () => {
    if (!pdfStatus?.downloadUrl) return;
    
    setIsDownloading(true);
    try {
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = pdfStatus.downloadUrl;
      link.download = 'Meeting_Matters_Subscription_Model.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Checking PDF status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Download PDF Documentation</h1>
        <p className="text-gray-600">Q361 Subscription Model Documentation</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Subscription Model Documentation PDF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pdfStatus?.exists ? (
            <>
              <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">PDF file is ready for download</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong>File Size:</strong><br />
                  {pdfStatus.size ? formatFileSize(pdfStatus.size) : 'Unknown'}
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong>Generated:</strong><br />
                  {pdfStatus.created ? formatDate(pdfStatus.created) : 'Unknown'}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Document Contents:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Complete subscription tier overview (Starter, Professional, Enterprise)</li>
                  <li>• Trial request system workflow and benefits</li>
                  <li>• Payment processing and billing information</li>
                  <li>• Email notification system details</li>
                  <li>• User roles and access control</li>
                  <li>• Customer journey and conversion process</li>
                  <li>• Technical architecture and API endpoints</li>
                  <li>• Security and compliance information</li>
                  <li>• Administrative features and support</li>
                  <li>• Revenue model and success metrics</li>
                  <li>• Future enhancements and getting started guides</li>
                </ul>
              </div>

              <div className="text-center pt-4">
                <Button 
                  onClick={handleDownload} 
                  className="flex items-center gap-2 mx-auto"
                  disabled={isDownloading}
                >
                  <Download className="w-4 h-4" />
                  {isDownloading ? 'Downloading...' : 'Download PDF'}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="flex items-center gap-2 text-orange-700 bg-orange-50 p-3 rounded-lg mb-4">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">PDF file not found</span>
              </div>
              <p className="text-gray-600 mb-4">
                The PDF documentation file is not available. This could mean:
              </p>
              <ul className="text-left text-gray-600 space-y-1 max-w-md mx-auto">
                <li>• The PDF hasn't been generated yet</li>
                <li>• The file was removed or moved</li>
                <li>• There was an error during generation</li>
              </ul>
              <p className="text-sm text-gray-500 mt-4">
                Please contact support if this issue persists.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-500">
        <p>This page automatically checks for the PDF file every 5 seconds.</p>
      </div>
    </div>
  );
}