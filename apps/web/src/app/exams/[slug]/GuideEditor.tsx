'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PencilLine, X, Check, Loader2, Eye } from 'lucide-react';
import { renderMarkdown } from '@/lib/markdown';
import { colors as c } from '@/lib/brand';
import { saveGuide } from './actions';

// ============= Editing the guide on the page it appears on =============
//
// This lived in Admin, and the comment on the old one explains why: the exam pages are served by
// the Site, and the Site deliberately could not see your session, so a page could not tell an
// admin from a visitor and had no business offering an edit box.
//
// It can now. This is what the server-side gate is for, and it is the zoo game's model rather than
// Admin's: you edit the words where you can see them, and the preview uses the page's own renderer
// (lib/markdown.ts) so what you are looking at is what will ship.

export function GuideEditor({ examId, initial }: { examId: string; initial: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const preview = useMemo(() => renderMarkdown(text), [text]);
  const dirty = text !== initial;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveGuide(examId, text);
      if (!result.ok) { setError(result.error); return; }
      setSaved(true);
      // Re-render the server page so the guide below updates without a reload.
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', right: 20, bottom: 20, zIndex: 60, display: 'flex', alignItems: 'center', gap: 8,
          background: c.deepTeal, color: '#fff', border: 0, borderRadius: 999, padding: '11px 18px',
          fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,.18)',
        }}
      >
        <PencilLine size={16} /> Edit guide
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Edit guide"
      style={{
        position: 'fixed', inset: 0, zIndex: 70, display: 'flex', flexDirection: 'column',
        background: '#fff',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${c.paleTeal}` }}>
        <strong style={{ color: c.deepTeal, fontSize: 15 }}>Edit guide</strong>
        <span style={{ color: c.muted, fontSize: 13 }}>{words} words{dirty ? ' · unsaved' : ''}</span>
        <div style={{ flex: 1 }} />
        {error && <span style={{ color: c.danger, fontSize: 13 }}>{error}</span>}
        {saved && !error && <span style={{ color: c.deepTeal, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}><Check size={15} /> Saved</span>}
        <button
          onClick={save}
          disabled={pending || !dirty}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, background: dirty ? c.orange : '#d4d4d8', color: '#fff',
            border: 0, borderRadius: 8, padding: '9px 16px', fontSize: 14, fontWeight: 700,
            cursor: pending || !dirty ? 'default' : 'pointer',
          }}
        >
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save
        </button>
        <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'none', border: 0, cursor: 'pointer', color: c.muted, padding: 6 }}>
          <X size={20} />
        </button>
      </header>

      <div className="aa-guide-editor-body" style={{ flex: 1, minHeight: 0, display: 'grid' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck
          aria-label="Guide markdown"
          style={{
            border: 0, borderRight: `1px solid ${c.paleTeal}`, resize: 'none', padding: '20px 22px',
            font: '14px/1.7 ui-monospace, SFMono-Regular, Menlo, monospace', color: c.body, outline: 'none',
          }}
        />
        <div style={{ overflowY: 'auto', padding: '20px 26px', background: '#fbfbfb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.muted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
            <Eye size={13} /> As the page will show it
          </div>
          {text.trim() ? (
            <div className="aa-exam-guide" dangerouslySetInnerHTML={{ __html: preview }} />
          ) : (
            <p style={{ color: c.muted, fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
              Nothing yet. What you type appears here as the page will show it.
            </p>
          )}
        </div>
      </div>

      <style>{`
        .aa-guide-editor-body { grid-template-columns: 1fr 1fr; }
        @media (max-width: 820px) { .aa-guide-editor-body { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; } }
      `}</style>
    </div>
  );
}
