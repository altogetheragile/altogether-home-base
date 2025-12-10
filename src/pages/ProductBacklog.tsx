import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ClipboardList, 
  ArrowLeft,
  Save,
  Download,
  AlertTriangle
} from 'lucide-react';
import { LocalBacklogQuickAdd } from '@/components/backlog/LocalBacklogQuickAdd';
import { LocalBacklogList } from '@/components/backlog/LocalBacklogList';
import { useLocalBacklogItems, LocalBacklogItemInput, LocalBacklogItem } from '@/hooks/useLocalBacklogItems';
import { useBacklogItems } from '@/hooks/useBacklogItems';
import { supabase } from '@/integrations/supabase/client';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { exportToCSV } from '@/utils/exportUtils';
import { toast } from 'sonner';

const ProductBacklog: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const hasInitialized = useRef(false);

  // Fetch existing backlog items from database when projectId is provided
  const { data: existingItems, isLoading: isLoadingItems } = useBacklogItems(projectId || undefined);

  const { 
    items, 
    addItem, 
    updateItem, 
    deleteItem, 
    reorderItems, 
    clearItems,
    hasItems,
    setAllItems
  } = useLocalBacklogItems();

  // Load existing backlog items from database when projectId is provided
  useEffect(() => {
    if (existingItems && existingItems.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      const localItems: LocalBacklogItem[] = existingItems.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: item.status,
        source: item.source,
        estimated_value: item.estimated_value,
        estimated_effort: item.estimated_effort,
        tags: item.tags,
        target_release: item.target_release,
        backlog_position: item.backlog_position,
      }));
      setAllItems(localItems);
    }
  }, [existingItems, setAllItems]);

  const handleAddItem = (input: LocalBacklogItemInput) => {
    addItem(input);
    toast.success('Item added to backlog');
  };

  const handleExportBacklog = () => {
    if (items.length === 0) {
      toast.error('No backlog items to export');
      return;
    }

    const exportData = items.map((item) => ({
      Title: item.title,
      Description: item.description || '',
      Priority: item.priority || '',
      Status: item.status || '',
      'Estimated Value': item.estimated_value || '',
      'Estimated Effort': item.estimated_effort || '',
      Source: item.source || '',
      'Target Release': item.target_release || '',
      Tags: item.tags?.join(', ') || '',
    }));

    exportToCSV(exportData, 'product-backlog');
    toast.success('Backlog exported successfully');
  };

  const handleSaveComplete = () => {
    clearItems();
    toast.success('Backlog saved to project successfully');
    setSaveDialogOpen(false);
  };

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null || (projectId && isLoadingItems)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Sign in Required</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to access the Product Backlog.
              </p>
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Product Backlog | Altogether Agile</title>
        <meta name="description" content="Capture, prioritize, and manage your product backlog with our intuitive backlog management tool." />
      </Helmet>
      
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(projectId ? `/projects/${projectId}` : '/ai-tools')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-primary" />
              Product Backlog
            </h1>
            <p className="text-muted-foreground mt-1">
              Capture and prioritize your product enhancements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="default"
              onClick={() => setSaveDialogOpen(true)}
              disabled={!hasItems}
            >
              <Save className="h-4 w-4 mr-2" />
              Save to Project
            </Button>
            <Button 
              variant="outline"
              onClick={handleExportBacklog}
              disabled={!hasItems}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Unsaved changes warning */}
        {hasItems && (
          <Alert variant="default" className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              You have {items.length} unsaved backlog item{items.length !== 1 ? 's' : ''}. 
              Click "Save to Project" to persist your work.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          <LocalBacklogQuickAdd onAddItem={handleAddItem} />
          <LocalBacklogList 
            items={items} 
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
            onReorderItems={reorderItems}
          />
        </div>
      </main>
      
      <Footer />

      <SaveToProjectDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        artifactType="product-backlog"
        artifactName="Product Backlog"
        artifactDescription="Product backlog items exported from the backlog tool"
        artifactData={{ items }}
        onSaveComplete={handleSaveComplete}
        preselectedProjectId={projectId || undefined}
      />
    </div>
  );
};

export default ProductBacklog;
