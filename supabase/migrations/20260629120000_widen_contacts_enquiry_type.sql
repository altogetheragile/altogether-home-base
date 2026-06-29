-- Fix a constraint/UI mismatch: the contact form (src/schemas/contactForm.ts) lets
-- visitors choose enquiry types 'training' and 'coaching', but the contacts table's
-- CHECK constraint only allowed general/support/partnership/feedback/other. Those two
-- selections therefore failed on insert (23514), silently losing contact submissions.
--
-- Widen the constraint to include 'training' and 'coaching' (keeping the existing
-- values so nothing else breaks).

ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_enquiry_type_check;

ALTER TABLE public.contacts ADD CONSTRAINT contacts_enquiry_type_check
  CHECK (enquiry_type IN ('general', 'support', 'partnership', 'feedback', 'other', 'training', 'coaching'));
