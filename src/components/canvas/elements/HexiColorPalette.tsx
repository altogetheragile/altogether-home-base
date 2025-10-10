import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Palette } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface HexiColorPaletteProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  allowCustom?: boolean;
}

const HEXI_COLOR_PALETTE = [
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Slate', value: '#475569' },
  { name: 'Emerald', value: '#059669' },
];

export const HexiColorPalette: React.FC<HexiColorPaletteProps> = ({
  selectedColor,
  onColorChange,
  allowCustom = false,
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState(selectedColor);

  const handleCustomColorApply = () => {
    onColorChange(customColor);
    setShowCustomPicker(false);
  };

  return (
    <div className="space-y-3">
      {/* Palette Grid */}
      <div className="grid grid-cols-6 gap-2">
        {HEXI_COLOR_PALETTE.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorChange(color.value)}
            className="relative w-10 h-10 rounded-md border-2 transition-all hover:scale-110"
            style={{
              backgroundColor: color.value,
              borderColor: selectedColor === color.value ? color.value : 'transparent',
            }}
            title={color.name}
          >
            {selectedColor === color.value && (
              <Check className="w-5 h-5 text-white absolute inset-0 m-auto drop-shadow-md" />
            )}
          </button>
        ))}
      </div>

      {/* Custom Color Picker */}
      {allowCustom && (
        <div className="space-y-2">
          {!showCustomPicker ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomPicker(true)}
              className="w-full"
            >
              <Palette className="h-4 w-4 mr-2" />
              Custom Color
            </Button>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="h-10"
                />
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="absolute top-0 left-0 pl-14"
                  placeholder="#000000"
                />
              </div>
              <Button size="sm" onClick={handleCustomColorApply}>
                Apply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCustomPicker(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
