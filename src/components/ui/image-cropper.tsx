import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ImageCropperProps {
  imageSrc: string;
  aspect?: number;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  /** Allow the user to skip cropping and use the original image */
  onUseOriginal?: () => void;
}

const ASPECT_PRESETS = [
  { label: 'Free', value: undefined },
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '1:1', value: 1 },
] as const;

/**
 * Extracts the cropped region from the source image and returns it as a Blob.
 */
async function getCroppedImage(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/webp', 0.9);
  });
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  aspect: initialAspect = 16 / 9,
  onCropComplete,
  onCancel,
  onUseOriginal,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [aspect, setAspect] = useState<number | undefined>(initialAspect);

  const onCropChange = useCallback((_: unknown, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsSaving(true);
    try {
      const blob = await getCroppedImage(imageSrc, croppedAreaPixels);
      onCropComplete(blob);
    } catch {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      onCropComplete(blob);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full" style={{ height: 360, background: '#1a1a1a', borderRadius: 8, overflow: 'hidden' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropChange}
        />
      </div>

      {/* Aspect ratio presets */}
      <div className="space-y-2">
        <Label className="text-sm">Aspect Ratio</Label>
        <div className="flex gap-2">
          {ASPECT_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant={aspect === preset.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAspect(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Zoom</Label>
        <Slider
          value={[zoom]}
          onValueChange={([val]) => setZoom(val)}
          min={1}
          max={3}
          step={0.05}
          className="w-full"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        {onUseOriginal && (
          <Button variant="outline" onClick={onUseOriginal} disabled={isSaving}>
            Use Original
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving || !croppedAreaPixels}>
          {isSaving ? 'Cropping...' : 'Apply Crop'}
        </Button>
      </div>
    </div>
  );
};
