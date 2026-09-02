/* One markdown file describing Build A Zoo, for a conversation somewhere else.
 *
 *   node scripts/context-pack.mjs > ~/Desktop/zoo-context-pack.md
 *
 * Written for uploading to a claude.ai Project, or pasting into any assistant that cannot see
 * this repository. It carries the design thinking, the rules model, and the files somebody would
 * have to read to say anything useful about either. Not the whole codebase: engine.ts and
 * design.ts are thousands of lines of park geometry and visitor simulation, and their shape
 * matters far more than their contents.
 *
 * Hand-run, and the output is not committed - it goes stale the moment anything changes, and a
 * stale copy of a codebase is worse than none.
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const at = (p) => `\`${p}\``;

/** A whole file, fenced, with its path as the heading. */
const whole = (p, why) => `### ${at(p)}\n\n${why}\n\n\`\`\`ts\n${read(p).trimEnd()}\n\`\`\`\n`;

/** Just the exported signatures of a file, for the ones too big to include. */
function signatures(p, why) {
  const lines = read(p).split('\n');
  const out = [];
  lines.forEach((l, i) => {
    if (!/^export (function|const|interface|type|class)/.test(l)) return;
    // The doc comment above it, where there is one: the reason usually matters more than the type.
    const doc = [];
    for (let k = i - 1; k >= 0 && /^\s*(\/\*\*|\*|\*\/|\/\/)/.test(lines[k]); k -= 1) doc.unshift(lines[k]);
    out.push([...doc.slice(-4), l.replace(/\s*\{$/, '')].join('\n'));
  });
  return `### ${at(p)}\n\n${why}\n\n\`\`\`ts\n${out.join('\n\n')}\n\`\`\`\n`;
}

const sha = execSync('git rev-parse --short HEAD').toString().trim();
const when = execSync('git log -1 --format=%cs').toString().trim();

process.stdout.write(`# Build A Zoo: a context pack

Generated from commit \`${sha}\` (${when}). A snapshot: the code moves, this does not.

---

## What This Is

A browser game that teaches Scrum by having you run one. You build a zoo through Sprints: a
Product Backlog of animals, habitats, paths and facilities; Sprint Planning in its three topics;
a Sprint of build days with a Daily Scrum; a Sprint Review where a visitor simulation tells you
what people made of what you delivered; and a Retrospective. It is made for a trainer to use with
a class, and for a learner to play alone.

It is live at <https://altogetheragile.com/zoo-game>, and at \`/zoo-game/together\` for a shared
session where several people hold the accountabilities between them and whatever nobody holds is
played by the game.

Two things shape every decision in it:

- **The Scrum is real Scrum.** Everything is checked against the 2020 Scrum Guide, and where the
  game has to choose, it chooses what the Guide says over what would be convenient. The
  vocabulary is the Guide's: accountabilities not roles, events not ceremonies.
- **The park is the product.** Value is what visitors experience, not points delivered. The
  simulation is the customer, and the gap between velocity and visitor happiness is the lesson
  the whole game is built to teach.

## How It Is Built

React and TypeScript, one pure reducer, about ninety typed actions, and a game state that is one
serialisable object. Shared sessions write that object to Supabase with optimistic concurrency;
every browser applies the same actions and lands on the same state. There is no server logic: the
rules are the reducer.

Deterministic on purpose. No \`Date.now\`, no \`Math.random\` anywhere in the engine: a per-game
seed drives everything, so a trainer can replay a seed and get the same game. That property is
what makes the tests possible, and it is the first thing to protect.

## The Design Documents

These are the current thinking, and the better starting point than any file.

`);

for (const [p, why] of [
  ['docs/ZOO_LEARNING_BY_BREAKING.md', 'The live design direction: let people break the rules of Scrum and feel the cost, scored with Evidence-Based Management.'],
  ['docs/ZOO_DOD_TEETH.md', 'Making the Definition of Done mean something mechanically. Increment one is built; two to four are not.'],
]) {
  // Demoted a level as they go in, so the pack has one outline rather than two fighting.
  const body = read(p).trimEnd().replace(/^(#+) /gm, '#$1 ');
  process.stdout.write(`## ${p.split('/').pop().replace(/\.md$/, '')}\n\n_${why}_\n\n---\n\n${body}\n\n---\n\n`);
}

process.stdout.write(`## The Code That Matters

### The rules model

Everything below is one of three kinds of thing:

- **State and actions** (\`types.ts\`): what a game is, and everything that can happen to it.
- **The reducer** (\`useZooGame.ts\`): one switch, no logic of its own, delegating to the engine.
- **The engine** (\`engine.ts\`): every rule, as pure functions.

`);

process.stdout.write(whole('src/components/zooGame/types.ts',
  'The whole model in one file: the game state, every action, and the comments explaining why each field exists. If you read one file, read this one.'));

process.stdout.write(whole('src/components/zooGame/seatRules.ts',
  'Who may do what. Only what the Scrum Guide actually assigns is gated, and an empty seat\'s work falls to the team rather than to nobody.'));

process.stdout.write(whole('src/components/zooGame/aiSeats.ts',
  'The seats nobody is holding, played by the game. Entirely hard-coded heuristics: a pure function returning one move and the line the seat says while making it. No model is involved, which is what keeps a game replayable from its seed.'));

process.stdout.write(whole('src/components/zooGame/parkChecks.ts',
  'The half of every acceptance criterion the park can answer for itself, with the evidence it read. Returning null means it is judgement, and the Product Owner\'s to make.'));

process.stdout.write(whole('src/components/zooGame/dodChecks.ts',
  'The same idea for the Definition of Done: which lines the park can read, and which are the team\'s word. Increment one of the plan above.'));

process.stdout.write(signatures('src/components/zooGame/engine.ts',
  'Every rule in the game, as pure functions. Nineteen hundred lines, so here are the exported signatures with the reasoning above each one.'));

process.stdout.write(signatures('src/components/zooGame/design.ts',
  'What things are made of and what Done looks like for each kind of thing: acceptance criteria written as questions, design criteria, footprints, and the park geometry.'));

process.stdout.write(`## Where Everything Lives

| File | What it holds |
|---|---|
| \`types.ts\` | The game state and every action |
| \`engine.ts\` | Every rule, as pure functions |
| \`useZooGame.ts\` | The reducer, and the actions API |
| \`aiSeats.ts\` | The seats played by the game |
| \`seatRules.ts\` | Who may take which action |
| \`parkChecks.ts\` / \`dodChecks.ts\` | What the park can measure, and what is judgement |
| \`design.ts\` | What things are made of, and what Done looks like |
| \`parkLayout.ts\` / \`parkModel.ts\` | Where things stand in the park |
| \`simulation/\` | The visitors: attendance, happiness, word of mouth |
| \`SprintPlanning.tsx\` / \`SprintBoard.tsx\` / \`SprintReview.tsx\` / \`SprintRetro.tsx\` | The four screens of the loop |
| \`ZooShell.tsx\` / \`MessageRail.tsx\` | The frame, and what the game says to you |
| \`useZooSession.ts\` / \`useZooSessions.ts\` | Shared sessions: seats, sync, the shared clock |

## Open Questions

Things genuinely undecided, where an outside view would help:

1. **Hard-coded seats, or a model?** The seats are heuristics today. The rules must stay
   deterministic, because they are the teaching and because a trainer replays seeds. But the
   judgement is a different matter: whether a habitat looks like somewhere an animal lives is
   exactly what a model could answer, and be wrong about, and be argued with. Where is the line?
2. **How much should the game refuse?** It refuses a lot today. The plan above reverses that:
   allow it, name it, cost it, show the cost at the Retrospective. What breaks if a first-time
   learner is allowed to do everything wrong?
3. **What makes it worth a second play?** The loop works and the game is quiet. Levels as Product
   Goals, a hypothesis each Sprint, external pressure and a scoreboard from EBM are the current
   answers, and none of them is built.
4. **The pacing of a watched Sprint.** With seats played by the game, a player watches more than
   they act. The current answer is a decision every ten or fifteen seconds. Is that the right
   shape, or should a Sprint be faster and shorter?
`);
