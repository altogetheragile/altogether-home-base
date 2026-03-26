-- Fix AgilePM Foundation Paper 1 question typos and grammar
-- Based on reviewer feedback

-- Q2: Double question mark
UPDATE public.questions
SET question_text = 'What is the AgilePM framework based upon?',
    updated_at = now()
WHERE id = '9a1ce634-bbb8-4382-9ec4-7c613387796f';

-- Q24 Answer B: "To delivery" → "To deliver"
UPDATE public.questions
SET option_b = 'To deliver working software',
    updated_at = now()
WHERE id = 'ce369349-927a-4549-9cb2-5a856a6cff5b';

-- Q36: Reword question for clarity
UPDATE public.questions
SET question_text = 'What helps to protect quality in an AgilePM project?',
    updated_at = now()
WHERE id = '2f52909c-6ab5-4c65-aa51-aa9113b1bca2';

-- Q37: Reword question + fix answer C to "Won't Have this time"
UPDATE public.questions
SET question_text = 'What is the priority of the requirements that the project team has agreed will not be delivered in the specified timeframe?',
    option_c = 'Won''t Have this time',
    updated_at = now()
WHERE id = '246c99fe-527d-485c-b369-47e563eba746';

-- Q40 (3ce61eaf): "What best help identify" → "What helps to identify"
UPDATE public.questions
SET question_text = 'What helps to identify and describe the competencies, capabilities, and capacities of an agile leader?',
    updated_at = now()
WHERE id = '3ce61eaf-e93e-40d1-b7d8-4de09348b9da';

-- Q40 alt (ea008fd5): "What helps identify" → "What helps to identify"
UPDATE public.questions
SET question_text = 'What helps to identify possible risks of using the AgilePM approach?',
    updated_at = now()
WHERE id = 'ea008fd5-62ff-456c-bacf-6e98475797d7';

-- Q49: "missing word" → "missing words"
UPDATE public.questions
SET question_text = 'Identify the missing words "best value emerges when projects are aligned to clear goals, deliver frequently and involve the collaboration of [?]".',
    updated_at = now()
WHERE id = '2ae3fff5-c041-4339-a90f-f246d976a59d';

-- Additional typos found during review:

-- "Comlexity" → "Complexity"
UPDATE public.questions
SET option_c = 'Complexity',
    updated_at = now()
WHERE id = '2b2b4069-be27-4888-9de3-7ad78aa63c31';

-- Missing question mark + "Variabilty" → "Variability"
UPDATE public.questions
SET question_text = 'What tool from Barry Boehm does AgilePM use when considering estimates?',
    option_b = 'The Cone of Variability',
    updated_at = now()
WHERE id = '7c46d8ef-9c40-42f2-9463-456607522fd4';

-- "unneccesary" → "unnecessary"
UPDATE public.questions
SET option_a = 'Solutions are specified in detail upfront to avoid unnecessary changes',
    updated_at = now()
WHERE id = '49d388d6-8e73-4677-b88c-3de9d1ba7d30';
