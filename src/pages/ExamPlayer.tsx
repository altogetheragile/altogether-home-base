import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { colors as p } from '@/theme/colors';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Clock, Flag, ChevronLeft, ChevronRight, SkipForward, CheckCircle2,
  XCircle, ArrowLeft, RotateCcw, BookOpen, Timer, AlertCircle,
} from 'lucide-react';

/* ─── Types ─── */
interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  pass_mark: number;
  total_questions: number;
}

interface Question {
  id: string;
  area: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  option_f: string;
  option_g: string;
  correct_answer: string;
  reference: string | null;
  sort_order: number | null;
}

type Mode = 'exam' | 'practice';
type Phase = 'start' | 'playing' | 'review';

interface Answer {
  selected: string[];
  flagged: boolean;
}

/* ─── Data hooks ─── */
const usePublicExam = (examId: string | undefined) =>
  useQuery({
    queryKey: ['public-exam', examId],
    enabled: !!examId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('id, title, description, duration_minutes, pass_mark, total_questions')
        .eq('id', examId!)
        .eq('status', 'published')
        .single();
      if (error) throw error;
      return data as Exam;
    },
  });

const usePublicQuestions = (examId: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: ['public-questions', examId],
    enabled: !!examId && enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('id, area, question_text, option_a, option_b, option_c, option_d, option_e, option_f, option_g, correct_answer, reference, sort_order')
        .eq('exam_id', examId!)
        .eq('status', 'published')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as Question[];
    },
  });

/* ─── Timer hook ─── */
function useCountdown(durationSeconds: number, running: boolean, onExpire: () => void) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
  const urgent = remaining < 120 && remaining > 0;

  return { remaining, formatted, urgent };
}

