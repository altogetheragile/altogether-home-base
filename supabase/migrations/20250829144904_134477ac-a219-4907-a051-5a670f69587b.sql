-- Phase 2: Comprehensive W5H Framework Data Population for All Knowledge Items
-- This migration enhances all 72 remaining legacy knowledge items with W5H framework data

-- Strategy & Direction Category (21 items, 3 already enhanced)
UPDATE knowledge_items SET 
  generic_who = 'Product managers, business analysts, strategic planners, executives, and cross-functional teams',
  generic_what = CASE 
    WHEN name ILIKE '%roadmap%' THEN 'Strategic planning tool that visualizes product direction, priorities, and timeline'
    WHEN name ILIKE '%vision%' THEN 'Shared strategic statement defining long-term goals and aspirational direction'
    WHEN name ILIKE '%okr%' OR name ILIKE '%objective%' THEN 'Goal-setting framework aligning organizational objectives with measurable key results'
    WHEN name ILIKE '%assumption%' THEN 'Systematic method to identify, categorize, and validate underlying business assumptions'
    WHEN name ILIKE '%business case%' THEN 'Evidence-based justification for proposed initiatives evaluating benefits, costs, and risks'
    WHEN name ILIKE '%acceptance criteria%' THEN 'Specific, measurable conditions defining when a feature or story is considered complete'
    ELSE 'Strategic analysis and planning technique for organizational direction and decision-making'
  END,
  generic_when = 'During strategic planning cycles, product roadmapping, quarterly reviews, and major initiative kickoffs',
  generic_where = 'Strategy workshops, executive meetings, product planning sessions, and cross-functional alignment meetings',
  generic_why = 'To align stakeholders, make informed strategic decisions, and ensure consistent direction toward business objectives',
  generic_how = CASE
    WHEN name ILIKE '%roadmap%' THEN 'Define vision, identify key initiatives, sequence priorities, estimate timelines, and communicate to stakeholders'
    WHEN name ILIKE '%vision%' THEN 'Gather stakeholder input, draft aspirational statement, validate alignment, and cascade throughout organization'
    WHEN name ILIKE '%okr%' OR name ILIKE '%objective%' THEN 'Set 3-5 ambitious objectives, define 2-4 measurable key results each, track progress, and review regularly'
    WHEN name ILIKE '%assumption%' THEN 'Brainstorm assumptions, categorize by risk and impact, prioritize for validation, and design experiments'
    WHEN name ILIKE '%business case%' THEN 'Define problem, analyze options, quantify benefits and costs, assess risks, and recommend solution'
    WHEN name ILIKE '%acceptance criteria%' THEN 'Collaborate with stakeholders to define specific, testable conditions using Given-When-Then format'
    ELSE 'Follow structured process with stakeholder involvement, data analysis, and iterative refinement'
  END,
  generic_how_much = '2-8 hours for workshops, 1-4 weeks for comprehensive strategic initiatives',
  example_who = 'Product team at a SaaS company planning their annual product strategy',
  example_what = 'Quarterly strategic planning session to align product roadmap with business objectives',
  example_when = 'Beginning of Q4 to plan the following year''s product direction and priorities',
  example_where = 'Two-day offsite workshop with all product stakeholders and leadership team',
  example_why = 'To ensure product investments align with market opportunities and business goals',
  example_how = 'Facilitated sessions combining market analysis, customer feedback, competitive intelligence, and business metrics',
  example_how_much = '16 hours over two days with 12 stakeholders, including pre-work and follow-up documentation',
  background = 'Strategic planning methodologies developed from business strategy frameworks and agile product management practices',
  source = 'Business strategy frameworks, product management methodologies, and organizational development practices',
  planning_considerations = 'Ensure diverse stakeholder representation, prepare supporting data, plan for iteration cycles, and establish clear success metrics',
  industry_context = 'Applicable across industries with adaptation for regulatory requirements, market dynamics, and organizational maturity'
WHERE category_id = '2b14345e-4aba-4a6e-8642-1d4d241a0268' 
  AND generic_who IS NULL;

