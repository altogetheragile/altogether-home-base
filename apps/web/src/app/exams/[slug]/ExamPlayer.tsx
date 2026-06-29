'use client';

import { useState, useEffect, useMemo, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { marked } from 'marked';
import { createClient } from '@/lib/supabase/client';
import {
  Clock, Timer, BookOpen, Flag, ChevronLeft, ChevronRight, SkipForward,
  CheckCircle2, XCircle, RotateCcw, ArrowLeft,
} from 'lucide-react';

// Brand teal palette (mirrors src/theme/colors.ts in the Vite app).
const c = {
  white: '#FFFFFF', skyTeal: '#F0FAFA', paleTeal: '#D9F2F2', lightTeal: '#B2DFDF',
  midTeal: '#007A7A', deepTeal: '#004D4D', orange: '#FF9715', body: '#374151', muted: '#6B7280',
};

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
  question_number: number | null;
  part: string | null;
  item_type: string | null;
  part_instruction: string | null;
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
type PartItem = { globalIndex: number; q: Question };
type PartGroup = { key: string; qnum: number; part: string; itemType: string; instruction: string; items: PartItem[] };

const LETTERS: [string, keyof Question][] = [
  ['A', 'option_a'], ['B', 'option_b'], ['C', 'option_c'], ['D', 'option_d'],
  ['E', 'option_e'], ['F', 'option_f'], ['G', 'option_g'], ['H', 'option_h'],
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function optionsOf(q: Question) {
  return LETTERS.map(([letter, field]) => ({ letter, text: (q[field] as string) || '' })).filter((o) => o.text.trim() !== '');
}
function correctLetters(q: Question) {
  return q.correct_answer.split(',').map((s) => s.trim().toUpperCase());
}
function isCorrect(q: Question, a: Answer | undefined) {
  if (!a || a.selected.length === 0) return false;
  return correctLetters(q).sort().join(',') === [...a.selected].map((s) => s.toUpperCase()).sort().join(',');
}
function renderScenario(md: string | null) {
  if (!md) return '';
  const html = String(marked.parse(md, { async: false }));
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

export function ExamPlayer({ exam }: { exam: ExamForPlayer }) {
  const supabase = useMemo(() => createClient(), []);
  const [phase, setPhase] = useState<Phase>('choose');
  const [mode, setMode] = useState<Mode>('exam');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [practiceRevealed, setPracticeRevealed] = useState(false);
  const [scenarioTab, setScenarioTab] = useState<'question' | 'scenario'>('question');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const expiredRef = useRef(false);

  const grouped = !!exam.scenario;
  const scenarioHtml = useMemo(() => renderScenario(exam.scenario), [exam.scenario]);

  const parts = useMemo<PartGroup[]>(() => {
    const map = new Map<string, PartGroup>();
    questions.forEach((q, idx) => {
      const key = `${q.question_number ?? 0}-${q.part ?? ''}`;
      if (!map.has(key)) {
        map.set(key, { key, qnum: q.question_number ?? 0, part: q.part ?? '', itemType: q.item_type ?? 'single', instruction: q.part_instruction ?? '', items: [] });
      }
      map.get(key)!.items.push({ globalIndex: idx, q });
    });
    return Array.from(map.values());
  }, [questions]);

  useEffect(() => {
    if (phase !== 'playing' || mode !== 'exam') return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(id); if (!expiredRef.current) { expiredRef.current = true; setPhase('review'); } return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, mode]);

  const start = useCallback(async (m: Mode) => {
    setLoading(true);
    const { data } = await supabase
      .from('questions')
      .select('id, area, question_number, part, item_type, part_instruction, question_text, option_a, option_b, option_c, option_d, option_e, option_f, option_g, option_h, correct_answer, reference, sort_order')
      .eq('exam_id', exam.id)
      .eq('status', 'published')
      .order('sort_order', { ascending: true, nullsFirst: false });
    const raw = (data as Question[]) ?? [];
    const ordered = exam.shuffle === false ? raw : shuffle(raw);
    const limited = ordered.slice(0, exam.total_questions || ordered.length);
    const init: Record<number, Answer> = {};
    limited.forEach((_, i) => (init[i] = { selected: [], flagged: false }));
    setQuestions(limited); setAnswers(init); setCurrentIdx(0); setMode(m);
    setPracticeRevealed(false); setScenarioTab('question'); expiredRef.current = false;
    if (m === 'exam') setRemaining((exam.duration_minutes || 40) * 60);
    setPhase('playing'); setLoading(false);
  }, [exam, supabase]);

  const q = questions[currentIdx];
  const answer = answers[currentIdx];
  const isMulti = q?.correct_answer.includes(',');
  const currentPart = grouped ? parts.find((pt) => pt.items.some((it) => it.globalIndex === currentIdx)) : undefined;
  const isMatch = !!currentPart && currentPart.itemType === 'match';

  const select = (letter: string) => {
    if (!q) return;
    const current = answer?.selected || [];
    if (isMulti) {
      if (practiceRevealed) return;
      const max = correctLetters(q).length;
      const has = current.includes(letter);
      if (!has && current.length >= max) return;
      const next = has ? current.filter((l) => l !== letter) : [...current, letter].sort();
      setAnswers((p) => ({ ...p, [currentIdx]: { ...p[currentIdx], selected: next } }));
    } else {
      if (current.includes(letter)) { setAnswers((p) => ({ ...p, [currentIdx]: { ...p[currentIdx], selected: [] } })); if (mode === 'practice') setPracticeRevealed(false); return; }
      if (mode === 'exam' && current.length > 0) return;
      if (mode === 'practice' && practiceRevealed) return;
      setAnswers((p) => ({ ...p, [currentIdx]: { ...p[currentIdx], selected: [letter] } }));
      if (mode === 'practice') setPracticeRevealed(true);
    }
  };
  const selectMatchRow = (gi: number, letter: string) =>
    setAnswers((p) => { const cur = p[gi]?.selected || []; return { ...p, [gi]: { ...p[gi], selected: cur.includes(letter) ? [] : [letter] } }; });

  const goTo = (i: number) => { setCurrentIdx(i); setPracticeRevealed(false); setScenarioTab('question'); };
  const goNextUnanswered = () => { for (let k = 1; k <= questions.length; k++) { const i = (currentIdx + k) % questions.length; if (!answers[i]?.selected.length) { goTo(i); return; } } };
  const goNextFlagged = () => { for (let k = 1; k <= questions.length; k++) { const i = (currentIdx + k) % questions.length; if (answers[i]?.flagged) { goTo(i); return; } } };
  const toggleFlag = () => setAnswers((p) => ({ ...p, [currentIdx]: { ...p[currentIdx], flagged: !p[currentIdx]?.flagged } }));

  const answeredCount = Object.values(answers).filter((a) => a.selected.length > 0).length;
  const flaggedCount = Object.values(answers).filter((a) => a.flagged).length;

  const results = useMemo(() => {
    let correct = 0, incorrect = 0, unanswered = 0;
    questions.forEach((qq, i) => { const a = answers[i]; if (!a || a.selected.length === 0) unanswered++; else if (isCorrect(qq, a)) correct++; else incorrect++; });
    return { correct, incorrect, unanswered, passed: correct >= exam.pass_mark };
  }, [questions, answers, exam.pass_mark]);

  const saveAttempt = useCallback(async (correct: number, passed: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('exam_attempts').insert({ exam_id: exam.id, user_id: user.id, score: correct, passed,
        answers: Object.fromEntries(questions.map((qq, i) => [qq.id, { selected: answers[i]?.selected ?? [], correct: qq.correct_answer }])), completed_at: new Date().toISOString() });
    } catch { /* anonymous / save failed */ }
  }, [supabase, exam.id, questions, answers]);

  const finish = () => { setPhase('review'); saveAttempt(results.correct, results.passed); };
  const retake = () => { setPhase('choose'); setQuestions([]); setAnswers({}); setCurrentIdx(0); setPracticeRevealed(false); expiredRef.current = false; };

  const card: CSSProperties = { background: c.white, borderRadius: 14, border: '1px solid #E5E7EB' };

  // ── Choose ──
  if (phase === 'choose') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', background: c.white, borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ height: 6, background: `linear-gradient(90deg, ${c.deepTeal}, ${c.midTeal})` }} />
        <div style={{ padding: 32 }}>
          <Link href="/exams" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: c.muted, textDecoration: 'none', marginBottom: 16 }}><ArrowLeft size={14} /> All exams</Link>
          <h1 style={{ color: c.deepTeal, fontSize: 28, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.2 }}>{exam.title}</h1>
          {exam.description && <p style={{ color: c.body, fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>{exam.description}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
            {[{ icon: <BookOpen size={18} />, label: 'Questions', value: exam.total_questions }, { icon: <Clock size={18} />, label: 'Duration', value: `${exam.duration_minutes} min` }, { icon: <CheckCircle2 size={18} />, label: 'Pass mark', value: `${exam.pass_mark}/${exam.total_questions}` }].map((s) => (
              <div key={s.label} style={{ background: c.skyTeal, borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ color: c.midTeal, marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: c.deepTeal }}>{s.value}</div>
                <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => start('exam')} disabled={loading} style={{ flex: 1, padding: '14px 20px', borderRadius: 10, border: 'none', background: c.orange, color: c.deepTeal, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}><Timer size={16} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} /> Exam Mode</button>
            <button onClick={() => start('practice')} disabled={loading} style={{ flex: 1, padding: '14px 20px', borderRadius: 10, border: `2px solid ${c.deepTeal}`, background: c.white, color: c.deepTeal, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}><BookOpen size={16} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} /> Practice Mode</button>
          </div>
          <p style={{ fontSize: 12, color: c.muted, textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>Exam mode is timed with answers at the end. Practice mode is untimed and reveals answers as you go.</p>
        </div>
      </div>
    );
  }

  // ── Review ──
  if (phase === 'review') {
    const pct = questions.length ? Math.round((results.correct / questions.length) * 100) : 0;
    return (
      <div>
        <div style={{ borderRadius: 16, padding: 28, textAlign: 'center', marginBottom: 24, background: results.passed ? 'linear-gradient(135deg,#ECFDF5,#D1FAE5)' : 'linear-gradient(135deg,#FEF2F2,#FECACA)' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: c.muted }}>{results.passed ? 'Passed' : 'Not passed'}</p>
          <p style={{ margin: '6px 0 0', fontSize: 40, fontWeight: 800, color: c.deepTeal }}>{results.correct} / {questions.length}</p>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: c.body }}>{pct}% · pass mark {exam.pass_mark} · {results.unanswered} unanswered</p>
          <button onClick={retake} style={{ marginTop: 16, padding: '8px 18px', borderRadius: 8, border: `1px solid ${c.lightTeal}`, background: c.white, color: c.deepTeal, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}><RotateCcw size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} /> Retake</button>
        </div>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {questions.map((qq, i) => {
            const a = answers[i]; const ok = isCorrect(qq, a); const corr = correctLetters(qq);
            return (
              <li key={qq.id} style={{ ...card, padding: 16 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  {ok ? <CheckCircle2 size={18} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} /> : <XCircle size={18} color="#DC2626" style={{ marginTop: 2, flexShrink: 0 }} />}
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: c.body }}>{i + 1}. {qq.question_text}</p>
                </div>
                <ul style={{ listStyle: 'none', padding: '0 0 0 26px', margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {optionsOf(qq).map((o) => { const sel = a?.selected.includes(o.letter); const isC = corr.includes(o.letter);
                    return <li key={o.letter} style={{ fontSize: 13, color: isC ? '#047857' : sel ? '#B91C1C' : c.muted, fontWeight: isC ? 700 : 400, textDecoration: sel && !isC ? 'line-through' : 'none' }}>{o.letter}. {o.text}{isC ? ' ✓' : ''}</li>;
                  })}
                </ul>
                {qq.reference && <p style={{ margin: '8px 0 0 26px', fontSize: 12, color: c.muted }}>Reference: {qq.reference}</p>}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  // ── Playing ──
  if (!q) return <div style={{ ...card, padding: 24, color: c.muted, fontSize: 14 }}>Loading questions…</div>;

  const opts = optionsOf(q);
  const revealed = mode === 'practice' && practiceRevealed;
  const corr = correctLetters(q);
  const mm = Math.floor(remaining / 60), ss = remaining % 60;
  const urgent = remaining < 120 && remaining > 0;
  const optStyle = (letter: string): CSSProperties => {
    const sel = answer?.selected.includes(letter); const isC = corr.includes(letter);
    if (revealed && isC) return { background: '#ECFDF5', borderColor: '#10B981', color: '#065F46' };
    if (revealed && sel && !isC) return { background: '#FEF2F2', borderColor: '#EF4444', color: '#991B1B' };
    if (sel) return { background: c.skyTeal, borderColor: c.deepTeal, color: c.deepTeal };
    return { background: c.white, borderColor: '#E5E7EB', color: c.body };
  };

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 14, color: c.muted }}>Question <strong style={{ color: c.deepTeal }}>{currentIdx + 1}</strong> / {questions.length}</span>
          <span style={{ fontSize: 13, color: c.muted }}>{answeredCount} answered</span>
          {flaggedCount > 0 && <span style={{ fontSize: 13, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 3 }}><Flag size={12} /> {flaggedCount} flagged</span>}
        </div>
        {mode === 'exam' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: urgent ? '#FEF2F2' : c.skyTeal, padding: '6px 14px', borderRadius: 8, color: urgent ? '#DC2626' : c.deepTeal, fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}><Clock size={16} /> {mm}:{ss.toString().padStart(2, '0')}</div>
        ) : <span style={{ fontSize: 13, color: c.midTeal, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><BookOpen size={14} /> Practice Mode</span>}
      </div>

      {/* Scenario tabs (Practitioner) */}
      {grouped && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }} className="aa-tabs">
          <ScenarioTabBtn active={scenarioTab === 'question'} onClick={() => setScenarioTab('question')}>Question</ScenarioTabBtn>
          <ScenarioTabBtn active={scenarioTab === 'scenario'} onClick={() => setScenarioTab('scenario')}>Project Scenario</ScenarioTabBtn>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 16 }} className="exam-grid">
        <div className={grouped ? 'aa-prac' : undefined} style={grouped ? { display: 'flex', flexDirection: 'column', gap: 16 } : undefined}>
          {/* Scenario pane */}
          {grouped && (
            <div className="pane-scenario" data-active={scenarioTab === 'scenario'} style={{ ...card, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.deepTeal, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>Project Scenario</div>
              <div className="aa-scenario-body" dangerouslySetInnerHTML={{ __html: scenarioHtml }} />
            </div>
          )}

          {/* Question pane */}
          <div className="pane-question" data-active={scenarioTab === 'question'} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...card, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {q.area && <span style={{ background: c.skyTeal, color: c.deepTeal, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '.05em' }}>{q.area}</span>}
                {isMatch && currentPart && <span style={{ fontSize: 12, color: c.muted, fontWeight: 600 }}>Matching — {currentPart.items.length} rows</span>}
              </div>
              {grouped && q.part_instruction && <p style={{ color: c.body, fontSize: 14, lineHeight: 1.55, margin: '0 0 16px' }}>{q.part_instruction}</p>}

              {isMatch && currentPart ? (
                <MatchingPart items={currentPart.items} answers={answers} mode={mode} currentIdx={currentIdx} onSelect={selectMatchRow} onFocusRow={goTo} />
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: c.body, whiteSpace: 'pre-line' }}>{q.question_text}</p>
                  {isMulti && <p style={{ margin: '4px 0 0', fontSize: 12, color: c.muted }}>Select {corr.length}.</p>}
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {opts.map((o) => (
                      <button key={o.letter} onClick={() => select(o.letter)} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', width: '100%', textAlign: 'left', padding: 12, borderRadius: 10, border: '1px solid', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', ...optStyle(o.letter) }}>
                        <span style={{ fontWeight: 700 }}>{o.letter}</span><span>{o.text}</span>
                      </button>
                    ))}
                  </div>
                  {revealed && q.reference && <div style={{ marginTop: 14, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, fontSize: 13, color: c.muted }}>{q.reference}</div>}
                  {isMulti && mode === 'practice' && !practiceRevealed && answer?.selected.length === corr.length && (
                    <button onClick={() => setPracticeRevealed(true)} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 8, border: 'none', background: c.deepTeal, color: c.white, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Confirm Answer</button>
                  )}
                </>
              )}

              {/* Nav buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <NavBtn onClick={() => goTo(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}><ChevronLeft size={16} /> Prev</NavBtn>
                  <NavBtn onClick={() => goTo(Math.min(questions.length - 1, currentIdx + 1))} disabled={currentIdx === questions.length - 1}>Next <ChevronRight size={16} /></NavBtn>
                  <NavBtn onClick={goNextUnanswered}><SkipForward size={14} /> Unanswered</NavBtn>
                  {flaggedCount > 0 && <NavBtn onClick={goNextFlagged}><Flag size={14} /> Flagged</NavBtn>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={toggleFlag} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 8, border: `1px solid ${answer?.flagged ? '#F59E0B' : '#D1D5DB'}`, background: answer?.flagged ? '#FFFBEB' : c.white, color: answer?.flagged ? '#B45309' : c.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><Flag size={14} /> {answer?.flagged ? 'Unflag' : 'Flag'}</button>
                  <button onClick={finish} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: c.deepTeal, color: c.white, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Finish</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ ...card, padding: 16 }} className="exam-sidebar">
          {grouped ? (
            <GroupedProgress parts={parts} answers={answers} currentIdx={currentIdx} onGoTo={goTo} />
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.deepTeal, marginBottom: 10 }}>Progress</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4 }}>
                {questions.map((_, i) => {
                  const a = answers[i]; const isCur = i === currentIdx;
                  let bg = '#F3F4F6', color: string = c.muted, border = 'transparent';
                  if (a?.flagged && a?.selected.length) { bg = '#FEF3C7'; color = '#92400E'; }
                  else if (a?.flagged) { bg = '#FFFBEB'; color = '#B45309'; }
                  else if (a?.selected.length) { bg = c.paleTeal; color = c.deepTeal; }
                  if (isCur) border = c.deepTeal;
                  return <button key={i} onClick={() => goTo(i)} style={{ aspectRatio: '1', borderRadius: 6, border: `2px solid ${border}`, background: bg, color, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</button>;
                })}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, fontSize: 11, color: c.muted }}>
                <Legend bg={c.paleTeal} border={c.lightTeal} label="Answered" /><Legend bg="#FFFBEB" border="#FDE68A" label="Flagged" /><Legend bg="#F3F4F6" border={c.deepTeal} label="Current" />
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media(min-width:900px){.exam-grid{grid-template-columns:minmax(0,1fr) 240px !important}.exam-sidebar{align-self:start;position:sticky;top:84px}}
        /* Tabbed at every screen size (like the live page): only the active pane
           shows, so the scenario gets full width and is easy to read. */
        .pane-scenario[data-active=false],.pane-question[data-active=false]{display:none}
        .aa-scenario-body{font-size:14px;line-height:1.6;color:${c.body}}.aa-scenario-body h1,.aa-scenario-body h2,.aa-scenario-body h3{color:${c.deepTeal};font-weight:700;margin:14px 0 6px}.aa-scenario-body p{margin:0 0 10px}.aa-scenario-body ul,.aa-scenario-body ol{margin:0 0 10px;padding-left:20px}.aa-scenario-body table{border-collapse:collapse;width:100%;margin:0 0 10px}.aa-scenario-body th,.aa-scenario-body td{border:1px solid #E5E7EB;padding:6px 8px;text-align:left;font-size:13px}
        .aa-match-table td,.aa-match-table th{border:none}
      `}</style>
    </div>
  );
}

function MatchingPart({ items, answers, mode, currentIdx, onSelect, onFocusRow }: {
  items: PartItem[]; answers: Record<number, Answer>; mode: Mode; currentIdx: number;
  onSelect: (gi: number, letter: string) => void; onFocusRow: (gi: number) => void;
}) {
  const options = optionsOf(items[0].q);
  return (
    <div>
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 14px', marginBottom: 16, background: '#F8FAFC' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: c.deepTeal, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Options (Column 2)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px,1fr))', gap: '5px 16px' }}>
          {options.map((o) => <div key={o.letter} style={{ fontSize: 13, color: c.body, lineHeight: 1.4 }}><strong style={{ color: c.deepTeal }}>{o.letter}.</strong> {o.text}</div>)}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="aa-match-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead><tr><th style={{ width: 26 }} /><th />{options.map((o) => <th key={o.letter} style={{ width: 34, fontSize: 12, fontWeight: 700, color: c.deepTeal, paddingBottom: 6 }}>{o.letter}</th>)}</tr></thead>
          <tbody>
            {items.map((it, ri) => {
              const sel = answers[it.globalIndex]?.selected[0]; const correct = it.q.correct_answer; const reveal = mode === 'practice' && !!sel; const isCur = it.globalIndex === currentIdx;
              return (
                <tr key={it.globalIndex} style={{ background: isCur ? c.skyTeal : 'transparent', borderTop: '1px solid #EEF2F6' }}>
                  <td style={{ fontWeight: 700, color: c.muted, fontSize: 13, padding: '10px 6px', verticalAlign: 'top' }}>{ri + 1}</td>
                  <td onClick={() => onFocusRow(it.globalIndex)} style={{ padding: '10px 12px 10px 2px', fontSize: 14, color: c.body, lineHeight: 1.45, cursor: 'pointer', verticalAlign: 'top' }}>{it.q.question_text}</td>
                  {options.map((o) => {
                    const chosen = sel === o.letter; const isC = reveal && correct === o.letter; const isW = reveal && chosen && correct !== o.letter;
                    let bg = '#fff', bd = '#CBD5E1';
                    if (isC) { bg = '#10B981'; bd = '#10B981'; } else if (isW) { bg = '#EF4444'; bd = '#EF4444'; } else if (chosen) { bg = c.deepTeal; bd = c.deepTeal; }
                    return <td key={o.letter} style={{ textAlign: 'center', padding: '8px 4px', verticalAlign: 'top' }}><button onClick={() => { onFocusRow(it.globalIndex); onSelect(it.globalIndex, o.letter); }} aria-label={`Row ${ri + 1}, option ${o.letter}`} style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${bd}`, background: bg, cursor: 'pointer', padding: 0 }} /></td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupedProgress({ parts, answers, currentIdx, onGoTo }: { parts: PartGroup[]; answers: Record<number, Answer>; currentIdx: number; onGoTo: (i: number) => void }) {
  const byQ = new Map<number, PartGroup[]>();
  parts.forEach((pt) => { if (!byQ.has(pt.qnum)) byQ.set(pt.qnum, []); byQ.get(pt.qnum)!.push(pt); });
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: c.deepTeal, marginBottom: 12 }}>Progress</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from(byQ.entries()).map(([qnum, qParts]) => (
          <div key={qnum}>
            <div style={{ fontSize: 11, fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Question {qnum}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {qParts.map((pt) => (
                <div key={pt.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: c.deepTeal, width: 12, flexShrink: 0 }}>{pt.part}</span>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {pt.items.map((it, idx) => {
                      const a = answers[it.globalIndex]; const isCur = it.globalIndex === currentIdx;
                      let bg = '#F3F4F6', col: string = c.muted, bd = 'transparent';
                      if (a?.flagged) { bg = '#FFFBEB'; col = '#B45309'; } else if (a?.selected.length) { bg = c.paleTeal; col = c.deepTeal; }
                      if (isCur) bd = c.deepTeal;
                      return <button key={it.globalIndex} onClick={() => onGoTo(it.globalIndex)} style={{ width: 22, height: 22, borderRadius: 5, border: `2px solid ${bd}`, background: bg, color: col, fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0 }}>{idx + 1}</button>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return <button onClick={onClick} disabled={disabled} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', background: c.white, color: disabled ? '#D1D5DB' : c.body, fontSize: 13, fontWeight: 600, cursor: disabled ? 'default' : 'pointer' }}>{children}</button>;
}
function Legend({ bg, border, label }: { bg: string; border: string; label: string }) {
  return <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: bg, border: `1px solid ${border}` }} /> {label}</span>;
}
function ScenarioTabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button onClick={onClick} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${active ? c.deepTeal : '#D1D5DB'}`, background: active ? c.deepTeal : c.white, color: active ? c.white : c.body, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{children}</button>;
}
