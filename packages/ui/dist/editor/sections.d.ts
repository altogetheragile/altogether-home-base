type SectionChoice = {
    key: string;
    label: string;
    hint?: string;
};
type SectionState = {
    section: string;
    visible: boolean;
};
/** What a page should render, given what was saved and what the code offers.
 *
 *  The merge is the point. A section added in code later has no entry saved against it, and must
 *  still appear rather than silently going missing; a section removed from the code must drop out
 *  rather than leaving a gap the editor offers to reorder. Saved order wins for anything the code
 *  still has, and anything new lands at the end where it is noticed. */
declare function orderedSections(stored: string | undefined, declared: SectionChoice[]): SectionState[];
/** The sections of the home page, top to bottom as the code has them. */
declare const HOME_SECTIONS: SectionChoice[];
/** The sections of the about page. */
declare const ABOUT_SECTIONS: SectionChoice[];
declare const SECTIONS_FOR_PAGE: Record<string, SectionChoice[]>;

export { ABOUT_SECTIONS, HOME_SECTIONS, SECTIONS_FOR_PAGE, type SectionChoice, type SectionState, orderedSections };