-- User & Stakeholder Analysis Category (11 items, 1 already enhanced) 
UPDATE knowledge_items SET
  generic_who = 'UX researchers, product managers, business analysts, designers, and customer success teams',
  generic_what = CASE
    WHEN name ILIKE '%persona%' OR name ILIKE '%user%' THEN 'Research-driven representation of target users capturing behaviors, needs, and motivations'
    WHEN name ILIKE '%stakeholder%' THEN 'Systematic identification and analysis of individuals or groups affected by or influencing the project'
    WHEN name ILIKE '%journey%' OR name ILIKE '%map%' THEN 'Visual representation of user experiences and interactions across touchpoints and time'
    WHEN name ILIKE '%empathy%' THEN 'Collaborative tool for understanding and visualizing user perspectives and emotional states'
    WHEN name ILIKE '%contextual%' OR name ILIKE '%inquiry%' THEN 'Ethnographic research method combining observation and interviews in natural user environments'
    ELSE 'User research technique for understanding stakeholder needs, behaviors, and contexts'
  END,
  generic_when = 'During discovery phases, before design decisions, and when validating user understanding',
  generic_where = 'User research facilities, customer locations, design studios, and collaborative workshop spaces',
  generic_why = 'To build empathy, inform design decisions, and ensure solutions meet real user needs',
  generic_how = CASE
    WHEN name ILIKE '%persona%' OR name ILIKE '%user%' THEN 'Conduct user research, identify patterns, create representative profiles, and validate with stakeholders'
    WHEN name ILIKE '%stakeholder%' THEN 'Identify all affected parties, assess influence and interest, map relationships, and plan engagement strategies'
    WHEN name ILIKE '%journey%' OR name ILIKE '%map%' THEN 'Map user touchpoints, identify pain points and opportunities, visualize emotional journey, and prioritize improvements'
    WHEN name ILIKE '%empathy%' THEN 'Define user, capture what they see/hear/think/feel/say/do, and identify pain points and gains'
    WHEN name ILIKE '%contextual%' OR name ILIKE '%inquiry%' THEN 'Observe users in natural environment, conduct contextual interviews, and analyze workflow patterns'
    ELSE 'Apply systematic research methods combining observation, interviews, and collaborative analysis'
  END,
  generic_how_much = '4-16 hours for creation, ongoing validation throughout project lifecycle',
  example_who = 'UX research team at fintech startup studying mobile banking user behavior',
  example_what = 'Research initiative to understand how users manage personal finances across different life stages',
  example_when = 'Early discovery phase before designing new financial planning features',
  example_where = 'User homes, coffee shops, and workplace environments where financial decisions occur',
  example_why = 'To design intuitive financial tools that fit naturally into users'' daily routines',
  example_how = 'Combination of in-home interviews, mobile diary studies, and collaborative analysis sessions',
  example_how_much = '40 hours of research with 20 participants over 3 weeks',
  background = 'User-centered design methodologies evolved from anthropology, psychology, and human-computer interaction research',
  source = 'Design thinking, ethnographic research methods, and user experience design practices',
  planning_considerations = 'Recruit representative participants, prepare research protocols, ensure ethical guidelines, and plan analysis workflows',
  industry_context = 'Universal application with industry-specific considerations for domain expertise and regulatory constraints'
WHERE category_id = 'f143cf15-7599-4764-91a8-9d1bb8a79fcc'
  AND generic_who IS NULL;

