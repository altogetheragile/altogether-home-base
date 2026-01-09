import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FileText, Target, Users, FolderOpen, Lightbulb, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';
import { EditableListField } from './EditableListField';
import { PrimaryClassificationPicker } from './PrimaryClassificationPicker';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { useActivityDomains } from '@/hooks/useActivityDomains';
import { useDecisionLevels } from '@/hooks/useDecisionLevels';
import { ITEM_TYPES } from '@/schemas/knowledgeItem';

interface KnowledgeEditViewProps {
  isNewItem?: boolean;
}

export const KnowledgeEditView: React.FC<KnowledgeEditViewProps> = ({ isNewItem }) => {
  const form = useFormContext();
  const { data: categories, isLoading: categoriesLoading } = useKnowledgeCategories();
  const { data: decisionLevels, isLoading: levelsLoading } = useDecisionLevels();
  const { data: domains, isLoading: domainsLoading } = useActivityDomains();

  // Watch form values
  const categoryIds = form.watch('category_ids') || [];
  const decisionLevelIds = form.watch('decision_level_ids') || [];
  const domainIds = form.watch('domain_ids') || [];
  const useThisWhen = form.watch('use_this_when') || [];
  const avoidWhen = form.watch('avoid_when') || [];
  const decisionsSupported = form.watch('decisions_supported') || [];
  const whatGoodLooksLike = form.watch('what_good_looks_like') || [];

  return (
    <div className="space-y-6">
      {/* Core Identification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Core Identification
          </CardTitle>
          <CardDescription>Basic information about this knowledge item</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Title *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="e.g., Impact Mapping"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item_type">Item Type</Label>
              <Select 
                value={form.watch('item_type') || 'technique'}
                onValueChange={(value) => form.setValue('item_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map(type => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Short Summary</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="A brief description visible to practitioners..."
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="why_it_exists">Why It Exists (internal)</Label>
            <Textarea
              id="why_it_exists"
              {...form.register('why_it_exists')}
              placeholder="Editor note: Why was this item added to the knowledge base?"
              rows={2}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">This field is for editors only and won't be shown to readers.</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Classifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PrimaryClassificationPicker
          title="Categories (Use-Cases)"
          description="When should this be used?"
          icon={FolderOpen}
          items={categories || []}
          selectedIds={categoryIds}
          primaryId={form.watch('primary_category_id')}
          rationale={form.watch('category_rationale')}
          onSelectionChange={(ids) => form.setValue('category_ids', ids)}
          onPrimaryChange={(id) => form.setValue('primary_category_id', id)}
          onRationaleChange={(r) => form.setValue('category_rationale', r)}
          isLoading={categoriesLoading}
        />
        
        <PrimaryClassificationPicker
          title="Decision Levels"
          description="Where does this apply?"
          icon={Target}
          items={decisionLevels || []}
          selectedIds={decisionLevelIds}
          primaryId={form.watch('primary_decision_level_id')}
          rationale={form.watch('decision_level_rationale')}
          onSelectionChange={(ids) => form.setValue('decision_level_ids', ids)}
          onPrimaryChange={(id) => form.setValue('primary_decision_level_id', id)}
          onRationaleChange={(r) => form.setValue('decision_level_rationale', r)}
          isLoading={levelsLoading}
        />
        
        <PrimaryClassificationPicker
          title="Domains of Interest"
          description="Who is typically involved?"
          icon={Users}
          items={domains || []}
          selectedIds={domainIds}
          primaryId={form.watch('primary_domain_id')}
          rationale={form.watch('domain_rationale')}
          onSelectionChange={(ids) => form.setValue('domain_ids', ids)}
          onPrimaryChange={(id) => form.setValue('primary_domain_id', id)}
          onRationaleChange={(r) => form.setValue('domain_rationale', r)}
          isLoading={domainsLoading}
        />
      </div>

      <Separator />

      {/* Use-Case Guidance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4" />
            Use-Case Guidance
          </CardTitle>
          <CardDescription>Help practitioners know when to use this</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <EditableListField
              label="Use this when..."
              description="Conditions that make this a good choice"
              items={useThisWhen}
              onChange={(items) => form.setValue('use_this_when', items)}
              placeholder="Enter a condition..."
            />
          </div>
          
          <div className="space-y-4">
            <EditableListField
              label="Avoid using when..."
              description="Conditions that suggest alternatives"
              items={avoidWhen}
              onChange={(items) => form.setValue('avoid_when', items)}
              placeholder="Enter a condition..."
            />
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="typical_output">Typical Output</Label>
            <Textarea
              id="typical_output"
              {...form.register('typical_output')}
              placeholder="e.g., A visual map linking outcomes → impacts → deliverables"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Governance & Decisions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4" />
            Governance & Decision Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableListField
            label="Decisions Supported"
            description="What decisions does this help with?"
            items={decisionsSupported}
            onChange={(items) => form.setValue('decisions_supported', items)}
            placeholder="e.g., Which initiatives are most likely to achieve desired outcomes"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="decision_boundaries">Decision Boundaries</Label>
              <Textarea
                id="decision_boundaries"
                {...form.register('decision_boundaries')}
                placeholder="e.g., Does not commit teams to delivery"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="governance_value">Governance Value</Label>
              <Textarea
                id="governance_value"
                {...form.register('governance_value')}
                placeholder="e.g., Improves transparency and reduces misaligned work"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Good Looks Like */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            What Good Looks Like
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditableListField
            label="Benefits & Success Indicators"
            description="Signs of successful application"
            items={whatGoodLooksLike}
            onChange={(items) => form.setValue('what_good_looks_like', items)}
            placeholder="e.g., Clear line of sight from outcomes to work"
          />
        </CardContent>
      </Card>
    </div>
  );
};
