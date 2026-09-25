'use client';

import { useState } from 'react';
import { Plus, ArrowRight, ArrowLeft, Copy, Check, ExternalLink, AlertTriangle } from 'lucide-react';
import { walkthrough, type Answers, type Step } from '@/lib/sites/walkthrough';

// ============= Walked through it, one step at a time =============
//
// Ten steps. Each says what to do, links to the exact page it happens on, and offers every value
// to copy rather than to type.
//
// It holds nothing and asks for nothing secret. Everything it shows it worked out from a name and
// a domain. That is deliberate: the version that did it all at the press of a button needed a
// Supabase token and a Vercel token kept in the database, and the only sensible place to keep
// them is a table whose neighbour is readable by the public.

const box: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.16)',
  fontSize: 14, boxSizing: 'border-box', background: '#fff',
};
const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, color: '#0C4A4A', marginBottom: 4 };

function CopyLine({ label: name, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#5A6B72', marginBottom: 2 }}>{name}</div>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, color: '#0C4A4A', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{value}</div>
      </div>
      <button
        onClick={() => { void navigator.clipboard?.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); }}
        style={{
          flexShrink: 0, border: '1px solid rgba(0,0,0,0.14)', background: '#fff', borderRadius: 7,
          padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: done ? '#1A9090' : '#5A6B72',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        {done ? <Check size={12} /> : <Copy size={12} />} {done ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function OneStep({
  step, of, at, back, on, answers, answer,
}: {
  step: Step; of: number; at: number; back: () => void; on: () => void;
  answers: Answers; answer: (field: 'ref' | 'anonKey', value: string) => void;
}) {
  // A step that asks for something will not let you past without it, because every command after
  // this one is built from what is typed here. Going on without it is how somebody ends up
  // pasting YOUR-PROJECT-REF into a terminal.
  const missing = (step.asks ?? []).filter((a) => !(answers[a.field] ?? '').trim());
  return (
    <div>
      <div style={{ color: '#5A6B72', fontSize: 12.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
        Step {step.n} of {of}
      </div>
      <h3 style={{ color: '#0C4A4A', fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>{step.title}</h3>
      <p style={{ color: '#3E5057', fontSize: 15, lineHeight: 1.75, margin: '0 0 14px' }}>{step.body}</p>

      {step.go && (
        <a
          href={step.go.href} target="_blank" rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, background: '#0C4A4A', color: '#fff',
            borderRadius: 9, padding: '10px 16px', fontSize: 14, fontWeight: 700, textDecoration: 'none', marginBottom: 14,
          }}
        >
          {step.go.label} <ExternalLink size={13} />
        </a>
      )}

      {step.asks && step.asks.length > 0 && (
        <div style={{ background: '#F4F8F8', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
          {step.asks.map((a) => (
            <div key={a.field} style={{ marginBottom: 12 }}>
              <label style={{ ...label, marginBottom: 2 }} htmlFor={a.field}>{a.label}</label>
              <p style={{ fontSize: 12.5, color: '#5A6B72', margin: '0 0 6px' }}>{a.help}</p>
              <input
                id={a.field}
                value={answers[a.field] ?? ''}
                onChange={(e) => answer(a.field, e.target.value)}
                placeholder={a.placeholder}
                style={{ ...box, fontFamily: 'ui-monospace, monospace', fontSize: 13 }}
              />
            </div>
          ))}
          <p style={{ fontSize: 12.5, color: '#5A6B72', margin: 0 }}>
            Neither is secret and neither is kept: they are used to fill in the rest of these
            steps and forgotten when you close this.
          </p>
        </div>
      )}

      {step.copy && step.copy.length > 0 && (
        <div style={{ background: '#F4F8F8', borderRadius: 10, padding: '4px 14px 10px', marginBottom: 14 }}>
          {step.copy.map((c) => <CopyLine key={c.label + c.value} label={c.label} value={c.value} />)}
        </div>
      )}

      {step.watch && (
        <p style={{
          display: 'flex', gap: 8, alignItems: 'flex-start', color: '#8A4B2A', background: '#FDF3EC',
          border: '1px solid #F0D5C0', borderRadius: 9, padding: '10px 12px', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 16px',
        }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} /> <span>{step.watch}</span>
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={back} disabled={at === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(0,0,0,0.14)', background: '#fff',
            borderRadius: 9, padding: '10px 16px', fontSize: 14, color: '#5A6B72',
            cursor: at === 0 ? 'default' : 'pointer', opacity: at === 0 ? 0.4 : 1,
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button
          onClick={on}
          disabled={missing.length > 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: missing.length ? 'rgba(0,0,0,0.08)' : '#F5A623',
            color: missing.length ? '#8A9499' : '#0C4A4A',
            border: 'none', borderRadius: 9, padding: '11px 20px', fontSize: 15, fontWeight: 700,
            cursor: missing.length ? 'not-allowed' : 'pointer',
          }}
        >
          {at === of - 1 ? 'Finished' : 'Done, next'} <ArrowRight size={14} />
        </button>
        <span style={{ color: '#5A6B72', fontSize: 13 }}>
          {missing.length
            ? `Fill in the ${missing.map((m) => m.label).join(' and the ')} first: the rest of the steps are built from ${missing.length === 1 ? 'it' : 'them'}.`
            : 'Take as long as you like. Nothing is waiting on you.'}
        </span>
      </div>
    </div>
  );
}

export function WalkMeThrough() {
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [at, setAt] = useState(0);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, background: '#F5A623', color: '#0C4A4A',
          border: 'none', borderRadius: 10, padding: '13px 22px', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', marginBottom: 28,
        }}
      >
        <Plus size={16} /> Add a site
      </button>
    );
  }

  if (!answers) {
    return (
      <div style={{ background: '#fff', borderRadius: 16, padding: '24px 26px', marginBottom: 28 }}>
        <h3 style={{ color: '#0C4A4A', fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>Add a site</h3>
        <p style={{ color: '#5A6B72', fontSize: 14.5, lineHeight: 1.7, margin: '0 0 18px' }}>
          Two questions, then ten steps. Each one tells you exactly where to go and what to paste,
          and you can stop and come back whenever you like. Nothing secret is asked for or kept.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget as HTMLFormElement);
            setAnswers({
              name: String(f.get('name') ?? ''),
              domain: String(f.get('domain') ?? ''),
              email: String(f.get('email') ?? ''),
            });
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <label style={label} htmlFor="name">What is the site called?</label>
            <input id="name" name="name" required placeholder="Her Business" style={box} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={label} htmlFor="domain">What address will it have?</label>
            <p style={{ fontSize: 12.5, color: '#5A6B72', margin: '0 0 6px' }}>Without https, as herbusiness.com. You need to own it already.</p>
            <input id="domain" name="domain" required placeholder="herbusiness.com" style={box} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={label} htmlFor="email">Who will look after it?</label>
            <p style={{ fontSize: 12.5, color: '#5A6B72', margin: '0 0 6px' }}>Your own email if that is you.</p>
            <input id="email" name="email" type="email" placeholder="you@example.com" style={box} />
          </div>
          <button type="submit" style={{ background: '#0C4A4A', color: '#fff', border: 'none', borderRadius: 9, padding: '11px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Start
          </button>
        </form>
      </div>
    );
  }

  const steps = walkthrough(answers);
  const done = at >= steps.length;

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '24px 26px', marginBottom: 28 }}>
      {/* How far along, as dots rather than a number, so ten steps do not look like a form. */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 18, flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <button
            key={s.n}
            onClick={() => setAt(i)}
            title={`${s.n}. ${s.title}`}
            aria-label={`Step ${s.n}: ${s.title}`}
            style={{
              width: 26, height: 6, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer',
              background: i < at ? '#1A9090' : i === at ? '#0C4A4A' : 'rgba(0,0,0,0.12)',
            }}
          />
        ))}
      </div>

      {done ? (
        <div>
          <h3 style={{ color: '#0C4A4A', fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>That is the lot</h3>
          <p style={{ color: '#3E5057', fontSize: 15, lineHeight: 1.75, margin: '0 0 16px' }}>
            {answers.name.trim() || 'The new site'} should be answering at{' '}
            <a href={`https://${answers.domain}`} target="_blank" rel="noreferrer" style={{ color: '#1A9090', fontWeight: 700 }}>{answers.domain}</a>.
            A domain can take a little while to start working after the records are added, so if it
            is not there yet, it is probably still coming.
          </p>
          <button onClick={() => { setAnswers(null); setAt(0); setOpen(false); }} style={{ background: '#0C4A4A', color: '#fff', border: 'none', borderRadius: 9, padding: '11px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Finish
          </button>
        </div>
      ) : (
        <OneStep
          step={steps[at]}
          of={steps.length}
          at={at}
          answers={answers}
          answer={(field, value) => setAnswers((a) => (a ? { ...a, [field]: value } : a))}
          back={() => setAt((i) => Math.max(0, i - 1))}
          on={() => setAt((i) => i + 1)}
        />
      )}
    </div>
  );
}
