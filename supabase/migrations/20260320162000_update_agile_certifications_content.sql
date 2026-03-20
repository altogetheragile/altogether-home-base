-- Update the agile certifications post with revised content (v2)
ALTER TABLE public.blog_posts DISABLE ROW LEVEL SECURITY;

UPDATE public.blog_posts
SET content = $CONTENT$<style>
.post-body { max-width: 680px; font-size: 18px; line-height: 1.7; }
.post-body p { margin: 0 0 1.4rem; }
.post-body h2 { font-size: 24px; font-weight: 600; margin: 2.5rem 0 1rem; line-height: 1.3; }
.post-body h3 { font-size: 19px; font-weight: 600; margin: 2rem 0 .75rem; line-height: 1.35; }
.post-body a { color: inherit; text-decoration: underline; text-decoration-color: rgba(0,0,0,0.3); }
.post-body a:hover { text-decoration-color: inherit; }
.post-body em { font-style: italic; }
.post-body strong { font-weight: 600; }
.post-body hr { border: none; border-top: 1px solid rgba(0,0,0,0.12); margin: 2.5rem 0; }
.post-body .byline { font-size: 15px; opacity: 0.6; margin-bottom: 2rem; }
.post-body .bio { font-size: 15px; opacity: 0.65; margin-top: 2.5rem; }
.callout {
  background: #f5fdf9;
  border-left: 3px solid #1D9E75;
  border-radius: 0 8px 8px 0;
  padding: 1rem 1.25rem;
  margin: 1.75rem 0;
  font-size: 17px;
  line-height: 1.65;
}
.decision-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.25rem 0 1.75rem;
  font-size: 16px;
}
.decision-table th {
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: 0 12px 10px 0;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}
.decision-table td {
  padding: 10px 12px 10px 0;
  border-bottom: 1px solid rgba(0,0,0,0.07);
  vertical-align: top;
  line-height: 1.5;
}
.decision-table td:first-child { font-weight: 600; color: #1a1a1a; width: 28%; }
.decision-table td:nth-child(2) { width: 18%; }
.decision-table td:nth-child(3) { width: 30%; }
.decision-table td:nth-child(4) { width: 24%; }
.decision-table tr:last-child td { border-bottom: none; }
</style>

<div class="post-body">

<p class="byline">By Alun Davies-Baker, AltogetherAgile</p>

<p>Most agile certifications will not make you better at agile. But they might still be worth doing.</p>

<p>The reason for that distinction matters. A certification tests whether you can recall a framework. It does not test whether you can read a room, rebuild trust in a dysfunctional team, or make a good call under pressure. Those are the skills that define a capable agile practitioner. No exam assesses them. You build them through practice, feedback, and experience, not through passing a multiple-choice assessment.</p>

<p>And yet. A quick search returns Scrum Alliance, Scrum.org, PMI, ICAgile, APMG, the Agile Business Consortium, and half a dozen others, each with their own badges, acronyms, and exam fees. Some of them genuinely open doors. Some are costly box-ticking. And a few have become so commoditised that hiring managers barely glance at them any more.</p>

<p>This is an honest guide to which agile certifications are actually worth your time and money, depending on where you are in your career right now.</p>

<h2>Before choosing an agile certification, answer this question first</h2>

<p>Before looking at any specific credential, it is worth asking what you actually want the certification to do for you. The answer changes everything about which route makes sense.</p>

<p>There are broadly three reasons people pursue agile certifications. The first is career entry: you want to demonstrate credibility in a field you are moving into, and a certification signals intent and baseline knowledge to a hiring manager who does not know you yet. The second is career progression: you are already working in agile roles and want formal recognition of your experience and expertise. The third is organisational requirement: your employer, client, or procurement framework specifies a particular credential.</p>

<p>Each of these leads to different choices. A two-day CSM course makes sense for career entry. It makes very little sense for someone with eight years of delivery experience who wants to grow into coaching.</p>

<h2>The main agile certifications compared: what each one actually covers</h2>

<h3>Scrum Alliance and Scrum.org</h3>

<p>The two main Scrum bodies offer the most widely recognised entry-level credentials in the market. The Certified ScrumMaster (CSM) from the Scrum Alliance and the Professional Scrum Master (PSM) from Scrum.org both cover the same territory: Scrum theory, events, roles, and artifacts.</p>

<p>The practical difference is that the Scrum Alliance route requires attending a certified course, while Scrum.org is assessment-only. PSM I has an 85% pass threshold and is genuinely harder to pass without preparation. Both are worth having at the start of a Scrum-focused career. Neither is particularly distinguished at senior level, because the market is saturated with them.</p>

<p>Both bodies offer advanced credentials (CSP, PSM II and III) that carry more weight, but require substantial demonstrated experience alongside the exam.</p>

<h3>PMI Agile Certified Practitioner (PMI-ACP)</h3>

<p>The PMI-ACP sits in a different category. It covers a broader range of agile approaches (Scrum, Kanban, Lean, XP, test-driven development) and requires meaningful prerequisites: 2,000 hours of general project experience and 1,500 hours of agile-specific experience within the last three years, plus 21 contact hours of agile training.</p>

<p>It is more rigorous than the entry-level Scrum credentials and carries weight in organisations that already recognise PMI's PMP certification. If you work in a PMI-fluent environment, it is a logical complement to the PMP. If you do not, there are probably more targeted routes.</p>

<h3>ICAgile</h3>

<p>ICAgile takes a different approach. Rather than a single certification, it offers a structured pathway from foundational to expert level across multiple specialisms: coaching, engineering, DevOps, Business Agility, and others. The expert-level credentials require demonstrated practice, peer review, and a panel assessment rather than just an exam.</p>

<p>The ICP-ACC (Agile Coaching) and ICP-ENT (Enterprise Coaching) are well regarded in the coaching community. If coaching is your direction, ICAgile's pathway is one of the more credible routes to professional recognition.</p>

<h3>Kanban certifications (Kanban University and Kanban Institute)</h3>

<p>Kanban has its own certification landscape, which is often overlooked in comparison posts that default to Scrum-centric framing. Kanban University offers a pathway from Team Kanban Practitioner through to Accredited Kanban Trainer, with intermediate credentials in systems thinking and coaching. The Kanban Institute runs parallel programmes with a similarly progressive structure.</p>

<p>These credentials are genuinely useful for practitioners working in flow-based delivery environments, service organisations, or teams that have moved beyond Scrum. They require more than exam knowledge: the practitioner-level assessments involve real board design and system analysis. If your work involves optimising flow, reducing lead time, or managing service delivery, Kanban certifications are more directly applicable than Scrum credentials and considerably less saturated in the market.</p>

<h3>AgilePM and AgileBA (APMG / Agile Business Consortium)</h3>

<p>These certifications are grounded in the DSDM framework and are particularly common in UK public sector and enterprise environments where formal project governance matters. AgilePM Foundation and Practitioner provide a structured approach to agile project management that integrates well with PRINCE2 and other governance-heavy environments. AgileBA covers business analysis within agile delivery, addressing a gap that Scrum-centric frameworks largely ignore.</p>

<p>Both are rigorous. Foundation level tests conceptual understanding. Practitioner level requires scenario-based application and genuine framework knowledge. You cannot pass Practitioner by memorising definitions. In regulated industries, central government, and large enterprise delivery programmes, these credentials are often specified in procurement frameworks and taken seriously by hiring managers who understand the context.</p>

<p>They are less relevant in product-led or startup environments where lightweight delivery matters more than governance alignment. But that is a context question, not a quality question. The frameworks themselves are substantive.</p>

<p>I am an assessor for the Agile Business Consortium and co-author of course materials for both AgilePM and AgileBA, including contributing to the AgilePM v3 handbook. That gives me a clearer picture of both the depth of these credentials and the environments where they carry genuine weight. If you are considering either and want a candid view of whether they fit your situation, I am happy to give you one.</p>

<h2>The honest truth about agile certifications and salary</h2>

<p>Certification bodies regularly cite salary data to justify their programmes. The figures vary by survey and should be treated with caution. What the data broadly shows is that certified professionals tend to earn more than non-certified peers in the same roles. What it cannot tell you is the direction of causality. People who invest in professional development tend to be the same people who progress faster. The certification may be a signal of that intent rather than the cause of the outcome.</p>

<p>The more reliable indicator is simpler: in a competitive job market, a recognised certification gets you past the first filter. Once you are in the room, it is your experience and judgment that close the deal.</p>

<div class="callout">
  The most common mistake I see is treating a certification as a substitute for experience rather than a complement to it. A two-day course tells an employer you understand the vocabulary. It says nothing yet about whether you can actually lead a team through complexity.
</div>

<h2>Which agile certification is right for you: a decision framework</h2>

<table class="decision-table">
  <thead>
    <tr>
      <th>Where you are</th>
      <th>Worth considering</th>
      <th>Why</th>
      <th>Avoid if</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Moving into agile from another field</td>
      <td>CSM or PSM I</td>
      <td>Recognised entry signal. Low cost of entry. Gets you the vocabulary fast.</td>
      <td>You expect it to get you a job on its own.</td>
    </tr>
    <tr>
      <td>Experienced practitioner in flow-based or service delivery</td>
      <td>Kanban University KMP</td>
      <td>More directly applicable than Scrum. Less saturated. Requires real system knowledge.</td>
      <td>You work in a Scrum-only team environment.</td>
    </tr>
    <tr>
      <td>Experienced practitioner moving into coaching</td>
      <td>ICAgile ICP-ACC</td>
      <td>Structured pathway. Peer-reviewed at expert level. Credible in coaching circles.</td>
      <td>You only want a quick CV keyword.</td>
    </tr>
    <tr>
      <td>UK public sector or enterprise delivery</td>
      <td>AgilePM Foundation or Practitioner</td>
      <td>Often specified in procurement. Rigorous framework knowledge. Recognised by employers in this context.</td>
      <td>You work in lightweight product environments.</td>
    </tr>
    <tr>
      <td>PMI environment, project management background</td>
      <td>PMI-ACP</td>
      <td>Complements the PMP. Broader agile coverage than Scrum-only routes.</td>
      <td>You work in product-led or startup teams.</td>
    </tr>
    <tr>
      <td>Already certified, want to go deeper</td>
      <td>Advanced credentials in your chosen body</td>
      <td>Entry-level certs age quickly. Advanced credentials with demonstrated experience carry more weight at senior level.</td>
      <td>You are stacking entry-level badges.</td>
    </tr>
  </tbody>
</table>

<h2>The most important factor in agile training: quality of learning, not the badge</h2>

<p>The quality of the learning experience matters more than the badge. A well-facilitated course on a framework you then apply in practice will do more for your career than a self-study exam pass you file and forget.</p>

<p>Look for providers who bring their own experience into the room, not just the syllabus. Ask whether the course covers real scenarios and messy situations, not just the textbook version of how things should work. The best agile training makes you better at navigating complexity. The worst just prepares you for a multiple-choice test.</p>

<p>If you are working at team or programme level and want to understand how certified frameworks like AgilePM connect to day-to-day delivery practice, our post on <a href="/blog/isa-framework-planning-horizons">planning horizons and structured agile delivery</a> is a useful next step.</p>

<p>If you are weighing up your options and want a candid conversation about which direction makes sense for your specific situation, <a href="/contact">get in touch</a>. I help people map their background to the certifications that will actually move them forward, not just add another line to their CV.</p>

<hr>

<p class="bio"><em>Alun Davies-Baker is the founder of AltogetherAgile, a London-based agile training and consultancy practice. He is an assessor for the Agile Business Consortium, holds ICF Associate Certified Coach accreditation, and is a co-author of the AgilePM v3 handbook and AgileBA course modules. He works with teams across pharmaceuticals, finance, education, and the public sector.</em></p>

</div>$CONTENT$,
updated_at = now()
WHERE slug = 'agile-certifications-do-they-matter';

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
