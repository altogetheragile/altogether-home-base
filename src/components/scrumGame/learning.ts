// ============= Learning points =============
//
// Short coaching points surfaced at the moment they matter in the sim. They are
// grounded in the Scrum Guide (and echo the areas of the Altogether Agile
// Professional Scrum Master exam), but they are paraphrased teaching in our own
// words - the exam's own questions and answers are NOT reproduced here, so the
// exam keeps its value. Each tip invites the player to test themselves on it.

export interface LearningPoint {
  id: string;
  /** The Scrum Guide area this relates to (matches the exam's areas). */
  area: string;
  title: string;
  body: string;
}

/** Where "test yourself" sends the player - the site's own exam. */
export const EXAM_URL = '/exams/professional-scrum-master';
export const EXAM_NAME = 'Professional Scrum Master';

/** Keyed by the sim moment (trigger) that surfaces them. */
export const LEARNING: Record<string, LearningPoint> = {
  'over-commit': {
    id: 'over-commit',
    area: 'Scrum Events',
    title: 'Forecast, don\'t wish',
    body: 'The Developers forecast what they believe they can finish, using past velocity as the guide. Committing well beyond it tends to miss the Sprint Goal and carry work over.',
  },
  renegotiate: {
    id: 'renegotiate',
    area: 'Scrum Artifacts',
    title: 'Scope can flex, the Goal should not',
    body: 'As more is learned during the Sprint, the Developers renegotiate the Sprint Backlog\'s scope with the Product Owner - without changing the Sprint Goal.',
  },
  impediment: {
    id: 'impediment',
    area: 'Scrum Team',
    title: 'The Scrum Master clears the way',
    body: 'The Scrum Master serves the team by causing the removal of impediments, so the Developers can stay focused on the Sprint Goal.',
  },
  'change-request': {
    id: 'change-request',
    area: 'Scrum Events',
    title: 'Welcome change, protect the Goal',
    body: 'New needs are welcome, but the Sprint Goal stays fixed for the Sprint. The team and Product Owner decide together whether to adapt scope now or order it for a later Sprint.',
  },
  review: {
    id: 'review',
    area: 'Scrum Events',
    title: 'The Review is a working session',
    body: 'At the Sprint Review the Scrum Team and stakeholders inspect the Increment and progress toward the Product Goal, then adapt the Product Backlog together. It is a conversation about the product, not a sign-off - Done work already meets the Definition of Done.',
  },
  dod: {
    id: 'dod',
    area: 'Scrum Artifacts',
    title: 'The team owns the quality bar',
    body: 'The Definition of Done is the team\'s shared standard for quality - what makes work an Increment. Work is only Done when it meets it, and the team can inspect and strengthen it at the Retrospective so "Done" keeps meaning releasable.',
  },
  'goal-missed': {
    id: 'goal-missed',
    area: 'Scrum Events',
    title: 'A missed Goal is feedback',
    body: 'The Sprint Goal is the Sprint\'s single objective. Missing it is not failure - it is information to inspect and adapt at the Review and Retrospective.',
  },
  retro: {
    id: 'retro',
    area: 'Scrum Theory',
    title: 'Inspect and adapt',
    body: 'Scrum is empirical: the team inspects how the Sprint went and adapts by choosing improvements to try next. Small changes compound.',
  },
  'product-goal': {
    id: 'product-goal',
    area: 'Scrum Artifacts',
    title: 'One long-term objective',
    body: 'The Product Goal is the team\'s long-term objective. The Product Backlog is ordered toward it, and every Sprint should move the product closer.',
  },
  refinement: {
    id: 'refinement',
    area: 'Scrum Artifacts',
    title: 'Refinement readies the Backlog',
    body: 'Product Backlog Refinement breaks items down and adds detail so they are small, clear and Ready before Planning. It is an ongoing activity, not a formal event - a little each Sprint - and the team needs a rough Backlog to refine before the first Sprint even starts.',
  },
};

/** Look up a learning point by its trigger key. */
export const learningFor = (trigger: string): LearningPoint | undefined => LEARNING[trigger];
