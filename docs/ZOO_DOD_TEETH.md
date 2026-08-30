# Making The Definition Of Done Mean Something

A scope, 30 August 2026. Not a build plan: it names the decisions to take first, and what each
increment would cost once they are taken.

The Definition of Done in Build A Zoo is a working agreement the Scrum Team writes, agrees before
the first Sprint, and refines at any Retrospective. All of that is right and already built. What is
missing is consequence. **Nothing a team writes into the Definition of Done changes what the game
will let them call Done.** A team can inspect and adapt the Increment's commitment, and the
adaptation costs nothing, catches nothing and changes nothing. That is inspect-and-adapt without
the adapt.

## What Is Already Right

Verified against the code rather than assumed.

| Asset | Where | Why it matters |
|---|---|---|
| The DoD is inspected and adapted at the Retrospective | `SprintRetro.tsx:83`, the `adapt` step | Exactly where the Guide puts it: the Scrum Team inspects "individuals, interactions, processes, tools, and their Definition of Done". |
| ...and editable any time from the Artifacts drawer | `ArtifactsPanel.tsx:137` | Refinement is not gated to one screen. |
| ...and agreed before the first Sprint | `RefineBacklog.tsx`, step three | The commitment is made before any work counts. |
| The park already answers criteria and shows its working | `parkChecks.ts` | `Verdict { met, evidence }`, and `null` for "this one is judgement". The split this scope needs already exists and is already taught. |
| Checks re-run after every action | `useZooGame.ts:29`, `applyParkChecks(step(state, action))` | A fact that stops being true unticks itself, and the sign-off comes off with it. |
| The sign-off is derived, never clicked | `syncSignOff`, `engine.ts` | Nothing downstream has to know which half of a list is fact and which is opinion. |
| The Done transition is in two known places | `engine.ts:430` (last plan task ticked), `engine.ts:1028` (built) | One gate to change, not a search. |
| A vocabulary of park facts | `design.ts`, `parkChecks.ts`, `parkNav.ts` | Paths reaching a zone, a group's room to roam, an animal in its habitat, a building's sign, an enclosure's fence. |

## The Gap, Exactly

The gate that decides Done is:

```
buildTasksDone(item)        every plan task except the sign-off is ticked
&& item.design              it has actually been built
&& syncSignOff(...)         the sign-off, derived from acceptance criteria
```

`state.definitionOfDone` appears nowhere in it. Two of the four default lines coincide with the
gate by luck of wording ("Meets its acceptance criteria", "Approved by the PO"). One is about
placement. **"Peer-reviewed by another Developer" is enforced by nothing at all**, and a team that
adds "Signposted so visitors can find it" at a Retrospective gets the same nothing.

There is even a test pinning the inertness: `zooGame.test.ts` asserts that editing the DoD does not
change visitor happiness. That test is right about happiness and should stay. It is not a licence
for the DoD to be inert everywhere else.

## The Shape

A sibling to `parkChecks.ts`, with the same contract, because the problem is the same problem one
level up: some lines are facts the park can see, the rest are the team's judgement, and the game
should say which is which rather than pretend.

```ts
// dodChecks.ts
export function checkDodLine(state, item, line): Verdict | null   // null = yours to judge
export function dodUnmet(state, item): { line: string; evidence: string }[]
```

`dodUnmet` is what the Done transition consults. Everything else - the card, the sign-off, the
Review prompt - reads the same list, exactly as they do for acceptance criteria today.

### The Catalogue

Every line the shipped `DOD_LIBRARY` offers, plus the one a team is most likely to type.

| DoD line | What the park would look at | New code |
|---|---|---|
| Meets its acceptance criteria | Every `acConfirmed` true | None: this is the gate today |
| Fully finished, every part built, no gaps | `isDesignDone(item, design)` | None: exists in `design.ts` |
| Peer-reviewed by another Developer | `assignedDevs.length > 1` | Trivial, and it teaches swarming |
| Safe and accessible to all visitors | A path run reaches this zone | None: lift the check out of `parkChecks.ts:56` |
| Signposted so visitors can find it | Amenity: `parts.sign === 'on'` and a sign colour. Others: a signpost open in the zone | Small |
| Enclosures secure and escape-proof | Enclosure: a fence colour chosen | Trivial |
| Nothing already open is broken by it | No overlap with an open feature, no path orphaned | Real geometry work: defer |
| Amenities still cope with the extra visitors | Simulation capacity against attendance | Real work, and it is a Sprint fact rather than an item fact: defer |
| Cleaned up, no leftover materials or hazards | - | Judgement |
| No known defects | - | Judgement |
| On-brand and fits the park look | - | Judgement |
| *Open to visitors* (a team writes this) | `status === 'open'` | See decision 3 |

