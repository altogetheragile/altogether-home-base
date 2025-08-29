-- Targeted migration to update the 10 missing knowledge items with W5H framework data

-- Update 5 Whys (Root Cause Analysis technique)
UPDATE knowledge_items 
SET 
  generic_who = 'Team members, facilitators, problem solvers, quality analysts, and anyone investigating issues',
  generic_what = 'A systematic questioning technique that explores cause-and-effect relationships by asking "Why?" five times in succession',
  generic_when = 'During problem-solving sessions, incident analysis, root cause investigations, and continuous improvement activities',
  generic_where = 'In team meetings, retrospectives, quality reviews, incident post-mortems, and process improvement workshops',
  generic_why = 'To identify the root cause of problems rather than symptoms, prevent recurrence, and develop effective solutions',
  generic_how = 'Start with a problem statement, ask why it occurred, then ask why for each subsequent answer until reaching the root cause',
  generic_how_much = '15-30 minutes per investigation, minimal cost, requires only facilitation time and participant engagement',
  example_who = 'Software development team investigating production bugs, manufacturing team analyzing defects',
  example_what = 'A team uses 5 Whys to investigate why their application crashed during peak traffic',
  example_when = 'After a critical system failure, during weekly retrospectives, or when recurring issues are identified',
  example_where = 'In incident response meetings, quality control sessions, or continuous improvement workshops',
  example_why = 'To prevent future system failures and improve overall reliability and customer satisfaction',
  example_how = 'Team asks: Why did the system crash? → High memory usage. Why high memory? → Memory leak. Why leak? → Unclosed connections. Why unclosed? → Missing cleanup code. Why missing? → Code review process gap',
  example_how_much = '20 minutes of team discussion, prevented future incidents worth thousands in lost revenue',
  purpose = 'Systematically identify root causes of problems through iterative questioning',
  background = 'Developed by Sakichi Toyoda and used within Toyota Motor Corporation as part of their problem-solving methodology',
  planning_considerations = 'Ensure psychological safety, have the right people present, focus on process not blame, document findings',
  industry_context = 'Manufacturing quality control, software debugging, healthcare incident analysis, service delivery improvement',
  success_criteria = ARRAY['Root cause identified', 'Actionable solutions developed', 'Team understanding improved', 'Problem recurrence prevented']
WHERE slug = '5-whys' OR name ILIKE '%5 Whys%';

-- Update Feature Toggles / Flags (Development Practice)
UPDATE knowledge_items 
SET 
  generic_who = 'Software developers, DevOps engineers, product managers, QA teams, and release managers',
  generic_what = 'Conditional logic that allows features to be turned on/off without deploying new code',
  generic_when = 'During feature development, A/B testing, gradual rollouts, and emergency response situations',
  generic_where = 'In application code, configuration management systems, and deployment pipelines',
  generic_why = 'To enable safe deployments, reduce risk, facilitate testing, and allow quick feature rollback',
  generic_how = 'Implement conditional statements that check feature flag status before executing feature code',
  generic_how_much = 'Initial setup: 1-2 days, ongoing maintenance: minimal, infrastructure costs vary by provider',
  example_who = 'E-commerce team rolling out new checkout flow, SaaS company testing premium features',
  example_what = 'Netflix uses feature flags to gradually roll out new recommendation algorithms to user segments',
  example_when = 'During major feature launches, holiday traffic periods, or when testing new functionality',
  example_where = 'In production applications, mobile apps, web platforms, and API services',
  example_why = 'To minimize risk during deployments and enable quick response to issues without full rollbacks',
  example_how = 'Configure flags in management system, wrap new features in conditional logic, monitor metrics, adjust rollout percentage',
  example_how_much = '2 hours setup time, prevented potential $50K revenue loss from faulty feature deployment',
  purpose = 'Enable safe, controlled feature releases and quick response to production issues',
  background = 'Emerged from continuous deployment practices and the need for risk-free feature releases',
  planning_considerations = 'Flag lifecycle management, performance impact assessment, team training on flag usage',
  industry_context = 'Software development, mobile applications, SaaS platforms, e-commerce systems',
  success_criteria = ARRAY['Zero-downtime deployments', 'Quick feature rollback capability', 'Gradual rollout success', 'Reduced deployment risk']