-- Validation & Evaluation Category (15 items, 0 enhanced)
UPDATE knowledge_items SET
  generic_who = 'Product managers, UX researchers, data analysts, QA engineers, and marketing teams',
  generic_what = CASE
    WHEN name ILIKE '%test%' THEN 'Controlled experiment comparing different versions to measure performance and user preference'
    WHEN name ILIKE '%prototype%' THEN 'Early validation method using low-fidelity representations to test concepts before full development'
    WHEN name ILIKE '%usability%' THEN 'Systematic evaluation of user interface effectiveness through task-based user testing'
    WHEN name ILIKE '%analytics%' THEN 'Data-driven analysis of user behavior patterns to validate assumptions and measure success'
    WHEN name ILIKE '%feedback%' THEN 'Structured collection and analysis of user opinions and suggestions for product improvement'
    WHEN name ILIKE '%audit%' THEN 'Comprehensive evaluation against established standards or best practices'
    ELSE 'Validation technique for testing assumptions, measuring performance, and gathering evidence'
  END,
  generic_when = 'Before major releases, during feature development, and as part of continuous improvement cycles',
  generic_where = 'Usability labs, online platforms, production environments, and user testing facilities',
  generic_why = 'To validate assumptions, reduce risk, optimize user experience, and make data-driven decisions',
  generic_how = CASE
    WHEN name ILIKE '%a/b%' OR name ILIKE '%test%' THEN 'Design experiment variants, define success metrics, run controlled test, and analyze statistical significance'
    WHEN name ILIKE '%prototype%' THEN 'Create testable representation, recruit target users, conduct evaluation sessions, and iterate based on feedback'
    WHEN name ILIKE '%usability%' THEN 'Define tasks, recruit participants, conduct moderated sessions, and analyze behavioral patterns'
    WHEN name ILIKE '%analytics%' THEN 'Set up tracking, collect behavioral data, analyze patterns, and derive actionable insights'
    WHEN name ILIKE '%feedback%' THEN 'Design collection methods, gather user input, categorize themes, and prioritize improvements'
    WHEN name ILIKE '%audit%' THEN 'Define evaluation criteria, systematic assessment, identify gaps, and recommend improvements'
    ELSE 'Apply systematic evaluation methods with clear metrics and statistical analysis'
  END,
  generic_how_much = '2-12 hours setup, 1-4 weeks data collection, 4-8 hours analysis',
  example_who = 'E-commerce product team testing checkout flow optimization',
  example_what = 'Comparing single-page vs. multi-step checkout processes to improve conversion rates',
  example_when = 'During quarterly conversion optimization initiative',
  example_where = 'Production website with real customer traffic',
  example_why = 'To reduce cart abandonment and increase successful purchases',
  example_how = 'Split traffic 50/50, measure conversion rates, completion times, and user satisfaction scores',
  example_how_much = '2 weeks testing with 10,000 users per variant',
  background = 'Evidence-based design principles from experimental psychology, statistics, and user experience research',
  source = 'Scientific method, statistical analysis, user experience research, and lean startup methodologies',
  planning_considerations = 'Define clear hypotheses, ensure statistical power, plan for ethical considerations, and prepare analysis frameworks',
  industry_context = 'Widely applicable with domain-specific metrics and compliance considerations'
WHERE category_id = '50cc42f0-d3f9-4b75-bb07-21f6d6174dab'
  AND generic_who IS NULL;

-- Planning & Estimation Category (11 items, 1 already enhanced)
UPDATE knowledge_items SET
  generic_who = 'Scrum masters, project managers, development teams, product owners, and delivery leads',
  generic_what = CASE
    WHEN name ILIKE '%planning poker%' OR name ILIKE '%estimation%' THEN 'Collaborative estimation technique using consensus-based relative sizing of work items'
    WHEN name ILIKE '%sprint%' OR name ILIKE '%iteration%' THEN 'Time-boxed planning session to select and commit to work for upcoming development cycle'
    WHEN name ILIKE '%backlog%' THEN 'Prioritization technique for ordering work items based on value, effort, and strategic alignment'
    WHEN name ILIKE '%capacity%' THEN 'Planning approach that considers team availability and capabilities for realistic commitment'
    WHEN name ILIKE '%story%' OR name ILIKE '%mapping%' THEN 'Visual planning technique organizing user stories to understand system functionality and plan releases'
    ELSE 'Agile planning technique for estimating effort, managing scope, and coordinating team delivery'
  END,
  generic_when = 'During sprint planning, backlog refinement, release planning, and capacity planning sessions',
  generic_where = 'Team collaboration spaces, planning rooms, and distributed team video conferences',
  generic_why = 'To create realistic commitments, align team understanding, and enable predictable delivery',
  generic_how = CASE
    WHEN name ILIKE '%planning poker%' OR name ILIKE '%estimation%' THEN 'Present work items, discuss complexity, use cards/tools for private estimates, reveal simultaneously, discuss differences, and reach consensus'
    WHEN name ILIKE '%sprint%' OR name ILIKE '%iteration%' THEN 'Review priority items, estimate capacity, select work for iteration, break into tasks, and commit to sprint goal'
    WHEN name ILIKE '%backlog%' THEN 'Gather requirements, write user stories, estimate relative size, prioritize by value, and maintain as living document'
    WHEN name ILIKE '%capacity%' THEN 'Calculate team availability, account for holidays and commitments, consider skill distribution, and plan realistic workload'
    WHEN name ILIKE '%story%' OR name ILIKE '%mapping%' THEN 'Map user journey, organize stories by narrative flow, identify minimum viable product, and plan releases'
    ELSE 'Facilitate collaborative sessions with structured estimation and planning processes'
  END,
  generic_how_much = '2-8 hours per planning session, ongoing refinement throughout development cycle',
  example_who = 'Agile development team of 8 engineers planning a two-week sprint',
  example_what = 'Sprint planning session for mobile app feature development',
  example_when = 'Beginning of each two-week sprint cycle',
  example_where = 'Team collaboration room with digital planning tools',
  example_why = 'To commit to realistic sprint goals and ensure team alignment on priorities',
  example_how = 'Review backlog priorities, estimate story points using planning poker, calculate team capacity, and select sprint commitment',
  example_how_much = '4 hours planning session resulting in 40 story points of committed work',
  background = 'Agile software development methodologies emphasizing iterative planning and team collaboration',
  source = 'Scrum framework, agile estimation practices, and iterative development methodologies',
  planning_considerations = 'Ensure team participation, maintain estimation calibration, account for dependencies, and plan for unknowns',
  industry_context = 'Originated in software development, now adapted across industries for iterative project delivery'
