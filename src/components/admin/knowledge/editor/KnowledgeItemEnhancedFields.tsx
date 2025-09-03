import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, BookOpen, Link, GraduationCap, Plus, X, 
  Lightbulb, User, ExternalLink, Calendar
} from 'lucide-react';

interface KnowledgeItemEnhancedFieldsProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export const KnowledgeItemEnhancedFields = ({
  formData,
  onFormChange
}: KnowledgeItemEnhancedFieldsProps) => {
  const [newPitfall, setNewPitfall] = useState('');
  const [newEvidenceSource, setNewEvidenceSource] = useState('');
  const [newRelatedTechnique, setNewRelatedTechnique] = useState('');
  const [newTermKey, setNewTermKey] = useState('');
  const [newTermValue, setNewTermValue] = useState('');

  const addPitfall = () => {
    if (newPitfall.trim()) {
      const pitfalls = formData.common_pitfalls || [];
      onFormChange('common_pitfalls', [...pitfalls, newPitfall.trim()]);
      setNewPitfall('');
    }
  };

  const removePitfall = (index: number) => {
    const pitfalls = formData.common_pitfalls || [];
    onFormChange('common_pitfalls', pitfalls.filter((_, i) => i !== index));
  };

  const addEvidenceSource = () => {
    if (newEvidenceSource.trim()) {
      const sources = formData.evidence_sources || [];
      onFormChange('evidence_sources', [...sources, newEvidenceSource.trim()]);
      setNewEvidenceSource('');
    }
  };

  const removeEvidenceSource = (index: number) => {
    const sources = formData.evidence_sources || [];
    onFormChange('evidence_sources', sources.filter((_, i) => i !== index));
  };

  const addRelatedTechnique = () => {
    if (newRelatedTechnique.trim()) {
      const techniques = formData.related_techniques || [];
      onFormChange('related_techniques', [...techniques, newRelatedTechnique.trim()]);
      setNewRelatedTechnique('');
    }
  };

  const removeRelatedTechnique = (index: number) => {
    const techniques = formData.related_techniques || [];
    onFormChange('related_techniques', techniques.filter((_, i) => i !== index));
  };

  const addTerminology = () => {
    if (newTermKey.trim() && newTermValue.trim()) {
      const terminology = formData.key_terminology || {};
      onFormChange('key_terminology', {
        ...terminology,
        [newTermKey.trim()]: newTermValue.trim()
      });
      setNewTermKey('');
      setNewTermValue('');
    }
  };

  const removeTerminology = (key: string) => {
    const terminology = formData.key_terminology || {};
    const newTerminology = { ...terminology };
    delete newTerminology[key];
    onFormChange('key_terminology', newTerminology);
  };

  return (
    <div className="space-y-6">
      {/* Learning Value Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Learning Value Summary
          </CardTitle>
          <CardDescription>
            A concise summary of what users will gain from this knowledge
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="learning_value_summary">Summary</Label>
            <Textarea
              id="learning_value_summary"
              value={formData.learning_value_summary || ''}
              onChange={(e) => onFormChange('learning_value_summary', e.target.value)}
              placeholder="Describe the key learning outcomes and benefits users will get from this knowledge item..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Source and Attribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5" />
            Source & Attribution
          </CardTitle>
          <CardDescription>
            Information about the source and authorship of this content
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={formData.author || ''}
              onChange={(e) => onFormChange('author', e.target.value)}
              placeholder="Author or creator name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="publication_year">Publication Year</Label>
            <Input
              id="publication_year"
              value={formData.publication_year || ''}
              onChange={(e) => onFormChange('publication_year', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="2024"
              type="number"
              min="1900"
              max="2030"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="reference_url">Reference URL</Label>
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <Input
                id="reference_url"
                value={formData.reference_url || ''}
                onChange={(e) => onFormChange('reference_url', e.target.value)}
                placeholder="https://example.com/original-source"
                type="url"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Common Pitfalls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Common Pitfalls
            </CardTitle>
            <CardDescription>
              Typical mistakes or misunderstandings to avoid
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newPitfall}
                  onChange={(e) => setNewPitfall(e.target.value)}
                  placeholder="Describe a common pitfall..."
                  onKeyPress={(e) => e.key === 'Enter' && addPitfall()}
                />
                <Button onClick={addPitfall} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(formData.common_pitfalls || []).map((pitfall: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <span className="text-sm flex-1">{pitfall}</span>
                  <Button
                    onClick={() => removePitfall(index)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Evidence Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Evidence Sources
            </CardTitle>
            <CardDescription>
              Research, studies, or references that support this knowledge
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newEvidenceSource}
                  onChange={(e) => setNewEvidenceSource(e.target.value)}
                  placeholder="Add evidence source..."
                  onKeyPress={(e) => e.key === 'Enter' && addEvidenceSource()}
                />
                <Button onClick={addEvidenceSource} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(formData.evidence_sources || []).map((source: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <span className="text-sm flex-1">{source}</span>
                  <Button
                    onClick={() => removeEvidenceSource(index)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Related Techniques */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link className="h-5 w-5" />
              Related Techniques
            </CardTitle>
            <CardDescription>
              Other techniques, methods, or tools that connect to this knowledge
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newRelatedTechnique}
                  onChange={(e) => setNewRelatedTechnique(e.target.value)}
                  placeholder="Add related technique..."
                  onKeyPress={(e) => e.key === 'Enter' && addRelatedTechnique()}
                />
                <Button onClick={addRelatedTechnique} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {(formData.related_techniques || []).map((technique: string, index: number) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {technique}
                  <Button
                    onClick={() => removeRelatedTechnique(index)}
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Terminology */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Key Terminology
            </CardTitle>
            <CardDescription>
              Important terms and their definitions for this knowledge
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newTermKey}
                  onChange={(e) => setNewTermKey(e.target.value)}
                  placeholder="Term"
                  className="flex-1"
                />
                <Input
                  value={newTermValue}
                  onChange={(e) => setNewTermValue(e.target.value)}
                  placeholder="Definition"
                  className="flex-2"
                  onKeyPress={(e) => e.key === 'Enter' && addTerminology()}
                />
                <Button onClick={addTerminology} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Object.entries(formData.key_terminology || {}).map(([term, definition], index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{term}</h5>
                      <p className="text-sm text-muted-foreground">{String(definition)}</p>
                    </div>
                    <Button
                      onClick={() => removeTerminology(term)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};