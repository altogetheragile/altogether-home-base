'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Clock, BookOpen, Timer, CheckCircle2, XCircle, Flag, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export type ExamForPlayer = {
  id: string;
  title: string;
  description: string | null;
  scenario: string | null;
  shuffle: boolean;
  duration_minutes: number;
  pass_mark: number;
  total_questions: number;
};

type Question = {
  id: string;
  area: string | null;
  question_text: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  option_e: string; option_f: string; option_g: string; option_h: string;
  correct_answer: string;
  reference: string | null;
  sort_order: number | null;
};

type Answer = { selected: string[]; flagged: boolean };
type Phase = 'choose' | 'playing' | 'review';
type Mode = 'exam' | 'practice';

const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function optionsOf(q: Question) {
  return LETTERS.map((l) => ({ letter: l, text: (q[`option_${l}` as keyof Question] as string) || '' })).filter(
    (o) => o.text.trim() !== '',
  );
}

function isCorrect(q: Question, a: Answer | undefined) {
  if (!a || a.selected.length === 0) return false;
  return q.correct_answer.split(',').map((s) => s.trim()).sort().join(',') === [...a.selected].sort().join(',');
}

export function ExamPlayer({ exam }: { exam: ExamForPlayer }) {
  const supabase = useMemo(() => createClient(), []);
  const [phase, setPhase] = useState<Phase>('choose');
  const [mode, setMode] = useState<Mode>('exam');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [practiceRevealed, setPracticeRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const expiredRef = useRef(false);

  // Countdown (exam mode only)
  useEffect(() => {
    if (phase !== 'playing' || mode !== 'exam') return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          if (!expiredRef.current) {
            expiredRef.current = true;
            setPhase('review');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, mode]);

  const start = useCallback(
    async (m: Mode) => {
      setLoading(true);
      const { data } = await supabase
        .from('questions')
        .select('id, area, question_text, option_a, option_b, option_c, option_d, option_e, option_f, option_g, option_h, correct_answer, reference, sort_order')
        .eq('exam_id', exam.id)
        .eq('status', 'published')
        .order('sort_order', { ascending: true, nullsFirst: false });
      const raw = (data as Question[]) ?? [];
      const ordered = exam.shuffle === false ? raw : shuffle(raw);
      const limited = ordered.slice(0, exam.total_questions || ordered.length);
      const init: Record<number, Answer> = {};
      limited.forEach((_, i) => (init[i] = { selected: [], flagged: false }));
      setQuestions(limited);
      setAnswers(init);
      setCurrentIdx(0);
      setMode(m);
      setPracticeRevealed(false);
      expiredRef.current = false;
      if (m === 'exam') setRemaining((exam.duration_minutes || 40) * 60);
      setPhase('playing');
      setLoading(false);
    },
    [exam, supabase],
  );

  const q = questions[currentIdx];
  const answer = answers[currentIdx];
  const isMulti = q?.correct_answer.includes(',');

  const select = (letter: string) => {
    if (!q) return;
    const current = answer?.selected || [];
    if (isMulti) {
      if (practiceRevealed) return;
      const max = q.correct_answer.split(',').length;
      const has = current.includes(letter);
      if (!has && current.length >= max) return;
      const next = has ? current.filter((l) => l !== letter) : [...current, letter].sort();
      setAnswers((p) => ({ ...p, [currentIdx]: { ...p[currentIdx], selected: next } }));
    } else {
      if (current.includes(letter)) {
        setAnswers((p) => ({ ...p, [currentIdx]: { ...p[currentIdx], selected: [] } }));
        if (mode === 'practice') setPracticeRevealed(false);
        return;
      }
      if (mode === 'exam' && current.length > 0) return;
      if (mode === 'practice' && practiceRevealed) return;
      setAnswers((p) => ({ ...p, [currentIdx]: { ...p[currentIdx], selected: [letter] } }));
      if (mode === 'practice') setPracticeRevealed(true);
    }
  };

  const goTo = (i: number) => {
    setCurrentIdx(i);
    setPracticeRevealed(false);
  };

  const saveAttempt = useCallback(
    async (correct: number, passed: boolean) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from('exam_attempts').insert({
          exam_id: exam.id,
          user_id: user.id,
          score: correct,
          passed,
          answers: Object.fromEntries(questions.map((qq, i) => [qq.id, { selected: answers[i]?.selected ?? [], correct: qq.correct_answer }])),
          completed_at: new Date().toISOString(),
        });
      } catch {
        /* anonymous or save failed: the exam still works, just unsaved */
      }
    },
    [supabase, exam.id, questions, answers],
  );

  const results = useMemo(() => {
    let correct = 0, incorrect = 0, unanswered = 0;
    questions.forEach((qq, i) => {
      const a = answers[i];
      if (!a || a.selected.length === 0) unanswered++;
      else if (isCorrect(qq, a)) correct++;
      else incorrect++;
    });
    return { correct, incorrect, unanswered, passed: correct >= exam.pass_mark };
  }, [questions, answers, exam.pass_mark]);

  const finish = () => {
    setPhase('review');
    saveAttempt(results.correct, results.passed);
  };

  const retake = () => {
    setPhase('choose');
    setQuestions([]);
    setAnswers({});
    setCurrentIdx(0);
    setPracticeRevealed(false);
    expiredRef.current = false;
  };

  // ── Choose mode ──
  if (phase === 'choose') {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Ready to start?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose timed exam conditions, or revision mode to see answers as you go.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => start('exam')}
            disabled={loading}
            className="flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-accent disabled:opacity-50"
          >
            <span className="flex items-center gap-2 font-semibold text-foreground"><Timer size={18} /> Timed exam</span>
            <span className="text-sm text-muted-foreground">{exam.duration_minutes} min, answers at the end.</span>
          </button>
          <button
            onClick={() => start('practice')}
            disabled={loading}
            className="flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-accent disabled:opacity-50"
          >
            <span className="flex items-center gap-2 font-semibold text-foreground"><BookOpen size={18} /> Revision mode</span>
            <span className="text-sm text-muted-foreground">Untimed, answers revealed as you go.</span>
          </button>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <BookOpen size={12} /> {exam.total_questions} questions · pass mark {exam.pass_mark}
        </p>
      </div>
    );
  }

  // ── Review / results ──
  if (phase === 'review') {
    const pct = questions.length ? Math.round((results.correct / questions.length) * 100) : 0;
    return (
      <div>
        <div className={cn('rounded-lg border p-6 text-center', results.passed ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50')}>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {results.passed ? 'Passed' : 'Not passed'}
          </p>
          <p className="mt-1 text-4xl font-bold text-foreground">{results.correct} / {questions.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">{pct}% · pass mark {exam.pass_mark} · {results.unanswered} unanswered</p>
          <Button onClick={retake} variant="outline" className="mt-4"><RotateCcw size={16} /> Retake</Button>
        </div>
        <ol className="mt-6 space-y-5">
          {questions.map((qq, i) => {
            const a = answers[i];
            const ok = isCorrect(qq, a);
            const opts = optionsOf(qq);
            const correctSet = qq.correct_answer.split(',').map((s) => s.trim());
            return (
              <li key={qq.id} className="rounded-lg border p-4">
                <div className="flex items-start gap-2">
                  {ok ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" /> : <XCircle size={18} className="mt-0.5 shrink-0 text-destructive" />}
                  <p className="text-sm font-medium text-foreground">{i + 1}. {qq.question_text}</p>
                </div>
                <ul className="mt-2 space-y-1 pl-7 text-sm">
                  {opts.map((o) => {
                    const sel = a?.selected.includes(o.letter);
                    const corr = correctSet.includes(o.letter);
                    return (
                      <li key={o.letter} className={cn(corr && 'font-semibold text-emerald-700', sel && !corr && 'text-destructive line-through')}>
                        {o.letter.toUpperCase()}. {o.text}{corr ? ' ✓' : ''}
                      </li>
                    );
                  })}
                </ul>
                {qq.reference && <p className="mt-2 pl-7 text-xs text-muted-foreground">Reference: {qq.reference}</p>}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  // ── Playing ──
  if (!q) return <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Loading questions…</div>;

  const opts = optionsOf(q);
  const revealed = mode === 'practice' && practiceRevealed;
  const correctSet = q.correct_answer.split(',').map((s) => s.trim());
  const mm = Math.floor(remaining / 60), ss = remaining % 60;

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5 text-sm">
        <span className="text-muted-foreground">Question {currentIdx + 1} of {questions.length}</span>
        <div className="flex items-center gap-3">
          {mode === 'exam' && (
            <span className={cn('flex items-center gap-1 font-mono font-medium', remaining < 120 ? 'text-destructive' : 'text-foreground')}>
              <Clock size={14} /> {mm}:{ss.toString().padStart(2, '0')}
            </span>
          )}
          <button onClick={() => setAnswers((p) => ({ ...p, [currentIdx]: { ...p[currentIdx], flagged: !p[currentIdx]?.flagged } }))} className={cn('flex items-center gap-1', answer?.flagged ? 'text-primary' : 'text-muted-foreground')}>
            <Flag size={14} /> Flag
          </button>
        </div>
      </div>

      <div className="p-5">
        {q.area && <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{q.area}</p>}
        <p className="text-base font-medium text-foreground">{q.question_text}</p>
        {isMulti && <p className="mt-1 text-xs text-muted-foreground">Select {correctSet.length}.</p>}

        <div className="mt-4 space-y-2">
          {opts.map((o) => {
            const sel = answer?.selected.includes(o.letter);
            const corr = correctSet.includes(o.letter);
            return (
              <button
                key={o.letter}
                onClick={() => select(o.letter)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
                  sel && !revealed && 'border-primary bg-primary/5',
                  revealed && corr && 'border-emerald-400 bg-emerald-50',
                  revealed && sel && !corr && 'border-destructive bg-destructive/5',
                  !sel && !revealed && 'hover:bg-accent',
                )}
              >
                <span className="font-semibold text-muted-foreground">{o.letter.toUpperCase()}</span>
                <span className="text-foreground">{o.text}</span>
              </button>
            );
          })}
        </div>

        {revealed && q.reference && <p className="mt-3 text-xs text-muted-foreground">Reference: {q.reference}</p>}
        {isMulti && mode === 'practice' && !practiceRevealed && answer?.selected.length === correctSet.length && (
          <Button onClick={() => setPracticeRevealed(true)} variant="outline" size="sm" className="mt-3">Check answer</Button>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-4 py-3">
        <Button onClick={() => goTo(Math.max(0, currentIdx - 1))} variant="outline" size="sm" disabled={currentIdx === 0}>
          <ChevronLeft size={16} /> Prev
        </Button>
        {currentIdx < questions.length - 1 ? (
          <Button onClick={() => goTo(currentIdx + 1)} size="sm">Next <ChevronRight size={16} /></Button>
        ) : (
          <Button onClick={finish} size="sm">Finish</Button>
        )}
      </div>
    </div>
  );
}