WHERE category_id = '6c79396e-06d5-46c4-be84-8704ffae7eef'
  AND generic_who IS NULL;

-- Decision & Prioritization Category (9 items, 0 enhanced)
UPDATE knowledge_items SET
  generic_who = 'Product managers, business analysts, executives, project managers, and cross-functional decision makers',
  generic_what = CASE
    WHEN name ILIKE '%kano%' THEN 'Prioritization framework categorizing features by customer satisfaction and implementation impact'
    WHEN name ILIKE '%ice%' THEN 'Scoring method evaluating initiatives based on Impact, Confidence, and Ease of implementation'
    WHEN name ILIKE '%rice%' THEN 'Prioritization framework scoring features by Reach, Impact, Confidence, and Effort'
    WHEN name ILIKE '%moscow%' THEN 'Requirements prioritization technique categorizing items as Must have, Should have, Could have, Won''t have'
    WHEN name ILIKE '%cost%' OR name ILIKE '%delay%' THEN 'Economic framework quantifying the financial impact of delaying decisions or delivery'
    WHEN name ILIKE '%matrix%' THEN 'Decision-making tool evaluating options against multiple weighted criteria'
    ELSE 'Structured decision-making framework for evaluating and prioritizing alternatives'
  END,
  generic_when = 'During feature prioritization, resource allocation, strategic planning, and roadmap development',
  generic_where = 'Strategy meetings, product planning sessions, executive reviews, and cross-functional workshops',
  generic_why = 'To make objective decisions, optimize resource allocation, and align stakeholders on priorities',
  generic_how = CASE
    WHEN name ILIKE '%kano%' THEN 'Survey customers on feature preferences, categorize as basic/performance/excitement, plot satisfaction curves, and prioritize by category'
    WHEN name ILIKE '%ice%' THEN 'Score each option on 1-10 scale for impact, confidence, and ease, calculate composite score, and rank alternatives'
    WHEN name ILIKE '%rice%' THEN 'Estimate reach and impact, assess confidence level, calculate effort required, and compute RICE score for ranking'
    WHEN name ILIKE '%moscow%' THEN 'Collaborate with stakeholders to categorize requirements, validate must-haves, and sequence should/could haves'
    WHEN name ILIKE '%cost%' OR name ILIKE '%delay%' THEN 'Calculate revenue impact over time, assess competitive risks, and quantify opportunity costs'
    WHEN name ILIKE '%matrix%' THEN 'Define evaluation criteria, weight importance, score alternatives, and rank by total weighted score'
    ELSE 'Apply systematic evaluation process with stakeholder input and quantitative scoring'
  END,
  generic_how_much = '2-6 hours for scoring sessions, 1-2 weeks for comprehensive analysis',
  example_who = 'Product management team at SaaS company prioritizing feature backlog for next quarter',
  example_what = 'Quarterly feature prioritization using multiple frameworks to optimize customer value and development effort',
  example_when = 'End of quarter during roadmap planning for subsequent quarter delivery',
  example_where = 'Cross-functional workshop with product, engineering, and business stakeholders',
  example_why = 'To ensure development resources focus on highest-impact features for business growth',
  example_how = 'Applied RICE scoring to 50+ feature candidates, validated with Kano analysis, and created prioritized roadmap',
  example_how_much = '8 hours of collaborative scoring across 2 sessions with 12 stakeholders',
  background = 'Decision science, operations research, and product management methodologies for systematic choice evaluation',
  source = 'Management science, product management frameworks, and organizational decision-making practices',
  planning_considerations = 'Gather relevant data, ensure stakeholder representation, plan for bias mitigation, and establish review cycles',
  industry_context = 'Universal application with industry-specific criteria and constraints'
