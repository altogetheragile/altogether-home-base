import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CourseRow {
  id: string;
  slug: string;
  title: string;
  created_at: string;
  lesson_count: number;
}

const AdminSelfPacedCourses = () => {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, slug, title, created_at')
        .order('created_at', { ascending: false });

      if (!coursesData) {
        setLoading(false);
        return;
      }

      const courseIds = coursesData.map(c => c.id);
      const { data: modules } = await supabase
        .from('modules')
        .select('id, course_id')
        .in('course_id', courseIds);

      const moduleIds = (modules || []).map(m => m.id);
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, module_id')
        .in('module_id', moduleIds);

      const moduleToCourseLookup: Record<string, string> = {};
      (modules || []).forEach(m => { moduleToCourseLookup[m.id] = m.course_id; });

      const countByCourse: Record<string, number> = {};
      (lessons || []).forEach(l => {
        const cid = moduleToCourseLookup[l.module_id];
        if (cid) countByCourse[cid] = (countByCourse[cid] || 0) + 1;
      });

      setCourses(coursesData.map(c => ({
        ...c,
        lesson_count: countByCourse[c.id] || 0,
      })));
      setLoading(false);
    };

    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Self-paced Courses</h1>
        <p className="text-gray-600">Manage self-paced course content</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map(course => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell className="text-muted-foreground">{course.slug}</TableCell>
                  <TableCell>{course.lesson_count}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(course.created_at).toLocaleDateString('en-GB')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {courses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No self-paced courses found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSelfPacedCourses;
