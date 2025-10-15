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
  autoPlay?: boolean;
  autoPlayDelay?: number;
  showArrows?: boolean;
  showDots?: boolean;
}

export const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({ 
  testimonials,
  limit = 6,
  autoPlay = true,
  autoPlayDelay = 4000,
  showArrows = true,
  showDots = false
}) => {
  const plugin = useRef(
    Autoplay({ delay: autoPlayDelay, stopOnInteraction: true })
  );

  const displayedTestimonials = testimonials.slice(0, limit);

  return (
    <Carousel
      plugins={autoPlay ? [plugin.current] : []}
      opts={{
        align: "start",
        loop: displayedTestimonials.length > 1,
        slidesToScroll: 1,
        containScroll: "trimSnaps",
      }}
      onMouseEnter={autoPlay ? plugin.current.stop : undefined}
      onMouseLeave={autoPlay ? plugin.current.reset : undefined}
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
