import React, { useRef } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { TestimonialBubble } from './TestimonialBubble';
import { CourseFeedback } from '@/hooks/useCourseFeedback';
import Autoplay from "embla-carousel-autoplay";

interface TestimonialsCarouselProps {
  testimonials: CourseFeedback[];
  limit?: number;
}

export const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({ 
  testimonials,
  limit = 6 
}) => {
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  const displayedTestimonials = testimonials.slice(0, limit);
  
  // Only show arrows if there are enough items to scroll
  // Desktop (lg): shows 3 items, need > 3
  // Tablet (md): shows 2 items, need > 2
  // Mobile: shows 1 item, need > 1
  const showArrows = displayedTestimonials.length > 1;

  return (
    <Carousel
      plugins={[plugin.current]}
      opts={{
        align: "start",
        loop: displayedTestimonials.length > 3,
        slidesToScroll: 1,
      }}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
      className="w-full"
    >
      <CarouselContent className="-ml-4">
        {displayedTestimonials.map((testimonial, index) => (
          <CarouselItem key={testimonial.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
            <TestimonialBubble 
              feedback={testimonial} 
              colorIndex={index}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      {showArrows && (
        <>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </>
      )}
    </Carousel>
  );
};
