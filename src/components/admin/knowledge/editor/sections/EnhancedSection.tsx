import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const EnhancedSection: React.FC = () => {
  const form = useFormContext();
  const { control, getValues, setValue, watch } = form;

  // Field arrays for additional enhanced fields (excluding Learning Value Summary)
  const pitfalls = useFieldArray({ control, name: 'common_pitfalls' as const });
  const evidence = useFieldArray({ control, name: 'evidence_sources' as const });
  const techniques = useFieldArray({ control, name: 'related_techniques' as const });

  // Key terminology helpers (record<string, string>)
  const terminology = (watch('key_terminology') as Record<string, string>) || {};

  const addTerminologyItem = () => {
    const current = getValues('key_terminology') as Record<string, string> | undefined;
    const obj = { ...(current || {}) } as Record<string, string>;
    let i = 1;
    let key = `new_term_${i}`;
    while (obj[key] !== undefined) {
      i += 1;
      key = `new_term_${i}`;
    }
    obj[key] = '';
    setValue('key_terminology', obj, { shouldDirty: true });
  };

  const updateTerminologyItem = (oldKey: string, newKey: string, value: string, which: 'key' | 'value') => {
    const current = (getValues('key_terminology') as Record<string, string>) || {};
    const next: Record<string, string> = {};
    Object.entries(current).forEach(([k, v]) => {
      if (k === oldKey) {
        const finalKey = which === 'key' ? newKey : oldKey;
        const finalVal = which === 'value' ? value : v;
        next[finalKey] = finalVal;
      } else {
        next[k] = v;
      }
    });
    setValue('key_terminology', next, { shouldDirty: true });
  };

  const removeTerminologyItem = (key: string) => {
    const current = (getValues('key_terminology') as Record<string, string>) || {};
    const { [key]: _, ...rest } = current;
    setValue('key_terminology', rest, { shouldDirty: true });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Additional Enhanced Fields</h2>
        <p className="text-muted-foreground">Manage pitfalls, evidence, related techniques, and terminology</p>
      </div>

      {/* Common Pitfalls */}
      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Common Pitfalls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pitfalls.fields.map((field, index) => (
            <FormField
              key={field.id}
              control={control}
              name={`common_pitfalls.${index}` as const}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Pitfall {index + 1}</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="Describe a common mistake…" {...field} />
                    </FormControl>
                    <Button type="button" variant="destructive" onClick={() => pitfalls.remove(index)}>
                      Remove
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button type="button" variant="secondary" onClick={() => pitfalls.append('')}>
            Add Pitfall
          </Button>
        </CardContent>
      </Card>

      {/* Evidence Sources */}
      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Evidence Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {evidence.fields.map((field, index) => (
            <FormField
              key={field.id}
              control={control}
              name={`evidence_sources.${index}` as const}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Source {index + 1}</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="Add a citation, link, or reference…" {...field} />
                    </FormControl>
                    <Button type="button" variant="destructive" onClick={() => evidence.remove(index)}>
                      Remove
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button type="button" variant="secondary" onClick={() => evidence.append('')}>
            Add Source
          </Button>
        </CardContent>
      </Card>

      {/* Related Techniques */}
      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Related Techniques</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {techniques.fields.map((field, index) => (
            <FormField
              key={field.id}
              control={control}
              name={`related_techniques.${index}` as const}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Technique {index + 1}</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="Enter a related technique…" {...field} />
                    </FormControl>
                    <Button type="button" variant="destructive" onClick={() => techniques.remove(index)}>
                      Remove
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button type="button" variant="secondary" onClick={() => techniques.append('')}>
            Add Technique
          </Button>
        </CardContent>
      </Card>

      {/* Key Terminology */}
      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Key Terminology</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(terminology).map(([term, definition]) => (
            <div key={term} className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  placeholder="Term"
                  value={term}
                  onChange={(e) => updateTerminologyItem(term, e.target.value, definition, 'key')}
                />
                <Input
                  placeholder="Definition"
                  value={definition}
                  onChange={(e) => updateTerminologyItem(term, term, e.target.value, 'value')}
                />
              </div>
              <div>
                <Button type="button" variant="destructive" onClick={() => removeTerminologyItem(term)}>
                  Remove Term
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={addTerminologyItem}>
            Add Term
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
