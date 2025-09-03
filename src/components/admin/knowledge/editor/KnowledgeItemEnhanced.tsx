import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Book, AlertTriangle, Link, Users, Calendar } from 'lucide-react';

interface KnowledgeItemEnhancedProps {
  formData: {
    common_pitfalls: string[];
    evidence_sources: string[];
    related_techniques: string[];
    learning_value_summary: string;
    key_terminology: Record<string, string>;
    author: string;
    reference_url: string;
    publication_year: string;
  };
  onFormChange: (field: string, value: any) => void;
}

export const KnowledgeItemEnhanced = ({ formData, onFormChange }: KnowledgeItemEnhancedProps) => {
  const addArrayItem = (field: string) => {
    const currentArray = formData[field as keyof typeof formData] as string[];
    onFormChange(field, [...currentArray, '']);
  };

  const updateArrayItem = (field: string, index: number, value: string) => {
    const currentArray = formData[field as keyof typeof formData] as string[];
    const updatedArray = [...currentArray];
    updatedArray[index] = value;
    onFormChange(field, updatedArray);
  };

  const removeArrayItem = (field: string, index: number) => {
    const currentArray = formData[field as keyof typeof formData] as string[];
    const updatedArray = currentArray.filter((_, i) => i !== index);
    onFormChange(field, updatedArray);
  };

  const addTerminologyItem = () => {
    const newKey = `term_${Object.keys(formData.key_terminology).length + 1}`;
    onFormChange('key_terminology', {
      ...formData.key_terminology,
      [newKey]: ''
    });
  };

  const updateTerminologyItem = (oldKey: string, newKey: string, value: string) => {
    const updated = { ...formData.key_terminology };
    if (oldKey !== newKey) {
      delete updated[oldKey];
    }
    updated[newKey] = value;
    onFormChange('key_terminology', updated);
  };

  const removeTerminologyItem = (key: string) => {
    const updated = { ...formData.key_terminology };
    delete updated[key];
    onFormChange('key_terminology', updated);
  };

  return (
    <div className="space-y-6">
      {/* Author Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Author Information
          </CardTitle>
          <CardDescription>
            Source and attribution details for this knowledge item
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => onFormChange('author', e.target.value)}
              placeholder="e.g., Alexander Osterwalder, Yves Pigneur"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reference_url">Reference URL</Label>
              <Input
                id="reference_url"
                type="url"
                value={formData.reference_url}
                onChange={(e) => onFormChange('reference_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
            
            <div>
              <Label htmlFor="publication_year">Publication Year</Label>
              <Input
                id="publication_year"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={formData.publication_year || ''}
                onChange={(e) => onFormChange('publication_year', e.target.value)}
                placeholder="2023"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Value Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Learning Value Summary
          </CardTitle>
          <CardDescription>
            Summarize the key learning value and benefits this technique provides
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.learning_value_summary}
            onChange={(e) => onFormChange('learning_value_summary', e.target.value)}
            placeholder="✅ Start from real customer insights, not assumptions&#10;✅ Expose and test risky assumptions early&#10;✅ Prioritise features that matter — based on Jobs, Pains, and Gains&#10;✅ Build stronger business cases or public sector proposals&#10;✅ Translate raw user research into clear, shareable product direction"
            rows={6}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Common Pitfalls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Common Pitfalls
          </CardTitle>
          <CardDescription>
            List typical mistakes or misapplications to help users avoid them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.common_pitfalls.map((pitfall, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={pitfall}
                onChange={(e) => updateArrayItem('common_pitfalls', index, e.target.value)}
                placeholder="e.g., Mapping assumed user needs instead of evidence-based ones"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeArrayItem('common_pitfalls', index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => addArrayItem('common_pitfalls')}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Pitfall
          </Button>
        </CardContent>
      </Card>

      {/* Evidence Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Evidence Sources
          </CardTitle>
          <CardDescription>
            Research papers, case studies, or authoritative sources that support this technique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.evidence_sources.map((source, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={source}
                onChange={(e) => updateArrayItem('evidence_sources', index, e.target.value)}
                placeholder="e.g., Osterwalder, A. & Pigneur, Y. (2014). Value Proposition Design"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeArrayItem('evidence_sources', index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => addArrayItem('evidence_sources')}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Evidence Source
          </Button>
        </CardContent>
      </Card>

      {/* Related Techniques */}
      <Card>
        <CardHeader>
          <CardTitle>Related Techniques</CardTitle>
          <CardDescription>
            Other techniques that complement or relate to this one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.related_techniques.map((technique, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={technique}
                onChange={(e) => updateArrayItem('related_techniques', index, e.target.value)}
                placeholder="e.g., Empathy Map, Customer Journey Map, Impact Mapping"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeArrayItem('related_techniques', index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => addArrayItem('related_techniques')}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Related Technique
          </Button>
        </CardContent>
      </Card>

      {/* Key Terminology */}
      <Card>
        <CardHeader>
          <CardTitle>Key Terminology</CardTitle>
          <CardDescription>
            Define important terms and concepts related to this technique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(formData.key_terminology).map(([key, value]) => (
            <div key={key} className="grid grid-cols-5 gap-2">
              <div className="col-span-2">
                <Input
                  value={key}
                  onChange={(e) => updateTerminologyItem(key, e.target.value, value)}
                  placeholder="Term"
                />
              </div>
              <div className="col-span-2">
                <Input
                  value={value}
                  onChange={(e) => updateTerminologyItem(key, key, e.target.value)}
                  placeholder="Definition"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeTerminologyItem(key)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addTerminologyItem}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Term
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};