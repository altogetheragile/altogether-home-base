-- ISA Canvas Knowledge Base Rebuild
-- Adds ISA dimensions taxonomy, renames decision levels to horizons, seeds artifact knowledge items

-- ═══════════════════════════════════════
-- 1. Create isa_dimensions table
-- ═══════════════════════════════════════

CREATE TABLE public.isa_dimensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.isa_dimensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ISA dimensions are viewable by everyone"
  ON public.isa_dimensions FOR SELECT USING (true);

CREATE POLICY "Only admins can insert ISA dimensions"
  ON public.isa_dimensions FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update ISA dimensions"
  ON public.isa_dimensions FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Only admins can delete ISA dimensions"
  ON public.isa_dimensions FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER update_isa_dimensions_updated_at
  BEFORE UPDATE ON public.isa_dimensions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed ISA dimension values
INSERT INTO public.isa_dimensions (name, slug, description, color, display_order) VALUES
  ('Intent', 'intent', 'Why we exist, where we are going, what we are trying to achieve', '#CC7510', 1),
  ('Scope', 'scope', 'The envelope of value: what we deliver, to whom, where', '#2FA8A3', 2),
  ('Approach', 'approach', 'The envelope of delivery: how we organise, operate, and schedule', '#8B6FE0', 3),
  ('Evidence', 'evidence', 'What real use of what we produced is telling us', '#5DB845', 4);

-- ═══════════════════════════════════════
-- 2. Create junction table
-- ═══════════════════════════════════════

