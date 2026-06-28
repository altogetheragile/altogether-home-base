// Single source of truth for the exams-page FAQ. In the Vite app this had to be
// mirrored between Exams.tsx and prerender.mjs; here the visible FAQ and the
// FAQPage JSON-LD both read from this one list.
export const EXAM_FAQS = [
  {
    q: 'What is the AgilePM Foundation exam?',
    a: 'The AgilePM Foundation exam is a closed-book, multiple-choice paper that tests your knowledge of the AgilePM framework, including its principles, roles, products, and the agile project lifecycle. It is the entry-level AgilePM qualification and the prerequisite for the AgilePM Practitioner exam.',
  },
  {
    q: 'How many questions are in the AgilePM Foundation exam?',
    a: 'Our AgilePM3 Foundation practice papers contain 50 questions to answer in 40 minutes, with a pass mark of 25 out of 50 (50%). They follow the multiple-choice format of the Foundation paper and are based on the latest version of the AgilePM Handbook.',
  },
  {
    q: 'Are these AgilePM practice exams free?',
    a: 'Yes. Every practice paper on this page is free. You can sit a timed mock exam or switch to revision mode and work through the questions at your own pace, with answers and explanations.',
  },
  {
    q: 'What is the difference between AgilePM Foundation and Practitioner?',
    a: 'Foundation tests whether you understand the AgilePM framework and terminology. Practitioner goes further and tests whether you can apply the framework to a realistic project scenario. You need to pass Foundation before taking Practitioner.',
  },
  {
    q: 'How should I prepare for the AgilePM Foundation exam?',
    a: 'Read the AgilePM Handbook, learn the roles, products, and the eight principles, then practise under timed conditions. Sitting full practice papers helps you manage the time limit and spot the topics you still need to revise.',
  },
  {
    q: 'Do you offer Scrum Master practice questions?',
    a: 'Yes. Our Professional Scrum Master practice exam has 40 questions to answer in 30 minutes, with a pass mark of 34 out of 40, so you can prepare for the Scrum Master assessment alongside AgilePM.',
  },
] as const;
