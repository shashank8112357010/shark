import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Camera, X, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PaymentScreenshotProps {
  onScreenshotCapture: (screenshot: string) => void;
  screenshot?: string;
}

const PaymentScreenshot: React.FC<PaymentScreenshotProps> = ({ onScreenshotCapture, screenshot }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions to maintain aspect ratio
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression (quality 0.7)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please select an image smaller than 10MB',
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select an image file',
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Show loading state
      toast({
        title: 'Processing image...',
        description: 'Compressing and uploading your screenshot',
      });
      
      // Compress image
      const compressedBase64 = await compressImage(file);
      
      onScreenshotCapture(compressedBase64);
      toast({
        title: 'Screenshot uploaded',
        description: 'Payment screenshot has been uploaded successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Failed to process the image. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveScreenshot = () => {
    onScreenshotCapture('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Camera className="h-5 w-5" />
          <span>Payment Screenshot</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!screenshot ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Upload a screenshot of your payment confirmation
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                {isUploading ? 'Processing...' : 'Upload Screenshot'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Please upload a clear screenshot of your payment confirmation 
                that shows the UTR number, amount, and transaction details.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={screenshot} 
                alt="Payment Screenshot" 
                className="w-full max-w-md mx-auto rounded-lg border-2 border-green-200"
              />
              <Button
                onClick={handleRemoveScreenshot}
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <Check className="h-5 w-5" />
                <span className="font-medium">Screenshot uploaded successfully</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentScreenshot;
