import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Trash2 } from 'lucide-react';

interface KnowledgeItemDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeItemId: string;
  knowledgeItemData: {
    name: string;
    slug: string;
    description?: string;
    domain_name?: string;
    domain_color?: string;
    planning_focus_name?: string;
    planning_focus_color?: string;
    category_name?: string;
  };
  onRemove: () => void;
}

export const KnowledgeItemDetailsDialog: React.FC<KnowledgeItemDetailsDialogProps> = ({
  isOpen,
  onClose,
  knowledgeItemData,
  onRemove,
}) => {
  const navigate = useNavigate();

  const handleViewFullDetails = () => {
    navigate(`/knowledge/${knowledgeItemData.slug}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{knowledgeItemData.name}</DialogTitle>
          <DialogDescription>
            Knowledge item details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {knowledgeItemData.domain_name && (
              <Badge
                variant="outline"
                style={{
                  borderColor: knowledgeItemData.domain_color,
                  color: knowledgeItemData.domain_color,
                }}
              >
                {knowledgeItemData.domain_name}
              </Badge>
            )}
            {knowledgeItemData.planning_focus_name && (
              <Badge
                variant="outline"
                style={{
                  borderColor: knowledgeItemData.planning_focus_color,
                  color: knowledgeItemData.planning_focus_color,
                }}
              >
                {knowledgeItemData.planning_focus_name}
              </Badge>
            )}
            {knowledgeItemData.category_name && (
              <Badge variant="secondary">
                {knowledgeItemData.category_name}
              </Badge>
            )}
          </div>

          {/* Description */}
          {knowledgeItemData.description && (
            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground line-clamp-4">
                {knowledgeItemData.description}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            onClick={onRemove}
            className="w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove from Canvas
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleViewFullDetails}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Details
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
