import { useFormContext } from 'react-hook-form';
import { FolderOpen, Layers, Target, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { usePlanningFocuses } from '@/hooks/usePlanningFocuses';
import { useActivityDomains } from '@/hooks/useActivityDomains';
import { KnowledgeItemFormData } from '@/schemas/knowledgeItem';

export const ClassificationSection: React.FC = () => {
  const form = useFormContext<KnowledgeItemFormData>();
  const { data: categories } = useKnowledgeCategories();
  const { data: planningFocuses } = usePlanningFocuses();
  const { data: domains } = useActivityDomains();

  const watchedValues = form.watch(['category_id', 'planning_focus_id', 'domain_id']);
  const [categoryId, focusId, domainId] = watchedValues;

  const selectedCategory = categories?.find(c => c.id === categoryId);
  const selectedFocus = planningFocuses?.find(l => l.id === focusId);
  const selectedDomain = domains?.find(d => d.id === domainId);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Classification & Organization</h2>
            <p className="text-muted-foreground">Categorize and organize this knowledge item for better discoverability</p>
          </div>
        </div>
      </div>

      {/* Classification Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-all duration-200 group">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 group-hover:text-primary transition-colors">
              <div className="p-1.5 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                <FolderOpen className="h-4 w-4 text-primary" />
              </div>
              Category
            </CardTitle>
            <CardDescription className="text-sm">
              Choose the primary category that best describes this knowledge item
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 border-border/60 focus:border-primary transition-colors">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover/95 backdrop-blur-sm">
                        {categories?.filter(category => category.id && category.id.trim() !== '')?.map((category) => (
                          <SelectItem key={category.id} value={category.id} className="hover:bg-accent/50">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full border border-white/20"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="font-medium">{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedCategory && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border/30">
                <Badge 
                  variant="secondary"
                  className="mb-2 font-medium"
                  style={{ 
                    backgroundColor: `${selectedCategory.color}15`, 
                    color: selectedCategory.color,
                    borderColor: `${selectedCategory.color}30`
                  }}
                >
                  {selectedCategory.name}
                </Badge>
                {selectedCategory.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedCategory.description}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 hover:shadow-md transition-all duration-200 group">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 group-hover:text-primary transition-colors">
              <div className="p-1.5 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              Planning Focus
            </CardTitle>
            <CardDescription className="text-sm">
              Select the planning layer where this knowledge item is most applicable
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="planning_focus_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 border-border/60 focus:border-primary transition-colors">
                        <SelectValue placeholder="Select a planning focus" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover/95 backdrop-blur-sm">
                        {planningFocuses
                          ?.filter(focus => focus.id && focus.id.trim() !== '')
                          ?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                          ?.map((focus) => (
                          <SelectItem key={focus.id} value={focus.id} className="hover:bg-accent/50">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full border border-white/20"
                                style={{ backgroundColor: focus.color }}
                              />
                              <span className="font-medium">{focus.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedFocus && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border/30">
                <Badge 
                  variant="outline"
                  className="mb-2 font-medium"
                  style={{ 
                    borderColor: selectedFocus.color, 
                    color: selectedFocus.color 
                  }}
                >
                  {selectedFocus.name}
                </Badge>
                {selectedFocus.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedFocus.description}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 hover:shadow-md transition-all duration-200 group">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 group-hover:text-primary transition-colors">
              <div className="p-1.5 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                <Target className="h-4 w-4 text-primary" />
              </div>
              Activity Domain
            </CardTitle>
            <CardDescription className="text-sm">
              Choose the domain where this knowledge is most relevant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="domain_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 border-border/60 focus:border-primary transition-colors">
                        <SelectValue placeholder="Select an activity domain" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover/95 backdrop-blur-sm">
                        {domains?.filter(domain => domain.id && domain.id.trim() !== '')?.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id} className="hover:bg-accent/50">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full border border-white/20"
                                style={{ backgroundColor: domain.color }}
                              />
                              <span className="font-medium">{domain.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedDomain && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border/30">
                <Badge 
                  variant="outline"
                  className="mb-2 font-medium"
                  style={{ 
                    borderColor: selectedDomain.color, 
                    color: selectedDomain.color 
                  }}
                >
                  {selectedDomain.name}
                </Badge>
                {selectedDomain.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedDomain.description}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Classification Summary */}
      <Card className="bg-gradient-to-r from-muted/30 to-muted/50 border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Classification Summary
          </CardTitle>
          <CardDescription>
            Review your selected classifications for this knowledge item
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {selectedCategory && (
              <Badge 
                variant="secondary"
                className="px-3 py-1.5 font-medium text-sm"
                style={{ 
                  backgroundColor: `${selectedCategory.color}15`, 
                  color: selectedCategory.color,
                  borderColor: `${selectedCategory.color}30`
                }}
              >
                <FolderOpen className="h-3 w-3 mr-1.5" />
                {selectedCategory.name}
              </Badge>
            )}
            {selectedFocus && (
              <Badge 
                variant="outline"
                className="px-3 py-1.5 font-medium text-sm"
                style={{ 
                  borderColor: selectedFocus.color, 
                  color: selectedFocus.color 
                }}
              >
                <Layers className="h-3 w-3 mr-1.5" />
                {selectedFocus.name}
              </Badge>
            )}
            {selectedDomain && (
              <Badge 
                variant="outline"
                className="px-3 py-1.5 font-medium text-sm"
                style={{ 
                  borderColor: selectedDomain.color, 
                  color: selectedDomain.color 
                }}
              >
                <Target className="h-3 w-3 mr-1.5" />
                {selectedDomain.name}
              </Badge>
            )}
            {!selectedCategory && !selectedFocus && !selectedDomain && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <Sparkles className="h-3 w-3" />
                </div>
                <p className="text-sm">No classifications selected yet</p>
              </div>
            )}
          </div>
          
          {(selectedCategory || selectedFocus || selectedDomain) && (
            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-xs text-primary/80 leading-relaxed">
                These classifications help users discover your content through search and filtering. 
                They also enable automatic recommendations and related content suggestions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};