WHERE slug ILIKE '%feature-toggle%' OR slug ILIKE '%feature-flag%' OR name ILIKE '%Feature Toggles%' OR name ILIKE '%Feature Flags%';

-- Update Fishbone Diagram (Root Cause Analysis technique)
UPDATE knowledge_items 
SET 
  generic_who = 'Quality analysts, problem-solving teams, process improvement specialists, and facilitators',
  generic_what = 'A cause-and-effect diagram that systematically explores all potential causes of a problem',
  generic_when = 'During root cause analysis, process improvement initiatives, and problem-solving sessions',
  generic_where = 'In team workshops, quality reviews, process analysis meetings, and improvement projects',
  generic_why = 'To comprehensively identify all possible causes and avoid overlooking important factors',
  generic_how = 'Draw fish skeleton with problem as head, add major cause categories as bones, brainstorm specific causes',
  generic_how_much = '30-60 minutes for diagram creation, minimal cost, requires facilitation and participant time',
  example_who = 'Manufacturing team analyzing product defects, healthcare team investigating patient safety issues',
  example_what = 'Hospital team creates fishbone diagram to analyze causes of medication errors',
  example_when = 'After quality incidents, during process improvement projects, or in preventive analysis',
  example_where = 'In quality control meetings, patient safety committees, or continuous improvement workshops',
  example_why = 'To systematically prevent medication errors and improve patient safety protocols',
  example_how = 'Categories: People (training), Process (verification steps), Environment (distractions), Equipment (barcode scanners), Materials (labeling), Management (policies)',
  example_how_much = '45 minutes team session, identified 12 contributing factors, led to 3 major process improvements',
  purpose = 'Systematically explore and visualize all potential causes of a problem or effect',
  background = 'Created by Kaoru Ishikawa in 1943, also known as Ishikawa diagram or cause-and-effect diagram',
  planning_considerations = 'Define problem clearly, select diverse team, use appropriate categories (6Ms, 4Ps, etc.), validate causes',
  industry_context = 'Manufacturing quality, healthcare safety, software defects, service failures, process optimization',
  success_criteria = ARRAY['Comprehensive cause identification', 'Team alignment on problem factors', 'Structured analysis completed', 'Actionable insights generated']
WHERE slug ILIKE '%fishbone%' OR name ILIKE '%Fishbone%';

-- Update Mind Mapping (Planning Tool)
UPDATE knowledge_items 
SET 
  generic_who = 'Project managers, creative teams, students, trainers, brainstorming facilitators, and strategic planners',
  generic_what = 'A visual thinking tool that uses branching diagrams to represent connections between ideas and concepts',
  generic_when = 'During brainstorming, planning sessions, learning activities, and creative problem-solving',
  generic_where = 'In meeting rooms, training sessions, individual work, collaborative workshops, and digital platforms',
  generic_why = 'To enhance creativity, improve memory retention, organize complex information, and facilitate idea generation',
  generic_how = 'Start with central topic, create main branches for key themes, add sub-branches for details, use colors and images',
  generic_how_much = '15-45 minutes per map, free to low cost tools available, time investment varies by complexity',
  example_who = 'Product team mapping user journey, training team organizing curriculum content',
  example_what = 'Marketing team creates mind map to plan comprehensive product launch campaign',
  example_when = 'During strategic planning sessions, campaign development, or project kickoff meetings',
  example_where = 'In collaborative workshops, digital tools like Miro, or traditional whiteboard sessions',
  example_why = 'To ensure all campaign elements are considered and connections between activities are clear',
  example_how = 'Central node: Product Launch, branches: Target Audience, Channels, Timeline, Budget, Metrics, with detailed sub-branches for each',
  example_how_much = '2 hours workshop time, resulted in comprehensive launch strategy covering 15 different activities',
  purpose = 'Visually organize information, enhance creative thinking, and improve understanding of complex topics',
  background = 'Popularized by Tony Buzan in the 1970s, based on research about how the brain processes information',
  planning_considerations = 'Clear central focus, logical branching structure, use of colors and symbols, collaborative input',
  industry_context = 'Education and training, project management, creative industries, strategic planning, knowledge management',
  success_criteria = ARRAY['Clear visual representation', 'Enhanced idea generation', 'Improved information retention', 'Better project organization']
