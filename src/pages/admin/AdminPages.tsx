import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePages } from '@/hooks/usePages';
import { usePageMutations } from '@/hooks/usePageMutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, ExternalLink, Eye } from 'lucide-react';

export default function AdminPages() {
  const { data: pages, isLoading } = usePages();
  const { createPage, deletePage } = usePageMutations();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPageForm, setNewPageForm] = useState({
    title: '',
    slug: '',
    description: '',
  });

  const handleCreatePage = () => {
    createPage.mutate(newPageForm, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setNewPageForm({ title: '', slug: '', description: '' });
      },
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setNewPageForm(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Pages</h1>
          <p className="text-muted-foreground">Manage your website pages and content</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Page
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Page</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="page-title">Page Title</Label>
                <Input
                  id="page-title"
                  value={newPageForm.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="About Us"
                />
              </div>
              <div>
                <Label htmlFor="page-slug">URL Slug</Label>
                <Input
                  id="page-slug"
                  value={newPageForm.slug}
                  onChange={(e) => setNewPageForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="about-us"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Will be accessible at: /{newPageForm.slug}
                </p>
              </div>
              <div>
                <Label htmlFor="page-description">Description (Optional)</Label>
                <Input
                  id="page-description"
                  value={newPageForm.description}
                  onChange={(e) => setNewPageForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the page"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePage} disabled={!newPageForm.title || !newPageForm.slug}>
                Create Page
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages?.map((page) => (
          <Card key={page.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{page.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">/{page.slug}</p>
                </div>
                <Badge variant={page.is_published ? 'default' : 'secondary'}>
                  {page.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              {page.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {page.description}
                </p>
              )}
              
              <div className="flex items-center gap-2">
                <Button asChild size="sm" className="flex items-center gap-1">
                  <Link to={`/admin/pages/${page.id}/edit`}>
                    <Edit className="h-3 w-3" />
                    Edit
                  </Link>
                </Button>
                
                <Button asChild size="sm" variant="outline" className="flex items-center gap-1">
                  <Link to={`/${page.slug}`} target="_blank">
                    <ExternalLink className="h-3 w-3" />
                    View
                  </Link>
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="flex items-center gap-1 text-destructive hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Page</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{page.title}"? This action cannot be undone
                        and will remove all content blocks associated with this page.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deletePage.mutate(page.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete Page
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              
              <div className="text-xs text-muted-foreground mt-3">
                Last updated: {new Date(page.updated_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pages && pages.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No pages yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first page to get started with content management.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Page
          </Button>
        </div>
      )}
    </div>
  );
}