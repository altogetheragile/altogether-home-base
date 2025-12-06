import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  ClipboardList, 
  FolderOpen,
  ArrowLeft,
  Save,
  Download
} from 'lucide-react';
import { BacklogQuickAdd } from '@/components/backlog/BacklogQuickAdd';
import { BacklogList } from '@/components/backlog/BacklogList';
import { useBacklogItems } from '@/hooks/useBacklogItems';
import { useProjects } from '@/hooks/useProjects';
import { supabase } from '@/integrations/supabase/client';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { exportToCSV } from '@/utils/exportUtils';
import { toast } from 'sonner';

const ProductBacklog: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: backlogItems = [], isLoading: itemsLoading } = useBacklogItems(selectedProjectId || undefined);

  const handleExportBacklog = () => {
    if (backlogItems.length === 0) {
      toast.error('No backlog items to export');
      return;
    }

    const exportData = backlogItems.map((item) => ({
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

    const projectName = selectedProject?.name || 'product-backlog';
    exportToCSV(exportData, `${projectName}-backlog`);
    toast.success('Backlog exported successfully');
  };

  const handleSaveComplete = (projectId: string) => {
    setSelectedProjectId(projectId);
    toast.success('Backlog saved to project successfully');
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

  // Auto-select first project
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (isAuthenticated === null) {
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
            onClick={() => navigate('/ai-tools')}
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
              disabled={backlogItems.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Save to Project
            </Button>
            <Button 
              variant="outline"
              onClick={handleExportBacklog}
              disabled={backlogItems.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Project Selector */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <Label className="text-sm font-medium">Project:</Label>
                {projectsLoading ? (
                  <div className="h-10 w-48 bg-muted animate-pulse rounded" />
                ) : projects.length > 0 ? (
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-muted-foreground text-sm">No projects yet</span>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                Manage Projects
              </Button>
            </div>
            
            {selectedProject?.description && (
              <p className="text-sm text-muted-foreground mt-2 ml-7">
                {selectedProject.description}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        {selectedProjectId ? (
          <div className="space-y-6">
            <BacklogQuickAdd projectId={selectedProjectId} />
            <BacklogList items={backlogItems} isLoading={itemsLoading} />
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Create a Project First</h3>
              <p className="text-muted-foreground mb-4">
                You need a project to start capturing backlog items.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      
      <Footer />

      <SaveToProjectDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        artifactType="product-backlog"
        artifactName={selectedProject?.name ? `${selectedProject.name} - Backlog` : 'Product Backlog'}
        artifactDescription="Product backlog items exported from the backlog tool"
        artifactData={{ items: backlogItems }}
        preselectedProjectId={selectedProjectId}
        onSaveComplete={handleSaveComplete}
      />
    </div>
  );
};

export default ProductBacklog;
