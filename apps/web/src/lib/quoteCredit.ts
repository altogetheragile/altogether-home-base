// ============= Who said it =============
//
// Three switches on the Testimonials tab decide how a quote is credited: whether it names anybody,
// whether by first name alone, and whether it says where they work. Only the testimonials page
// read them. The strip on the home and coaching pages and the quotes on the about page named
// everybody in full whatever was set, so somebody who turned names off to keep quotes anonymous
// was still publishing them on three other pages.
//
// One reading of the switches, here, so a fourth place that quotes somebody has nothing to forget.

export type CreditRules = { showName: boolean; firstNameOnly: boolean; showCompany: boolean };

export function creditRules(settings: {
  show_testimonial_name?: boolean | null;
  show_testimonial_first_name_only?: boolean | null;
  show_testimonial_company?: boolean | null;
}): CreditRules {
  return {
    showName: settings.show_testimonial_name ?? true,
    firstNameOnly: settings.show_testimonial_first_name_only ?? false,
    showCompany: settings.show_testimonial_company ?? true,
  };
}

type Quoted = { first_name: string; last_name: string; job_title?: string | null; company?: string | null };

/** The name line and the line under it. Either may be empty, and then is not drawn. */
export function credit(q: Quoted, rules: CreditRules): { name: string; role: string } {
  const name = !rules.showName ? '' : rules.firstNameOnly ? q.first_name : `${q.first_name} ${q.last_name}`.trim();
  const company = rules.showCompany ? (q.company ?? '') : '';
  const role = [q.job_title ?? '', company].filter((s) => s.trim()).join(' · ');
  return { name, role };
}