WHERE slug ILIKE '%mind-map%' OR name ILIKE '%Mind Map%';

-- Update Risk Analysis (Risk Management)
UPDATE knowledge_items 
SET 
  generic_who = 'Risk managers, project managers, business analysts, compliance officers, and executive teams',
  generic_what = 'Systematic identification, assessment, and prioritization of potential risks and their impacts',
  generic_when = 'During project planning, strategic planning, compliance reviews, and decision-making processes',
  generic_where = 'In risk workshops, board meetings, project planning sessions, and regulatory assessments',
  generic_why = 'To proactively identify threats, minimize negative impacts, and make informed decisions',
  generic_how = 'Identify risks, assess probability and impact, calculate risk scores, develop mitigation strategies',
  generic_how_much = 'Initial analysis: 1-5 days, ongoing monitoring: 2-4 hours monthly, tools from free to enterprise level',
  example_who = 'Financial services team assessing market risks, IT team analyzing cybersecurity threats',
  example_what = 'Bank conducts comprehensive risk analysis for new digital banking platform launch',
  example_when = 'Before major system launches, during regulatory reviews, or after security incidents',
  example_where = 'In risk committee meetings, cybersecurity assessments, or regulatory compliance reviews',
  example_why = 'To ensure platform security, regulatory compliance, and protect customer data and bank reputation',
  example_how = 'Risk register with categories: Cyber threats, Operational risks, Regulatory compliance, Market risks, each scored and prioritized',
  example_how_much = '3 weeks analysis by 5-person team, identified 23 risks, prevented potential $2M regulatory fine',
  purpose = 'Proactively identify and manage potential threats to organizational objectives',
  background = 'Evolved from insurance and engineering fields, formalized in project management and enterprise risk frameworks',
  planning_considerations = 'Stakeholder involvement, regular updates, risk appetite definition, mitigation planning, monitoring systems',
  industry_context = 'Financial services, healthcare, manufacturing, IT systems, construction, pharmaceutical',
  success_criteria = ARRAY['Comprehensive risk identification', 'Accurate impact assessment', 'Effective mitigation plans', 'Reduced unexpected issues']
WHERE slug ILIKE '%risk-analys%' OR name ILIKE '%Risk Analy%';

-- Update Service Blueprint (Process Design)
UPDATE knowledge_items 
SET 
  generic_who = 'Service designers, UX researchers, operations managers, customer experience teams, and process analysts',
  generic_what = 'A detailed diagram that visualizes service delivery processes, including customer actions and behind-the-scenes activities',
  generic_when = 'During service design projects, process improvement initiatives, and customer experience optimization',
  generic_where = 'In design workshops, service development meetings, and customer experience planning sessions',
  generic_why = 'To understand complete service ecosystem, identify improvement opportunities, and align teams on service delivery',
  generic_how = 'Map customer journey, add employee actions, backstage processes, and support systems across swim lanes',
  generic_how_much = '1-3 days for initial blueprint, workshop facilitation costs, ongoing updates as needed',
  example_who = 'Restaurant chain optimizing dine-in experience, hospital improving patient admission process',
  example_what = 'Hotel chain creates service blueprint for guest check-in experience across all touchpoints',
  example_when = 'During service redesign projects, new location openings, or customer satisfaction improvement initiatives',
  example_where = 'In cross-functional workshops, customer experience labs, or service design studios',
  example_why = 'To ensure consistent high-quality check-in experience and identify efficiency improvements',
  example_how = 'Customer actions: Arrive, check-in, receive key; Frontstage: Greet, verify, process; Backstage: Room prep, system updates',
  example_how_much = '2-day workshop with 8 stakeholders, reduced check-in time by 40%, improved satisfaction scores by 25%',
  purpose = 'Visualize and optimize complete service delivery processes from customer and organizational perspectives',
  background = 'Developed by G. Lynn Shostack in 1984, evolved from service marketing and operations research',
  planning_considerations = 'Cross-functional team involvement, customer research integration, regular updates, technology considerations',
  industry_context = 'Hospitality, healthcare, retail, financial services, government services, digital platforms',
  success_criteria = ARRAY['Complete process visibility', 'Improved service quality', 'Enhanced team alignment', 'Identified optimization opportunities']