WHERE category_id = '38e960c8-77e9-4518-bd38-f7d53df001e1'
  AND generic_who IS NULL;

-- Delivery & Execution Category (3 items, 0 enhanced)
UPDATE knowledge_items SET
  generic_who = 'Development teams, scrum masters, project managers, delivery leads, and operations teams',
  generic_what = CASE
    WHEN name ILIKE '%kanban%' THEN 'Visual workflow management system for continuous delivery and work-in-progress optimization'
    WHEN name ILIKE '%ci/cd%' OR name ILIKE '%continuous%' THEN 'Automated delivery pipeline enabling frequent, reliable software releases'
    WHEN name ILIKE '%deployment%' THEN 'Systematic approach for releasing software changes to production environments'
    ELSE 'Execution methodology for delivering value through systematic workflow management'
  END,
  generic_when = 'Throughout development lifecycle, during continuous delivery, and for ongoing operational management',
  generic_where = 'Development environments, operations centers, team collaboration spaces, and automated pipeline systems',
  generic_why = 'To optimize flow, reduce waste, enable faster delivery, and improve quality and reliability',
  generic_how = CASE
    WHEN name ILIKE '%kanban%' THEN 'Visualize workflow stages, set work-in-progress limits, manage flow, implement pull system, and measure cycle time'
    WHEN name ILIKE '%ci/cd%' OR name ILIKE '%continuous%' THEN 'Automate build and test processes, implement deployment pipelines, monitor quality gates, and enable rapid feedback'
    WHEN name ILIKE '%deployment%' THEN 'Plan release strategy, prepare rollback procedures, coordinate team communication, and monitor system health'
    ELSE 'Implement systematic processes with automation, monitoring, and continuous improvement'
  END,
  generic_how_much = 'Initial setup: 1-4 weeks, ongoing operation with continuous optimization',
  example_who = 'DevOps team at e-commerce company implementing continuous delivery for mobile applications',
  example_what = 'Automated deployment pipeline enabling daily releases with zero-downtime deployments',
  example_when = 'Implemented during platform modernization initiative over 6-month period',
  example_where = 'Cloud infrastructure with automated testing and deployment orchestration',
  example_why = 'To reduce release cycle time from monthly to daily while maintaining system reliability',
  example_how = 'Implemented GitOps workflow, automated testing suite, canary deployments, and comprehensive monitoring',
  example_how_much = 'Initial 12-week implementation enabling 10x faster release cadence',
  background = 'Lean manufacturing principles, DevOps practices, and continuous delivery methodologies',
  source = 'Lean manufacturing, agile software development, and site reliability engineering practices',
  planning_considerations = 'Assess current state, plan incremental adoption, ensure team training, and establish monitoring capabilities',
  industry_context = 'Primarily software-focused with adaptation principles applicable to other delivery contexts'
WHERE category_id = '83aa17d2-9b2e-4b38-b6be-b0d2493a0f7a'
  AND generic_who IS NULL;