Six lines are checkable with almost no new code, because the facts already exist and are already
computed for something else. Three are honestly judgement. Two are worth having and are not cheap,
so they wait.

Free text a team types that matches nothing in the catalogue is judgement by default. That is the
honest answer and it teaches something: a criterion nobody can check is a criterion you are taking
on trust.

## Four Decisions To Take First

**1. Do the judgement lines gate Done too?**
Recommend **no**. The checkable lines gate; the judgement lines are listed on the card as the
team's word, without ticks. A tick box per item per DoD line is real teams' practice and a game's
clicking tax, and the acceptance criteria already carry the per-item ticking lesson. Alternative if
you want the ceremony: one "we walked the DoD" tick per item, which is one click rather than five.

**2. What happens to work already Done when the DoD changes mid-game?**
Recommend: **re-check anything not yet open, leave open work alone**. Tightening the DoD at a
Retrospective should bite the work in front of you, not retroactively un-deliver a zoo visitors are
already walking round. This differs from `applyParkChecks`, which unticks freely, so it needs
saying out loud in the code.

**3. The release line, and the circle it closes.**
If a team writes "Open to visitors" into the DoD, then Done requires open, open requires the
sign-off, and the sign-off requires Done. Recommend: **when the DoD contains a release line, Done
and open become the same act** - the item goes from built straight to open, and the Open button is
the Done button. That is the truthful consequence of the agreement, it is the continuous-delivery
stance made real, and it is a better lesson than refusing the line. The alternative is to reject
release lines in the editor, which teaches that the DoD is the game's, not the team's.

**4. Does every line apply to every item?**
Recommend: **the predicate decides, and a line that does not apply is silent**. "Enclosures secure
and escape-proof" says nothing about a kiosk. Silence beats a green tick nobody earned.

## What Would Deadlock If We Forgot The AI Seats

A gate the game's own seats cannot satisfy is a stalled Sprint, which has bitten this game twice
already. Under the catalogue above the seats need to:

- run a path to the zone: **already do** (`pathRunFor`, and they do it unprompted)
- put a sign on a building: **already do** (`aiDesign` paints a sign and never leaves one switched
  off, which is what the amenity check asks)
- put a second Developer on an item: **new move**, and a small one
- choose a fence colour: **already do**

So one new AI move, plus a test that the seats can finish a Sprint under the strictest catalogue
DoD. That test is the one that matters most.

## Increments

Each is shippable on its own and each is worth having if the next never happens.

**1. Say which lines the game can check.** No behaviour change at all. The DoD editor marks each
line as checked by the park or judged by the team; the item card lists the DoD beside the
acceptance criteria with the same two-tone treatment. This is worth shipping alone, because it
teaches the split before it costs anybody a Sprint. *Half a session.*

**2. Give the checkable lines teeth.** `dodChecks.ts`, the gate at both Done transitions, evidence
on the card, and the one new AI move. *One to two sessions.*

**3. The release line.** Decision 3, and the collapse of Done and open when a team asks for it.
*Half a session.*

**4. Show what it cost.** At the Retrospective: since you tightened the DoD, this many items needed
a path run, and velocity moved from x to y. This is the increment that turns the mechanic into the
lesson. *Half a session.*

## Tests That Have To Exist

- Each predicate, met and unmet, with the evidence string it shows.
- The counterfactual: an item that reached Done last Sprint would not reach it under the tightened
  DoD, and the test names the line that stopped it.
- Already-open work is untouched by a DoD change (decision 2).
- The AI seats finish a Sprint under the strictest catalogue DoD (no deadlock).
- With a release line in the DoD, an item can still reach open (no circle).
- The existing test that DoD text does not move visitor happiness still passes. Happiness comes
  from the design, and a stricter DoD earns its keep through what gets built, not through a number.

## Not In Scope

- Per-item Definitions of Done. There is one DoD for the product, which is the point of it.
- Organisational DoD minimums (the Guide's "if it is part of the standards of the organization").
  Interesting for the AgilePM sim later; nothing to attach it to today.
- Rewriting or validating a team's wording. They write what they write; the game answers what it
  can and says so when it cannot.

## Why It Is Worth Doing

The game already teaches that half of any real acceptance criterion is judgement, and it teaches it
well, because the park argues back with evidence. The Definition of Done is the Increment's
commitment and currently the only agreement in the game with no consequences attached.

With teeth, three things become teachable that are not teachable now: that a Definition of Done
costs velocity and is worth it; that a criterion nobody can check is a criterion taken on trust;
and that changing the agreement at a Retrospective changes what happens next Sprint, which is what
empiricism is.
