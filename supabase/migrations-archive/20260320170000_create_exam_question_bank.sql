-- Exam question bank: exams, questions, and attempt tracking
-- ============================================================

-- 1) exams
CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 40,
  pass_mark integer NOT NULL DEFAULT 30,
  total_questions integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) questions
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  area text NOT NULL,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer char(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  reference text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  sort_order integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3) exam_attempts (learner tracking)
CREATE TABLE public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  answers jsonb,
  score integer,
  passed boolean,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_questions_exam_id ON public.questions(exam_id);
CREATE INDEX idx_questions_area ON public.questions(area);
CREATE INDEX idx_exam_attempts_exam_id ON public.exam_attempts(exam_id);
CREATE INDEX idx_exam_attempts_user_id ON public.exam_attempts(user_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

-- exams: public read for published, admin write
CREATE POLICY "Published exams are publicly readable"
  ON public.exams FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can read all exams"
  ON public.exams FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert exams"
  ON public.exams FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update exams"
  ON public.exams FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete exams"
  ON public.exams FOR DELETE
  USING (public.is_admin());

-- questions: public read for published (under published exam), admin write
CREATE POLICY "Published questions are publicly readable"
  ON public.questions FOR SELECT
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.exams WHERE id = exam_id AND status = 'published'
    )
  );

CREATE POLICY "Admins can read all questions"
  ON public.questions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert questions"
  ON public.questions FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update questions"
  ON public.questions FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete questions"
  ON public.questions FOR DELETE
  USING (public.is_admin());

-- exam_attempts: users can read/insert own, admins can read all
CREATE POLICY "Users can read own attempts"
  ON public.exam_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON public.exam_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts"
  ON public.exam_attempts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all attempts"
  ON public.exam_attempts FOR SELECT
  USING (public.is_admin());
