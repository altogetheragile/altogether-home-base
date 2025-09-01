import { FolderOpen, Layers, Target } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { usePlanningLayers } from '@/hooks/usePlanningLayers';
import { useActivityDomains } from '@/hooks/useActivityDomains';

interface KnowledgeItemClassificationProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export const KnowledgeItemClassification = ({
  formData,
  onFormChange
}: KnowledgeItemClassificationProps) => {
  const { data: categories } = useKnowledgeCategories();
  const { data: planningLayers } = usePlanningLayers();
  const { data: domains } = useActivityDomains();

  const selectedCategory = categories?.find(c => c.id === formData.category_id);
  const selectedLayer = planningLayers?.find(l => l.id === formData.planning_layer_id);
  const selectedDomain = domains?.find(d => d.id === formData.domain_id);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Classification
        </h3>
        <p className="text-sm text-muted-foreground">
          Organize this knowledge item with categories, layers, and domains
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Category
            </CardTitle>
            <CardDescription>
              Choose the primary category for this knowledge item
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={formData.category_id}
              onValueChange={(value) => onFormChange('category_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.filter(category => category.id && category.id.trim() !== '')?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedCategory && (
              <div className="mt-2">
                <Badge 
                  variant="secondary"
                  style={{ 
                    backgroundColor: `${selectedCategory.color}15`, 
                    color: selectedCategory.color,
                    borderColor: `${selectedCategory.color}30`
                  }}
                >
                  {selectedCategory.name}
                </Badge>
                {selectedCategory.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCategory.description}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Planning Layer
            </CardTitle>
            <CardDescription>
              Select the planning level this knowledge item belongs to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={formData.planning_layer_id}
              onValueChange={(value) => onFormChange('planning_layer_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a planning layer" />
              </SelectTrigger>
              <SelectContent>
                {planningLayers
                  ?.filter(layer => layer.id && layer.id.trim() !== '')
                  ?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                  ?.map((layer) => (
                  <SelectItem key={layer.id} value={layer.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: layer.color }}
                      />
                      {layer.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedLayer && (
              <div className="mt-2">
                <Badge 
                  variant="outline"
                  style={{ 
                    borderColor: selectedLayer.color, 
                    color: selectedLayer.color 
                  }}
                >
                  {selectedLayer.name}
                </Badge>
                {selectedLayer.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedLayer.description}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Activity Domain
            </CardTitle>
            <CardDescription>
              Choose the domain of activity this knowledge applies to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={formData.domain_id}
              onValueChange={(value) => onFormChange('domain_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an activity domain" />
              </SelectTrigger>
              <SelectContent>
                {domains?.filter(domain => domain.id && domain.id.trim() !== '')?.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: domain.color }}
                      />
                      {domain.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedDomain && (
              <div className="mt-2">
                <Badge 
                  variant="outline"
                  style={{ 
                    borderColor: selectedDomain.color, 
                    color: selectedDomain.color 
                  }}
                >
                  {selectedDomain.name}
                </Badge>
                {selectedDomain.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedDomain.description}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Classification Summary */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Classification Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <Badge 
                variant="secondary"
                style={{ 
                  backgroundColor: `${selectedCategory.color}15`, 
                  color: selectedCategory.color
                }}
              >
                {selectedCategory.name}
              </Badge>
            )}
            {selectedLayer && (
              <Badge 
                variant="outline"
                style={{ 
                  borderColor: selectedLayer.color, 
                  color: selectedLayer.color 
                }}
              >
                {selectedLayer.name}
              </Badge>
            )}
            {selectedDomain && (
              <Badge 
                variant="outline"
                style={{ 
                  borderColor: selectedDomain.color, 
                  color: selectedDomain.color 
                }}
              >
                {selectedDomain.name}
              </Badge>
            )}
            {!selectedCategory && !selectedLayer && !selectedDomain && (
              <p className="text-sm text-muted-foreground">No classification selected</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};