import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEventTypes } from "@/hooks/useEventTypes";
import { useEventCategories } from "@/hooks/useEventCategories";
import { useLevels } from "@/hooks/useLevels";
import { useFormats } from "@/hooks/useFormats";
import { useLocations } from "@/hooks/useLocations";
import { useInstructors } from "@/hooks/useInstructors";

interface EventsFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  eventType: string;
  category: string;
  level: string;
  format: string;
  location: string;
  instructor: string;
}

const EventsFilter = ({ onFilterChange }: EventsFilterProps) => {
  const [filters, setFilters] = useState<FilterState>({
    eventType: "",
    category: "",
    level: "",
    format: "",
    location: "",
    instructor: ""
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Load filter options
  const { data: eventTypes } = useEventTypes();
  const { data: categories } = useEventCategories();
  const { data: levels } = useLevels();
  const { data: formats } = useFormats();
  const { data: locations } = useLocations();
  const { data: instructors } = useInstructors();

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      eventType: "",
      category: "",
      level: "",
      format: "",
      location: "",
      instructor: ""
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");
  const activeFilterCount = Object.values(filters).filter(value => value !== "").length;

  return (
    <Card className="border-border mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filter Events</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Type</label>
              <Select value={filters.eventType} onValueChange={(value) => updateFilter('eventType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {eventTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Level</label>
              <Select value={filters.level} onValueChange={(value) => updateFilter('level', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All levels</SelectItem>
                  {levels?.map((level) => (
                    <SelectItem key={level.id} value={level.name}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select value={filters.format} onValueChange={(value) => updateFilter('format', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All formats</SelectItem>
                  {formats?.map((format) => (
                    <SelectItem key={format.id} value={format.name}>
                      {format.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select value={filters.location} onValueChange={(value) => updateFilter('location', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All locations</SelectItem>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.name}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Instructor</label>
              <Select value={filters.instructor} onValueChange={(value) => updateFilter('instructor', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All instructors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All instructors</SelectItem>
                  {instructors?.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.name}>
                      {instructor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default EventsFilter;