-- Process & Workflow Design Category (3 items, 0 enhanced)
UPDATE knowledge_items SET
  generic_who = 'Business analysts, process owners, operations managers, workflow designers, and improvement teams',
  generic_what = CASE
    WHEN name ILIKE '%process%' OR name ILIKE '%workflow%' THEN 'Systematic documentation and optimization of business processes and operational workflows'
    WHEN name ILIKE '%value stream%' THEN 'End-to-end analysis of activities required to deliver value from concept to customer'
    WHEN name ILIKE '%lean%' THEN 'Waste elimination methodology focusing on value-added activities and continuous improvement'
    ELSE 'Process analysis and design technique for optimizing organizational workflows and efficiency'
  END,
  generic_when = 'During process improvement initiatives, organizational change, and operational optimization projects',
  generic_where = 'Process workshops, operational areas, cross-functional meetings, and improvement team sessions',
  generic_why = 'To eliminate waste, improve efficiency, reduce errors, and enhance customer value delivery',
  generic_how = CASE
    WHEN name ILIKE '%process%' OR name ILIKE '%workflow%' THEN 'Document current state, identify inefficiencies, design future state, and implement improvements with stakeholder involvement'
    WHEN name ILIKE '%value stream%' THEN 'Map end-to-end process, identify value-added vs. non-value-added activities, measure flow metrics, and optimize bottlenecks'
    WHEN name ILIKE '%lean%' THEN 'Identify eight types of waste, apply 5S methodology, implement pull systems, and establish continuous improvement culture'
    ELSE 'Apply systematic analysis combining process mapping, stakeholder input, and performance measurement'
  END,
  generic_how_much = '1-4 weeks for analysis, 2-12 weeks for implementation depending on complexity',
  example_who = 'Operations improvement team at manufacturing company optimizing order fulfillment process',
  example_what = 'Value stream mapping initiative to reduce order-to-delivery cycle time',
  example_when = 'Quarterly process improvement project as part of operational excellence program',
  example_where = 'Cross-functional workshops involving sales, fulfillment, and customer service teams',
  example_why = 'To improve customer satisfaction by reducing delivery times and eliminating process bottlenecks',
  example_how = 'Mapped current state, identified waste and delays, redesigned workflow, and implemented lean improvements',
  example_how_much = '6-week project resulting in 40% reduction in cycle time',
  background = 'Lean manufacturing, business process improvement, and operations management methodologies',
  source = 'Toyota Production System, business process reengineering, and continuous improvement practices',
  planning_considerations = 'Engage process stakeholders, gather baseline metrics, plan change management, and establish measurement systems',
  industry_context = 'Universal application across industries with adaptation for sector-specific processes and constraints'
WHERE category_id = 'ca8f8b5a-4e15-4f71-8b37-2853c8e4a9d7'
  AND generic_who IS NULL;

-- Supporting Techniques Category (3 items, 0 enhanced)
UPDATE knowledge_items SET
  generic_who = 'Facilitators, team leads, consultants, trainers, and collaborative session organizers',
  generic_what = CASE
    WHEN name ILIKE '%facilitation%' THEN 'Structured approach to guiding group processes and enabling productive collaborative outcomes'
    WHEN name ILIKE '%workshop%' THEN 'Interactive session design for achieving specific learning or decision-making objectives'
    WHEN name ILIKE '%brainstorm%' THEN 'Creative ideation technique for generating diverse solutions and innovative thinking'
    ELSE 'Collaborative technique for enabling group effectiveness and productive teamwork'
  END,
  generic_when = 'During collaborative sessions, problem-solving workshops, creative ideation, and team building activities',
  generic_where = 'Meeting rooms, workshop spaces, virtual collaboration platforms, and team collaboration environments',
  generic_why = 'To harness collective intelligence, generate creative solutions, build consensus, and enable effective group decisions',
  generic_how = CASE
    WHEN name ILIKE '%facilitation%' THEN 'Prepare session design, establish ground rules, guide discussions, manage group dynamics, and ensure outcome achievement'
    WHEN name ILIKE '%workshop%' THEN 'Define objectives, design activities, prepare materials, facilitate engagement, and capture actionable outcomes'
    WHEN name ILIKE '%brainstorm%' THEN 'Set creative environment, encourage wild ideas, defer judgment, build on others'' ideas, and prioritize results'
    ELSE 'Apply structured collaborative processes with clear objectives and inclusive participation'
  END,
  generic_how_much = '2-8 hours per session, with 30 minutes to 2 hours of preparation per hour of facilitation',
  example_who = 'Innovation team at technology company facilitating product ideation workshop',
  example_what = 'Cross-functional brainstorming session to generate new product feature concepts',
  example_when = 'Quarterly innovation workshop during strategic planning cycle',
  example_where = 'Creative collaboration space with diverse stakeholders from product, engineering, and design',
  example_why = 'To generate breakthrough ideas for next-generation product features and capabilities',
  example_how = 'Facilitated divergent thinking exercises, affinity mapping, and convergent prioritization activities',
  example_how_much = '4-hour workshop with 16 participants generating 200+ ideas refined to top 10 concepts',
  background = 'Group dynamics, creative problem-solving, and collaborative facilitation methodologies',
  source = 'Design thinking, creative facilitation practices, and group process improvement techniques',
  planning_considerations = 'Design inclusive environment, prepare diverse activities, plan for different thinking styles, and ensure follow-through',
  industry_context = 'Universal application with customization for organizational culture and specific collaboration needs'
