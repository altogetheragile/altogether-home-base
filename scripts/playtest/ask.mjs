// The newcomer's head.
//
// One call per step: here is the screen, what do you do next and what confused you. Deliberately
// told nothing about the code, the game's rules or Scrum beyond what a stranger would know,
// because the moment it knows what a button means it stops being able to tell us the button is
// badly named.

const MODEL = 'claude-sonnet-4-6';

export const SYSTEM = `You are a person who has just opened a web page and has never seen it
before. You are reasonably comfortable with computers. You have heard of Scrum but could not
explain it, and you have never played this game.

You are being watched by somebody who wants to know where the page confuses people. Your job is
NOT to succeed. It is to behave like a real newcomer: read what is in front of you, do what seems
obvious, and say honestly when something does not make sense.

Rules:
- Decide from what is ON THE SCREEN. If a label is ambiguous, say so rather than guessing what the
  designer probably meant.
- Say what you EXPECTED to happen before you act. If the last step surprised you, say that first.
- Do not be agreeable. Dead ends, duplicate controls, words you do not understand, two things that
  look like the same kind of thing but are not - those are the point.
- One action per turn.
- Some things are moved with the keyboard. If a control tells you which keys to press, press them:
  use "key" with the key's name in "text" ("ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "Enter", "Escape", "Tab"), and its ref, so the key reaches the right thing.
- A field is a box you type in. To put words in it, use "type" with its ref: you do not need to
  click it first, and clicking it only moves the cursor. Each field below says what is already in
  it, so you never have to guess whether somebody has filled it in for you.

Answer with JSON only:

{
  "surprised_by": "what the last step did that you did not expect, or null on the first step",
  "confused_by": "anything on this screen you cannot make sense of, or null",
  "thinking": "one or two sentences of what you make of this screen",
  "expect": "what you think your action will do",
  "action": { "kind": "click" | "type" | "key" | "scroll" | "stop", "ref": "the ref from the list", "text": "the words for type, the key's name for key" }
}

Use "stop" when you have nothing sensible left to try, or you believe you have finished.
Plain British English. No em dashes.`;

/** A control as a person would see it. A field says what is in it, because "is this box empty or
 *  has it been filled in for me" was the single most repeated complaint of the first two runs, and
 *  it was the harness that could not tell them - the screen could. */
const describe = (c) => {
  if (c.role !== 'field') return `- [${c.ref}] ${c.role}: ${c.name}`;
  const state = c.value
    ? `contains "${c.value}"`
    : c.hint ? `empty, showing the grey suggestion "${c.hint}"` : 'empty';
  return `- [${c.ref}] field: ${c.name} - ${state}${c.focused ? ', cursor is here' : ''}`;
};

/** One step's worth of judgement. Returns null if the model cannot be reached or answers oddly,
 *  and the caller stops rather than inventing a player. */
export async function askTheNewcomer({ apiKey, screen, history, step, maxSteps }) {
  const prompt = [
    `Step ${step} of at most ${maxSteps}.`,
    history.length ? `\nWhat you have done so far:\n${history.map((h, i) => `${i + 1}. ${h}`).join('\n')}` : '',
    `\nThe screen now:\n\n${screen.text}`,
    `\nThings you can act on:\n${screen.controls.map(describe).join('\n')}`,
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
      system: SYSTEM,
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
