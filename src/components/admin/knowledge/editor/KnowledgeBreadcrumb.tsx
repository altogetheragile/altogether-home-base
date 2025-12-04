import React from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ChevronRight, Database, Edit3, Plus, LayoutGrid } from 'lucide-react';

interface KnowledgeBreadcrumbProps {
  isEditing: boolean;
  itemName?: string;
  currentStep?: string;
  returnTo?: string | null;
}

export const KnowledgeBreadcrumb: React.FC<KnowledgeBreadcrumbProps> = ({
  isEditing,
  itemName,
  currentStep,
  returnTo
}) => {
  return (
    <div className="bg-muted/30 border-b">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/admin/knowledge/items" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Database className="h-4 w-4" />
                  Knowledge Base
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2 font-medium">
                {isEditing ? (
                  <>
                    <Edit3 className="h-4 w-4 text-primary" />
                    Edit: {itemName || 'Knowledge Item'}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 text-primary" />
                    Create Knowledge Item
                  </>
                )}
              </BreadcrumbPage>
            </BreadcrumbItem>
            
            {currentStep && (
              <>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm text-muted-foreground">
                    {currentStep}
                  </BreadcrumbPage>
                </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      
      {returnTo === 'project-model' && (
        <Button variant="outline" size="sm" asChild>
          <Link to="/project-modelling" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Return to Project Model
          </Link>
        </Button>
      )}
      </div>
    </div>
  );
};