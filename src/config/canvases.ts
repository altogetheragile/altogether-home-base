// Coached canvas definitions for the Canvas catalogue (see VISION_TO_VALUE.md 6.2).
// A coached canvas is a data-driven list of cells, each with CellCoach metadata.
// The generic CoachedCanvasEditor renders any of these; data is a
// Record<cellKey, string> stored in the artifact.

import type { CellCoach } from '@/types/coaching';

export interface CanvasCellDef {
  key: string;
  label: string;
  coach: CellCoach;
  /** Render across the full width rather than in the two-column grid. */
  wide?: boolean;
}

export interface CanvasDef {
  /** artifact_type and route key, e.g. 'business-case'. */
  key: string;
  name: string;
  blurb: string;
  cells: CanvasCellDef[];
}

const TEAL = '#004D4D';
const MIDTEAL = '#1A9090';
const ORANGE = '#E08A4E';
const TAN = '#9C8A6A';
const PURPLE = '#6B5FCC';

const businessCase: CanvasDef = {
  key: 'business-case',
  name: 'Business Case Canvas',
  blurb: 'Make the case for a funded change: vision, options, costs and benefits, and the risks you would rather not name.',
  cells: [
    { key: 'vision', label: 'Business Vision', wide: true, coach: { tag: 'VISION', question: 'What is the business vision this case serves?', help: 'The future state this investment moves you towards.', stretch: 'What in today’s way of working actually works, and might this break it?', color: TEAL } },
    { key: 'options', label: 'Options', coach: { tag: 'OPTIONS', question: 'What options did you consider, including doing nothing?', help: 'The realistic alternatives, not just the preferred one.', stretch: 'Which option had you already chosen before the others were written down?', color: MIDTEAL } },
    { key: 'solution', label: 'Solution Overview', coach: { tag: 'SOLUTION', question: 'What is the solution, in brief?', help: 'A short description of the recommended option.', stretch: 'Which optional part is actually load-bearing?', color: MIDTEAL } },
    { key: 'alignment', label: 'Strategic Alignment', coach: { tag: 'ALIGNMENT', question: 'How does this align to the strategy?', help: 'The strategic goals or objectives this supports.', stretch: 'If the strategy shifted next quarter, which part of this case would fall?', color: ORANGE } },
    { key: 'costsBenefits', label: 'Costs and Benefits', wide: true, coach: { tag: 'COSTS/BENEFITS', question: 'What are the costs and benefits, as best, expected and worst ranges?', help: 'Quantify where you can; show the range, not a single number.', stretch: 'What does your worst case still quietly assume will go right?', color: ORANGE } },
    { key: 'appraisal', label: 'Investment Appraisal', coach: { tag: 'APPRAISAL', question: 'What is the investment appraisal?', help: 'Payback, NPV, or however you judge the return.', stretch: 'When do the costs land against the benefits, and can you survive the gap?', color: TAN } },
    { key: 'risk', label: 'Investment Risk', coach: { tag: 'RISK', question: 'What is the investment risk?', help: 'What could undermine the return.', stretch: 'Which risk are you leaving out because naming it would weaken the case?', color: TAN } },
    { key: 'assumptions', label: 'Assumptions, Risks and Dependencies', wide: true, coach: { tag: 'ASSUMPTIONS', question: 'What are the key assumptions, risks and dependencies?', help: 'What must be true, what might go wrong, and what you depend on.', stretch: 'Which assumption are you relying on most and testing least?', color: PURPLE } },
  ],
};

const productVision: CanvasDef = {
  key: 'product-vision',
  name: 'Product Vision Canvas',
  blurb: 'Shape product direction (after Roman Pichler): the vision, who it is for, their needs, the product, and the business goals.',
  cells: [
    { key: 'vision', label: 'Vision', wide: true, coach: { tag: 'VISION', question: 'What is the overarching vision?', help: 'The positive change the product should bring about.', stretch: 'If this vision came true, what would you have to stop doing?', color: TEAL } },
    { key: 'targetGroup', label: 'Target Group', coach: { tag: 'WHO', question: 'Who is the product for?', help: 'The market or specific customers and users.', stretch: 'Who are you quietly hoping will not use this?', color: MIDTEAL } },
    { key: 'needs', label: 'Needs', coach: { tag: 'NEEDS', question: 'What problem does it solve, or benefit does it offer?', help: 'The need that makes the product worth having.', stretch: 'Which need do they say they have but do not act on?', color: ORANGE } },
    { key: 'product', label: 'Product', coach: { tag: 'PRODUCT', question: 'What is the product, in brief?', help: 'What makes it special and feasible to build.', stretch: 'What is the smallest version that would still matter?', color: TAN } },
    { key: 'businessGoals', label: 'Business Goals', coach: { tag: 'GOALS', question: 'What are the business goals?', help: 'How the product benefits the organisation that builds it.', stretch: 'How would you know this product earned its place, not just shipped?', color: PURPLE } },
  ],
};

export const CANVASES: CanvasDef[] = [businessCase, productVision];

export const canvasByKey = (key: string): CanvasDef | undefined => CANVASES.find((c) => c.key === key);
