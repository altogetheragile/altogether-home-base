import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageLightboxProps {
  images: Array<{
    url: string;
    title?: string;
    description?: string;
  }>;
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (index: number) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  currentIndex,
  open,
  onOpenChange,
  onNavigate,
}) => {
  const currentImage = images[currentIndex];

  const handlePrevious = () => {
    onNavigate(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
  };

  const handleNext = () => {
    onNavigate(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none"
        onKeyDown={handleKeyDown}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                onClick={handleNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          <div className="flex flex-col items-center justify-center w-full h-full p-8 space-y-4">
            <img
              src={currentImage?.url}
              alt={currentImage?.title || 'Image'}
              className="max-w-full max-h-[80vh] object-contain"
            />

            {(currentImage?.title || currentImage?.description) && (
              <div className="max-w-2xl text-center space-y-2 text-white">
                {currentImage.title && (
                  <h3 className="text-lg font-medium">{currentImage.title}</h3>
                )}
                {currentImage.description && (
                  <p className="text-sm text-white/80">{currentImage.description}</p>
                )}
              </div>
            )}

            {images.length > 1 && (
              <div className="text-sm text-white/60">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
