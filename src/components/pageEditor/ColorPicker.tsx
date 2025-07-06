import React, { useState } from 'react';
import { SketchPicker } from 'react-color';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
}

interface ColorValue {
  hex: string;
  rgb: { r: number; g: number; b: number; a: number };
  hsl: { h: number; s: number; l: number; a: number };
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'picker' | 'manual'>('picker');
  const [manualValues, setManualValues] = useState({
    hex: '',
    rgb: { r: 0, g: 0, b: 0 },
    hsl: { h: 0, s: 0, l: 0 },
  });

  // Convert various color formats to a consistent format
  const parseColor = (colorValue: string): ColorValue => {
    // Default color if parsing fails
    const defaultColor = {
      hex: '#000000',
      rgb: { r: 0, g: 0, b: 0, a: 1 },
      hsl: { h: 0, s: 0, l: 0, a: 1 },
    };

    if (!colorValue || colorValue === 'default') return defaultColor;

    // If it's already a hex color
    if (colorValue.startsWith('#')) {
      return {
        hex: colorValue,
        rgb: hexToRgb(colorValue),
        hsl: hexToHsl(colorValue),
      };
    }

    // If it's an RGB color
    if (colorValue.startsWith('rgb')) {
      const rgb = parseRgb(colorValue);
      return {
        hex: rgbToHex(rgb.r, rgb.g, rgb.b),
        rgb,
        hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
      };
    }

    // If it's an HSL color
    if (colorValue.startsWith('hsl')) {
      const hsl = parseHsl(colorValue);
      const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      return {
        hex: rgbToHex(rgb.r, rgb.g, rgb.b),
        rgb: { ...rgb, a: hsl.a },
        hsl,
      };
    }

    return defaultColor;
  };

  const currentColor = parseColor(value);

  const handleColorChange = (color: any) => {
    const hexColor = color.hex;
    onChange(hexColor);
  };

  const handleManualChange = (type: 'hex' | 'rgb' | 'hsl', newValue: any) => {
    let finalColor = '';

    switch (type) {
      case 'hex':
        finalColor = newValue;
        break;
      case 'rgb':
        finalColor = `rgb(${newValue.r}, ${newValue.g}, ${newValue.b})`;
        break;
      case 'hsl':
        finalColor = `hsl(${newValue.h}, ${newValue.s}%, ${newValue.l}%)`;
        break;
    }

    onChange(finalColor);
  };

  const colorPreview = value && value !== 'default' ? value : '#e5e7eb';

  return (
    <div>
      <Label>{label}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <div
              className="w-4 h-4 rounded mr-2 border border-border"
              style={{ backgroundColor: colorPreview }}
            />
            {value === 'default' || !value ? 'Default' : value}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'picker' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="picker">Color Picker</TabsTrigger>
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
            </TabsList>
            
            <TabsContent value="picker" className="space-y-3">
              <SketchPicker
                color={currentColor.hex}
                onChange={handleColorChange}
                disableAlpha={false}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChange('default')}
                  className="flex-1"
                >
                  Default
                </Button>
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4">
              <div>
                <Label>HEX Color</Label>
                <Input
                  value={manualValues.hex}
                  onChange={(e) => {
                    const hex = e.target.value;
                    setManualValues(prev => ({ ...prev, hex }));
                    if (hex.match(/^#[0-9A-Fa-f]{6}$/)) {
                      handleManualChange('hex', hex);
                    }
                  }}
                  placeholder="#000000"
                />
              </div>
              
              <div>
                <Label>RGB Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="255"
                    placeholder="R"
                    value={manualValues.rgb.r}
                    onChange={(e) => {
                      const r = parseInt(e.target.value) || 0;
                      const newRgb = { ...manualValues.rgb, r };
                      setManualValues(prev => ({ ...prev, rgb: newRgb }));
                      handleManualChange('rgb', newRgb);
                    }}
                  />
                  <Input
                    type="number"
                    min="0"
                    max="255"
                    placeholder="G"
                    value={manualValues.rgb.g}
                    onChange={(e) => {
                      const g = parseInt(e.target.value) || 0;
                      const newRgb = { ...manualValues.rgb, g };
                      setManualValues(prev => ({ ...prev, rgb: newRgb }));
                      handleManualChange('rgb', newRgb);
                    }}
                  />
                  <Input
                    type="number"
                    min="0"
                    max="255"
                    placeholder="B"
                    value={manualValues.rgb.b}
                    onChange={(e) => {
                      const b = parseInt(e.target.value) || 0;
                      const newRgb = { ...manualValues.rgb, b };
                      setManualValues(prev => ({ ...prev, rgb: newRgb }));
                      handleManualChange('rgb', newRgb);
                    }}
                  />
                </div>
              </div>
              
              <div>
                <Label>HSL Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="360"
                    placeholder="H"
                    value={manualValues.hsl.h}
                    onChange={(e) => {
                      const h = parseInt(e.target.value) || 0;
                      const newHsl = { ...manualValues.hsl, h };
                      setManualValues(prev => ({ ...prev, hsl: newHsl }));
                      handleManualChange('hsl', newHsl);
                    }}
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="S%"
                    value={manualValues.hsl.s}
                    onChange={(e) => {
                      const s = parseInt(e.target.value) || 0;
                      const newHsl = { ...manualValues.hsl, s };
                      setManualValues(prev => ({ ...prev, hsl: newHsl }));
                      handleManualChange('hsl', newHsl);
                    }}
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="L%"
                    value={manualValues.hsl.l}
                    onChange={(e) => {
                      const l = parseInt(e.target.value) || 0;
                      const newHsl = { ...manualValues.hsl, l };
                      setManualValues(prev => ({ ...prev, hsl: newHsl }));
                      handleManualChange('hsl', newHsl);
                    }}
                  />
                </div>
              </div>
              
              <Button
                onClick={() => setIsOpen(false)}
                className="w-full"
              >
                Apply Color
              </Button>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Color conversion utilities
function hexToRgb(hex: string): { r: number; g: number; b: number; a: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: 1
  } : { r: 0, g: 0, b: 0, a: 1 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToHsl(hex: string): { h: number; s: number; l: number; a: number } {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number; a: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a: 1
  };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function parseRgb(rgb: string): { r: number; g: number; b: number; a: number } {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  return match ? {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
    a: match[4] ? parseFloat(match[4]) : 1
  } : { r: 0, g: 0, b: 0, a: 1 };
}

function parseHsl(hsl: string): { h: number; s: number; l: number; a: number } {
  const match = hsl.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*([\d.]+))?\)/);
  return match ? {
    h: parseInt(match[1]),
    s: parseInt(match[2]),
    l: parseInt(match[3]),
    a: match[4] ? parseFloat(match[4]) : 1
  } : { h: 0, s: 0, l: 0, a: 1 };
}