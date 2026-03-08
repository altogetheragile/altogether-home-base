import { ChevronRight, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import CourseStatusBadge from './CourseStatusBadge';
import CourseContentTab from './CourseContentTab';
import CourseDatesTab from './CourseDatesTab';
import CourseSettingsTab from './CourseSettingsTab';
import type { CourseAdminItem } from '@/hooks/useCourseAdmin';

interface CourseExpandableRowProps {
  course: CourseAdminItem;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: (id: string) => void;
  onAddDate: (id: string) => void;
}

const CourseExpandableRow = ({ course, isExpanded, onToggle, onDelete, onAddDate }: CourseExpandableRowProps) => {
  const nextDateFormatted = course.next_date
    ? (() => {
        try { return format(new Date(course.next_date), 'MMM dd, yyyy'); } catch { return '—'; }
      })()
    : '—';

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggle}>
        <TableCell className="w-8">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </TableCell>
        <TableCell className="font-medium">{course.title}</TableCell>
        <TableCell>{course.event_types?.name || '—'}</TableCell>
        <TableCell>{course.event_categories?.name || '—'}</TableCell>
        <TableCell className="text-center">{course.event_count}</TableCell>
        <TableCell className="whitespace-nowrap">{nextDateFormatted}</TableCell>
        <TableCell><CourseStatusBadge status={course.status} /></TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onAddDate(course.id); }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add a date</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(course.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow>
          <TableCell colSpan={8} className="p-0">
            <div className="border-t bg-muted/20 px-6 py-4">
              <Tabs defaultValue="content">
                <TabsList>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="dates">Dates</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="content">
                  <CourseContentTab course={course} />
                </TabsContent>
                <TabsContent value="dates">
                  <CourseDatesTab course={course} />
                </TabsContent>
                <TabsContent value="settings">
                  <CourseSettingsTab course={course} />
                </TabsContent>
              </Tabs>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default CourseExpandableRow;
