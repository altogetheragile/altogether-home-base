import React from 'react';
import { Badge } from '@/components/ui/badge';

interface DifficultyBadgeProps {
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  className?: string;
}

const difficultyConfig = {
  beginner: {
    label: 'Beginner',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  intermediate: {
    label: 'Intermediate', 
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  advanced: {
    label: 'Advanced',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

const DifficultyBadge = ({ difficulty = 'intermediate', className = '' }: DifficultyBadgeProps) => {
  const config = difficultyConfig[difficulty];
  
  return (
    <Badge variant="outline" className={`${config.className} ${className}`}>
      {config.label}
    </Badge>
  );
};

export default DifficultyBadge;