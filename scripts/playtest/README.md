# Somebody plays the game

An AI agent that opens the game as a given persona, a newcomer by default, and says where it got
confused.

```bash
node scripts/playtest/playtest.mjs --dry            # check the harness, costs nothing
set -a && . ./.env && set +a                        # load ANTHROPIC_API_KEY from .env
node scripts/playtest/playtest.mjs --persona scrum-master --steps 250 --out playtest-report-sm
```

Options: `--persona` (newcomer), `--url` (default the live zoo game), `--steps` (18), `--out`
(playtest-report), `--headed` to watch it, `--dry` to run the plumbing with a scripted stand-in.

## Who plays

`--persona` picks who is at the keyboard. The presets live in `personas/`:

| Persona | Who | Watches for |
| --- | --- | --- |
| `newcomer` | Has heard of Scrum, could not explain it | Anything a stranger cannot follow |
| `scrum-master` | Knows the 2020 Guide well, judging it for a class | Where it gets Scrum wrong, noted as "Scrum:" |
| `product-owner` | A first-time Product Owner on a course | Decisions without enough to go on, or taken from them |
| `keyboard-only` | No mouse at all | Things Tab cannot reach, lost or trapped focus |
| `impatient` | Skims, presses whatever says "carry on" | Screens that only work if you read all of them |

A persona is a short Markdown file: front matter with a `title` and `hands` (`mouse` or
`keyboard`), then who they are in plain words. Write your own and pass its path:
`--persona ./my-trainer.md`. The rules of a turn and the answer format are shared, in `ask.mjs`,
so a persona only has to say who the person is.

`hands: keyboard` is enforced, not just described: clicks are refused, refs are ignored, and
every key goes wherever the focus actually is. Otherwise the harness would put the focus on a
control for them, which is exactly what a keyboard user cannot do.

## What makes it worth anything

**It is told nothing.** It sees the visible words and the controls by their accessible names, and
that is all: no source, no `data-part` hooks, no explanation of what the game is or what Scrum is.
A tester who can see `data-part="goal-wand"` already knows what the wand does, and then cannot
tell you the label is wrong.

It is asked for three things at each step: what surprised it about the last one, what it cannot
make sense of on this one, and what it expects its next action to do. Those three are the report.

## What it is not

Not a test. It does not pass or fail, and two runs will differ - a newcomer is not deterministic
either. Treat one complaint as an anecdote and the same complaint twice as a finding.

Not in CI. It costs roughly one Claude call per step and needs a key, so it runs when somebody
asks it to.

Not a replacement for watching a person. It will never be baffled in the way people are baffled.
What it is good at is the mechanical half: a control that does nothing, two things named as though
they were the same, a dead end, an instruction that contradicts the one beside it.

## Where it came from

Four steps of playing it by hand turned up three real faults: a box pre-filled with the worked
example so a newcomer appeared to have written a goal they had not, an example that was the answer,
and two instructions in the same place that contradicted each other. Those were worth fixing before
building this, because otherwise every run would report the same three things.
