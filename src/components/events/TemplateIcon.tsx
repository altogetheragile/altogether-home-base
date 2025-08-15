import React from 'react';
import { 
  Calendar, 
  Users, 
  BookOpen, 
  Zap, 
  Target, 
  TrendingUp, 
  Star,
  Award,
  Lightbulb,
  Briefcase,
  type LucideIcon 
} from 'lucide-react';

interface TemplateIconProps {
  iconName?: string;
  className?: string;
  size?: number;
}

const iconMap: Record<string, LucideIcon> = {
  Calendar,
  Users,
  BookOpen,
  Zap,
  Target,
  TrendingUp,
  Star,
  Award,
  Lightbulb,
  Briefcase,
};

const TemplateIcon = ({ iconName = 'Calendar', className = '', size = 20 }: TemplateIconProps) => {
  const IconComponent = iconMap[iconName] || Calendar;
  
  return <IconComponent size={size} className={className} />;
};

export default TemplateIcon;