WHERE slug ILIKE '%service-blueprint%' OR name ILIKE '%Service Blueprint%';

-- Update Service Blueprinting (if different record)
UPDATE knowledge_items 
SET 
  generic_who = 'Service design teams, customer experience professionals, operations staff, and business process analysts',
  generic_what = 'The practice and methodology of creating detailed service delivery process maps and optimizations',
  generic_when = 'Throughout service design lifecycle, during process improvement phases, and operational reviews',
  generic_where = 'In collaborative design sessions, operational planning meetings, and customer experience workshops',
  generic_why = 'To systematically improve service delivery through comprehensive process understanding and optimization',
  generic_how = 'Conduct research, facilitate mapping workshops, create detailed blueprints, implement improvements iteratively',
  generic_how_much = 'Project timeline: 2-12 weeks, facilitation and analysis time, moderate investment for significant returns',
  example_who = 'Digital bank improving onboarding, airline enhancing passenger experience',
  example_what = 'Telecommunications company uses service blueprinting to redesign customer support experience',
  example_when = 'During digital transformation, customer satisfaction decline, or new service launches',
  example_where = 'In service design labs, customer research facilities, or virtual collaborative platforms',
  example_why = 'To reduce customer effort, improve first-call resolution, and increase support team efficiency',
  example_how = 'Research current state, map customer journey, identify pain points, design future state, pilot improvements',
  example_how_much = '6-week project, 12-person cross-functional team, improved resolution rates by 35%, reduced costs by 20%',
  purpose = 'Apply systematic service design methodology to create superior customer experiences and operational efficiency',
  background = 'Methodology built on service blueprint technique, incorporating design thinking and lean principles',
  planning_considerations = 'Stakeholder alignment, customer research, iterative approach, measurement framework, change management',
  industry_context = 'Service industries, digital services, healthcare delivery, government services, professional services',
  success_criteria = ARRAY['Enhanced customer satisfaction', 'Improved operational efficiency', 'Reduced service failures', 'Increased team alignment']
WHERE (slug ILIKE '%service-blueprint%' OR name ILIKE '%Service Blueprint%') AND name ILIKE '%Blueprinting%';

-- Update Spikes (Development Practice)
UPDATE knowledge_items 
SET 
  generic_who = 'Software developers, technical leads, product owners, and research teams investigating unknowns',
  generic_what = 'Time-boxed research activities to investigate technical unknowns, reduce risks, or explore solutions',
  generic_when = 'Before major development work, when facing technical uncertainty, or exploring new technologies',
  generic_where = 'In sprint planning, technical research phases, proof-of-concept development, and architecture discussions',
  generic_why = 'To reduce technical risk, inform decision-making, and provide accurate estimates for complex work',
  generic_how = 'Define research question, set time-box, conduct focused investigation, document findings and recommendations',
  generic_how_much = 'Typically 1-5 days, developer time investment, prevents much larger costs from wrong technical decisions',
  example_who = 'Development team evaluating new database technology, mobile team investigating performance optimization',
  example_what = 'Team conducts spike to evaluate microservices architecture for monolithic application migration',
  example_when = 'During architectural planning, before major refactoring, or when considering technology upgrades',
  example_where = 'In technical planning meetings, architecture review sessions, or dedicated research sprints',
  example_why = 'To understand migration complexity, identify risks, and create realistic implementation roadmap',
  example_how = 'Research microservices patterns, build proof-of-concept, test performance, document findings, present recommendations',
  example_how_much = '1-week spike by 2 developers, prevented 6-month project delay, saved estimated $200K in rework',
  purpose = 'Investigate technical unknowns to reduce risk and inform development decisions',
  background = 'Originated in Extreme Programming (XP), adopted across Agile methodologies for handling uncertainty',
  planning_considerations = 'Clear research objectives, appropriate time-boxing, stakeholder communication, documentation standards',
  industry_context = 'Software development, technology companies, digital product teams, research and development',
  success_criteria = ARRAY['Uncertainty reduced', 'Technical risk assessed', 'Informed decisions enabled', 'Implementation approach clarified']
