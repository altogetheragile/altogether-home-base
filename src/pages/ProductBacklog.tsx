import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  List,
  Columns
} from 'lucide-react';
import { LocalBacklogQuickAdd } from '@/components/backlog/LocalBacklogQuickAdd';
import { LocalBacklogList } from '@/components/backlog/LocalBacklogList';
import { StoryMap } from '@/components/backlog/StoryMap';
import { SchemeProvider } from '@/components/backlog/SchemeContext';
import { useProjectScheme } from '@/hooks/useProjectScheme';
import { SCHEMES, getScheme, type SchemeId } from '@/config/prioritisationSchemes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalBacklogItems, LocalBacklogItemInput } from '@/hooks/useLocalBacklogItems';
import { useProjectBacklog } from '@/hooks/useProjectBacklog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { exportBacklogCsv, type BacklogCsvFormat, FORMAT_LABELS } from '@/utils/backlog/backlogCsv';
import { UpstreamIntentPrompt } from '@/components/backlog/UpstreamIntentPrompt';
import { supabase } from '@/integrations/supabase/client';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { exportToCSV } from '@/utils/exportUtils';
import { toast } from 'sonner';

const ProductBacklog: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const backlogId = searchParams.get('backlogId');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [view, setView] = useState<'list' | 'story-map'>('list');
  const { scheme, setScheme } = useProjectScheme(projectId || undefined);
  const activeScheme = getScheme(scheme);
  const [includeWont, setIncludeWont] = useState(false);

  // In project mode the relational backlog_items table is the single source and
  // every change auto-persists. Standalone mode keeps a local draft + Save to Project.
  const local = useLocalBacklogItems();
  const project = useProjectBacklog(projectId || undefined, backlogId || undefined);
  const inProject = !!projectId;
  const { items, addItem, updateItem, deleteItem, reorderItems, clearItems, hasItems } =
    inProject ? project : local;
  const isLoadingItems = inProject ? project.isLoading : false;

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

  const handleExportFormat = (format: BacklogCsvFormat) => {
    if (!items.length) {
      toast.error('No backlog items to export');
      return;
    }
    exportBacklogCsv(items, format, { scheme: activeScheme, includeWont });
    toast.success(`Exported for ${FORMAT_LABELS[format]}`);
  };

  const handleSaveComplete = (savedProjectId: string) => {
    clearItems();
    setSaveDialogOpen(false);
    toast.success('Backlog saved to project');
    // Land on the project-scoped (relational) backlog so the saved items are shown.
    navigate(`/backlog?projectId=${savedProjectId}`);
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
    <SchemeProvider scheme={scheme}>
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
            <Select value={scheme} onValueChange={(v) => setScheme(v as SchemeId)}>
              <SelectTrigger className="h-9 w-[170px]" title="How this backlog is prioritised">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SCHEMES).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mr-1 flex items-center rounded-md border border-border p-0.5">
              <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" className="h-8 px-2" onClick={() => setView('list')}>
                <List className="mr-1.5 h-4 w-4" /> List
              </Button>
              <Button variant={view === 'story-map' ? 'secondary' : 'ghost'} size="sm" className="h-8 px-2" onClick={() => setView('story-map')}>
                <Columns className="mr-1.5 h-4 w-4" /> Story Map
              </Button>
            </div>
            {!inProject && (
              <Button
                variant="default"
                onClick={() => setSaveDialogOpen(true)}
                disabled={!hasItems}
              >
                <Save className="h-4 w-4 mr-2" />
                Save to Project
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!hasItems}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {activeScheme.id === 'moscow' && (
                  <>
                    <DropdownMenuCheckboxItem
                      checked={includeWont}
                      onCheckedChange={setIncludeWont}
                      onSelect={(e) => e.preventDefault()}
                    >
                      Include Won't items
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => handleExportFormat('jira')}>Jira CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportFormat('azure-devops')}>Azure DevOps CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportFormat('trello')}>Trello CSV</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportBacklog}>Generic CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* One-question-upstream: capture why this work exists, once per project */}
        {projectId && <UpstreamIntentPrompt projectId={projectId} />}

        {/* This backlog has no project context: explain how to link it */}
        {!projectId && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This backlog is not linked to a project, so it will not capture your project's intent or item provenance.
              Open a project and choose <strong>Project Tools &gt; Product Backlog</strong>, or use <strong>Save to Project</strong> above to link it.
            </AlertDescription>
          </Alert>
        )}

        {/* Unsaved changes warning (standalone only; project mode auto-persists) */}
        {!inProject && hasItems && (
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
          {view === 'list' ? (
            <>
              <LocalBacklogQuickAdd onAddItem={handleAddItem} potentialParents={items} />
              <LocalBacklogList
                items={items}
                onUpdateItem={updateItem}
                onDeleteItem={deleteItem}
                onReorderItems={reorderItems}
                onAddItem={handleAddItem}
              />
            </>
          ) : (
            <StoryMap items={items} />
          )}
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
    </SchemeProvider>
  );
};

export default ProductBacklog;
