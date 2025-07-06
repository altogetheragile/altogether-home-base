import React from 'react';
import { Link } from 'react-router-dom';
import { usePages } from '@/hooks/usePages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, ExternalLink } from 'lucide-react';

export default function AdminPages() {
  const { data: pages, isLoading } = usePages();

  // Filter to only show home page (slug is empty or "home")
  const homePage = pages?.find(page => page.slug === '' || page.slug === 'home');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Home Page Configuration</h1>
        <p className="text-muted-foreground">Configure your website's home page content</p>
      </div>

      {homePage ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{homePage.title}</CardTitle>
                <p className="text-sm text-muted-foreground">/{homePage.slug || 'home'}</p>
              </div>
              <Badge variant={homePage.is_published ? 'default' : 'secondary'}>
                {homePage.is_published ? 'Published' : 'Draft'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            {homePage.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {homePage.description}
              </p>
            )}
            
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="flex items-center gap-1">
                <Link to={`/admin/pages/${homePage.id}/edit`}>
                  <Edit className="h-3 w-3" />
                  Edit Home Page
                </Link>
              </Button>
              
              <Button asChild size="sm" variant="outline" className="flex items-center gap-1">
                <Link to={`/${homePage.slug || ''}`} target="_blank">
                  <ExternalLink className="h-3 w-3" />
                  View Home Page
                </Link>
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground mt-3">
              Last updated: {new Date(homePage.updated_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No home page found</h3>
          <p className="text-muted-foreground">
            Create a page with slug "home" or an empty slug to configure the home page.
          </p>
        </div>
      )}
    </div>
  );
}