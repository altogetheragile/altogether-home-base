import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Plus, X, BookOpen, AlertTriangle, Link, Lightbulb, Hash, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { KnowledgeItemFormData } from '@/schemas/knowledgeItem';

export const EnhancedSection: React.FC = () => {
  const form = useFormContext<KnowledgeItemFormData>();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const addArrayItem = (fieldName: keyof KnowledgeItemFormData) => {
    const currentValue = form.getValues(fieldName) as string[] || [];
    form.setValue(fieldName, [...currentValue, ''] as any);
  };

  const updateArrayItem = (fieldName: keyof KnowledgeItemFormData, index: number, value: string) => {
    const currentValue = form.getValues(fieldName) as string[] || [];
    const updatedArray = [...currentValue];
    updatedArray[index] = value;
    form.setValue(fieldName, updatedArray as any);
  };

  const removeArrayItem = (fieldName: keyof KnowledgeItemFormData, index: number) => {
    const currentValue = form.getValues(fieldName) as string[] || [];
    const updatedArray = currentValue.filter((_, i) => i !== index);
    form.setValue(fieldName, updatedArray as any);
  };

  const addTerminologyItem = () => {
    const currentValue = form.getValues('key_terminology') || {};
    const newKey = `term_${Object.keys(currentValue).length + 1}`;
    form.setValue('key_terminology', { ...currentValue, [newKey]: '' });
  };

  const updateTerminologyItem = (oldKey: string, newKey: string, value: string) => {
    const currentValue = form.getValues('key_terminology') || {};
    const updated = { ...currentValue };
    if (oldKey !== newKey) {
      delete updated[oldKey];
    }
    updated[newKey] = value;
    form.setValue('key_terminology', updated);
  };

  const removeTerminologyItem = (key: string) => {
    const currentValue = form.getValues('key_terminology') || {};
    const updated = { ...currentValue };
    delete updated[key];
    form.setValue('key_terminology', updated);
  };

  const watchedValues = form.watch(['common_pitfalls', 'evidence_sources', 'related_techniques', 'key_terminology']);
  const [commonPitfalls, evidenceSources, relatedTechniques, keyTerminology] = watchedValues;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Enhanced Information
        </h3>
      </div>

      {/* Learning Value Summary - Always visible */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Learning Value Summary
          </CardTitle>
          <CardDescription>
            Summarize the key learning value and benefits of this knowledge item
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="learning_value_summary"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Describe the key learning value, benefits, and outcomes..."
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Explain what learners will gain from this knowledge item
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Collapsible Additional Fields */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            Additional Enhanced Fields
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Common Pitfalls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Common Pitfalls
            </CardTitle>
            <CardDescription>
              List common mistakes or pitfalls to avoid
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(commonPitfalls || []).map((pitfall: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  value={pitfall}
                  onChange={(e) => updateArrayItem('common_pitfalls', index, e.target.value)}
                  placeholder={`Pitfall ${index + 1}`}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeArrayItem('common_pitfalls', index)}
                  className="shrink-0 self-start"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
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
            <CardTitle className="text-base flex items-center gap-2">
              <Link className="h-4 w-4" />
              Evidence Sources
            </CardTitle>
            <CardDescription>
              Add supporting evidence, research, or sources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(evidenceSources || []).map((source: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  value={source}
                  onChange={(e) => updateArrayItem('evidence_sources', index, e.target.value)}
                  placeholder={`Evidence source ${index + 1}`}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeArrayItem('evidence_sources', index)}
                  className="shrink-0 self-start"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
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
            <CardTitle className="text-base flex items-center gap-2">
              <Link className="h-4 w-4" />
              Related Techniques
            </CardTitle>
            <CardDescription>
              List related techniques or methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(relatedTechniques || []).map((technique: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={technique}
                  onChange={(e) => updateArrayItem('related_techniques', index, e.target.value)}
                  placeholder={`Related technique ${index + 1}`}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeArrayItem('related_techniques', index)}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
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
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Key Terminology
            </CardTitle>
            <CardDescription>
              Define important terms and concepts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3">
              {Object.entries(keyTerminology || {}).map(([key, value]) => (
                <div key={key} className="grid grid-cols-5 gap-2 items-start">
                  <Input
                    value={key}
                    onChange={(e) => updateTerminologyItem(key, e.target.value, value as string)}
                    placeholder="Term"
                    className="col-span-2"
                  />
                  <Input
                    value={value as string}
                    onChange={(e) => updateTerminologyItem(key, key, e.target.value)}
                    placeholder="Definition"
                    className="col-span-2"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeTerminologyItem(key)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTerminologyItem}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Term
            </Button>
          </CardContent>
        </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};