import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';

interface ButtonConfig {
  text?: string;
  link?: string;
  variant?: string;
  size?: string;
  visible?: boolean;
}

interface ButtonsArrayEditorProps {
  content: any;
  onContentChange: (key: string, value: any) => void;
}

export const ButtonsArrayEditor: React.FC<ButtonsArrayEditorProps> = ({ content, onContentChange }) => {
  const buttons: ButtonConfig[] = content?.buttons || [];

  const addButton = () => {
    const newButtons = [...buttons, { text: '', link: '', variant: 'default', visible: true }];
    onContentChange('buttons', newButtons);
  };

  const removeButton = (index: number) => {
    const newButtons = buttons.filter((_item, i) => i !== index);
    onContentChange('buttons', newButtons);
  };

  const updateButton = (index: number, field: string, value: string | boolean) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    onContentChange('buttons', newButtons);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Label>Buttons</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addButton}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Button
        </Button>
      </div>
      {buttons.length > 0 && (
        <div className="space-y-3">
          {buttons.map((button: ButtonConfig, index: number) => (
            <div key={index} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Button {index + 1}</span>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`button-${index}-visible`}
                      checked={button.visible !== false}
                      onCheckedChange={(checked) => updateButton(index, 'visible', checked)}
                    />
                    <Label htmlFor={`button-${index}-visible`} className="text-xs text-muted-foreground cursor-pointer">
                      Visible
                    </Label>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeButton(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`button-${index}-text`}>Button Text</Label>
                  <Input
                    id={`button-${index}-text`}
                    value={button.text || ''}
                    onChange={(e) => updateButton(index, 'text', e.target.value)}
                    placeholder="Button text"
                  />
                </div>
                <div>
                  <Label htmlFor={`button-${index}-link`}>Link</Label>
                  <Input
                    id={`button-${index}-link`}
                    value={button.link || ''}
                    onChange={(e) => updateButton(index, 'link', e.target.value)}
                    placeholder="/example"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`button-${index}-variant`}>Style</Label>
                  <Select
                    value={button.variant || 'default'}
                    onValueChange={(value) => updateButton(index, 'variant', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select button style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Use Global Default</SelectItem>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="ghost">Ghost</SelectItem>
                      <SelectItem value="destructive">Destructive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`button-${index}-size`}>Size</Label>
                  <Select
                    value={button.size || 'default'}
                    onValueChange={(value) => updateButton(index, 'size', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select button size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Use Global Default</SelectItem>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                      <SelectItem value="xl">Extra Large</SelectItem>
                      <SelectItem value="2xl">2X Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
