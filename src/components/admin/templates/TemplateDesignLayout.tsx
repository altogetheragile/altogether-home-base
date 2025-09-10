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
    <div className="grid h-screen bg-muted/20 overflow-hidden" 
         style={{ 
           gridTemplateColumns: `${leftSidebarOpen ? '18rem' : '3rem'} 1fr ${rightSidebarOpen ? '20rem' : '0'}`,
           gridTemplateRows: '1fr auto',
           transition: 'grid-template-columns 300ms ease-in-out'
         }}>
      {/* Left Sidebar */}
      <div className="border-r bg-card flex flex-col overflow-hidden">
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
            <div className="flex-1 overflow-y-auto">
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

      {/* Main Content - Fixed canvas area */}
      <div className="flex flex-col overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>

      {/* Right Sidebar - Only show when open */}
      {rightSidebarOpen && (
        <div className="border-l bg-card flex flex-col overflow-hidden">
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

      {/* Bottom Toolbar - Spans full width */}
      <div className="col-span-full">
        {toolbar}
      </div>
    </div>
  );
};