import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Plus, Search } from 'lucide-react';
import { useCourseAdmin, useCourseAdminMutations } from '@/hooks/useCourseAdmin';
import CourseExpandableRow from '@/components/admin/courses/CourseExpandableRow';
import CreateCourseSheet from '@/components/admin/courses/CreateCourseSheet';
import AddDateSheet from '@/components/admin/courses/AddDateSheet';

type SortField = 'title' | 'next_date';
type SortDir = 'asc' | 'desc';

const AdminCourses = () => {
  const { data: courses = [], isLoading } = useCourseAdmin();
  const { deleteTemplate, invalidate } = useCourseAdminMutations();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addDateForId, setAddDateForId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let result = courses;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.title.toLowerCase().includes(q));
    }

    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    result = [...result].sort((a, b) => {
      if (sortField === 'title') {
        const cmp = a.title.localeCompare(b.title);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const aDate = a.next_date || '';
      const bDate = b.next_date || '';
      const cmp = aDate.localeCompare(bDate);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [courses, search, statusFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteTemplate.mutateAsync(deleteId);
    invalidate();
    setDeleteId(null);
  };

  const handleCreated = (id: string) => {
    setExpandedIds(prev => new Set(prev).add(id));
  };

  const addDateCourse = addDateForId ? courses.find(c => c.id === addDateForId) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Courses</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Course
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">No courses found.</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create your first course
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('title')}
                >
                  Title {sortField === 'title' ? (sortDir === 'asc' ? '\u2191' : '\u2193') : ''}
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Dates</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('next_date')}
                >
                  Next Date {sortField === 'next_date' ? (sortDir === 'asc' ? '\u2191' : '\u2193') : ''}
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(course => (
                <CourseExpandableRow
                  key={course.id}
                  course={course}
                  isExpanded={expandedIds.has(course.id)}
                  onToggle={() => toggleExpand(course.id)}
                  onDelete={setDeleteId}
                  onAddDate={setAddDateForId}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateCourseSheet open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />

      {addDateCourse && (
        <AddDateSheet
          open={!!addDateForId}
          onOpenChange={(open) => { if (!open) setAddDateForId(null); }}
          templateId={addDateCourse.id}
          templateTitle={addDateCourse.title}
          durationDays={addDateCourse.duration_days}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
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

export default AdminCourses;
