// The player's head.
//
// One call per step: here is the screen, what do you do next and what confused you. Deliberately
// told nothing about the code, the game's rules or Scrum beyond what a stranger would know,
// because the moment it knows what a button means it stops being able to tell us the button is
// badly named.

const MODEL = 'claude-sonnet-4-6';

// Who is playing is a persona file in ./personas: who they are and what they watch for. What
// follows is the same for everybody - how a turn works and what to answer with - so a persona can
// be written by somebody who has never read this file.
const SHARED = `You are being watched by somebody who wants to know where the page confuses people.

Rules:
- Decide from what is ON THE SCREEN. If a label is ambiguous, say so rather than guessing what the
  designer probably meant.
- Say what you EXPECTED to happen before you act. If the last step surprised you, say that first.
- Do not be agreeable. Dead ends, duplicate controls, words you do not understand, two things that
  look like the same kind of thing but are not - those are the point.
- One action per turn.
- You are playing this game, not inspecting it. Keep going: finish what you started, and when a
  screen offers a way forward, take it. Say what confused you on the way past, do not stop on it.
- Only use "stop" when the game itself has ended, or when you have genuinely tried everything on
  screen and none of it moves you on. Running out of patience is not a reason to stop.`;

const MOUSE = `- Some things are moved with the keyboard. If a control tells you which keys to press, press them:
  use "key" with the key's name in "text" ("ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "Enter", "Escape", "Tab"), and its ref, so the key reaches the right thing. Add "times" to hold
  it down - "times": 8 nudges something eight paces, which is what a person does rather than
  pressing once and looking.
- A field is a box you type in. To put words in it, use "type" with its ref: you do not need to
  click it first, and clicking it only moves the cursor. Each field below says what is already in
  it, so you never have to guess whether somebody has filled it in for you.

Answer with JSON only:

{
  "surprised_by": "what the last step did that you did not expect, or null on the first step",
  "confused_by": "anything on this screen you cannot make sense of, or null",
  "thinking": "one or two sentences of what you make of this screen",
  "expect": "what you think your action will do",
  "action": { "kind": "click" | "type" | "key" | "scroll" | "stop", "ref": "the ref from the list", "text": "the words for type, the key's name for key", "times": "optional, for key only" }
}`;

// Keyboard only, for real. No click, and no ref: a ref would put the focus straight on a control,
// which is the one thing a keyboard user cannot do and the thing this persona exists to test. Keys
// go wherever the focus is, and the list says where that is.
const KEYBOARD = `- You have no mouse. You cannot click, and you cannot point at a control to act on it. Every key
  you press goes to whatever has the focus, and the list of things below marks which one that is
  ("has the focus"). If nothing is marked, say so: that is worth knowing.
- Use "key" with the key's name in "text": "Tab", "Shift+Tab", "Enter", "Space", "Escape",
  "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageDown". Add "times" to
  press it more than once - "times": 6 with Tab moves six places on, and "times": 8 with an arrow
  key nudges something eight paces.
- To put words in a box, Tab to it first, then use "type" with the words in "text". They go into
  whatever has the focus.

Answer with JSON only:

{
  "surprised_by": "what the last step did that you did not expect, or null on the first step",
  "confused_by": "anything on this screen you cannot make sense of, or null",
  "thinking": "one or two sentences of what you make of this screen",
  "expect": "what you think your action will do",
  "action": { "kind": "key" | "type" | "stop", "text": "the key's name for key, the words for type", "times": "optional, for key only" }
}`;

/** The whole brief for one persona: who they are, then the rules everybody plays by. */
export const systemFor = (persona) => [
  persona.brief,
  SHARED,
  persona.hands === 'keyboard' ? KEYBOARD : MOUSE,
  'Use "stop" when you have nothing sensible left to try, or you believe you have finished.\nPlain British English. No em dashes.',
].join('\n\n');

/** A control as a person would see it. A field says what is in it, because "is this box empty or
 *  has it been filled in for me" was the single most repeated complaint of the first two runs, and
 *  it was the harness that could not tell them - the screen could. */
const describe = (c) => {
  const focus = c.focused ? ', has the focus' : '';
  if (c.role === 'tick box') return `- [${c.ref}] tick box: ${c.name} - ${c.value}${focus}`;
  if (c.role !== 'field') return `- [${c.ref}] ${c.role}: ${c.name}${focus}`;
  const state = c.value
    ? `contains "${c.value}"`
    : c.hint ? `empty, showing the grey suggestion "${c.hint}"` : 'empty';
  return `- [${c.ref}] field: ${c.name} - ${state}${c.focused ? ', cursor is here, has the focus' : ''}`;
};

/** One step's worth of judgement. Returns null if the model cannot be reached or answers oddly,
 *  and the caller stops rather than inventing a player. */
export async function askThePlayer({ apiKey, persona, screen, history, step, maxSteps, park }) {
  // Only the recent past in full. A long game's history outgrows the screen it is about, and what
  // somebody actually carries is roughly the last few minutes plus a sense of how long they have
  // been at it.
  const RECENT = 14;
  const older = Math.max(0, history.length - RECENT);
  const prompt = [
    `Step ${step} of at most ${maxSteps}.`,
    older ? `\nYou have been playing for a while - ${older} earlier steps, not listed.` : '',
    history.length ? `\nWhat you have done recently:\n${history.slice(-RECENT).map((h, i) => `${older + i + 1}. ${h}`).join('\n')}` : '',
    park ? `\nThe park in front of you:\n${park}` : '',
    `\nThe screen now:\n\n${screen.text}`,
    `\nThings you can act on:\n${screen.controls.map(describe).join('\n')}`,
    persona.hands === 'keyboard' && !screen.controls.some((c) => c.focused)
      ? `\nNone of these has the focus. It is on: ${screen.focus || 'nothing you can see'}.` : '',
    '\nWhat do you do? JSON only.',
  ].join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 700,
      // Warm enough to behave like a person rather than a search for the optimal path.
      temperature: 0.7,
      system: systemFor(persona),
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude said ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  const text = body?.content?.[0]?.text ?? '';
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
