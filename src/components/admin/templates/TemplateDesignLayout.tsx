import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, 
  ChevronRight, 
  PanelLeft, 
  PanelRight, 
  Settings 
} from 'lucide-react';

interface TemplateDesignLayoutProps {
  children: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  toolbar?: React.ReactNode;
  leftSidebarOpen?: boolean;
  rightSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  onToggleRightSidebar?: () => void;
}

export const TemplateDesignLayout: React.FC<TemplateDesignLayoutProps> = ({
  children,
  leftSidebar,
  rightSidebar,
  toolbar,
  leftSidebarOpen = true,
  rightSidebarOpen = false,
  onToggleLeftSidebar,
  onToggleRightSidebar,
}) => {
  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden">
      {/* Left Sidebar */}
      <div 
        className={`${
          leftSidebarOpen ? 'w-72' : 'w-12'
        } transition-all duration-300 border-r bg-card flex flex-col overflow-hidden`}
      >
        {leftSidebarOpen ? (
          <>
            <div className="flex items-center justify-between p-4 border-b bg-card">
              <h3 className="text-sm font-semibold">Template Builder</h3>
              {onToggleLeftSidebar && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleLeftSidebar}
                  className="h-8 w-8 p-0"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-auto">
              {leftSidebar}
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-2 border-b">
              {onToggleLeftSidebar && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleLeftSidebar}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex-1 p-1">
              {leftSidebar}
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Fixed width to prevent resizing */}
      <div className="flex-1 flex flex-col overflow-hidden pb-16" style={{ minWidth: 0 }}>
        {/* Canvas Area - No top toolbar, using bottom toolbar */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
        
        {/* Bottom Toolbar */}
        {toolbar}
      </div>

      {/* Right Sidebar - Only show when open */}
      {rightSidebarOpen && (
        <div className="w-80 transition-all duration-300 border-l bg-card flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-card">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Properties</h3>
            </div>
            {onToggleRightSidebar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleRightSidebar}
                className="h-8 w-8 p-0"
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {rightSidebar}
          </div>
        </div>
      )}
    </div>
  );
};