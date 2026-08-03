# Build A Zoo — Scrum-fidelity Red Team

An agile-coach / Scrum Master review of the `/zoo-game` simulation. Worst-first: the
most damaging issues in a *training* tool are the mechanics that quietly teach the
opposite of what they should.

## What's genuinely strong (keep)
- A real customer at the Review (the visitor simulation → emergence).
- Product Backlog Refinement before Sprint 1 + continuous refinement on the board.
- Planning framed as the Scrum Guide's three topics (Why → What → How).
- A clean **Acceptance Criteria vs Definition of Done** distinction.
- **Increment vs Release** (an item is *Done*, then you *Open* it to visitors).
- Timeboxed events, velocity/capacity, deterministic planning poker.

---

## 🔴 Tier 1 — teaches an anti-pattern (fix first)

### 1. The Sprint Goal is scored as "100% of committed items Done"
`sprintGoalMet = deliveredThisSprint.length === committedThisSprint.length`
- **Principle:** the Sprint Goal is a single *outcome*; scope flexes, the Goal doesn't.
  You can meet the Goal having dropped an item, or finish everything and still miss it.
- **Risk:** teaches *Sprint Goal = deliver all the scope* — the exact anti-pattern — and
  punishes flexing scope to protect the Goal.
- **Fix:** judge the Goal by outcome. Mark goal-critical items (or the goal names a
  zone/capability) and score "met" when that outcome lands (target zone open + its
  visitors happy), independent of finishing every PBI. Ideally engineer a case where you
  drop an item *and still* meet the Goal.

### 2. Product Goal progress = % of the backlog built
`open items / total backlog`
- **Principle:** the Product Goal is a future *outcome*, not "build everything."
- **Risk:** pure output-thinking — and perversely, **adding a PBI lowers progress %**. It
  rewards burning the backlog over delivering value.
- **Fix:** base progress on the visitor outcome (attendance / happiness / return rate vs a
  target). Teaches that unbuilt backlog is fine once the outcome is met.

### 3. The Definition of Done is a poster, not a gate
Nothing enforces `definitionOfDone`. "Done" = design built + tasks ticked; "safe /
signposted / peer-reviewed" have no effect, and editing the DoD changes nothing.
- **Risk:** learners see a DoD that doesn't bite → DoD is decoration.
- **Fix:** make Done **self-certify against the DoD** (like ACs), and tie 1–2 lines to
  mechanics at the Review (no peer-review → defect risk; not signposted → visitors can't
  find it → lower appeal). A DoD *edited at the Retro* must change the bar next Sprint.

---

## 🟠 Tier 2 — an event/accountability modelled weakly

### 4. The Daily Scrum is skippable and impediment-centric
"Hold the Daily Scrum (costs time)" vs "Skip it (costs more later)."
- **Principle:** a *mandatory, Developer-run* re-plan toward the Sprint Goal; impediments
  are surfaced, not solved there.
- **Risk:** "Skip it" implies the event is optional (it isn't), and it frames the event's
  purpose as impediment-handling.
- **Fix:** the Daily Scrum always happens; the real choice is whether you *adapt the plan*
  (re-order to protect the Goal) or carry on. Attach cost to *not adapting*, not to *not
  attending*.

### 5. Accountabilities are labels, not felt roles
"Developer / Product Owner / Scrum Master" appear in copy, but the player is all three
with no boundary.
- **Risk:** the single most-tested Scrum concept — who's accountable for what — isn't
  *experienced*.
- **Fix (cheap):** tag each action with the hat ("PO: order the Backlog", "Developers:
  estimate & pull", "SM: ensure the Daily Scrum happens"). *Fuller:* lightweight AI
  Developers who estimate/pull so you can't just do it all — the bridge to the parked
  multiplayer version.

---

## 🟡 Tier 3 — high-value lessons missing

6. **No WIP limit.** To Do/Doing/Done with no cap; "finish fewer" is only a text nudge.
   Add a WIP limit or a context-switch penalty (each extra *Doing* item slows the day).
7. **Retro improvements do nothing.** Picked, stored as text, no mechanical effect. Make
   it bite ("Hold the Daily Scrum daily" → cheaper impediments; "Finish fewer" → imposes a
   WIP limit) or make it a real Sprint Backlog item (kaizen as work).
8. **Fixed 3-day Sprint.** No cadence choice or events-overhead trade-off.
9. **Estimation implies a "right answer."** Poker clusters around a hidden true size →
   teaches accuracy. Lean on empiricism: forecast/velocity > estimate precision.

---

## 🔵 Tier 4 — learning-design / UX

10. **The real-time day clock fights reflection.** It doesn't pause during the build modal,
    so it can reward guessing over thinking. Offer a generous/pausable timer or a "learn
    mode" without the clock (keep timed mode as a *choice* to teach Sprint pressure).
11. **Few explicit "why" moments.** No contextual coaching tip when a learner hits an
    anti-pattern (over-commit, skip the Daily Scrum, high WIP, output-chasing), and no
    PSM-exam link to deepen. Turn mistakes into lessons.

---

## Suggested order (impact × effort)
1. **#1 Sprint Goal by outcome** + **#2 Product Goal by outcome** — highest fidelity
   payoff; they share a "goal-critical / outcome" model.
2. **#3 DoD actually gates Done** + becomes consequential when edited.
3. **#7 Retro improvements have teeth** + **#6 WIP limit** (an improvement can *impose*
   the WIP limit).
4. **#4 Daily Scrum reframe** (always-on, adapt-vs-not).
5. **#11 contextual coaching tips** — cheap, high learning value.
6. **#5 role hats**, **#8 sprint length**, **#10 learn mode** — polish.

**Coach's recommendation:** do **#1, #2, #3** next — a training tool must never reward
output over outcome, or ship a Definition of Done that doesn't bite.