CREATE TABLE public.knowledge_item_isa_dimensions (
  knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  isa_dimension_id UUID NOT NULL REFERENCES public.isa_dimensions(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  rationale TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (knowledge_item_id, isa_dimension_id)
);

ALTER TABLE public.knowledge_item_isa_dimensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Junction viewable by everyone"
  ON public.knowledge_item_isa_dimensions FOR SELECT USING (true);

CREATE POLICY "Only admins can insert ISA dimension junctions"
  ON public.knowledge_item_isa_dimensions FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update ISA dimension junctions"
  ON public.knowledge_item_isa_dimensions FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Only admins can delete ISA dimension junctions"
  ON public.knowledge_item_isa_dimensions FOR DELETE
  USING (public.is_admin());

-- ═══════════════════════════════════════
-- 3. Rename decision levels to match horizon names
-- ═══════════════════════════════════════

UPDATE public.decision_levels SET
  name = 'Organisation',
  slug = 'organisation',
  description = 'Sets the purpose and direction of the whole organisation and how it operates'
WHERE slug = 'strategic-direction';

UPDATE public.decision_levels SET
  name = 'Team',
  slug = 'team',
  description = 'Where cascading strategy meets delivery — teams produce outputs that generate evidence'
WHERE slug = 'teams';

UPDATE public.decision_levels SET
  description = 'Translates organisational intent into aligned delivery across initiatives and teams'
WHERE slug = 'coordination';

-- ═══════════════════════════════════════
-- 4. Seed artifact knowledge items
-- ═══════════════════════════════════════

-- Organisation Horizon — Intent
INSERT INTO public.knowledge_items (name, slug, description, why_it_exists, common_pitfalls, what_good_looks_like, is_published, item_type) VALUES
(
  'Purpose',
  'org-purpose',
  'The timeless reason the organisation exists.',
  'Why do we exist at all?',
  ARRAY['Often confused with Mission. Mission is what we do today; Purpose is why that work matters at all.'],
  ARRAY['If the Purpose changed tomorrow, would it still be the same company?'],
  true,
  'artifact'
),
(
  'Mission',
  'org-mission',
  'What the organisation does about its Purpose, in the present tense.',
  'Why are we here today, and what do we do about it?',
  ARRAY['Often confused with Purpose (timeless vs present), Vision (present vs future), Goals (continuous vs bounded).'],
  ARRAY['Does it make obvious which opportunities to say no to?'],
  true,
  'artifact'
),
(
  'Vision',
  'org-vision',
  'The future the organisation is working toward, set far enough out to be ambitious and close enough to be accountable.',
  'Where are we going? When will we get there?',
  ARRAY['Often confused with Strategy. Vision is the destination; Strategy is the route.'],
  ARRAY['In five years'' time, could you tell whether the Vision came true?'],
  true,
  'artifact'
),
(
  'Values',
  'org-values',
  'Behaviours the organisation refuses to trade away, even when it would be profitable to.',
  'How do we behave on the way?',
  ARRAY['Often confused with Brand. Brand is what customers see; Values are what colleagues do when no one is watching.'],
  ARRAY['Has a Value ever cost the organisation money? If not, it probably is not a Value.'],
  true,
  'artifact'
),
(
  'Goals',
  'org-goals',
  'Time-bound, measurable commitments on the way to the Vision.',
  'What will we achieve, by when?',
  ARRAY['Often confused with Mission (continuous vs bounded), Strategy (commitments vs bets). Common techniques include OKRs.'],
  ARRAY['Does it have a number and a date? If yes, it is a Goal. A Mission cannot be ticked off.'],
  true,
  'artifact'
);

-- Organisation Horizon — Scope
INSERT INTO public.knowledge_items (name, slug, description, why_it_exists, common_pitfalls, what_good_looks_like, is_published, item_type) VALUES
(
  'Business Model',
  'org-business-model',
  'How the organisation creates, delivers, and captures value. The outward-facing commercial logic.',
  'What do we sell, to whom, and how do we make money?',
  ARRAY['Often confused with Operating Model. Business Model describes the promise; Operating Model keeps it.'],
  ARRAY['If you rewrote the Value Proposition on a napkin, would the rest of the Business Model still make sense?'],
  true,
  'artifact'
),
(
  'Value Proposition',
  'org-value-proposition',
  'The promise made to the customer; the hinge of the Business Model.',
  'Why would they choose us?',
  ARRAY['Often confused with Mission (internal vs customer-facing), Brand (the promise vs how the promise is recognised).'],
  ARRAY['Can your customer say it back to you in their own words, without prompting?'],
  true,
  'artifact'
),
(
  'Brand',
  'org-brand',
  'How the organisation is recognised, remembered, and trusted. The visible expression of the Value Proposition.',
  'Who are we in the customer''s mind?',
  ARRAY['Often confused with Value Proposition. Value Proposition is the promise itself; Brand is the visible, repeatable shorthand for it.'],
  ARRAY['If you removed the logo from your marketing, would customers still know it was you?'],
  true,
  'artifact'
),
(
  'Portfolio Backlog',
  'org-portfolio-backlog',
  'The ordered set of strategic initiatives the organisation will pursue to meet its Goals.',
  'What initiatives will we run? In what order?',
  ARRAY['Often confused with Strategy. Strategy makes the bets; the Portfolio Backlog sequences the initiatives that realise them.'],
  ARRAY['Could the next funding decisions be made directly from this backlog?'],
  true,
  'artifact'
);

-- Organisation Horizon — Approach
INSERT INTO public.knowledge_items (name, slug, description, why_it_exists, common_pitfalls, what_good_looks_like, is_published, item_type) VALUES
(
  'Strategy',
  'org-strategy',
  'The choices about where to compete and how to win.',
  'Where will we play? How will we win?',
  ARRAY['Often confused with Business Model (choice vs resulting logic), Goals (long-range bets vs measurable commitments).'],
  ARRAY['Could a competitor read it and know exactly where not to attack?'],
  true,
  'artifact'
),
(
  'Operating Model',
  'org-operating-model',
  'The capabilities, processes, structures, technology, partners, and people that turn the Business Model into a working reality.',
  'How do we run, day to day?',
  ARRAY['Often confused with Business Model (inward vs outward), Org Structure (the whole machine vs just reporting lines).'],
  ARRAY['If a customer had a bad experience today, could you point to the part of the Operating Model that let them down?'],
  true,
  'artifact'
),
(
  'Governance',
  'org-governance',
  'The decision rights, forums, and thresholds that determine who decides what across the organisation.',
  'Who decides what, and how are decisions made?',
  ARRAY['Often confused with Operating Model. Governance is one component of the Operating Model, externalised here because it shapes every other decision.'],
  ARRAY['When two parts of the organisation disagree, where is that conflict resolved, and by whom?'],
  true,
  'artifact'
),
(
  'Portfolio Roadmap',
  'org-portfolio-roadmap',
  'The schedule and milestones across the Portfolio Backlog — when initiatives are sequenced for delivery, with key review and decision points.',
  'When will each initiative deliver, and how do they sequence?',
  ARRAY['Often confused with Portfolio Backlog. The Backlog is the ordered set; the Roadmap is the schedule of when delivery happens.'],
  ARRAY['Does it show what depends on what, not just what runs when?'],
  true,
  'artifact'
);

-- Organisation Horizon — Evidence
INSERT INTO public.knowledge_items (name, slug, description, why_it_exists, common_pitfalls, what_good_looks_like, is_published, item_type) VALUES
(
  'Strategic Outcomes and Market Signals',
  'org-strategic-outcomes',
  'The evidence that tests whether the Strategy and Goals are working: customer behaviour, financial performance, market shifts, regulatory changes.',
  'Is the Strategy actually delivering, and what is the world telling us?',
  ARRAY['Often confused with Goals (commitments vs evidence), Financial Plan (forward plan vs actual results). Common techniques include strategic dashboards, executive reviews, customer cohort analysis, market intelligence.'],
  ARRAY['When this evidence contradicts the Strategy, does the Strategy actually change?'],
  true,
  'artifact'
);

-- Coordination Horizon — Intent
INSERT INTO public.knowledge_items (name, slug, description, why_it_exists, common_pitfalls, what_good_looks_like, is_published, item_type) VALUES
(
  'Purpose',
  'coord-purpose',
  'Why this initiative exists and what it is for, in service of the host organisation''s Purpose. For a project or programme, this is the reason the temporary organisation has been formed. For a product or service, this is the reason the product exists and the value it is built to create.',
  'Why does this initiative exist?',
  ARRAY['Often confused with Vision (founding reason vs future destination), Goal (founding reason vs measurable commitment).'],
  ARRAY['If someone new joined the initiative tomorrow, could they get a clear answer to ''why does this exist'' without quoting the host organisation''s Purpose?'],
  true,
  'artifact'
),
(
  'Vision',
  'coord-vision',
  'The future state the initiative is bringing about — what the world looks like when the work is done.',
  'Where is this initiative taking us?',
  ARRAY['Often confused with Goal (long-range destination vs near-term milestone). Common techniques include Product Vision, Project Vision, Programme Vision.'],
  ARRAY['Could a new joiner explain the initiative''s purpose in one sentence after reading it?'],
  true,
  'artifact'
),
(
  'Goal',
  'coord-goal',
  'The next meaningful objective for the initiative, cascaded from organisational Goals.',
  'Why this goal next? What outcome are we pursuing? When?',
  ARRAY['Often confused with Vision (near-term commitment vs long-range destination). Common techniques include Product Goal (Scrum), Project Outcome, initiative-level OKRs.'],
  ARRAY['When this Goal is met, will the initiative be visibly different to a customer or beneficiary?'],
  true,
  'artifact'
);

-- Coordination Horizon — Scope
INSERT INTO public.knowledge_items (name, slug, description, why_it_exists, common_pitfalls, what_good_looks_like, is_published, item_type) VALUES
(
  'User and Beneficiary Profile',
  'coord-user-beneficiary-profile',
  'The articulated understanding of who the initiative serves and what they need — their goals, contexts, jobs, and the value they would receive.',
  'Who are we serving, and what do they need?',
  ARRAY['Often confused with Stakeholder Map. The Profile is about value and need; the Map is about power and influence.'],
  ARRAY['Could a developer make a design call by asking ''what would this user do''?'],
  true,
  'artifact'
),
(
  'Stakeholder Map',
  'coord-stakeholder-map',
  'The stakeholders with power to fund, block, support, or override the initiative, and what each one needs from it.',
  'Who can stop this, regardless of merit? Who needs convincing?',
  ARRAY['Often confused with User and Beneficiary Profile (power vs need). Common techniques include Power/Interest grid, Stakeholder Onion, RACI.'],
  ARRAY['If a senior stakeholder withdrew support tomorrow, would you know whose support you needed to recover?'],
  true,
  'artifact'
),
(
  'Backlog',
  'coord-backlog',
  'The ordered set of items defining what the initiative will deliver, anchored to its Goal.',
  'What will we deliver? In what order?',
  ARRAY['Often confused with Delivery Schedule. The Backlog is order; the Schedule is timing. Common techniques include Product Backlog (Scrum), Project Backlog, Programme Backlog.'],
  ARRAY['Does the top of the backlog visibly serve the Goal at the top of it?'],
  true,
  'artifact'
),
(
  'Solution Design',
  'coord-solution-design',
  'The articulated description of what the solution looks like — its components, interfaces, behaviour, data — at a level that lets multiple teams build coherent parts.',
  'What will the solution look like? What will it do?',
  ARRAY['Often confused with Way of Working. Solution Design is what is built; Way of Working is how it gets built. Common techniques include Solution Architecture, Domain Model, Service Blueprint.'],
  ARRAY['Could two teams build their parts independently and have them fit together?'],
  true,
  'artifact'
);

-- Coordination Horizon — Approach
INSERT INTO public.knowledge_items (name, slug, description, why_it_exists, common_pitfalls, what_good_looks_like, is_published, item_type) VALUES
(
  'Team Topology',
  'coord-team-topology',
  'The set of teams delivering the initiative, the shape of each, and the way they interact.',
  'Who builds what? How do the teams relate?',
  ARRAY['Often confused with Org Structure (reporting lines vs delivery shape). Common techniques include Stream-aligned, Enabling, Platform, and Complicated-subsystem teams (Team Topologies).'],
  ARRAY['Does it make team-to-team interactions explicit, not just team boundaries?'],
  true,
  'artifact'
),
(
  'Integration Standard',
  'coord-integration-standard',
  'The shared standard for what counts as ready to integrate or release across the initiative''s teams.',
  'How do we ensure work from different teams fits together cleanly?',
  ARRAY['Often confused with Quality Bar (cross-team integration vs single-team completion). Common techniques include cross-team Definition of Done, Release Readiness Criteria.'],
  ARRAY['Could two teams release together without renegotiating what ''ready'' means?'],
  true,
  'artifact'
),
(
  'Way of Working',
  'coord-way-of-working',
  'The shared delivery practices, engineering standards, and ceremonies across the initiative''s teams.',
  'How do the teams in this initiative work together?',
  ARRAY['Often confused with Working Agreement (cross-team vs single-team). Common techniques include initiative-level engineering standards, shared cadence.'],
  ARRAY['If a new team joined the initiative, could they pick up the Way of Working in a day?'],
  true,
  'artifact'
),
(
  'Governance',
  'coord-governance',
  'The decision rights, forums, and thresholds within the initiative — who can decide on scope, schedule, and resourcing changes.',
  'Who decides what within this initiative, and how?',
  ARRAY['Often confused with Way of Working (decision rights vs delivery practices). Common techniques include Programme Board, Steering Group, Tolerance levels.'],
  ARRAY['When teams disagree, where does the decision get made and by whom?'],
  true,
  'artifact'
),
(
  'Delivery Schedule',
  'coord-delivery-schedule',
  'The schedule and milestones of when the Backlog items will be delivered, with key releases and review points.',
  'When will each piece land?',
  ARRAY['Often confused with Backlog (order vs timing). Common techniques include Product Roadmap, Project Delivery Plan, Release Plan.'],
  ARRAY['Does it show sequence and rationale, not just a list of dates?'],
  true,
  'artifact'
);

-- Coordination Horizon — Evidence
INSERT INTO public.knowledge_items (name, slug, description, why_it_exists, common_pitfalls, what_good_looks_like, is_published, item_type) VALUES
(
  'Outcomes',
  'coord-outcomes',
  'The measurable evidence that tests whether the Goal is being met, drawn from real use of what the initiative has produced.',
  'Is the initiative producing the outcomes we hoped for?',
  ARRAY['Often confused with Goal (commitment vs evidence). Common techniques include OKR Key Results, impact metrics, customer behaviour signals, North Star Metric.'],
  ARRAY['Could you stop or pivot the initiative on the strength of this evidence?'],
  true,
  'artifact'
);

-- Team Horizon — Intent
INSERT INTO public.knowledge_items (name, slug, description, why_it_exists, common_pitfalls, what_good_looks_like, is_published, item_type) VALUES
(
  'Goal',
  'team-goal',
  'The intent for the team''s current cycle, cascaded from the initiative Goal.',
  'Why this cycle? What must be true by the end of it?',
  ARRAY['Often confused with Selected Work Items (the why vs the chosen work). Common techniques include Sprint Goal (Scrum), Iteration Goal, Daily Goal.'],
  ARRAY['If we delivered the Goal but only some of the items, would the cycle still be a success?'],
  true,
  'artifact'
);

-- Team Horizon — Scope
INSERT INTO public.knowledge_items (name, slug, description, why_it_exists, common_pitfalls, what_good_looks_like, is_published, item_type) VALUES
(
  'Selected Work Items',
  'team-selected-work-items',
  'The items pulled from the initiative Backlog into the team''s current cycle.',
  'What have we taken on this cycle?',
  ARRAY['Often confused with Goal (work vs reason for choosing it). Common techniques include Selected PBIs (Scrum), iteration stories, today''s queue (operational teams).'],
  ARRAY['Do the items, taken together, deliver the Goal?'],
  true,
  'artifact'
);

-- Team Horizon — Approach
INSERT INTO public.knowledge_items (name, slug, description, why_it_exists, common_pitfalls, what_good_looks_like, is_published, item_type) VALUES
(
  'Plan',
  'team-plan',
  'The team''s own plan for delivering the Goal during the cycle — the schedule and sequence of the chosen work.',
  'When will each item move? In what order?',
  ARRAY['Often confused with Way of Working (cycle-shaped plan vs standing practices). Common techniques include Sprint Plan element of a Sprint Backlog (Scrum), Iteration Plan, Task Board.'],
  ARRAY['Would the team change the Plan if a work item''s complexity changed mid-cycle?'],
  true,
  'artifact'
),
(
  'Working Agreement',
  'team-working-agreement',
  'The behavioural and practice norms a team chooses to operate by.',
  'How do we choose to behave as a team?',
  ARRAY['Often confused with Way of Working at Coordination level (team-local vs initiative-wide). Common techniques include Working Agreements, Team Charter, Definition of Workflow.'],
  ARRAY['If a Working Agreement is broken, does the team notice and address it?'],
  true,
  'artifact'
),
(
  'Quality Bar',
  'team-quality-bar',
  'The shared standard every team output must meet to be considered complete.',
  'How do we know the work is really finished?',
  ARRAY['Often confused with item-level acceptance criteria (universal bar vs item-specific conditions). Common techniques include Definition of Done (Scrum), Acceptance Standards, Quality Gates.'],
  ARRAY['Could the team release the output without further checks?'],
  true,
  'artifact'
);

-- Team Horizon — Evidence
INSERT INTO public.knowledge_items (name, slug, description, why_it_exists, common_pitfalls, what_good_looks_like, is_published, item_type) VALUES
(
  'Output',
  'team-output',
  'The integrated, usable result of the cycle that meets the Quality Bar.',
  'What did the cycle actually produce?',
  ARRAY['Often confused with Release. The Output is produced every cycle; a Release is when an Output is delivered to users. Common techniques include Increment (Scrum), Release Candidate.'],
  ARRAY['Could a stakeholder use the Output today, even if you chose not to release it?'],
  true,
  'artifact'
),
(
  'Output Feedback',
  'team-output-feedback',
  'The evidence from real use of the Output — whether anyone uses it, and whether it produces the outcomes the initiative Goal expected.',
  'Is what we built being used? Is it producing the change we hoped for?',
  ARRAY['Often confused with Delivery Health Metrics (output value vs system health). Common techniques include usage analytics, customer feedback, support tickets.'],
  ARRAY['Could you tell tomorrow whether last cycle''s Output was worth building?'],
  true,
  'artifact'
),
(
  'Delivery Health Metrics',
  'team-delivery-health-metrics',
  'The leading indicators of how the team''s delivery system is performing.',
  'How fast? How predictable? How clean?',
  ARRAY['Often confused with Output Feedback (system health vs output value). Common techniques include Flow Metrics (cycle time, throughput, WIP), Velocity, Defect Escape Rate.'],
  ARRAY['Could you spot a cycle going wrong before the review by looking at these numbers?'],
  true,
  'artifact'
);

-- ═══════════════════════════════════════
-- 5. Link artifacts to horizons (decision_levels) and ISA dimensions
-- ═══════════════════════════════════════

-- Organisation Horizon — Intent artifacts
INSERT INTO public.knowledge_item_decision_levels (knowledge_item_id, decision_level_id)
SELECT ki.id, dl.id FROM public.knowledge_items ki, public.decision_levels dl
WHERE ki.slug IN ('org-purpose', 'org-mission', 'org-vision', 'org-values', 'org-goals')
AND dl.slug = 'organisation';

INSERT INTO public.knowledge_item_isa_dimensions (knowledge_item_id, isa_dimension_id, is_primary)
SELECT ki.id, isa.id, true FROM public.knowledge_items ki, public.isa_dimensions isa
WHERE ki.slug IN ('org-purpose', 'org-mission', 'org-vision', 'org-values', 'org-goals')
AND isa.slug = 'intent';

-- Organisation Horizon — Scope artifacts
INSERT INTO public.knowledge_item_decision_levels (knowledge_item_id, decision_level_id)
SELECT ki.id, dl.id FROM public.knowledge_items ki, public.decision_levels dl
WHERE ki.slug IN ('org-business-model', 'org-value-proposition', 'org-brand', 'org-portfolio-backlog')
AND dl.slug = 'organisation';

INSERT INTO public.knowledge_item_isa_dimensions (knowledge_item_id, isa_dimension_id, is_primary)
SELECT ki.id, isa.id, true FROM public.knowledge_items ki, public.isa_dimensions isa
WHERE ki.slug IN ('org-business-model', 'org-value-proposition', 'org-brand', 'org-portfolio-backlog')
AND isa.slug = 'scope';

-- Organisation Horizon — Approach artifacts
INSERT INTO public.knowledge_item_decision_levels (knowledge_item_id, decision_level_id)
SELECT ki.id, dl.id FROM public.knowledge_items ki, public.decision_levels dl
WHERE ki.slug IN ('org-strategy', 'org-operating-model', 'org-governance', 'org-portfolio-roadmap')
AND dl.slug = 'organisation';

INSERT INTO public.knowledge_item_isa_dimensions (knowledge_item_id, isa_dimension_id, is_primary)
SELECT ki.id, isa.id, true FROM public.knowledge_items ki, public.isa_dimensions isa
WHERE ki.slug IN ('org-strategy', 'org-operating-model', 'org-governance', 'org-portfolio-roadmap')
AND isa.slug = 'approach';

-- Organisation Horizon — Evidence artifacts
INSERT INTO public.knowledge_item_decision_levels (knowledge_item_id, decision_level_id)
SELECT ki.id, dl.id FROM public.knowledge_items ki, public.decision_levels dl
WHERE ki.slug = 'org-strategic-outcomes'
AND dl.slug = 'organisation';

INSERT INTO public.knowledge_item_isa_dimensions (knowledge_item_id, isa_dimension_id, is_primary)
SELECT ki.id, isa.id, true FROM public.knowledge_items ki, public.isa_dimensions isa
WHERE ki.slug = 'org-strategic-outcomes'
AND isa.slug = 'evidence';

-- Coordination Horizon — Intent artifacts
INSERT INTO public.knowledge_item_decision_levels (knowledge_item_id, decision_level_id)
SELECT ki.id, dl.id FROM public.knowledge_items ki, public.decision_levels dl
WHERE ki.slug IN ('coord-purpose', 'coord-vision', 'coord-goal')
AND dl.slug = 'coordination';

INSERT INTO public.knowledge_item_isa_dimensions (knowledge_item_id, isa_dimension_id, is_primary)
SELECT ki.id, isa.id, true FROM public.knowledge_items ki, public.isa_dimensions isa
WHERE ki.slug IN ('coord-purpose', 'coord-vision', 'coord-goal')
AND isa.slug = 'intent';

-- Coordination Horizon — Scope artifacts
INSERT INTO public.knowledge_item_decision_levels (knowledge_item_id, decision_level_id)
SELECT ki.id, dl.id FROM public.knowledge_items ki, public.decision_levels dl
WHERE ki.slug IN ('coord-user-beneficiary-profile', 'coord-stakeholder-map', 'coord-backlog', 'coord-solution-design')
AND dl.slug = 'coordination';

INSERT INTO public.knowledge_item_isa_dimensions (knowledge_item_id, isa_dimension_id, is_primary)
SELECT ki.id, isa.id, true FROM public.knowledge_items ki, public.isa_dimensions isa
WHERE ki.slug IN ('coord-user-beneficiary-profile', 'coord-stakeholder-map', 'coord-backlog', 'coord-solution-design')
AND isa.slug = 'scope';

-- Coordination Horizon — Approach artifacts
INSERT INTO public.knowledge_item_decision_levels (knowledge_item_id, decision_level_id)
SELECT ki.id, dl.id FROM public.knowledge_items ki, public.decision_levels dl
WHERE ki.slug IN ('coord-team-topology', 'coord-integration-standard', 'coord-way-of-working', 'coord-governance', 'coord-delivery-schedule')
AND dl.slug = 'coordination';

INSERT INTO public.knowledge_item_isa_dimensions (knowledge_item_id, isa_dimension_id, is_primary)
SELECT ki.id, isa.id, true FROM public.knowledge_items ki, public.isa_dimensions isa
WHERE ki.slug IN ('coord-team-topology', 'coord-integration-standard', 'coord-way-of-working', 'coord-governance', 'coord-delivery-schedule')
AND isa.slug = 'approach';

-- Coordination Horizon — Evidence artifacts
INSERT INTO public.knowledge_item_decision_levels (knowledge_item_id, decision_level_id)
SELECT ki.id, dl.id FROM public.knowledge_items ki, public.decision_levels dl
WHERE ki.slug = 'coord-outcomes'
AND dl.slug = 'coordination';

INSERT INTO public.knowledge_item_isa_dimensions (knowledge_item_id, isa_dimension_id, is_primary)
SELECT ki.id, isa.id, true FROM public.knowledge_items ki, public.isa_dimensions isa
WHERE ki.slug = 'coord-outcomes'
AND isa.slug = 'evidence';

-- Team Horizon — Intent artifacts
INSERT INTO public.knowledge_item_decision_levels (knowledge_item_id, decision_level_id)
SELECT ki.id, dl.id FROM public.knowledge_items ki, public.decision_levels dl
WHERE ki.slug = 'team-goal'
AND dl.slug = 'team';

INSERT INTO public.knowledge_item_isa_dimensions (knowledge_item_id, isa_dimension_id, is_primary)
SELECT ki.id, isa.id, true FROM public.knowledge_items ki, public.isa_dimensions isa
WHERE ki.slug = 'team-goal'
AND isa.slug = 'intent';

-- Team Horizon — Scope artifacts
INSERT INTO public.knowledge_item_decision_levels (knowledge_item_id, decision_level_id)
SELECT ki.id, dl.id FROM public.knowledge_items ki, public.decision_levels dl
WHERE ki.slug = 'team-selected-work-items'
AND dl.slug = 'team';

INSERT INTO public.knowledge_item_isa_dimensions (knowledge_item_id, isa_dimension_id, is_primary)
SELECT ki.id, isa.id, true FROM public.knowledge_items ki, public.isa_dimensions isa
WHERE ki.slug = 'team-selected-work-items'
AND isa.slug = 'scope';

-- Team Horizon — Approach artifacts
INSERT INTO public.knowledge_item_decision_levels (knowledge_item_id, decision_level_id)
SELECT ki.id, dl.id FROM public.knowledge_items ki, public.decision_levels dl
WHERE ki.slug IN ('team-plan', 'team-working-agreement', 'team-quality-bar')
AND dl.slug = 'team';

INSERT INTO public.knowledge_item_isa_dimensions (knowledge_item_id, isa_dimension_id, is_primary)
SELECT ki.id, isa.id, true FROM public.knowledge_items ki, public.isa_dimensions isa
WHERE ki.slug IN ('team-plan', 'team-working-agreement', 'team-quality-bar')
AND isa.slug = 'approach';

-- Team Horizon — Evidence artifacts
INSERT INTO public.knowledge_item_decision_levels (knowledge_item_id, decision_level_id)
SELECT ki.id, dl.id FROM public.knowledge_items ki, public.decision_levels dl
WHERE ki.slug IN ('team-output', 'team-output-feedback', 'team-delivery-health-metrics')
AND dl.slug = 'team';

INSERT INTO public.knowledge_item_isa_dimensions (knowledge_item_id, isa_dimension_id, is_primary)
SELECT ki.id, isa.id, true FROM public.knowledge_items ki, public.isa_dimensions isa
WHERE ki.slug IN ('team-output', 'team-output-feedback', 'team-delivery-health-metrics')
AND isa.slug = 'evidence';
