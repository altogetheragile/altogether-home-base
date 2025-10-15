import React, { useMemo } from 'react';
import { ContentBlock } from '@/types/page';
import { TestimonialsCarousel } from '@/components/feedback/TestimonialsCarousel';
import { useCourseFeedback } from '@/hooks/useCourseFeedback';
import { Skeleton } from '@/components/ui/skeleton';
import { getStyleClasses } from '../utils/backgroundUtils';

interface TestimonialsCarouselBlockProps {
  block: ContentBlock;
}

export const TestimonialsCarouselBlock: React.FC<TestimonialsCarouselBlockProps> = ({ block }) => {
  const content = block.content || {};
  const styles = useMemo(() => (content.styles && typeof content.styles === 'object') ? content.styles : {}, [content.styles]);
  const styleClasses = getStyleClasses(styles);
  
  const title = content.title || 'What Our Attendees Say';
  const limit = content.limit || 6;
  const autoPlay = content.autoPlay !== false;
  const autoPlayDelay = content.autoPlayDelay || 4000;
  const showArrows = content.showArrows !== false;
  const showDots = content.showDots || false;
  const onlyFeatured = content.onlyFeatured || false;

  const { data: allTestimonials, isLoading } = useCourseFeedback({ 
    isApproved: true,
    isFeatured: onlyFeatured ? true : undefined
  });
  
  const testimonials = allTestimonials?.slice(0, limit);

  if (isLoading) {
    return (
      <div className={`container mx-auto px-4 py-12 ${styleClasses}`}>
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!testimonials || testimonials.length === 0) {
    return (
      <div className={`container mx-auto px-4 py-12 ${styleClasses}`}>
        <h2 className="text-2xl font-bold text-foreground mb-6">{title}</h2>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No testimonials available at the moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-12 ${styleClasses}`}>
      <h2 className="text-2xl font-bold text-foreground mb-6">{title}</h2>
      <TestimonialsCarousel
        testimonials={testimonials}
        limit={limit}
        autoPlay={autoPlay}
        autoPlayDelay={autoPlayDelay}
        showArrows={showArrows}
        showDots={showDots}
      />
    </div>
  );
};
