import { Badge } from "@/components/ui/badge";

interface PlanningLayer {
  id: string;
  name: string;
  slug: string;
  color: string;
  display_order: number;
  is_primary?: boolean;
}

interface PlanningLayerBadgesProps {
  layers: PlanningLayer[];
  maxVisible?: number;
}

export const PlanningLayerBadges = ({ layers = [], maxVisible = 3 }: PlanningLayerBadgesProps) => {
  const sortedLayers = layers.sort((a, b) => a.display_order - b.display_order);
  const primaryLayer = sortedLayers.find(layer => layer.is_primary);
  const secondaryLayers = sortedLayers.filter(layer => !layer.is_primary);
  
  const visibleLayers = sortedLayers.slice(0, maxVisible);
  const remainingCount = layers.length - maxVisible;

  if (layers.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {visibleLayers.map((layer) => (
        <Badge 
          key={layer.id} 
          variant={layer.is_primary ? "default" : "secondary"}
          className="text-xs"
          style={{
            backgroundColor: layer.is_primary ? layer.color : undefined,
            borderColor: !layer.is_primary ? layer.color : undefined,
            color: !layer.is_primary ? layer.color : undefined,
          }}
        >
          <span 
            className="w-2 h-2 rounded-full mr-1" 
            style={{ backgroundColor: layer.is_primary ? 'white' : layer.color }}
          />
          {layer.name}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
};