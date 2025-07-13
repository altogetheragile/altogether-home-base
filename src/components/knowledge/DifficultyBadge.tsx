import { Badge } from "@/components/ui/badge";

interface DifficultyBadgeProps {
  level?: string;
  difficulty?: string;
  className?: string;
}

export const DifficultyBadge = ({ level, difficulty, className }: DifficultyBadgeProps) => {
  const difficultyLevel = level || difficulty;
  
  if (!difficultyLevel) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Badge 
      variant="secondary" 
      className={`text-xs ${getDifficultyColor(difficultyLevel)} ${className}`}
    >
      {difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)}
    </Badge>
  );
};