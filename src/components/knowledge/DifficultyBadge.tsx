import { Badge } from '@/components/ui/badge';
import { GraduationCap } from 'lucide-react';

interface DifficultyBadgeProps {
  difficulty: string | null;
  className?: string;
}

const getDifficultyConfig = (difficulty: string | null) => {
  switch (difficulty) {
    case 'Beginner':
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '●',
        label: 'Beginner'
      };
    case 'Intermediate':
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '●●',
        label: 'Intermediate'
      };
    case 'Advanced':
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '●●●',
        label: 'Advanced'
      };
    default:
      return null;
  }
};

export const DifficultyBadge = ({ difficulty, className }: DifficultyBadgeProps) => {
  const config = getDifficultyConfig(difficulty);
  
  if (!config) return null;

  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${className || ''}`}
    >
      <GraduationCap className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};