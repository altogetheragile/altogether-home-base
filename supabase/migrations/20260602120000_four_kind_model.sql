-- Four-Kind Knowledge Base, Phase 1 (foundation, additive).
-- Adds the four-kind ontology onto knowledge_items + a typed knowledge_edges
-- table. Existing array columns (produces/counterparts/techniques) are left in
-- place so current views keep working; the data layer/views switch in Phase 2.
-- Seeds below are DRAFTS per the brief, for Alun to confirm via the CSV +
-- export/import round-trip. Technique-link edges are NOT seeded here (they are
-- the "do not guess" re-typing pass).

-- 1. New node columns ------------------------------------------------------
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS shape text;   -- artifact: container | anchor
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS family text;  -- constituent: queue_item | field_content
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS level text;   -- constituent: epic | feature | story | task

COMMENT ON COLUMN knowledge_items.shape IS 'Artifact shape: container | anchor';
COMMENT ON COLUMN knowledge_items.family IS 'Constituent family: queue_item | field_content';
COMMENT ON COLUMN knowledge_items.level IS 'Constituent level: epic | feature | story | task';

-- 2. Typed edges -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_edges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id uuid NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  edge_type text NOT NULL,   -- convene|generate|decompose|populate|formalise|produce_or_shape|advance|anchors_to|cascades_to
  from_level text,           -- decompose only
  to_level text,             -- decompose only
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, target_id, edge_type)
);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_source ON public.knowledge_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_target ON public.knowledge_edges(target_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_type ON public.knowledge_edges(edge_type);

COMMENT ON COLUMN knowledge_edges.edge_type IS 'convene|generate|decompose|populate|formalise|produce_or_shape|advance|anchors_to|cascades_to';

ALTER TABLE public.knowledge_edges ENABLE ROW LEVEL SECURITY;
-- Public read (the knowledge-base views need it); writes via admin/service role.
CREATE POLICY "Public can view knowledge edges"
  ON public.knowledge_edges FOR SELECT USING (true);
CREATE POLICY "Admins can manage knowledge edges"
  ON public.knowledge_edges FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 3. Artifact shape (DRAFT split per brief; Alun confirms) ------------------
UPDATE knowledge_items SET shape = 'anchor' WHERE item_type = 'artifact' AND slug IN (
  'org-purpose','org-vision','org-values','org-mission','org-brand','org-governance',
  'org-value-proposition','org-goals','org-strategy',
  'coord-purpose','coord-vision','coord-goal','coord-governance','coord-way-of-working','coord-integration-standard',
  'team-goal','team-quality-bar','team-working-agreement'
);
UPDATE knowledge_items SET shape = 'container' WHERE item_type = 'artifact' AND slug IN (
  'org-business-model','org-operating-model','org-portfolio-backlog','org-portfolio-roadmap','org-strategic-outcomes',
  'coord-backlog','coord-delivery-schedule','coord-solution-design','coord-stakeholder-map',
  'coord-user-beneficiary-profile','coord-team-topology','coord-outcomes',
  'team-selected-work-items','team-output','team-output-feedback','team-plan','team-delivery-health-metrics'
);

-- 4. Events: reclassify the two miscatalogued, seed a starter set -----------
UPDATE knowledge_items SET item_type = 'event' WHERE slug IN ('sprint-miov2esf','daily-stand-ups');

INSERT INTO knowledge_items (slug, name, item_type, description, is_published)
VALUES
  ('ev-workshop','Workshop','event','A facilitated working session convened to apply techniques toward an artifact.',true),
  ('ev-sprint-planning','Sprint Planning','event','The event where the team selects and plans work for the cycle.',true),
  ('ev-backlog-refinement','Backlog Refinement','event','The recurring event to clarify, split, and order backlog items.',true),
  ('ev-sprint-review','Sprint Review','event','The event to inspect the increment and adapt direction with stakeholders.',true),
  ('ev-retrospective','Retrospective','event','The event where the team inspects its way of working and adapts it.',true),
  ('ev-synchronisation','Synchronisation','event','A coordinating event aligning multiple teams or workstreams.',true)
ON CONFLICT (slug) DO NOTHING;

-- 5. Constituent items: seed the brief's type list -------------------------
INSERT INTO knowledge_items (slug, name, item_type, family, level, description, is_published)
VALUES
  ('ci-epic','Epic','constituent','queue_item','epic','A large body of work decomposed into features.',true),
  ('ci-feature','Feature','constituent','queue_item','feature','A slice of capability decomposed into stories.',true),
  ('ci-story','Story','constituent','queue_item','story','A user-valued increment decomposable into smaller stories or tasks.',true),
  ('ci-task','Task','constituent','queue_item','task','A unit of work contributing to a story.',true),
  ('ci-experiment','Experiment','constituent','queue_item',NULL,'A test of an assumption; a queue item before it runs, evidence after.',true),
  ('ci-bug','Bug','constituent','queue_item',NULL,'A defect tracked as a queue item.',true),
  ('ci-opportunity','Opportunity','constituent','queue_item',NULL,'A discovered opportunity or problem to pursue.',true),
  ('ci-vision','Vision','constituent','field_content',NULL,'The content that formalises a Vision anchor.',true),
  ('ci-value-proposition','Value Proposition','constituent','field_content',NULL,'The content that formalises a Value Proposition.',true),
  ('ci-business-model','Business Model','constituent','field_content',NULL,'The content that fills a Business Model canvas.',true)
ON CONFLICT (slug) DO NOTHING;

-- Acceptance criteria are a component of the Story constituent (story-internal),
-- not a thing that shapes an artifact. The Acceptance Criteria / Gherkin-BDD
-- techniques therefore carry no produce_or_shape/generate/decompose edge.
UPDATE knowledge_items
SET components = '[{"name":"Acceptance Criteria","question":"What conditions must hold for this story to be accepted?","perspective":"what"}]'::jsonb
WHERE slug = 'ci-story';

-- 6. Cross-horizon edges (safe to derive) ----------------------------------
-- anchors_to: lower horizon references the same anchor at the higher horizon.
-- cascades_to: a higher-horizon container feeds the one below.
INSERT INTO public.knowledge_edges (source_id, target_id, edge_type)
SELECT s.id, t.id, e.etype
FROM (VALUES
    ('coord-purpose','org-purpose','anchors_to'),
    ('coord-vision','org-vision','anchors_to'),
    ('coord-governance','org-governance','anchors_to'),
    ('coord-goal','org-goals','anchors_to'),
    ('team-goal','coord-goal','anchors_to'),
    ('org-portfolio-backlog','coord-backlog','cascades_to'),
    ('coord-backlog','team-selected-work-items','cascades_to'),
    ('org-portfolio-roadmap','coord-delivery-schedule','cascades_to'),
    ('coord-delivery-schedule','team-plan','cascades_to')
) AS e(src, tgt, etype)
JOIN knowledge_items s ON s.slug = e.src
JOIN knowledge_items t ON t.slug = e.tgt
ON CONFLICT (source_id, target_id, edge_type) DO NOTHING;
