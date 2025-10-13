import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { TestimonialBubble } from "@/components/feedback/TestimonialBubble";
import { useCourseFeedback, useFeedbackStats } from "@/hooks/useCourseFeedback";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Testimonials = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  const { data: feedback, isLoading } = useCourseFeedback({ isApproved: true });
  const { data: stats } = useFeedbackStats();

  const filteredFeedback = feedback?.filter(f => {
    const matchesSearch = 
      f.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.comment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = courseFilter === "all" || f.course_name.toLowerCase().includes(courseFilter.toLowerCase());
    const matchesRating = ratingFilter === "all" || f.rating >= parseInt(ratingFilter);

    return matchesSearch && matchesCourse && matchesRating;
  }) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-7xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">What Our Attendees Say</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real feedback from professionals who have attended our courses
            </p>
            {stats && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                <span className="text-2xl font-bold">{stats.averageRating}/10</span>
                <span className="text-muted-foreground">from {stats.totalRatings} reviews</span>
              </div>
            )}
          </div>
        </section>

        {/* Filters */}
        <section className="py-8 px-4 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search testimonials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:max-w-xs"
              />
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="md:w-[200px]">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="agilepm">AgilePM</SelectItem>
                  <SelectItem value="scrum">Scrum</SelectItem>
                  <SelectItem value="management">Management 3.0</SelectItem>
                  <SelectItem value="prince2">PRINCE2</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="md:w-[180px]">
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="9">9+ Stars</SelectItem>
                  <SelectItem value="8">8+ Stars</SelectItem>
                  <SelectItem value="7">7+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Testimonials Carousel */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-80" />
                ))}
              </div>
            ) : filteredFeedback.length > 0 ? (
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {filteredFeedback.map((item, index) => (
                    <CarouselItem key={item.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                      <TestimonialBubble 
                        feedback={item} 
                        colorIndex={index}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
              </Carousel>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No testimonials found matching your filters.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Testimonials;
