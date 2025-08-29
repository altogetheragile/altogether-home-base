import { Link } from "react-router-dom";
import type { KnowledgeItem } from "@/hooks/useKnowledgeItems";
import { TechniqueTemplate } from "./TechniqueTemplate";

interface EnhancedKnowledgeCardProps {
  item: KnowledgeItem;
  showDetails?: boolean;
}

export const EnhancedKnowledgeCard = ({ item, showDetails = false }: EnhancedKnowledgeCardProps) => {
  const formatTeamSize = () => {
    if (item.team_size_min && item.team_size_max) {
      return item.team_size_min === item.team_size_max 
        ? `${item.team_size_min} people`
        : `${item.team_size_min}-${item.team_size_max} people`;
    }
    return undefined;
  };

  const formatDuration = () => {
    if (item.duration_min_minutes && item.duration_max_minutes) {
      return item.duration_min_minutes === item.duration_max_minutes
        ? `${item.duration_min_minutes} minutes`
        : `${item.duration_min_minutes}-${item.duration_max_minutes} minutes`;
    }
    return undefined;
  };

  return (
    <Link to={`/knowledge/${item.slug}`}>
      <TechniqueTemplate
        title={item.name}
        summary={item.generic_summary || item.purpose || item.description || ""}
        who={item.generic_who}
        what={item.generic_what}
        why={item.generic_why}
        teamSize={formatTeamSize()}
        duration={formatDuration()}
        participants={item.typical_participants?.join(", ")}
        skills={item.required_skills?.join(", ")}
        success={item.success_criteria?.join(" ")}
        pitfalls={item.common_pitfalls || []}
        related={item.related_practices || []}
        category={item.activity_categories ? {
          name: item.activity_categories.name,
          color: item.activity_categories.color
        } : undefined}
        domain={item.activity_domains ? {
          name: item.activity_domains.name,
          color: item.activity_domains.color
        } : undefined}
        focus={item.activity_focus ? {
          name: item.activity_focus.name,
          color: item.activity_focus.color
        } : undefined}
        difficulty={item.difficulty_level as 'beginner' | 'intermediate' | 'advanced'}
        className="h-full cursor-pointer"
      />
    </Link>
  );
};