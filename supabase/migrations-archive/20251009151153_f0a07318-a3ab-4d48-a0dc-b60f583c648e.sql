-- Category Restructure Migration
-- Consolidates 9+ categories into 6 aligned categories
-- Preserves all knowledge item relationships

-- Step 1: Store old category IDs for reference
DO $$
DECLARE
  v_direction_alignment_id uuid;
  v_strategy_direction_id uuid;
  v_user_stakeholder_id uuid;
  v_planning_estimation_id uuid;
  v_delivery_execution_id uuid;
  v_process_workflow_id uuid;
  v_risk_governance_id uuid;
  v_validation_evaluation_id uuid;
  v_supporting_techniques_id uuid;
  
  v_new_insight_id uuid;
  v_new_decision_id uuid;
  v_new_flow_id uuid;
  v_new_assurance_id uuid;
  v_new_enabling_id uuid;
BEGIN
  -- Get existing category IDs
  SELECT id INTO v_direction_alignment_id FROM knowledge_categories WHERE slug = 'direction-alignment';
  SELECT id INTO v_strategy_direction_id FROM knowledge_categories WHERE slug = 'strategy-direction';
  SELECT id INTO v_user_stakeholder_id FROM knowledge_categories WHERE slug = 'user-stakeholder-analysis';
  SELECT id INTO v_planning_estimation_id FROM knowledge_categories WHERE slug = 'planning-estimation';
  SELECT id INTO v_delivery_execution_id FROM knowledge_categories WHERE slug = 'delivery-execution';
  SELECT id INTO v_process_workflow_id FROM knowledge_categories WHERE slug = 'process-workflow-design';
  SELECT id INTO v_risk_governance_id FROM knowledge_categories WHERE slug = 'risk-governance';
  SELECT id INTO v_validation_evaluation_id FROM knowledge_categories WHERE slug = 'validation-evaluation';
  SELECT id INTO v_supporting_techniques_id FROM knowledge_categories WHERE slug = 'supporting-techniques';

  -- Step 2: Update Direction & Alignment (keep existing, update description)
  UPDATE knowledge_categories
  SET 
    description = 'Set and connect goals at any level — from organisational vision to team objectives. Scope: Vision definition, OKRs, product goals, Sprint Goals, strategy mapping, portfolio alignment.',
    updated_at = now()
  WHERE slug = 'direction-alignment';

  -- Step 3: Update and rename User & Stakeholder Analysis → Insight & Understanding
  UPDATE knowledge_categories
  SET 
    name = 'Insight & Understanding',
    slug = 'insight-understanding',
    description = 'Build shared understanding of context, people, and needs to inform better decisions. Scope: Discovery research, stakeholder mapping, assumption testing, metrics analysis, sense-making.',
    updated_at = now()
  WHERE id = v_user_stakeholder_id;
  
  v_new_insight_id := v_user_stakeholder_id;

  -- Step 4: Update and rename Supporting Techniques → Enabling Practices
  UPDATE knowledge_categories
  SET 
    name = 'Enabling Practices',
    slug = 'enabling-practices',
    description = 'Strengthen collaboration, facilitation, and communication across all capabilities. Scope: Workshop design, visualisation, facilitation, documentation patterns, and collaboration platforms.',
    updated_at = now()
  WHERE id = v_supporting_techniques_id;
  
  v_new_enabling_id := v_supporting_techniques_id;

  -- Step 5: Create Decision & Planning (merge Decision & Prioritization + Planning & Estimation)
  INSERT INTO knowledge_categories (name, slug, description, color, created_at, updated_at)
  VALUES (
    'Decision & Planning',
    'decision-planning',
    'Decide what to pursue, and how and when to pursue it — balancing value, cost, risk, and opportunity. Scope: Prioritisation frameworks (MoSCoW, WSJF), estimation, backlog refinement, roadmap planning.',
    '#F97316',
    now(),
    now()
  )
  RETURNING id INTO v_new_decision_id;

  -- Step 6: Create Flow & Delivery (merge Delivery & Execution + Process & Workflow Design)
  INSERT INTO knowledge_categories (name, slug, description, color, created_at, updated_at)
  VALUES (
    'Flow & Delivery',
    'flow-delivery',
    'Coordinate, produce, and release work effectively. Scope: Workflow design, backlog management, dependency coordination, delivery metrics, DevOps practices.',
    '#6366F1',
    now(),
    now()
  )
  RETURNING id INTO v_new_flow_id;

  -- Step 7: Create Assurance & Adaptation (merge Risk & Governance + Validation & Evaluation)
  INSERT INTO knowledge_categories (name, slug, description, color, created_at, updated_at)
  VALUES (
    'Assurance & Adaptation',
    'assurance-adaptation',
    'Govern responsibly, manage risk, and evolve practices through feedback. Scope: Risk reviews, retrospectives, governance models, validation, measurement, and continuous improvement.',
    '#10B981',
    now(),
    now()
  )
  RETURNING id INTO v_new_assurance_id;

  -- Step 8: Migrate knowledge items from old categories to new categories
  
  -- Strategy & Direction → Direction & Alignment
  IF v_strategy_direction_id IS NOT NULL THEN
    UPDATE knowledge_items 
    SET category_id = v_direction_alignment_id, updated_at = now()
    WHERE category_id = v_strategy_direction_id;
  END IF;

  -- Planning & Estimation → Decision & Planning
  IF v_planning_estimation_id IS NOT NULL THEN
    UPDATE knowledge_items 
    SET category_id = v_new_decision_id, updated_at = now()
    WHERE category_id = v_planning_estimation_id;
  END IF;

  -- Delivery & Execution → Flow & Delivery
  IF v_delivery_execution_id IS NOT NULL THEN
    UPDATE knowledge_items 
    SET category_id = v_new_flow_id, updated_at = now()
    WHERE category_id = v_delivery_execution_id;
  END IF;

  -- Process & Workflow Design → Flow & Delivery
  IF v_process_workflow_id IS NOT NULL THEN
    UPDATE knowledge_items 
    SET category_id = v_new_flow_id, updated_at = now()
    WHERE category_id = v_process_workflow_id;
  END IF;

  -- Risk & Governance → Assurance & Adaptation
  IF v_risk_governance_id IS NOT NULL THEN
    UPDATE knowledge_items 
    SET category_id = v_new_assurance_id, updated_at = now()
    WHERE category_id = v_risk_governance_id;
  END IF;

  -- Validation & Evaluation → Assurance & Adaptation
  IF v_validation_evaluation_id IS NOT NULL THEN
    UPDATE knowledge_items 
    SET category_id = v_new_assurance_id, updated_at = now()
    WHERE category_id = v_validation_evaluation_id;
  END IF;

  -- Step 9: Verify no items left on old categories before deletion
  IF EXISTS (
    SELECT 1 FROM knowledge_items 
    WHERE category_id IN (
      v_strategy_direction_id,
      v_planning_estimation_id, 
      v_delivery_execution_id,
      v_process_workflow_id,
      v_risk_governance_id,
      v_validation_evaluation_id
    )
  ) THEN
    RAISE EXCEPTION 'Migration failed: Some knowledge items still reference old categories';
  END IF;

  -- Step 10: Delete old obsolete categories
  DELETE FROM knowledge_categories 
  WHERE id IN (
    v_strategy_direction_id,
    v_planning_estimation_id,
    v_delivery_execution_id,
    v_process_workflow_id,
    v_risk_governance_id,
    v_validation_evaluation_id
  );

  -- Step 11: Log the migration
  INSERT INTO admin_logs (action, details, created_by)
  VALUES (
    'category_restructure',
    jsonb_build_object(
      'migration', 'category_restructure_2025',
      'categories_consolidated', 9,
      'final_categories', 6,
      'new_categories', ARRAY['Decision & Planning', 'Flow & Delivery', 'Assurance & Adaptation'],
      'renamed_categories', ARRAY['Insight & Understanding', 'Enabling Practices'],
      'timestamp', now()
    ),
    auth.uid()
  );

  RAISE NOTICE 'Category restructure completed successfully';
END $$;