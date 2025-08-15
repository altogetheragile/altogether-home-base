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
import TemplateFilterSelect from "./TemplateFilterSelect";

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
  template: string;
  difficulty: string;
}

const EventsFilter = ({ onFilterChange }: EventsFilterProps) => {
  const [filters, setFilters] = useState<FilterState>({
    eventType: "all",
    category: "all",
    level: "all",
    format: "all",
    location: "all",
    instructor: "all",
    template: "all",
    difficulty: "all"
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
      eventType: "all",
      category: "all",
      level: "all",
      format: "all",
      location: "all",
      instructor: "all",
      template: "all",
      difficulty: "all"
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "all");
  const activeFilterCount = Object.values(filters).filter(value => value !== "all").length;

  return (
    <div className="mb-6">
      <div 
        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-muted cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filter Events</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs h-5">{activeFilterCount}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              className="h-7 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {isExpanded ? "Collapse" : "Expand"}
          </span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-3 p-4 bg-background/50 rounded-lg border border-muted/50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Event Type</label>
              <Select value={filters.eventType} onValueChange={(value) => updateFilter('eventType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {eventTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Level</label>
              <Select value={filters.level} onValueChange={(value) => updateFilter('level', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  {levels?.map((level) => (
                    <SelectItem key={level.id} value={level.name}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Format</label>
              <Select value={filters.format} onValueChange={(value) => updateFilter('format', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All formats</SelectItem>
                  {formats?.map((format) => (
                    <SelectItem key={format.id} value={format.name}>
                      {format.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Location</label>
              <Select value={filters.location} onValueChange={(value) => updateFilter('location', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.name}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Instructor</label>
              <Select value={filters.instructor} onValueChange={(value) => updateFilter('instructor', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All instructors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All instructors</SelectItem>
                  {instructors?.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.name}>
                      {instructor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Template</label>
              <TemplateFilterSelect
                value={filters.template}
                onValueChange={(value) => updateFilter('template', value)}
                placeholder="All templates"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
              <Select value={filters.difficulty} onValueChange={(value) => updateFilter('difficulty', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All difficulties</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsFilter;