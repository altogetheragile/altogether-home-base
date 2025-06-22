
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, X } from 'lucide-react';
import { format } from 'date-fns';

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters?: {
    label: string;
    value: string;
    options: { label: string; value: string }[];
    onChange: (value: string) => void;
  }[];
  dateFilters?: {
    startDate?: Date;
    endDate?: Date;
    onStartDateChange: (date: Date | undefined) => void;
    onEndDateChange: (date: Date | undefined) => void;
  };
  onClearFilters: () => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  filters = [],
  dateFilters,
  onClearFilters,
}) => {
  const hasActiveFilters = searchTerm || 
    filters.some(f => f.value !== 'all') || 
    dateFilters?.startDate || 
    dateFilters?.endDate;

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      {filters.map((filter) => (
        <Select key={filter.label} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {filter.label}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {/* Date Filters */}
      {dateFilters && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-[180px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilters.startDate ? format(dateFilters.startDate, "PPP") : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFilters.startDate}
                onSelect={dateFilters.onStartDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-[180px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilters.endDate ? format(dateFilters.endDate, "PPP") : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFilters.endDate}
                onSelect={dateFilters.onEndDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" onClick={onClearFilters} className="shrink-0">
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  );
};

export default SearchAndFilter;