WHERE category_id = 'd1f2e3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a'
  AND generic_who IS NULL;

-- Risk & Governance Category (1 item, 0 enhanced)
UPDATE knowledge_items SET
  generic_who = 'Risk managers, compliance officers, project managers, audit teams, and governance committees',
  generic_what = CASE
    WHEN name ILIKE '%risk%' THEN 'Systematic identification, assessment, and mitigation of potential threats to project or business objectives'
    WHEN name ILIKE '%audit%' THEN 'Independent evaluation of processes, controls, and compliance with established standards'
    WHEN name ILIKE '%governance%' THEN 'Framework for decision-making authority, accountability, and oversight of organizational activities'
    ELSE 'Risk management and governance technique for ensuring compliance and mitigating organizational threats'
  END,
  generic_when = 'During project initiation, periodic reviews, compliance assessments, and governance evaluations',
  generic_where = 'Governance meetings, audit sessions, risk assessment workshops, and compliance review spaces',
  generic_why = 'To protect organizational assets, ensure regulatory compliance, and enable informed risk-based decision making',
  generic_how = CASE
    WHEN name ILIKE '%risk%' THEN 'Identify potential risks, assess probability and impact, develop mitigation strategies, and monitor risk indicators'
    WHEN name ILIKE '%audit%' THEN 'Plan audit scope, gather evidence, evaluate controls, identify gaps, and recommend improvements'
    WHEN name ILIKE '%governance%' THEN 'Establish oversight structures, define decision rights, implement monitoring processes, and ensure accountability'
    ELSE 'Apply systematic evaluation with documented procedures, stakeholder involvement, and continuous monitoring'
  END,
  generic_how_much = '4-16 hours for assessment activities, ongoing monitoring throughout project lifecycle',
  example_who = 'Risk management team at financial services company conducting operational risk assessment',
  example_what = 'Comprehensive risk evaluation for new digital banking platform implementation',
  example_when = 'Pre-implementation risk assessment during system development phase',
  example_where = 'Cross-functional risk workshop with technology, operations, and compliance teams',
  example_why = 'To identify and mitigate potential risks before launching customer-facing digital services',
  example_how = 'Systematic threat modeling, control assessment, risk scoring, and mitigation planning',
  example_how_much = '3-week assessment process with 40 hours of workshops and analysis',
  background = 'Enterprise risk management, regulatory compliance, and organizational governance frameworks',
  source = 'Risk management standards, regulatory guidance, and corporate governance best practices',
  planning_considerations = 'Ensure comprehensive scope, engage relevant stakeholders, plan for regular updates, and establish clear escalation procedures',
  industry_context = 'Critical for regulated industries with adaptation for sector-specific risks and compliance requirements'
WHERE category_id = 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e'
  AND generic_who IS NULL;

-- Update common fields for all newly enhanced items
UPDATE knowledge_items SET
  success_criteria = ARRAY[
    'Clear stakeholder understanding and alignment',
    'Actionable outcomes and next steps identified', 
    'Improved decision-making and reduced uncertainty',
    'Enhanced team collaboration and communication'
  ],
  typical_participants = ARRAY[
    'Subject matter experts',
    'Key stakeholders', 
    'Decision makers',
    'Implementation team members'
  ],
  required_skills = ARRAY[
    'Analytical thinking',
    'Collaborative facilitation',
    'Domain knowledge',
    'Communication skills'
  ],
  common_pitfalls = ARRAY[
    'Insufficient stakeholder involvement',
    'Lack of clear objectives or scope',
    'Poor preparation or incomplete data', 
    'Inadequate follow-through on outcomes'
  ],
  related_practices = ARRAY[
    'Stakeholder analysis and engagement',
    'Data collection and analysis',
    'Collaborative decision making',
    'Change management and implementation'
  ]
WHERE generic_who IS NOT NULL 
  AND success_criteria IS NULL;

-- Log completion
INSERT INTO admin_logs (action, details, created_by)
VALUES ('knowledge_items_w5h_enhancement', 
        '{"enhanced_items": 72, "categories_updated": 9, "framework": "W5H"}',
        (SELECT auth.uid()));