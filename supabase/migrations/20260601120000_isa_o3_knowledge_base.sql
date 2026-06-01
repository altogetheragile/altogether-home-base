-- ISA-O3 Knowledge Base: add ISA-O3 dimensions and links to knowledge_items.
-- House style: additive text/array columns, no enums or CHECK constraints
-- (validation lives in the zod schema). Columns inherit the table's RLS.

-- 1. New columns -----------------------------------------------------------
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS horizon text;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS isa text;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS layer text;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS facet text;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS kind text;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS inheritable boolean NOT NULL DEFAULT false;
-- Link arrays hold target slugs (clean for JSON export/import round-trips):
--   produces      = technique -> artifact slugs
--   techniques    = artifact  -> technique slugs
--   counterparts  = artifact  -> artifact slugs
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS produces text[] NOT NULL DEFAULT '{}';
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS counterparts text[] NOT NULL DEFAULT '{}';
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS techniques text[] NOT NULL DEFAULT '{}';
-- Components: array of { name, question, perspective }
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS components jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN knowledge_items.horizon IS 'ISA-O3 Value Horizon: Organisation | Coordination | Team';
COMMENT ON COLUMN knowledge_items.isa IS 'ISA-O3 dimension: Intent | Scope | Approach';
COMMENT ON COLUMN knowledge_items.layer IS 'ISA-O3 layer: Anchoring | Iterative | Evidence';
COMMENT ON COLUMN knowledge_items.facet IS 'Anchoring facet (e.g. Identity, Purpose, Direction); null otherwise';
COMMENT ON COLUMN knowledge_items.kind IS 'Element | Artifact';
COMMENT ON COLUMN knowledge_items.produces IS 'Technique -> artifact slugs produced';
COMMENT ON COLUMN knowledge_items.counterparts IS 'Artifact -> counterpart artifact slugs';
COMMENT ON COLUMN knowledge_items.techniques IS 'Artifact -> technique slugs that produce it';
COMMENT ON COLUMN knowledge_items.components IS 'Array of { name, question, perspective }';

-- 2. Backfill horizon + kind for artifacts from the slug prefix -------------
UPDATE knowledge_items SET kind = 'Artifact' WHERE item_type = 'artifact' AND kind IS NULL;

UPDATE knowledge_items SET horizon = CASE
    WHEN slug LIKE 'org-%'   THEN 'Organisation'
    WHEN slug LIKE 'coord-%' THEN 'Coordination'
    WHEN slug LIKE 'team-%'  THEN 'Team'
    ELSE horizon
  END
WHERE item_type = 'artifact';

-- 3. Seed isa/layer from the reviewed classification proposal ---------------
--    (14 high-confidence doc matches + 21 reasoned proposals; refine later
--     via admin editing and the JSON export/import loop.)
UPDATE knowledge_items AS k SET isa = s.isa, layer = s.layer
FROM (VALUES
    ('coord-backlog','Scope','Iterative'),
    ('coord-delivery-schedule','Approach','Iterative'),
    ('coord-goal','Intent','Iterative'),
    ('coord-governance','Approach','Anchoring'),
    ('coord-integration-standard','Approach','Iterative'),
    ('coord-outcomes','Intent','Evidence'),
    ('coord-purpose','Intent','Anchoring'),
    ('coord-solution-design','Scope','Iterative'),
    ('coord-stakeholder-map','Scope','Iterative'),
    ('coord-team-topology','Approach','Iterative'),
    ('coord-user-beneficiary-profile','Scope','Iterative'),
    ('coord-vision','Intent','Anchoring'),
    ('coord-way-of-working','Approach','Anchoring'),
    ('org-brand','Intent','Anchoring'),
    ('org-business-model','Scope','Iterative'),
    ('org-goals','Intent','Iterative'),
    ('org-governance','Approach','Anchoring'),
    ('org-mission','Scope','Anchoring'),
    ('org-operating-model','Approach','Iterative'),
    ('org-portfolio-backlog','Scope','Iterative'),
    ('org-portfolio-roadmap','Scope','Iterative'),
    ('org-purpose','Intent','Anchoring'),
    ('org-strategic-outcomes','Intent','Evidence'),
    ('org-strategy','Approach','Iterative'),
    ('org-value-proposition','Scope','Anchoring'),
    ('org-values','Intent','Anchoring'),
    ('org-vision','Intent','Anchoring'),
    ('team-delivery-health-metrics','Approach','Evidence'),
    ('team-goal','Intent','Iterative'),
    ('team-output','Scope','Evidence'),
    ('team-output-feedback','Intent','Evidence'),
    ('team-plan','Approach','Iterative'),
    ('team-quality-bar','Approach','Anchoring'),
    ('team-selected-work-items','Scope','Iterative'),
    ('team-working-agreement','Approach','Anchoring')
) AS s(slug, isa, layer)
WHERE k.slug = s.slug;
