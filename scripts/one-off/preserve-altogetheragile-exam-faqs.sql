-- Keeps altogetheragile.com's exam questions and answers, after the change that moves them off
-- the code and onto the curtain as exams.faq.items, which ships empty.
--
-- Run this ONCE against altogetheragile.com's production database BEFORE deploying that change,
-- and NOT against any other site's: these answers describe this site's own practice papers in the
-- first person, which is exactly why they no longer ship to everybody. Safe to run twice: it does
-- nothing if the row is already there.
--
-- Nothing here is new content. It is the list the exams page rendered from lib/exam-faqs.ts, and
-- gave to search engines as the page's FAQ.

insert into public.site_copy (key, page, value, label, hint)
values ('exams.faq.items', 'exams',
'[
  {
    "question": "What is the AgilePM Foundation exam?",
    "answer": "The AgilePM Foundation exam is a closed-book, multiple-choice paper that tests your knowledge of the AgilePM framework, including its principles, roles, products, and the agile project lifecycle. It is the entry-level AgilePM qualification and the prerequisite for the AgilePM Practitioner exam."
  },
  {
    "question": "How many questions are in the AgilePM Foundation exam?",
    "answer": "Our AgilePM3 Foundation practice papers contain 50 questions to answer in 40 minutes, with a pass mark of 25 out of 50 (50%). They follow the multiple-choice format of the Foundation paper and are based on the latest version of the AgilePM Handbook."
  },
  {
    "question": "Are these AgilePM practice exams free?",
    "answer": "Yes. Every practice paper on this page is free. You can sit a timed mock exam or switch to revision mode and work through the questions at your own pace, with answers and explanations."
  },
  {
    "question": "What is the difference between AgilePM Foundation and Practitioner?",
    "answer": "Foundation tests whether you understand the AgilePM framework and terminology. Practitioner goes further and tests whether you can apply the framework to a realistic project scenario. You need to pass Foundation before taking Practitioner."
  },
  {
    "question": "How should I prepare for the AgilePM Foundation exam?",
    "answer": "Read the AgilePM Handbook, learn the roles, products, and the eight principles, then practise under timed conditions. Sitting full practice papers helps you manage the time limit and spot the topics you still need to revise."
  },
  {
    "question": "Do you offer Scrum Master practice questions?",
    "answer": "Yes. Our Professional Scrum Master practice exam has 40 questions to answer in 30 minutes, with a pass mark of 34 out of 40, so you can prepare for the Scrum Master assessment alongside AgilePM."
  }
]',
        'Questions and answers',
        'One per question people ask. They appear below the exam cards and are also given to search engines as the page''s questions and answers, so write what is true of your own papers. Leave it empty and the section disappears, heading and all.')
on conflict (key) do nothing;

-- Check. Expect one row holding six questions.
select key, jsonb_array_length(value::jsonb) as questions from public.site_copy where key = 'exams.faq.items';
