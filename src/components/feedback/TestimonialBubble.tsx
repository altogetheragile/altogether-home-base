import { CourseFeedback } from "@/hooks/useCourseFeedback";
import { User } from "lucide-react";

interface TestimonialBubbleProps {
  feedback: CourseFeedback;
  colorIndex?: number;
}

const BUBBLE_COLORS = [
  { bg: "hsl(54 100% 88%)", text: "hsl(210 100% 40%)" }, // Yellow
  { bg: "hsl(340 100% 90%)", text: "hsl(210 100% 40%)" }, // Pink
  { bg: "hsl(142 76% 85%)", text: "hsl(210 100% 40%)" }, // Green
  { bg: "hsl(210 100% 90%)", text: "hsl(210 100% 40%)" }, // Light Blue
];

export const TestimonialBubble = ({ feedback, colorIndex = 0 }: TestimonialBubbleProps) => {
  const color = BUBBLE_COLORS[colorIndex % BUBBLE_COLORS.length];
  const displayName = `${feedback.first_name} ${feedback.last_name}`;
  
  // Truncate comment for bubble display
  const maxLength = 250;
  const displayComment = feedback.comment.length > maxLength 
    ? `${feedback.comment.substring(0, maxLength)}...` 
    : feedback.comment;

  return (
    <div className="flex flex-col items-center gap-3 p-2">
      {/* Speech Bubble */}
      <div 
        className="relative rounded-2xl px-6 py-6 shadow-md min-h-[200px] flex items-center justify-center w-full"
        style={{ backgroundColor: color.bg }}
      >
        {/* Bubble Tail */}
        <div 
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderTop: `16px solid ${color.bg}`,
          }}
        />
        
        {/* Quote Text */}
        <p 
          className="text-center font-semibold text-base leading-relaxed"
          style={{ color: color.text }}
        >
          "{displayComment}"
        </p>
      </div>

      {/* Avatar Circle */}
      <div className="flex flex-col items-center gap-2 mt-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
        
        {/* Name and Details */}
        <div className="text-center">
          <p className="font-semibold text-sm text-foreground">{displayName}</p>
          {feedback.job_title && (
            <p className="text-xs text-muted-foreground">{feedback.job_title}</p>
          )}
          {feedback.company && (
            <p className="text-xs text-muted-foreground">{feedback.company}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {feedback.course_name}
          </p>
        </div>
      </div>
    </div>
  );
};
