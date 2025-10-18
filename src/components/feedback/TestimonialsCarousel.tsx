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
  showNames?: boolean;
  showCompanies?: boolean;
  showJobTitles?: boolean;
}

export const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({ 
  testimonials = [],
  limit = 6,
  autoPlay = true,
  autoPlayDelay = 4000,
  showArrows = true,
  showDots = false,
  showNames = true,
  showCompanies = true,
  showJobTitles = true
}) => {
  const plugin = useRef(
    Autoplay({ delay: autoPlayDelay, stopOnInteraction: true })
  );

  const items = testimonials ?? [];

  return (
    <Carousel
      plugins={autoPlay ? [plugin.current] : []}
      opts={{
        align: "start",
        loop: items.length > 1,
        slidesToScroll: 1,
        containScroll: "trimSnaps",
      }}
      onMouseEnter={autoPlay ? plugin.current.stop : undefined}
      onMouseLeave={autoPlay ? plugin.current.reset : undefined}
      className="w-full"
    >
      <CarouselContent>
        {items.map((testimonial, index) => (
          <CarouselItem key={testimonial.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
            <TestimonialBubble 
              feedback={testimonial} 
              colorIndex={index}
              showName={showNames}
              showCompany={showCompanies}
              showJobTitle={showJobTitles}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      {showArrows && items.length > 3 && (
        <>
          <CarouselPrevious className="hidden md:flex z-20 pointer-events-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          <CarouselNext className="hidden md:flex z-20 pointer-events-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary" />
        </>
      )}
    </Carousel>
  );
};
