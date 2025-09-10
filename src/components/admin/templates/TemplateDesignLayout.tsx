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
  rightSidebarOpen = true,
  onToggleLeftSidebar,
  onToggleRightSidebar,
}) => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Sidebar */}
      <div 
        className={`${
          leftSidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 border-r bg-card flex flex-col overflow-hidden`}
      >
        {leftSidebarOpen && (
          <>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Template Builder</h3>
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
        )}
      </div>

      {/* Left Sidebar Toggle (when closed) */}
      {!leftSidebarOpen && onToggleLeftSidebar && (
        <div className="flex flex-col justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleLeftSidebar}
            className="h-16 w-8 rounded-l-none border-l-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        {toolbar}
        
        {/* Canvas Area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>

      {/* Right Sidebar Toggle (when closed) */}
      {!rightSidebarOpen && onToggleRightSidebar && (
        <div className="flex flex-col justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleRightSidebar}
            className="h-16 w-8 rounded-r-none border-r-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Right Sidebar */}
      <div 
        className={`${
          rightSidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 border-l bg-card flex flex-col overflow-hidden`}
      >
        {rightSidebarOpen && (
          <>
            <div className="flex items-center justify-between p-4 border-b">
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
          </>
        )}
      </div>
    </div>
  );
};