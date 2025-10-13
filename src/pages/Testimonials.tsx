import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TestimonialCard from "@/components/feedback/TestimonialCard";
import { useCourseFeedback, useFeedbackStats } from "@/hooks/useCourseFeedback";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUserRole } from "@/hooks/useUserRole";

const Testimonials = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [showName, setShowName] = useState(true);
  const [showCompany, setShowCompany] = useState(true);
  const [showRating, setShowRating] = useState(true);

  const { data: feedback, isLoading } = useCourseFeedback({ isApproved: true });
  const { data: stats } = useFeedbackStats();
  const { data: role } = useUserRole();
  const isAdmin = role === 'admin';

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
        <section className="py-8 px-4 border-b border-border">
          <div className="max-w-7xl mx-auto text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold">What Our Attendees Say</h1>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Real feedback from professionals who have attended our courses
            </p>
            {stats && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                <span className="text-xl font-bold">{stats.averageRating}/10</span>
                <span className="text-sm text-muted-foreground">from {stats.totalRatings} reviews</span>
              </div>
            )}
          </div>
        </section>

        {/* Filters */}
        <section className="py-6 px-4 border-b border-border bg-muted/30">
          <div className="max-w-7xl mx-auto space-y-4">
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
            
            {/* Display Toggles - Admin Only */}
            {isAdmin && (
              <div className="flex flex-wrap gap-6 pt-2 border-t border-border mt-4 pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-name"
                    checked={showName}
                    onCheckedChange={setShowName}
                  />
                  <Label htmlFor="show-name" className="cursor-pointer">Show Name</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-company"
                    checked={showCompany}
                    onCheckedChange={setShowCompany}
                  />
                  <Label htmlFor="show-company" className="cursor-pointer">Show Company</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-rating"
                    checked={showRating}
                    onCheckedChange={setShowRating}
                  />
                  <Label htmlFor="show-rating" className="cursor-pointer">Show Rating</Label>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Testimonials Grid */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-80" />
                ))}
              </div>
            ) : filteredFeedback.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFeedback.map((item) => (
                  <TestimonialCard
                    key={item.id}
                    feedback={item}
                    showName={showName}
                    showCompany={showCompany}
                    showRating={showRating}
                  />
                ))}
              </div>
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
