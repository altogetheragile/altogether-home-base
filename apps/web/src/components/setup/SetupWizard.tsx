'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { FieldControl } from '@altogether/ui/editor/FieldControl';
import type { CopyField } from '@altogether/ui/editor/store';
import { createClient } from '@/lib/supabase/client';
import { loadPageCopy, savePageCopy } from '@/app/actions/copy';
import { STEPS, fieldsForStep, type Step } from '@/lib/setup/steps';

// ============= Being stepped through it =============
//
// One screen at a time, in the order of docs/NEW_SITE_SETUP.md: who the site belongs to, what it
// looks like, whose it is, what it does, and the words.
//
// It writes through savePageCopy, the same server action the editor drawer calls, which already
// knows that a name is a column, a colour is a key inside the brand object and a heading is a
// row. There is one write path for the whole site and this is not a second one: the wizard is a
// different order to be asked things in, not a different way of saving them.
//
// Nothing is compulsory and nothing is finished. Every step can be skipped, every step can be
// come back to, and the same fields are on the page they belong to for the rest of the site's
// life.

type Group = { step: Step; page: string; title: string; fields: CopyField[] };

export function SetupWizard({
  /** Pages with a visibility switch, and the copy pages that are switched on, worked out on the
   *  server where the settings already are. */
  modulePages,
  wordPages,
}: {
  modulePages: { page: string; label: string; key: string }[];
  wordPages: { page: string; label: string; href: string; keys: string[] }[];
}) {
  const router = useRouter();
  const [at, setAt] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, CopyField[]>>({});
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, startSaving] = useTransition();

  const step = STEPS[at];

  // Which registries this step needs. The first three are all the site registry; the last two
  // span every page that is switched on.
  const pagesNeeded = useMemo(() => {
    // The modules step spans every page with a visibility switch, plus the site registry, which
    // holds the parts that have no page of their own.
    if (step.id === 'modules') return [...modulePages.map((m) => m.page), step.page];
    if (step.id === 'words') return wordPages.map((w) => w.page);
    return [step.page];
  }, [step, modulePages, wordPages]);

  useEffect(() => {
    let alive = true;
    const missing = pagesNeeded.filter((p) => !loaded[p]);
    if (!missing.length) return;
    void Promise.all(missing.map(async (p) => [p, await loadPageCopy(p)] as const)).then((pairs) => {
      if (!alive) return;
      setLoaded((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
    });
    return () => { alive = false; };
  }, [pagesNeeded, loaded]);

  /** What this step puts on screen: one group for a single-registry step, one per page for the
   *  two that span pages. */
  const groups: Group[] = useMemo(() => {
    if (step.id === 'modules') {
      return [
        ...modulePages.map(({ page, label, key }) => ({
          step, page, title: label,
          fields: (loaded[page] ?? []).filter((f) => f.key === key),
        })),
        // Last, under its own heading: the parts with no page to be switched from.
        {
          step, page: step.page, title: 'Everything else',
          fields: fieldsForStep(step, loaded[step.page] ?? []),
        },
      ].filter((g) => g.fields.length);
    }
    if (step.id === 'words') {
      return wordPages
        .map(({ page, label, keys }) => ({
          step, page, title: label,
          fields: (loaded[page] ?? []).filter((f) => keys.includes(f.key)),
        }))
        .filter((g) => g.fields.length);
    }
    return [{ step, page: step.page, title: '', fields: fieldsForStep(step, loaded[step.page] ?? []) }];
  }, [step, loaded, modulePages, wordPages]);

  const waiting = pagesNeeded.some((p) => !loaded[p]);
  const valueOf = (page: string, f: CopyField) => edits[page]?.[f.key] ?? f.value;
  const changedPages = Object.entries(edits).filter(([, v]) => Object.keys(v).length);
  const changedCount = changedPages.reduce((n, [, v]) => n + Object.keys(v).length, 0);

  const setField = (page: string, key: string, value: string) =>
    setEdits((prev) => ({ ...prev, [page]: { ...(prev[page] ?? {}), [key]: value } }));

  /** Saves whatever has been typed, then moves. Saving per step rather than at the end, because
   *  a wizard that loses an hour's typing when a laptop sleeps is worse than no wizard. */
  const saveThen = (move: () => void) => {
    setError(null);
    if (!changedCount) return move();
    startSaving(() => { void (async () => {
      for (const [page, changes] of changedPages) {
        const result = await savePageCopy(page, changes);
        if (!result.ok) return setError(result.error);
      }
      setEdits({});
      setSavedAt(step.id);
      setTimeout(() => setSavedAt(null), 2500);
      // Read back, so a later step shows what was actually written rather than what was typed.
      const fresh = await Promise.all(changedPages.map(async ([p]) => [p, await loadPageCopy(p)] as const));
      setLoaded((prev) => ({ ...prev, ...Object.fromEntries(fresh) }));
      router.refresh();
      move();
    })(); });
  };

  const upload = async (file: File) => {
    const supabase = createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const path = `site/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: failed } = await supabase.storage.from('assets').upload(path, file, { upsert: false, cacheControl: '31536000' });
    if (failed) throw failed;
    const { data } = supabase.storage.from('assets').getPublicUrl(path);
    if (!data?.publicUrl) throw new Error('Uploaded, but no address came back for it.');
    return data.publicUrl;
  };

  const last = at === STEPS.length - 1;

  return (
    <div>
      {/* Where you are. Numbered, because "step 2 of 5" is the question somebody has. */}
      <ol style={{ display: 'flex', flexWrap: 'wrap', gap: 8, listStyle: 'none', margin: '0 0 28px', padding: 0 }}>
        {STEPS.map((s, i) => {
          const here = i === at;
          const done = i < at;
          return (
            <li key={s.id}>
              <button
                onClick={() => saveThen(() => setAt(i))}
                disabled={pending}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, borderRadius: 999, cursor: 'pointer',
                  padding: '6px 14px 6px 8px', fontSize: 13, fontWeight: here ? 700 : 500,
                  border: `1px solid ${here ? '#0C4A4A' : 'rgba(0,0,0,0.12)'}`,
                  background: here ? '#0C4A4A' : '#fff', color: here ? '#fff' : '#5A6B72',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 20, height: 20, borderRadius: 10, display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                    background: here ? 'rgba(255,255,255,0.2)' : done ? '#1A9090' : 'rgba(0,0,0,0.07)',
                    color: here || done ? '#fff' : '#5A6B72',
                  }}
                >
                  {done ? '✓' : i + 1}
                </span>
                {s.title}
              </button>
            </li>
          );
        })}
      </ol>

      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 30px' }}>
        <h2 style={{ color: '#0C4A4A', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>{step.title}</h2>
        <p style={{ color: '#5A6B72', fontSize: 14.5, lineHeight: 1.7, margin: '0 0 24px' }}>{step.blurb}</p>

        {waiting ? (
          <p style={{ color: '#5A6B72', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader2 size={15} className="animate-spin" /> Reading what is there now
          </p>
        ) : groups.length === 0 ? (
          <p style={{ color: '#5A6B72', fontSize: 14 }}>
            Nothing to fill in here. {step.id === 'words' ? 'No pages are switched on yet, so there are no words to write.' : 'Move on.'}
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.page + group.title} style={{ marginBottom: 24 }}>
              {group.title && (
                <h3 style={{ color: '#0C4A4A', fontSize: 15, fontWeight: 800, margin: '0 0 10px', paddingTop: 4 }}>
                  {group.title}
                </h3>
              )}
              {group.fields.map((f) => (
                <div key={f.key} style={{ marginBottom: 18 }}>
                  {/* A group of one, under a heading that already names the page, does not need
                      "Show this page to visitors" written under "About". */}
                  {!(group.title && group.fields.length === 1) && (
                    <label htmlFor={f.key} style={{ display: 'block', color: '#0C4A4A', fontSize: 13.5, fontWeight: 700, marginBottom: 3 }}>
                      {f.label}
                    </label>
                  )}
                  <p style={{ color: '#5A6B72', fontSize: 12.5, lineHeight: 1.55, margin: '0 0 7px' }}>{f.hint}</p>
                  <FieldControl
                    field={f}
                    value={valueOf(group.page, f)}
                    page={group.page}
                    onChange={(next) => setField(group.page, f.key, next)}
                    upload={upload}
                  />
                </div>
              ))}
            </section>
          ))
        )}

        {step.id === 'words' && wordPages.length > 0 && (
          <p style={{ color: '#5A6B72', fontSize: 13, lineHeight: 1.6, margin: '4px 0 0' }}>
            The rest of each page is edited on the page:{' '}
            {wordPages.map((w, i) => (
              <span key={w.page}>
                {i > 0 && ', '}
                <a href={w.href} style={{ color: '#1A9090', fontWeight: 700, textDecoration: 'none' }}>{w.label}</a>
              </span>
            ))}
            .
          </p>
        )}

        {step.footnote && (
          <p style={{ color: '#5A6B72', fontSize: 12.5, lineHeight: 1.6, margin: '16px 0 0', paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            {step.footnote}
          </p>
        )}
      </div>

      {error && <p style={{ color: '#C0392B', fontSize: 14, margin: '14px 0 0' }}>{error}</p>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
        <button
          onClick={() => saveThen(() => setAt((i) => Math.max(0, i - 1)))}
          disabled={at === 0 || pending}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.14)', background: '#fff', color: '#5A6B72',
            fontSize: 14, fontWeight: 600, cursor: at === 0 ? 'default' : 'pointer', opacity: at === 0 ? 0.4 : 1,
          }}
        >
          <ArrowLeft size={15} /> Back
        </button>

        <button
          onClick={() => saveThen(() => { if (!last) setAt((i) => i + 1); })}
          disabled={pending}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 10,
            border: 'none', background: '#F5A623', color: '#0C4A4A', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {pending ? <Loader2 size={15} className="animate-spin" /> : savedAt === step.id ? <Check size={15} /> : null}
          {pending
            ? 'Saving'
            : changedCount
              ? `Save ${changedCount} ${changedCount === 1 ? 'change' : 'changes'}${last ? '' : ' and continue'}`
              : last ? 'Done' : 'Continue'}
          {!pending && !last && !changedCount && <ArrowRight size={15} />}
        </button>

        {/* Said plainly, because a wizard that looks compulsory gets abandoned rather than
            skipped, and an abandoned one never gets come back to. */}
        <span style={{ color: '#5A6B72', fontSize: 13 }}>
          {changedCount ? 'Saved as you go.' : 'Nothing here is compulsory. Skip anything and come back to it.'}
        </span>
      </div>
    </div>
  );
}
