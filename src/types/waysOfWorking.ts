// Retro Coach and Ways of Working (see VISION_TO_VALUE.md 6.10). The Operate stage:
// working agreements plus short coached retrospectives that produce one improvement
// action at a time. Standing stretch: "What works well that we have quietly become
// afraid to change?"

export interface RetroAction {
  id: string;
  date: string;
  what_worked: string;
  improve_one_thing: string;
  action: string;
  status: 'open' | 'done';
}

export interface WaysOfWorking {
  agreements: string[];
  retro_actions: RetroAction[];
}

export const STANDING_STRETCH = 'What works well that we have quietly become afraid to change?';

const newId = () => crypto.randomUUID();

export const emptyWaysOfWorking = (): WaysOfWorking => ({ agreements: [], retro_actions: [] });

export const exampleWaysOfWorking = (): WaysOfWorking => ({
  agreements: [
    'We start stand-up on time and keep it to fifteen minutes',
    'We review one improvement action every retro, not five',
    'We pair on anything touching the payments code',
  ],
  retro_actions: [
    {
      id: newId(),
      date: '2026-06-04',
      what_worked: 'Pairing reduced review wait times noticeably',
      improve_one_thing: 'Hand-offs to QA still stall over the weekend',
      action: 'Trial a Friday cut-off for QA-ready items',
      status: 'open',
    },
  ],
});

export const newRetroAction = (): RetroAction => ({
  id: newId(),
  date: new Date().toISOString().slice(0, 10),
  what_worked: '',
  improve_one_thing: '',
  action: '',
  status: 'open',
});

export const parseWaysOfWorking = (raw: unknown): WaysOfWorking | null => {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const agreements = Array.isArray(o.agreements) ? o.agreements.map((a) => String(a)) : [];
  const retro_actions: RetroAction[] = Array.isArray(o.retro_actions)
    ? o.retro_actions.map((r) => {
        const x = (r ?? {}) as Record<string, unknown>;
        return {
          id: typeof x.id === 'string' ? x.id : newId(),
          date: String(x.date ?? ''),
          what_worked: String(x.what_worked ?? ''),
          improve_one_thing: String(x.improve_one_thing ?? ''),
          action: String(x.action ?? ''),
          status: x.status === 'done' ? 'done' : 'open',
        };
      })
    : [];
  return { agreements, retro_actions };
};
