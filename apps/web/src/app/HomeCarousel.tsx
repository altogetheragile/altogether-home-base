'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { HomeCourseCard } from '@/lib/home';

const ChevronLeft = () => <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor"><path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z" /></svg>;
const ChevronRight = () => <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" /></svg>;
const ArrowRight = () => <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" /></svg>;
const Calendar = () => <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z" /></svg>;

export function HomeCarousel({ courses }: { courses: HomeCourseCard[] }) {
  const [index, setIndex] = useState(0);

  const getVisible = useCallback(() => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth <= 767) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }, []);
  const [visibleCount, setVisibleCount] = useState(3);
  useEffect(() => {
    const onResize = () => setVisibleCount(getVisible());
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [getVisible]);

  const maxIndex = useMemo(() => Math.max(0, courses.length - visibleCount), [courses.length, visibleCount]);
  const canPrev = index > 0;
  const canNext = index < maxIndex;

  if (!courses.length) return null;

  return (
    <div style={{ position: 'relative' }}>
      {canPrev && (
        <button onClick={() => setIndex((i) => Math.max(0, i - 1))} aria-label="Previous courses" className="aa-carousel-btn aa-carousel-btn--prev">
          <ChevronLeft />
        </button>
      )}
      {canNext && (
        <button onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))} aria-label="Next courses" className="aa-carousel-btn aa-carousel-btn--next">
          <ChevronRight />
        </button>
      )}
      <div style={{ overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${courses.length}, calc(${100 / visibleCount}% - ${(20 * (visibleCount - 1)) / visibleCount}px))`,
            gap: 20,
            transition: 'transform 0.35s ease',
            transform: `translateX(calc(-${index} * (${100 / visibleCount}% + ${20 / visibleCount}px)))`,
          }}
        >
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`} className="aa-course-card">
              <div className="aa-course-card__header">
                {course.category && <span className="aa-badge aa-badge--deep">{course.category}</span>}
                {course.difficulty && <span className="aa-badge--difficulty">{course.difficulty}</span>}
              </div>
              <div className="aa-course-card__title">{course.title}</div>
              {course.description && (
                <div className="aa-course-card__desc">
                  {course.description.length > 100 ? course.description.slice(0, 100).trimEnd() + '…' : course.description}
                </div>
              )}
              {course.hasDatesAvailable && (
                <span className="aa-badge aa-badge--dates">
                  <Calendar /> Dates available
                </span>
              )}
              <div className="aa-course-card__cta">
                <span>Find out more <ArrowRight /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
