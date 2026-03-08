import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { formatPrice } from '@/utils/currency';
import { useCourseAdminMutations, type CourseAdminItem } from '@/hooks/useCourseAdmin';
import AddDateSheet from './AddDateSheet';

interface CourseDatesTabProps {
  course: CourseAdminItem;
}

const CourseDatesTab = ({ course }: CourseDatesTabProps) => {
  const [addDateOpen, setAddDateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { updateEvent, deleteEvent, invalidate } = useCourseAdminMutations();

  const handleTogglePublished = async (eventId: string, isPublished: boolean) => {
    await updateEvent.mutateAsync({ id: eventId, data: { status: isPublished ? 'published' : 'draft' } as any });
    invalidate();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteEvent.mutateAsync(deleteId);
    invalidate();
    setDeleteId(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return '—';
    }
  };

  return (
    <div className="py-4 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-muted-foreground">
          {course.events.length} scheduled date{course.events.length !== 1 ? 's' : ''}
        </h4>
        <Button size="sm" onClick={() => setAddDateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add a date
        </Button>
      </div>

      {course.events.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No dates scheduled yet.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {course.events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(event.start_date)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(event.end_date)}</TableCell>
                  <TableCell>{event.locations?.name || '—'}</TableCell>
                  <TableCell>
                    {event.price_cents && event.price_cents > 0
                      ? formatPrice(event.price_cents, event.currency || 'gbp')
                      : 'Free'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={event.is_published}
                      onCheckedChange={(checked) => handleTogglePublished(event.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(event.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddDateSheet
        open={addDateOpen}
        onOpenChange={setAddDateOpen}
        templateId={course.id}
        templateTitle={course.title}
        durationDays={course.duration_days}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scheduled Date</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scheduled date? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseDatesTab;
