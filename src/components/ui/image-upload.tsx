import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  bucket?: string;
  path?: string;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  bucket = 'knowledge-base',
  path = '',
  accept = 'image/*',
  maxSize = 5,
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Please select an image smaller than ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log(`Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) to ${bucket}/${fileName}`);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (!publicUrl) {
        console.error('Failed to get public URL for file:', fileName);
        throw new Error('Failed to get public URL for uploaded file');
      }

      console.log(`Upload successful: ${publicUrl}`);
      onChange(publicUrl);
      toast({
        title: "Upload Successful",
        description: `Image "${file.name}" uploaded successfully`,
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      const errorCode = error?.error || error?.code || 'UNKNOWN';
      
      console.error('Upload error details:', {
        message: errorMessage,
        code: errorCode,
        fileName: file.name,
        fileSize: file.size,
        bucket,
        error
      });

      let userFriendlyMessage = "Failed to upload image.";
      
      if (errorMessage.includes('The resource already exists')) {
        userFriendlyMessage = "A file with this name already exists. Please rename your file and try again.";
      } else if (errorMessage.includes('exceeded')) {
        userFriendlyMessage = "File size exceeds the allowed limit.";
      } else if (errorMessage.includes('Invalid')) {
        userFriendlyMessage = "Invalid file format or corrupted file.";
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userFriendlyMessage = "Network error. Please check your connection and try again.";
      } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        userFriendlyMessage = "Permission denied. Please contact support.";
      } else if (errorCode === 'STORAGE_OBJECT_NOT_FOUND') {
        userFriendlyMessage = "Storage bucket not found. Please contact support.";
      }

      toast({
        title: "Upload Failed",
        description: `${userFriendlyMessage} Error: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    onChange('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Uploaded image"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => document.getElementById('image-upload-input')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Select an image (max {maxSize}MB)
            </p>
          </div>
        </div>
      )}
      
      <input
        id="image-upload-input"
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};