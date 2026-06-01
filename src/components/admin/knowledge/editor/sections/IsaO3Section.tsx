import { useFormContext, useFieldArray } from 'react-hook-form';
import { Grid3x3, Link2, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
} from '@/components/ui/form';
import { useKnowledgeItems } from '@/hooks/useKnowledgeItems';
import { KnowledgeItemFormData } from '@/schemas/knowledgeItem';
import { HORIZONS, ISA, LAYERS, KINDS, PERSPECTIVES, horizonFromSlug } from '@/lib/isaO3';

const NONE = '__none__';

// A simple slug-based multi-select: current values shown as removable badges,
// plus a dropdown to add a slug not yet chosen. Options are knowledge items
// (optionally filtered by item_type), labelled by name.
function SlugMultiSelect({
  fieldName,
  label,
  description,
  options,
}: {
  fieldName: 'produces' | 'counterparts' | 'techniques';
  label: string;
  description: string;
  options: { slug: string; name: string }[];
}) {
  const form = useFormContext<KnowledgeItemFormData>();
  const selected: string[] = form.watch(fieldName) || [];
  const nameFor = (slug: string) => options.find((o) => o.slug === slug)?.name || slug;
  const available = options.filter((o) => !selected.includes(o.slug));

  const add = (slug: string) => {
    if (slug && slug !== NONE && !selected.includes(slug)) {
      form.setValue(fieldName, [...selected, slug], { shouldDirty: true });
    }
  };
  const remove = (slug: string) => {
    form.setValue(fieldName, selected.filter((s) => s !== slug), { shouldDirty: true });
  };

  return (
    <div className="space-y-2">
      <FormLabel className="text-sm font-medium">{label}</FormLabel>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {selected.length === 0 && (
          <span className="text-xs text-muted-foreground italic">None selected</span>
        )}
        {selected.map((slug) => (
          <Badge key={slug} variant="secondary" className="gap-1 pr-1">
            {nameFor(slug)}
            <button
              type="button"
              onClick={() => remove(slug)}
              className="rounded-full hover:bg-muted-foreground/20 p-0.5"
              aria-label={`Remove ${nameFor(slug)}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Select value={NONE} onValueChange={add}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Add..." />
        </SelectTrigger>
        <SelectContent>
          {available.length === 0 ? (
            <SelectItem value={NONE} disabled>
              Nothing to add
            </SelectItem>
          ) : (
            available.map((o) => (
              <SelectItem key={o.slug} value={o.slug}>
                {o.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

// A nullable single-select bound to a form field, with a "Not set" option.
function EnumSelect({
  fieldName,
  label,
  options,
}: {
  fieldName: 'horizon' | 'isa' | 'layer' | 'kind';
  label: string;
  options: readonly string[];
}) {
  const form = useFormContext<KnowledgeItemFormData>();
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">{label}</FormLabel>
          <Select
            value={field.value || NONE}
            onValueChange={(v) => field.onChange(v === NONE ? null : v)}
          >
            <FormControl>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={NONE}>Not set</SelectItem>
              {options.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
}

export const IsaO3Section: React.FC = () => {
  const form = useFormContext<KnowledgeItemFormData>();
  const { data: items } = useKnowledgeItems({ showUnpublished: true, limit: 500 });

  const allOptions = (items || [])
    .map((i) => ({ slug: i.slug, name: i.name, item_type: i.item_type }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const artifactOptions = allOptions.filter((o) => o.item_type === 'artifact');
  const techniqueOptions = allOptions.filter((o) => o.item_type === 'technique');

  const itemType = form.watch('item_type');
  const slug = form.watch('slug') || '';
  const horizon = form.watch('horizon');
  const derivedHorizon = horizonFromSlug(slug);
  const isArtifact = itemType === 'artifact';

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'components' as never,
  });

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Grid3x3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">ISA-O3 Placement</h2>
            <p className="text-muted-foreground">
              Where this item sits on the Value Horizons map, and its framework links
            </p>
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Dimensions</CardTitle>
          <CardDescription className="text-xs">
            Horizon, ISA and Layer position an artifact in a grid cell. Techniques can leave these unset.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EnumSelect fieldName="horizon" label="Horizon" options={HORIZONS} />
            <EnumSelect fieldName="isa" label="ISA Dimension" options={ISA} />
            <EnumSelect fieldName="layer" label="Layer" options={LAYERS} />
          </div>

          {derivedHorizon && horizon !== derivedHorizon && (
            <p className="text-xs text-amber-600">
              The slug prefix suggests horizon "{derivedHorizon}". Set it above if that is correct.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EnumSelect fieldName="kind" label="Kind" options={KINDS} />
            <FormField
              control={form.control}
              name="facet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Facet</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Anchoring facet, e.g. Identity"
                      className="h-10"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Anchoring artifacts only; leave blank otherwise
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="inheritable"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-center gap-2">
                  <FormLabel className="text-sm font-medium">Inheritable</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2 h-10">
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                      <span className="text-xs text-muted-foreground">
                        Anchoring cell may be inherited from the horizon above
                      </span>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            Framework Links
          </CardTitle>
          <CardDescription className="text-xs">
            Cross-links between artifacts and techniques. Stored as slugs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isArtifact ? (
            <>
              <SlugMultiSelect
                fieldName="techniques"
                label="Techniques"
                description="Techniques that produce this artifact"
                options={techniqueOptions}
              />
              <SlugMultiSelect
                fieldName="counterparts"
                label="Counterparts"
                description="Related artifacts at other horizons"
                options={artifactOptions}
              />
            </>
          ) : (
            <SlugMultiSelect
              fieldName="produces"
              label="Produces"
              description="Artifacts this technique helps produce"
              options={artifactOptions}
            />
          )}
        </CardContent>
      </Card>

      {/* Components */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Components</CardTitle>
          <CardDescription className="text-xs">
            The questions this artifact answers, each tagged with a perspective
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No components yet</p>
          )}
          {fields.map((f, index) => (
            <div key={f.id} className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_auto_auto] gap-3 items-end">
              <FormField
                control={form.control}
                name={`components.${index}.name` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Name</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="Component name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`components.${index}.question` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Question</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="Question it answers" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`components.${index}.perspective` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Perspective</FormLabel>
                    <Select value={field.value || NONE} onValueChange={(v) => field.onChange(v === NONE ? '' : v)}>
                      <FormControl>
                        <SelectTrigger className="h-9 w-[120px]">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>-</SelectItem>
                        {PERSPECTIVES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => remove(index)}
                aria-label="Remove component"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: '', question: '', perspective: '' })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Component
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