/* ─── Helper: shuffle array ─── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─── Main component ─── */
const ExamPlayer = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuth();
  const { data: exam, isLoading: examLoading, error: examError } = usePublicExam(examId);

  const [phase, setPhase] = useState<Phase>('start');
  const [mode, setMode] = useState<Mode>('exam');
  const [started, setStarted] = useState(false);

  const { data: rawQuestions } = usePublicQuestions(examId, started);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [practiceRevealed, setPracticeRevealed] = useState(false);

  // Shuffle questions when they load
  useEffect(() => {
    if (rawQuestions && rawQuestions.length > 0 && questions.length === 0) {
      const shuffled = shuffle(rawQuestions);
      const limited = exam ? shuffled.slice(0, exam.total_questions) : shuffled;
      setQuestions(limited);
      const initialAnswers: Record<number, Answer> = {};
      limited.forEach((_, i) => { initialAnswers[i] = { selected: [], flagged: false }; });
      setAnswers(initialAnswers);
    }
  }, [rawQuestions, exam, questions.length]);

  const saveAttempt = useCallback(async () => {
    if (!user || !exam) return;
    let correct = 0;
    questions.forEach((q, i) => {
      const a = answers[i];
      const correctSet = q.correct_answer.split(',').sort().join(',');
      const selectedSet = a ? [...a.selected].sort().join(',') : '';
      if (correctSet === selectedSet) correct++;
    });
    const passed = correct >= exam.pass_mark;
    try {
      await supabase.from('exam_attempts').insert({
        exam_id: exam.id,
        user_id: user.id,
        score: correct,
        passed,
        answers: Object.fromEntries(
          questions.map((q, i) => [q.id, { selected: answers[i]?.selected ?? [], correct: q.correct_answer }])
        ),
        completed_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to save exam attempt:', err);
    }
  }, [user, exam, questions, answers, mode]);

  const handleExpire = useCallback(() => {
    setTimerRunning(false);
    setPhase('review');
    saveAttempt();
  }, [saveAttempt]);

  const { formatted: timeLeft, urgent: timeUrgent } = useCountdown(
    (exam?.duration_minutes ?? 40) * 60,
    timerRunning,
    handleExpire,
  );

  /* ─── Actions ─── */
  const startExam = (m: Mode) => {
    setMode(m);
    setStarted(true);
    setPhase('playing');
    setCurrentIdx(0);
    setQuestions([]);
    setPracticeRevealed(false);
    if (m === 'exam') setTimerRunning(true);
  };

  const selectAnswer = (letter: string) => {
    if (mode === 'practice' && practiceRevealed) return;
    const q = questions[currentIdx];
    const isMulti = q?.correct_answer.includes(',');
    const current = answers[currentIdx]?.selected || [];

    if (isMulti) {
      // Toggle selection for multi-answer questions
      if (mode === 'exam' && practiceRevealed) return;
      const maxSelections = q.correct_answer.split(',').length;
      const isDeselecting = current.includes(letter);
      if (!isDeselecting && current.length >= maxSelections) return;
      const next = isDeselecting
        ? current.filter((l) => l !== letter)
        : [...current, letter].sort();
      setAnswers((prev) => ({
        ...prev,
        [currentIdx]: { ...prev[currentIdx], selected: next },
      }));
    } else {
      // Single answer — lock after first selection in exam mode
      if (mode === 'exam' && current.length > 0) return;
      setAnswers((prev) => ({
        ...prev,
        [currentIdx]: { ...prev[currentIdx], selected: [letter] },
      }));
      if (mode === 'practice') setPracticeRevealed(true);
    }
  };

  // For multi-answer practice: explicit confirm button
  const confirmMultiAnswer = () => {
    setPracticeRevealed(true);
  };

  const toggleFlag = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentIdx]: { ...prev[currentIdx], flagged: !prev[currentIdx]?.flagged },
    }));
  };

  const goTo = (idx: number) => {
    setCurrentIdx(idx);
    setPracticeRevealed(false);
  };

  const goNext = () => { if (currentIdx < questions.length - 1) goTo(currentIdx + 1); };
  const goPrev = () => { if (currentIdx > 0) goTo(currentIdx - 1); };

  const goNextUnanswered = () => {
    for (let i = 1; i <= questions.length; i++) {
      const idx = (currentIdx + i) % questions.length;
      if (!answers[idx]?.selected.length) { goTo(idx); return; }
    }
  };

  const goNextFlagged = () => {
    for (let i = 1; i <= questions.length; i++) {
      const idx = (currentIdx + i) % questions.length;
      if (answers[idx]?.flagged) { goTo(idx); return; }
    }
  };

  const finishExam = () => {
    setTimerRunning(false);
    setPhase('review');
    saveAttempt();
  };

  const retake = () => {
    setPhase('start');
    setStarted(false);
    setQuestions([]);
    setAnswers({});
    setCurrentIdx(0);
    setTimerRunning(false);
    setPracticeRevealed(false);
  };

  /* ─── Computed stats ─── */
  const totalQ = questions.length;
  const answeredCount = Object.values(answers).filter((a) => a.selected.length > 0).length;
  const flaggedCount = Object.values(answers).filter((a) => a.flagged).length;

  const isCorrectAnswer = (q: Question, a: Answer | undefined): boolean => {
    if (!a || a.selected.length === 0) return false;
    const correctSet = q.correct_answer.split(',').sort().join(',');
    const selectedSet = [...a.selected].sort().join(',');
    return correctSet === selectedSet;
  };

  const computeResults = () => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    questions.forEach((q, i) => {
      const a = answers[i];
      if (!a || a.selected.length === 0) { unanswered++; }
      else if (isCorrectAnswer(q, a)) { correct++; }
      else { incorrect++; }
    });
    const passed = exam ? correct >= exam.pass_mark : false;
    return { correct, incorrect, unanswered, passed };
  };

  /* ─── Loading / Error ─── */
  if (examLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
        <Navigation />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (examError || !exam) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
        <Navigation />
        <div id="main-content" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <AlertCircle style={{ width: 48, height: 48, color: '#9CA3AF', margin: '0 auto 16px' }} />
            <h2 style={{ color: p.deepTeal, fontSize: 22, fontWeight: 700 }}>Exam not found</h2>
            <p style={{ color: p.muted, marginTop: 8 }}>This exam may not be published yet.</p>
            <Link to="/exams" style={{ display: 'inline-block', marginTop: 16, color: p.midTeal, fontWeight: 600, textDecoration: 'underline' }}>
              Back to exams
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /* ─── START SCREEN ─── */
  if (phase === 'start') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
        <Helmet><title>{`${exam.title} — Altogether Agile`}</title></Helmet>
        <Navigation />
        <div id="main-content" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 520, width: '100%', background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <div style={{ height: 6, background: `linear-gradient(90deg, ${p.deepTeal}, ${p.midTeal})` }} />
            <div style={{ padding: 32 }}>
              <Link to="/exams" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: p.muted, textDecoration: 'none', marginBottom: 16 }}>
                <ArrowLeft size={14} /> All exams
              </Link>
              <h1 style={{ color: p.deepTeal, fontSize: 28, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.2 }}>{exam.title}</h1>
              {exam.description && <p style={{ color: p.body, fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>{exam.description}</p>}

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
                {[
                  { icon: <BookOpen size={18} />, label: 'Questions', value: exam.total_questions },
                  { icon: <Clock size={18} />, label: 'Duration', value: `${exam.duration_minutes} min` },
                  { icon: <CheckCircle2 size={18} />, label: 'Pass mark', value: `${exam.pass_mark}/${exam.total_questions}` },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: p.skyTeal, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ color: p.midTeal, marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: p.deepTeal }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: p.muted, marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Mode buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => startExam('exam')}
                  style={{
                    flex: 1, padding: '14px 20px', borderRadius: 10, border: 'none',
                    background: p.orange, color: p.deepTeal, fontWeight: 700, fontSize: 15,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  <Timer size={16} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
                  Exam Mode
                </button>
                <button
                  onClick={() => startExam('practice')}
                  style={{
                    flex: 1, padding: '14px 20px', borderRadius: 10,
                    border: `2px solid ${p.deepTeal}`, background: '#fff',
                    color: p.deepTeal, fontWeight: 700, fontSize: 15,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = p.skyTeal; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                >
                  <BookOpen size={16} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
                  Practice Mode
                </button>
              </div>

              <p style={{ fontSize: 12, color: p.muted, textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
                {mode === 'exam'
                  ? 'Timed exam. Answers revealed on completion.'
                  : 'Practice at your own pace. Answers shown after each question.'}
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /* ─── PLAYING SCREEN ─── */
  if (phase === 'playing') {
    const q = questions[currentIdx];
    if (!q) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
          <Navigation />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
          <Footer />
        </div>
      );
    }

    const currentAnswer = answers[currentIdx];
    const options: { letter: string; text: string }[] = [
      { letter: 'A', text: q.option_a },
      { letter: 'B', text: q.option_b },
      { letter: 'C', text: q.option_c },
      { letter: 'D', text: q.option_d },
      { letter: 'E', text: q.option_e },
      { letter: 'F', text: q.option_f },
      { letter: 'G', text: q.option_g },
    ].filter((o) => o.text.trim() !== '');

    const isMulti = q.correct_answer.includes(',');
    const correctLetters = q.correct_answer.split(',');

    const getOptionStyle = (letter: string): React.CSSProperties => {
      const isSelected = currentAnswer?.selected.includes(letter);
      const isCorrect = correctLetters.includes(letter);
      const showResult = mode === 'practice' && practiceRevealed;

      if (showResult && isCorrect) {
        return { background: '#ECFDF5', borderColor: '#10B981', color: '#065F46' };
      }
      if (showResult && isSelected && !isCorrect) {
        return { background: '#FEF2F2', borderColor: '#EF4444', color: '#991B1B' };
      }
      if (isSelected) {
        return { background: p.skyTeal, borderColor: p.deepTeal, color: p.deepTeal };
      }
      return { background: '#fff', borderColor: '#E5E7EB', color: p.body };
    };

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
        <Helmet><title>{`${exam.title} — Question ${currentIdx + 1}`}</title></Helmet>
        <Navigation />

        <div id="main-content" style={{ flex: 1, maxWidth: 1100, margin: '0 auto', padding: '24px 24px 40px', width: '100%' }}>
          {/* Top bar: timer + progress */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: p.muted }}>
                Question <strong style={{ color: p.deepTeal }}>{currentIdx + 1}</strong> / {totalQ}
              </span>
              <span style={{ fontSize: 13, color: p.muted }}>
                {answeredCount} answered
              </span>
              {flaggedCount > 0 && (
                <span style={{ fontSize: 13, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Flag size={12} /> {flaggedCount} flagged
                </span>
              )}
            </div>
            {mode === 'exam' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: timeUrgent ? '#FEF2F2' : p.skyTeal,
                padding: '6px 14px', borderRadius: 8,
                color: timeUrgent ? '#DC2626' : p.deepTeal,
                fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums',
              }}>
                <Clock size={16} /> {timeLeft}
              </div>
            )}
            {mode === 'practice' && (
              <span style={{ fontSize: 13, color: p.midTeal, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <BookOpen size={14} /> Practice Mode
              </span>
            )}
          </div>

          <div className="aa-exam-layout">
            {/* Question panel */}
            <div style={{ flex: 1 }}>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: 28 }}>
                {/* Area badge */}
                <span style={{
                  display: 'inline-block', background: p.skyTeal, color: p.deepTeal,
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12,
                }}>
                  {q.area}
                </span>

                <p style={{ color: p.deepTeal, fontSize: 17, fontWeight: 600, lineHeight: 1.5, margin: '0 0 20px' }}>
                  {q.question_text}
                </p>

                {isMulti && (
                  <p style={{ fontSize: 13, color: p.midTeal, fontWeight: 600, marginBottom: 12, fontStyle: 'italic' }}>
                    Select {correctLetters.length} answers
                  </p>
                )}

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {options.map(({ letter, text }) => {
                    const optStyle = getOptionStyle(letter);
                    const showResult = mode === 'practice' && practiceRevealed;
                    const isCorrect = correctLetters.includes(letter);
                    const isSelected = currentAnswer?.selected.includes(letter);
                    const singleLocked = !isMulti && mode === 'exam' && currentAnswer?.selected.length > 0;
                    return (
                      <button
                        key={letter}
                        onClick={() => selectAnswer(letter)}
                        disabled={singleLocked && !isSelected}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          padding: '14px 16px', borderRadius: 10,
                          border: `2px solid ${optStyle.borderColor}`,
                          background: optStyle.background, color: optStyle.color,
                          cursor: (showResult || singleLocked) ? 'default' : 'pointer',
                          fontFamily: 'inherit', fontSize: 15, textAlign: 'left',
                          transition: 'border-color 0.15s, background 0.15s',
                          width: '100%',
                          opacity: showResult && !isSelected && !isCorrect ? 0.55 : 1,
                        }}
                      >
                        <span style={{
                          flexShrink: 0, width: 28, height: 28, borderRadius: isMulti ? 6 : '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700,
                          background: isSelected ? (showResult ? (isCorrect ? '#10B981' : '#EF4444') : p.deepTeal) : '#F3F4F6',
                          color: isSelected ? '#fff' : p.body,
                        }}>
                          {letter}
                        </span>
                        <span style={{ paddingTop: 3, lineHeight: 1.45 }}>{text}</span>
                        {showResult && isCorrect && (
                          <CheckCircle2 size={18} style={{ marginLeft: 'auto', flexShrink: 0, color: '#10B981', marginTop: 4 }} />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <XCircle size={18} style={{ marginLeft: 'auto', flexShrink: 0, color: '#EF4444', marginTop: 4 }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Confirm button for multi-answer in practice mode */}
                {isMulti && mode === 'practice' && !practiceRevealed && currentAnswer?.selected.length > 0 && (
                  <button
                    onClick={confirmMultiAnswer}
                    style={{
                      marginTop: 12, padding: '8px 20px', borderRadius: 8, border: 'none',
                      background: p.deepTeal, color: '#fff', fontWeight: 700, fontSize: 14,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Confirm Answer
                  </button>
                )}

                {/* Practice mode reference */}
                {mode === 'practice' && practiceRevealed && q.reference && (
                  <div style={{ marginTop: 16, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, fontSize: 13, color: p.muted }}>
                    {q.reference}
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <NavBtn onClick={goPrev} disabled={currentIdx === 0}><ChevronLeft size={16} /> Prev</NavBtn>
                  <NavBtn onClick={goNext} disabled={currentIdx === questions.length - 1}>Next <ChevronRight size={16} /></NavBtn>
                  <NavBtn onClick={goNextUnanswered}><SkipForward size={14} /> Unanswered</NavBtn>
                  {flaggedCount > 0 && (
                    <NavBtn onClick={goNextFlagged}><Flag size={14} /> Flagged</NavBtn>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={toggleFlag}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '8px 14px', borderRadius: 8,
                      border: `1px solid ${currentAnswer?.flagged ? '#F59E0B' : '#D1D5DB'}`,
                      background: currentAnswer?.flagged ? '#FFFBEB' : '#fff',
                      color: currentAnswer?.flagged ? '#B45309' : p.muted,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <Flag size={14} /> {currentAnswer?.flagged ? 'Unflag' : 'Flag'}
                  </button>
                  <button
                    onClick={finishExam}
                    style={{
                      padding: '8px 18px', borderRadius: 8, border: 'none',
                      background: p.deepTeal, color: '#fff',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Finish
                  </button>
                </div>
              </div>
            </div>

            {/* Progress grid sidebar */}
            <div className="aa-exam-sidebar">
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: p.deepTeal, marginBottom: 10 }}>Progress</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                  {questions.map((_, i) => {
                    const a = answers[i];
                    const isCurrent = i === currentIdx;
                    let bg: string = '#F3F4F6';
                    let color: string = p.muted;
                    let border: string = 'transparent';
                    if (a?.flagged && a?.selected.length) { bg = '#FEF3C7'; color = '#92400E'; }
                    else if (a?.flagged) { bg = '#FFFBEB'; color = '#B45309'; }
                    else if (a?.selected.length) { bg = p.paleTeal; color = p.deepTeal; }
                    if (isCurrent) { border = p.deepTeal; }
                    return (
                      <button
                        key={i}
                        onClick={() => goTo(i)}
                        style={{
                          width: '100%', aspectRatio: '1', borderRadius: 6,
                          border: `2px solid ${border}`, background: bg, color,
                          fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          fontFamily: 'inherit', padding: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, fontSize: 11, color: p.muted }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: p.paleTeal, border: '1px solid ' + p.lightTeal }} /> Answered
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#FFFBEB', border: '1px solid #FDE68A' }} /> Flagged
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#F3F4F6', border: `2px solid ${p.deepTeal}` }} /> Current
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
        <ExamLayoutStyles />
      </div>
    );
  }

  /* ─── REVIEW SCREEN ─── */
  const results = computeResults();
  const percentage = totalQ > 0 ? Math.round((results.correct / totalQ) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
      <Helmet><title>{`${exam.title} — Results`}</title></Helmet>
      <Navigation />

      <div id="main-content" style={{ flex: 1, maxWidth: 800, margin: '0 auto', padding: '32px 24px 48px', width: '100%' }}>
        {/* Score card */}
        <div style={{
          background: results.passed
            ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
            : 'linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)',
          borderRadius: 16, padding: 32, textAlign: 'center', marginBottom: 32,
          border: `1px solid ${results.passed ? '#A7F3D0' : '#FCA5A5'}`,
        }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: results.passed ? '#065F46' : '#991B1B', lineHeight: 1 }}>
            {results.correct}/{totalQ}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: results.passed ? '#047857' : '#DC2626', marginTop: 8 }}>
            {results.passed ? 'Passed' : 'Not Passed'} — {percentage}%
          </div>
          <div style={{ fontSize: 14, color: results.passed ? '#059669' : '#EF4444', marginTop: 4 }}>
            Pass mark: {exam.pass_mark}/{totalQ}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20 }}>
            <StatPill label="Correct" value={results.correct} color="#10B981" />
            <StatPill label="Incorrect" value={results.incorrect} color="#EF4444" />
            <StatPill label="Unanswered" value={results.unanswered} color="#9CA3AF" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
            <button
              onClick={retake}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 22px', borderRadius: 8, border: 'none',
                background: p.orange, color: p.deepTeal,
                fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <RotateCcw size={15} /> Retake
            </button>
            <Link
              to="/exams"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 22px', borderRadius: 8,
                border: `2px solid ${p.deepTeal}`, background: '#fff',
                color: p.deepTeal, fontWeight: 700, fontSize: 14, textDecoration: 'none',
              }}
            >
              <ArrowLeft size={15} /> All Exams
            </Link>
          </div>
        </div>

        {/* Question review */}
        <h2 style={{ color: p.deepTeal, fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Question Review</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {questions.map((q, i) => {
            const a = answers[i];
            const qCorrectAnswer = isCorrectAnswer(q, a);
            const wasAnswered = (a?.selected.length ?? 0) > 0;
            const qCorrectLetters = q.correct_answer.split(',');

            return (
              <div key={q.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                {/* Status bar */}
                <div style={{
                  height: 4,
                  background: wasAnswered ? (qCorrectAnswer ? '#10B981' : '#EF4444') : '#D1D5DB',
                }} />
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.muted }}>Q{i + 1}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                      background: wasAnswered ? (qCorrectAnswer ? '#ECFDF5' : '#FEF2F2') : '#F3F4F6',
                      color: wasAnswered ? (qCorrectAnswer ? '#065F46' : '#991B1B') : '#6B7280',
                    }}>
                      {wasAnswered ? (qCorrectAnswer ? 'CORRECT' : 'INCORRECT') : 'UNANSWERED'}
                    </span>
                    {qCorrectLetters.length > 1 && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: '#EFF6FF', color: '#1D4ED8' }}>
                        MULTI
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: p.muted, marginLeft: 'auto' }}>{q.area}</span>
                  </div>
                  <p style={{ color: p.deepTeal, fontSize: 15, fontWeight: 600, lineHeight: 1.45, margin: '0 0 12px' }}>
                    {q.question_text}
                  </p>

                  {/* Options review */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { letter: 'A', text: q.option_a },
                      { letter: 'B', text: q.option_b },
                      { letter: 'C', text: q.option_c },
                      { letter: 'D', text: q.option_d },
                      { letter: 'E', text: q.option_e },
                      { letter: 'F', text: q.option_f },
                      { letter: 'G', text: q.option_g },
                    ].filter((o) => o.text.trim() !== '').map(({ letter, text }) => {
                      const isThisCorrect = qCorrectLetters.includes(letter);
                      const wasSelected = a?.selected.includes(letter);
                      let bg: string = '#FAFAFA';
                      let borderCol: string = '#E5E7EB';
                      let textColor: string = p.body;
                      if (isThisCorrect) { bg = '#ECFDF5'; borderCol = '#A7F3D0'; textColor = '#065F46'; }
                      else if (wasSelected) { bg = '#FEF2F2'; borderCol = '#FECACA'; textColor = '#991B1B'; }
                      return (
                        <div key={letter} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 8,
                          padding: '8px 12px', borderRadius: 8,
                          border: `1px solid ${borderCol}`, background: bg,
                          fontSize: 14, color: textColor,
                        }}>
                          <span style={{ fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 1 }}>{letter}.</span>
                          <span style={{ lineHeight: 1.45 }}>{text}</span>
                          {isThisCorrect && <CheckCircle2 size={15} style={{ marginLeft: 'auto', color: '#10B981', flexShrink: 0, marginTop: 2 }} />}
                          {wasSelected && !isThisCorrect && <XCircle size={15} style={{ marginLeft: 'auto', color: '#EF4444', flexShrink: 0, marginTop: 2 }} />}
                        </div>
                      );
                    })}
                  </div>

                  {q.reference && (
                    <div style={{ marginTop: 10, fontSize: 12, color: p.muted }}>{q.reference}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
};

/* ─── Small components ─── */
const NavBtn = ({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '8px 14px', borderRadius: 8,
      border: '1px solid #D1D5DB', background: '#fff',
      color: disabled ? '#D1D5DB' : '#374151',
      fontSize: 13, fontWeight: 600,
      cursor: disabled ? 'default' : 'pointer',
      fontFamily: 'inherit', transition: 'background 0.15s',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {children}
  </button>
);

const StatPill = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: 11, color: '#6B7280' }}>{label}</div>
  </div>
);

const ExamLayoutStyles = () => (
  <style>{`
    .aa-exam-layout { display: flex; gap: 24px; align-items: flex-start; }
    .aa-exam-sidebar { width: 220px; flex-shrink: 0; position: sticky; top: 80px; }
    @media (max-width: 767px) {
      .aa-exam-layout { flex-direction: column-reverse; }
      .aa-exam-sidebar { width: 100%; position: static; }
    }
  `}</style>
);

export default ExamPlayer;
