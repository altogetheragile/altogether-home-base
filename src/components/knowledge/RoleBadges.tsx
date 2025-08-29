import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface RoleBadgesProps {
  roles: string[];
  maxVisible?: number;
  className?: string;
}

export const RoleBadges = ({ roles, maxVisible = 3, className }: RoleBadgesProps) => {
  if (!roles || roles.length === 0) return null;

  const visibleRoles = roles.slice(0, maxVisible);
  const remainingCount = roles.length - maxVisible;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Users className="h-3 w-3 text-primary flex-shrink-0" />
      <div className="flex items-center gap-1 flex-wrap">
        {visibleRoles.map((role, index) => (
          <Badge 
            key={index}
            variant="secondary" 
            className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20 font-medium"
          >
            {role}
          </Badge>
        ))}
        {remainingCount > 0 && (
          <Badge 
            variant="secondary" 
            className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground font-medium"
          >
            +{remainingCount}
          </Badge>
        )}
      </div>
    </div>
  );
};