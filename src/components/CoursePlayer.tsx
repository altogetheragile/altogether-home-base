import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import './CoursePlayer.css';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'activity';
  duration: string;
  chapter_ref: string | null;
  notes_html: string | null;
  video_url: string | null;
  position: number;
}

interface Module {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  modules: Module[];
}

// ─── Styles ────────────────────────────────────────────────────────────────
const deepTeal = '#004D4D';
const orange = '#FF9715';

const typeBadge = (type: string) => {
  if (type === 'video') return { bg: '#E1F5EE', color: '#0F6E56', label: 'Video' };
  if (type === 'text') return { bg: '#E6F1FB', color: '#185FA5', label: 'Reading' };
  return { bg: '#FAEEDA', color: '#854F0B', label: 'Activity' };
};

// ─── Component ─────────────────────────────────────────────────────────────
interface CoursePlayerProps {
  courseSlug: string;
}

const CoursePlayer = ({ courseSlug }: CoursePlayerProps) => {
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('notes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Flatten lessons for sequential navigation
  const allLessons = useMemo(() => {
    if (!course) return [];
    return course.modules
      .sort((a, b) => a.position - b.position)
      .flatMap(m => m.lessons.sort((a, b) => a.position - b.position));
  }, [course]);

  const currentLesson = allLessons[currentIndex] || null;

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      setError(null);

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, slug, title, description')
        .eq('slug', courseSlug)
        .single();

      if (courseError || !courseData) {
        setError('Course not found.');
        setLoading(false);
        return;
      }

      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, title, position')
        .eq('course_id', courseData.id)
        .order('position');

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('id, module_id, title, type, duration, chapter_ref, notes_html, video_url, position')
        .in('module_id', (modulesData || []).map(m => m.id))
        .order('position');

      const modules: Module[] = (modulesData || []).map(m => ({
        ...m,
        lessons: (lessonsData || [])
          .filter(l => l.module_id === m.id)
          .map(l => ({ ...l, type: l.type as Lesson['type'] })),
      }));

      setCourse({ ...courseData, modules });
      setLoading(false);
    };

    fetchCourse();
  }, [courseSlug]);

  // Fetch user progress
  useEffect(() => {
    if (!user || !course) return;

    const fetchProgress = async () => {
      const lessonIds = allLessons.map(l => l.id);
      if (!lessonIds.length) return;

      const { data } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);

      setCompletedIds(new Set((data || []).map(d => d.lesson_id)));
    };

    fetchProgress();
  }, [user, course, allLessons]);

  // Reset tab when lesson changes
  useEffect(() => {
    if (!currentLesson) return;
    const tabs = getTabs(currentLesson);
    setActiveTab(tabs[0]);
  }, [currentIndex]);

  const getTabs = (lesson: Lesson): string[] => {
    const tabs: string[] = [];
    if (lesson.type === 'video') tabs.push('video');
    tabs.push('notes');
    tabs.push('downloads');
    return tabs;
  };

  const toggleComplete = async () => {
    if (!user || !currentLesson) return;
    const isCompleted = completedIds.has(currentLesson.id);

    if (isCompleted) {
      await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('lesson_id', currentLesson.id);
      setCompletedIds(prev => {
        const next = new Set(prev);
        next.delete(currentLesson.id);
        return next;
      });
    } else {
      await supabase
        .from('user_progress')
        .insert({ user_id: user.id, lesson_id: currentLesson.id });
      setCompletedIds(prev => new Set(prev).add(currentLesson.id));
    }
  };

  const navigate = (delta: number) => {
    const next = currentIndex + delta;
    if (next >= 0 && next < allLessons.length) setCurrentIndex(next);
  };

  // ─── Loading / error states ────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 640, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center', color: '#6B7280' }}>Loading course...</div>
      </div>
    );
  }

  if (error || !course || !currentLesson) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 640, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center', color: '#EF4444' }}>{error || 'Something went wrong.'}</div>
      </div>
    );
  }

  const completedCount = completedIds.size;
  const totalCount = allLessons.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = completedIds.has(currentLesson.id);
  const tabs = getTabs(currentLesson);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '290px 1fr',
      gridTemplateRows: '52px 1fr 56px',
      height: 640,
      border: '0.5px solid #E5E7EB',
      borderRadius: 12,
      overflow: 'hidden',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* ─── Topbar ─── */}
      <div style={{
        gridColumn: '1 / -1',
        background: deepTeal,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
      }}>
        <div style={{
          color: '#fff',
          fontSize: 13,
          fontWeight: 500,
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {course.title}{currentLesson.chapter_ref ? ` - ${currentLesson.chapter_ref}` : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 120, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
            <div style={{ height: 4, background: orange, borderRadius: 2, width: `${progressPct}%`, transition: 'width 0.3s' }} />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, whiteSpace: 'nowrap' }}>
            {completedCount} of {totalCount} done
          </span>
        </div>
      </div>

      {/* ─── Sidebar ─── */}
      <div style={{
        background: '#F9FAFB',
        borderRight: '0.5px solid #E5E7EB',
        overflowY: 'auto',
        gridRow: '2 / 3',
      }}>
        {course.modules.sort((a, b) => a.position - b.position).map(mod => (
          <div key={mod.id}>
            <div style={{
              padding: '10px 14px 6px',
              fontSize: 10,
              fontWeight: 500,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {mod.title}
            </div>
            {mod.lessons.sort((a, b) => a.position - b.position).map(lesson => {
              const idx = allLessons.findIndex(l => l.id === lesson.id);
              const isActive = idx === currentIndex;
              const isDone = completedIds.has(lesson.id);
              const badge = typeBadge(lesson.type);

              return (
                <div
                  key={lesson.id}
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    borderLeft: `3px solid ${isActive ? deepTeal : 'transparent'}`,
                    background: isActive ? '#fff' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: `1.5px solid ${isDone ? deepTeal : '#D1D5DB'}`,
                    background: isDone ? deepTeal : 'transparent',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                  }}>
                    {isDone && (
                      <div style={{
                        width: 7,
                        height: 7,
                        borderRight: '1.5px solid #fff',
                        borderBottom: '1.5px solid #fff',
                        transform: 'rotate(45deg) translate(-1px, -1px)',
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#111827', lineHeight: 1.35 }}>{lesson.title}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, display: 'flex', gap: 5, alignItems: 'center' }}>
                      {lesson.duration}
                      <span style={{
                        fontSize: 10,
                        padding: '1px 5px',
                        borderRadius: 3,
                        fontWeight: 500,
                        background: badge.bg,
                        color: badge.color,
                      }}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ─── Main content ─── */}
      <div style={{ background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid #E5E7EB', padding: '0 20px' }}>
          {tabs.map(tab => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 14px',
                fontSize: 13,
                color: activeTab === tab ? deepTeal : '#6B7280',
                cursor: 'pointer',
                borderBottom: `2px solid ${activeTab === tab ? deepTeal : 'transparent'}`,
                marginBottom: -0.5,
                fontWeight: activeTab === tab ? 500 : 400,
              }}
            >
              {tab === 'video' ? 'Video' : tab === 'notes' ? 'Notes' : 'Downloads'}
            </div>
          ))}
        </div>

        {/* Content body */}
        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
          {activeTab === 'video' && (
            currentLesson.video_url ? (
              <iframe
                src={currentLesson.video_url}
                title={currentLesson.title}
                style={{ width: '100%', height: 300, border: 'none', borderRadius: 8 }}
                allowFullScreen
              />
            ) : (
              <>
                <div style={{
                  background: '#F9FAFB',
                  borderRadius: 8,
                  height: 175,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  border: '0.5px solid #E5E7EB',
                }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: deepTeal,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 0,
                      height: 0,
                      borderTop: '8px solid transparent',
                      borderBottom: '8px solid transparent',
                      borderLeft: '14px solid #fff',
                      marginLeft: 3,
                    }} />
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>
                    {currentLesson.title} &middot; {currentLesson.duration}
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#111827', marginTop: 14 }}>{currentLesson.title}</div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7, marginTop: 8 }}>
                  This video covers the key concepts for this lesson. Switch to the Notes tab for a written summary.
                </div>
              </>
            )
          )}

          {activeTab === 'notes' && currentLesson.notes_html && (
            <div className="course-notes" dangerouslySetInnerHTML={{ __html: currentLesson.notes_html }} />
          )}

          {activeTab === 'downloads' && (
            <>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#111827', marginBottom: 8 }}>Downloads</div>
              <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7, marginBottom: 12 }}>Resources for this lesson.</div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                border: '0.5px solid #E5E7EB',
                borderRadius: 8,
                cursor: 'pointer',
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  background: '#FAEEDA',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  flexShrink: 0,
                }}>
                  <span role="img" aria-label="document">&#128196;</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{currentLesson.title} - reference card</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>PDF</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Bottom bar ─── */}
      <div style={{
        gridColumn: '1 / -1',
        borderTop: '0.5px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        background: '#fff',
      }}>
        <button
          disabled={currentIndex === 0}
          onClick={() => navigate(-1)}
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            fontSize: 13,
            cursor: currentIndex === 0 ? 'default' : 'pointer',
            border: '0.5px solid #D1D5DB',
            background: 'transparent',
            color: '#111827',
            opacity: currentIndex === 0 ? 0.35 : 1,
          }}
        >
          Previous
        </button>
        <button
          disabled={currentIndex === allLessons.length - 1}
          onClick={() => navigate(1)}
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            fontSize: 13,
            cursor: currentIndex === allLessons.length - 1 ? 'default' : 'pointer',
            border: '0.5px solid #D1D5DB',
            background: 'transparent',
            color: '#111827',
            opacity: currentIndex === allLessons.length - 1 ? 0.35 : 1,
          }}
        >
          Next
        </button>
        {user && (
          <button
            onClick={toggleComplete}
            style={{
              padding: '7px 20px',
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer',
              background: isComplete ? deepTeal : orange,
              border: 'none',
              color: '#fff',
              fontWeight: 500,
              marginLeft: 'auto',
            }}
          >
            {isComplete ? 'Completed' : 'Mark complete'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CoursePlayer;
