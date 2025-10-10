import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import * as Icons from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HexiIconSelectorProps {
  selectedIcon?: string;
  selectedEmoji?: string;
  onIconChange: (icon: string) => void;
  onEmojiChange: (emoji: string) => void;
}

const POPULAR_ICONS = [
  'Circle', 'Square', 'Users', 'Calendar', 'Target', 'Flag', 'Layers',
  'Zap', 'Star', 'Heart', 'Award', 'Briefcase', 'Clock', 'Map',
  'BookOpen', 'FileText', 'Lightbulb', 'TrendingUp', 'Activity',
];

const EMOJI_CATEGORIES = {
  People: ['👥', '👤', '👨‍💼', '👩‍💼', '🙋', '🙋‍♂️', '🙋‍♀️', '👨‍💻', '👩‍💻'],
  Objects: ['📅', '📊', '📈', '📋', '📝', '💼', '🎯', '🏁', '⚡', '💡'],
  Symbols: ['✅', '❌', '⭐', '🔥', '💪', '🎉', '🚀', '🎨', '🔧', '⚙️'],
  Activities: ['🏃', '🤝', '💬', '📢', '🎓', '🔍', '⏰', '📍', '🗺️', '🌟'],
};

export const HexiIconSelector: React.FC<HexiIconSelectorProps> = ({
  selectedIcon,
  selectedEmoji,
  onIconChange,
  onEmojiChange,
}) => {
  const [iconSearch, setIconSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!iconSearch) return POPULAR_ICONS;
    
    return Object.keys(Icons).filter(iconName => 
      iconName.toLowerCase().includes(iconSearch.toLowerCase())
    ).slice(0, 30);
  }, [iconSearch]);

  const handleClear = () => {
    onIconChange('');
    onEmojiChange('');
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as any;
    if (!IconComponent) return null;
    
    const isSelected = selectedIcon === iconName;
    
    return (
      <button
        key={iconName}
        onClick={() => onIconChange(iconName)}
        className={`p-2 rounded border-2 transition-all hover:scale-110 ${
          isSelected ? 'border-primary bg-primary/10' : 'border-transparent hover:border-border'
        }`}
        title={iconName}
      >
        <IconComponent className="h-5 w-5" />
      </button>
    );
  };

  return (
    <div className="space-y-2">
      <Tabs defaultValue="icons" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="icons">Icons</TabsTrigger>
          <TabsTrigger value="emoji">Emoji</TabsTrigger>
        </TabsList>

        <TabsContent value="icons" className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search icons..."
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Icons Grid */}
          <ScrollArea className="h-[200px]">
            <div className="grid grid-cols-6 gap-2 pr-4">
              {filteredIcons.map(renderIcon)}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="emoji" className="space-y-3">
          <ScrollArea className="h-[200px]">
            <div className="space-y-3 pr-4">
              {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                <div key={category}>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">
                    {category}
                  </h4>
                  <div className="grid grid-cols-9 gap-2">
                    {emojis.map((emoji) => {
                      const isSelected = selectedEmoji === emoji;
                      return (
                        <button
                          key={emoji}
                          onClick={() => onEmojiChange(emoji)}
                          className={`p-2 rounded border-2 transition-all hover:scale-110 text-xl ${
                            isSelected ? 'border-primary bg-primary/10' : 'border-transparent hover:border-border'
                          }`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Clear Selection */}
      {(selectedIcon || selectedEmoji) && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Clear Selection
        </Button>
      )}
    </div>
  );
};
