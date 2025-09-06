import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ExternalLink } from "lucide-react";
import { usePublications } from "@/hooks/usePublications";
import { useState } from "react";

interface KnowledgeItemPublicationProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export const KnowledgeItemPublication = ({ formData, onFormChange }: KnowledgeItemPublicationProps) => {
  const { data: publications } = usePublications();
  const [showNewPublication, setShowNewPublication] = useState(false);
  const [newPublication, setNewPublication] = useState({
    title: '',
    publication_type: 'website',
    url: '',
    publication_year: new Date().getFullYear(),
  });

  const selectedPublication = publications?.find(p => p.id === formData.primary_publication_id);

  const handleCreatePublication = async () => {
    // This would create a new publication and select it
    // For now, we'll just show a placeholder
    console.log('Creating publication:', newPublication);
    setShowNewPublication(false);
    setNewPublication({ title: '', publication_type: 'website', url: '', publication_year: new Date().getFullYear() });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Primary Publication
          {selectedPublication?.url && (
            <Button variant="ghost" size="sm" asChild>
              <a href={selectedPublication.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="primary_publication">Select Publication</Label>
          <div className="flex gap-2">
            <Select
              value={formData.primary_publication_id || ''}
              onValueChange={(value) => onFormChange('primary_publication_id', value)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose a publication..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No publication selected</SelectItem>
                {publications?.map((publication) => (
                  <SelectItem key={publication.id} value={publication.id}>
                    {publication.title} ({publication.publication_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewPublication(!showNewPublication)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showNewPublication && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium">Create New Publication</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new_title">Title</Label>
                <Input
                  id="new_title"
                  value={newPublication.title}
                  onChange={(e) => setNewPublication(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Publication title..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_type">Type</Label>
                <Select
                  value={newPublication.publication_type}
                  onValueChange={(value) => setNewPublication(prev => ({ ...prev, publication_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="book">Book</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="paper">Research Paper</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="blog">Blog Post</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="podcast">Podcast</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new_url">URL</Label>
                <Input
                  id="new_url"
                  type="url"
                  value={newPublication.url}
                  onChange={(e) => setNewPublication(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_year">Publication Year</Label>
                <Input
                  id="new_year"
                  type="number"
                  value={newPublication.publication_year}
                  onChange={(e) => setNewPublication(prev => ({ ...prev, publication_year: parseInt(e.target.value) }))}
                  min="1900"
                  max="2030"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={handleCreatePublication} size="sm">
                Create Publication
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowNewPublication(false)} size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {selectedPublication && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Selected Publication Details</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedPublication.publication_type}</Badge>
                {selectedPublication.publication_year && (
                  <Badge variant="outline">{selectedPublication.publication_year}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{selectedPublication.title}</p>
              {selectedPublication.publication_authors?.length > 0 && (
                <p className="text-sm">
                  <strong>Authors:</strong> {selectedPublication.publication_authors.map(pa => pa.authors.name).join(', ')}
                </p>
              )}
              {selectedPublication.publisher && (
                <p className="text-sm">
                  <strong>Publisher:</strong> {selectedPublication.publisher}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};