WHERE slug ILIKE '%spike%' OR name ILIKE '%Spike%';

-- Update Task Boards (Planning Tool)
UPDATE knowledge_items 
SET 
  generic_who = 'Agile teams, project managers, scrum masters, team leads, and anyone managing work flow',
  generic_what = 'Visual workflow management tool showing tasks organized by status columns (To Do, In Progress, Done)',
  generic_when = 'Throughout project lifecycle, daily standups, sprint planning, and continuous work management',
  generic_where = 'In team spaces, digital platforms, collaborative tools, and project management systems',
  generic_why = 'To visualize work progress, identify bottlenecks, improve transparency, and enhance team coordination',
  generic_how = 'Create columns for workflow stages, add task cards, move cards through stages, update regularly',
  generic_how_much = 'Setup time: 30 minutes, daily updates: 5-10 minutes, digital tools free to moderate cost',
  example_who = 'Software development team tracking user stories, marketing team managing campaign tasks',
  example_what = 'Product development team uses Kanban board to manage feature development workflow',
  example_when = 'During daily standups, sprint reviews, and continuous work tracking throughout development cycles',
  example_where = 'In team rooms with physical boards, digital tools like Jira, Trello, or Azure DevOps',
  example_why = 'To maintain visibility of work progress, identify blockers quickly, and ensure timely delivery',
  example_how = 'Columns: Backlog, Analysis, Development, Testing, Review, Done; cards moved based on actual progress',
  example_how_much = '15 minutes daily team time, reduced delivery time by 20%, improved predictability significantly',
  purpose = 'Provide visual workflow management and enhance team coordination through transparent work tracking',
  background = 'Evolved from manufacturing Kanban systems, adapted for knowledge work and Agile methodologies',
  planning_considerations = 'Appropriate workflow stages, team agreements on card movement, regular review and improvement',
  industry_context = 'Software development, marketing campaigns, operations management, creative projects, service delivery',
  success_criteria = ARRAY['Improved work visibility', 'Faster issue identification', 'Enhanced team coordination', 'Better workflow optimization']
WHERE slug ILIKE '%task-board%' OR name ILIKE '%Task Board%';

-- Update Working Agreements (Team Process)
UPDATE knowledge_items 
SET 
  generic_who = 'Agile teams, project teams, cross-functional groups, team leads, and collaborative work groups',
  generic_what = 'Explicit agreements about how team members will work together, communicate, and handle various situations',
  generic_when = 'During team formation, at project start, when conflicts arise, and during regular retrospectives',
  generic_where = 'In team kickoff meetings, retrospectives, team spaces, and collaborative planning sessions',
  generic_why = 'To establish clear expectations, reduce conflicts, improve collaboration, and enhance team effectiveness',
  generic_how = 'Facilitate team discussion, identify key working practices, document agreements, review and update regularly',
  generic_how_much = 'Initial creation: 2-4 hours, regular reviews: 30 minutes monthly, minimal cost for significant team benefits',
  example_who = 'New Scrum team establishing norms, remote team defining communication protocols',
  example_what = 'Cross-functional product team creates working agreements for hybrid work environment',
  example_when = 'At team formation, when moving to hybrid work, or after team conflicts or communication issues',
  example_where = 'In team formation workshops, retrospectives, or dedicated team building sessions',
  example_why = 'To ensure effective collaboration between remote and office workers, clear communication expectations',
  example_how = 'Discuss: Meeting protocols, Communication channels, Decision-making process, Conflict resolution, Work hours overlap',
  example_how_much = '3-hour workshop facilitation, resulted in 50% reduction in communication issues, improved team satisfaction',
  purpose = 'Establish explicit team norms and agreements to enhance collaboration and prevent conflicts',
  background = 'Common practice in Agile methodologies, team development theory, and organizational behavior research',
  planning_considerations = 'Full team participation, regular review cycles, visible documentation, enforcement mechanisms',
  industry_context = 'Software development, consulting teams, project-based work, remote teams, creative agencies',
  success_criteria = ARRAY['Clear team expectations', 'Reduced conflicts', 'Improved collaboration', 'Enhanced team performance']
WHERE slug ILIKE '%working-agreement%' OR name ILIKE '%Working Agreement%';