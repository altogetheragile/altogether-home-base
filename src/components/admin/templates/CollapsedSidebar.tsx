import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { 
  Layout, 
  Type, 
  Hash, 
  Calendar, 
  Mail, 
  Phone, 
  FileText, 
  CheckSquare,
  Settings,
  ChevronRight
} from 'lucide-react';

interface CollapsedSidebarProps {
  onAddSection: () => void;
  onAddField: (field: any) => void;
  onExpand: () => void;
  canAddField: boolean;
}

export const CollapsedSidebar: React.FC<CollapsedSidebarProps> = ({
  onAddSection,
  onAddField,
  onExpand,
  canAddField
}) => {
  const fieldTypes = [
    { type: 'text', label: 'Text Field', icon: Type },
    { type: 'textarea', label: 'Text Area', icon: FileText },
    { type: 'email', label: 'Email', icon: Mail },
    { type: 'number', label: 'Number', icon: Hash },
    { type: 'date', label: 'Date', icon: Calendar },
    { type: 'phone', label: 'Phone', icon: Phone },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  ];

  return (
    <TooltipProvider>
      <div className="w-12 bg-card border-r flex flex-col">
        <div className="p-2 border-b">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onExpand}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Expand sidebar</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex flex-col gap-1 p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onAddSection}
              >
                <Layout className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Add Section</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-full h-px bg-border my-1" />

          {fieldTypes.map((field) => {
            const Icon = field.icon;
            return (
              <Tooltip key={field.type}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onAddField({
                      type: field.type,
                      label: field.label,
                      required: false,
                      placeholder: `Enter ${field.label.toLowerCase()}`
                    })}
                    disabled={!canAddField}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{field.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};