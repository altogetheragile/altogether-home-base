-- Temporarily disable RLS to allow data migration insert
ALTER TABLE public.blog_posts DISABLE ROW LEVEL SECURITY;

-- Clean up any partial rows from earlier attempts
DELETE FROM public.blog_posts WHERE slug = 'how-ai-is-changing-software-development';

-- Insert the blog post using dollar-quoting to avoid escaping issues
INSERT INTO public.blog_posts (
  title,
  slug,
  excerpt,
  content,
  category_id,
  is_published,
  is_featured,
  estimated_reading_time,
  seo_title,
  seo_description,
  seo_keywords,
  created_at,
  updated_at
) VALUES (
  'How AI Is Changing Software Development: We Have Moved Up a Level of Abstraction',
  'how-ai-is-changing-software-development',
  'We have moved up a level of abstraction. It is not the first time this has happened in software development - but it is moving faster than any previous shift. Here is what engineering leaders need to understand.',
  $CONTENT$<style>
.post-body { max-width: 680px; font-size: 18px; line-height: 1.7; }
.post-body p { margin: 0 0 1.4rem; }
.post-body h2 { font-size: 24px; font-weight: 600; margin: 2.5rem 0 1rem; line-height: 1.3; }
.post-body a { color: inherit; text-decoration: underline; text-decoration-color: rgba(0,0,0,0.3); }
.post-body a:hover { text-decoration-color: inherit; }
.post-body em { font-style: italic; }
.post-body hr { border: none; border-top: 1px solid rgba(0,0,0,0.12); margin: 2.5rem 0; }
.post-body .byline { font-size: 15px; opacity: 0.6; margin-bottom: 2rem; }
.post-body .bio { font-size: 15px; opacity: 0.65; margin-top: 2.5rem; }

/* Diagram */
.diagram-wrap { margin: 2.5rem 0; font-size: 16px; }
.diagram-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .12em;
  text-transform: uppercase;
  opacity: .45;
  margin-bottom: .5rem;
  display: flex;
  align-items: center;
  gap: 10px;
}
.diagram-label::before, .diagram-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: currentColor;
  opacity: .3;
}
.stack { display: flex; flex-direction: column; gap: 3px; }
.layer {
  display: flex;
  align-items: stretch;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.08);
  transition: border-color .2s, box-shadow .2s;
  background: #fff;
  cursor: default;
}
.layer:hover {
  border-color: rgba(0,0,0,0.2);
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
}
.layer-era {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  padding: 10px 9px;
  min-width: 38px;
  text-align: center;
  flex-shrink: 0;
  transition: opacity .2s;
}
.layer-body { flex: 1; padding: 13px 18px; }
.layer-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 3px;
  color: #1a1a1a;
}
.layer-desc {
  font-size: 14px;
  color: #555;
  line-height: 1.5;
}
.layer-unit {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .05em;
  padding: 2px 9px;
  border-radius: 20px;
  display: inline-block;
  margin-top: 7px;
}

/* Layer colour themes */
.l1 .layer-era { background: #e8e6df; color: #555; }
.l1 .layer-unit { background: #e8e6df; color: #555; }

.l2 .layer-era { background: #d3d1c7; color: #333; }
.l2 .layer-unit { background: #d3d1c7; color: #333; }

.l3 .layer-era { background: #b5e8d8; color: #085041; }
.l3 .layer-unit { background: #b5e8d8; color: #085041; }

.l4 .layer-era { background: #5DCAA5; color: #04342C; }
.l4 .layer-unit { background: #5DCAA5; color: #04342C; }

.l5 {
  background: #f5fdf9;
  border: 1px solid rgba(15,110,86,0.25) !important;
}
.l5:hover {
  border-color: rgba(15,110,86,0.5) !important;
  box-shadow: 0 2px 16px rgba(15,110,86,0.1) !important;
}
.l5 .layer-era { background: #1D9E75; color: #fff; }
.l5 .layer-unit { background: #1D9E75; color: #fff; }
.l5 .layer-title { font-size: 17px; }

/* Hover reveal on all layers - subtle lift */
.layer:hover .layer-title { color: #000; }
.layer:hover .layer-desc  { color: #333; }

/* Skills shift table */
.skills-table { width: 100%; border-collapse: collapse; margin: 1.25rem 0 1.5rem; font-size: 16px; }
.skills-table td { padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.07); vertical-align: top; }
.skills-table td:first-child { color: #888; text-decoration: line-through; text-decoration-color: rgba(0,0,0,0.25); width: 45%; padding-right: 12px; }
.skills-table td:nth-child(2) { color: #aaa; width: 10%; text-align: center; }
.skills-table td:last-child { font-weight: 600; color: #1a1a1a; }
.skills-table tr:last-child td { border-bottom: none; }

@media (prefers-color-scheme: dark) {
  .layer { background: #1e1e1e; border-color: rgba(255,255,255,0.08); }
  .layer:hover { border-color: rgba(255,255,255,0.2); box-shadow: 0 2px 12px rgba(0,0,0,0.3); }
  .layer-title { color: #f0f0f0; }
  .layer-desc  { color: #aaa; }
  .layer:hover .layer-title { color: #fff; }
  .layer:hover .layer-desc  { color: #ccc; }
  .l1 .layer-era { background: #3a3930; color: #aaa; }
  .l1 .layer-unit { background: #3a3930; color: #aaa; }
  .l2 .layer-era { background: #4a4840; color: #ccc; }
  .l2 .layer-unit { background: #4a4840; color: #ccc; }
  .l3 .layer-era { background: #0d4a38; color: #9FE1CB; }
  .l3 .layer-unit { background: #0d4a38; color: #9FE1CB; }
  .l4 .layer-era { background: #0F6E56; color: #E1F5EE; }
  .l4 .layer-unit { background: #0F6E56; color: #E1F5EE; }
  .l5 { background: #0d2e24; border-color: rgba(29,158,117,0.35) !important; }
  .l5:hover { border-color: rgba(29,158,117,0.6) !important; }
  .l5 .layer-title { color: #e0f7f0; }
  .l5 .layer-desc  { color: #8ecfba; }
  .skills-table td:first-child { color: #666; }
  .skills-table td:nth-child(2) { color: #555; }
  .skills-table td:last-child { color: #f0f0f0; }
  .skills-table td { border-bottom-color: rgba(255,255,255,0.07); }
  .post-body a { text-decoration-color: rgba(255,255,255,0.3); }
}
</style>

<div class="post-body">

<p class="byline">By Alun Davies-Baker, AltogetherAgile</p>

<p>Something significant has happened in software development. Not overnight, and not for the first time. But this one is moving faster than any previous shift in the industry.</p>

<p>We have moved up a level of abstraction. And if you lead software teams, you need to understand what that means - both the opportunities and the failure modes it creates.</p>

<h2>Every generation of developers inherits a higher floor</h2>

<p>The history of software development is a history of rising abstraction. Each generation builds on a platform the previous one created, and the unit of work gets bigger each time.</p>

<div class="diagram-wrap">
  <div class="diagram-label">increasing abstraction</div>
  <div class="stack">
    <div class="layer l1">
      <div class="layer-era">50s</div>
      <div class="layer-body">
        <div class="layer-title">Machine code and assembly</div>
        <div class="layer-desc">Every instruction written by hand. Memory addresses managed manually. You thought in bits and registers.</div>
        <span class="layer-unit">Unit of work: instruction</span>
      </div>
    </div>
    <div class="layer l2">
      <div class="layer-era">70s</div>
      <div class="layer-body">
        <div class="layer-title">High-level languages</div>
        <div class="layer-desc">C, Fortran, Cobol. You described logic, not hardware. The compiler handled the translation. Enormous productivity leap.</div>
        <span class="layer-unit">Unit of work: function</span>
      </div>
    </div>
    <div class="layer l3">
      <div class="layer-era">90s</div>
      <div class="layer-body">
        <div class="layer-title">Object-oriented languages and frameworks</div>
        <div class="layer-desc">Reusable components, design patterns, libraries. You stopped writing everything from scratch. You assembled systems.</div>
        <span class="layer-unit">Unit of work: component</span>
      </div>
    </div>
    <div class="layer l4">
      <div class="layer-era">10s</div>
      <div class="layer-body">
        <div class="layer-title">Cloud, APIs, and platform services</div>
        <div class="layer-desc">Entire capabilities became API calls. Auth, payments, storage, messaging. You integrated, not built.</div>
        <span class="layer-unit">Unit of work: service</span>
      </div>
    </div>
    <div class="layer l5">
      <div class="layer-era">Now</div>
      <div class="layer-body">
        <div class="layer-title">AI-assisted development</div>
        <div class="layer-desc">You describe the outcome. The AI writes the code. The unit of thought is shifting from implementation to intent.</div>
        <span class="layer-unit">Unit of work: intent</span>
      </div>
    </div>
  </div>
</div>

<p>Each shift followed the same pattern. More people could participate. Experienced developers got dramatically more productive. And something got hidden underneath your feet that you used to have to understand yourself.</p>

<h2>How AI is changing software development right now</h2>

<p>Now we have AI-assisted development, and it is the same pattern again - only faster.</p>

<p>Tools like GitHub Copilot, Claude Code, and Cursor are not sophisticated autocomplete. They write whole functions, refactor existing code, explain unfamiliar codebases, and catch obvious bugs before the developer notices them. The unit of work is shifting from implementation to intent. You describe the outcome. The AI writes the code.</p>

<p>The productivity gains are real. I see them every week across the teams I work with. Prototypes that took weeks now take hours. Junior developers are producing at something close to senior speed. Seniors are producing more than they ever did.</p>

<p>Speed of exploration is the biggest change. Teams can test ten directions before committing to one. That used to be expensive. Now it is not. The constraint has shifted from &ldquo;can we build it&rdquo; to &ldquo;should we build it&rdquo; - which is a much more interesting question to be spending your time on.</p>

<h2>What the AI productivity gains are hiding</h2>

<p>Here is what I also see. Engineers are merging code they do not fully understand. The code looks right, it compiles, the tests pass. But nobody has really read it.</p>

<p>Code review culture is quietly weakening at exactly the moment it should be getting stronger. When generation becomes easy, review becomes the critical skill. Most teams have not made that adjustment yet.</p>

<p>There is also a more subtle risk in the analysis and requirements phase. AI turns vague briefs into structured user stories fast. The output looks complete. It is not always correct. It does not know your business. It does not know what your stakeholders actually mean when they say &ldquo;flexible reporting.&rdquo; Teams are shipping AI-generated requirements nobody has truly interrogated. Arvind Narayanan and Sayash Kapoor make this point forcefully in <a href="https://www.aisnakeoil.com/">AI Snake Oil</a> - that AI systems are routinely deployed with misplaced confidence, in contexts where they lack the situational understanding to perform reliably. Requirements generation is exactly that kind of context.</p>

<h2>Complexity does not disappear. It moves.</h2>

<p>Every abstraction layer hides complexity. That is the point. But hidden complexity does not disappear. It shifts somewhere you are less likely to look, until something goes wrong and you need to look there urgently. Fred Brooks made this argument in his 1986 essay <a href="http://www.cs.unc.edu/techreports/86-020.pdf">No Silver Bullet</a> - that software&rsquo;s essential complexity is irreducible, and no single invention would ever give us an order-of-magnitude improvement in productivity by removing it. AI is not the silver bullet either. It moves the burden of complexity, spectacularly well. It does not make it vanish.</p>

<p>The engineers I watch most carefully are those starting their careers now who have never had to fight with raw code. They may never develop a feel for what the machine is actually doing. That gap matters rarely. But when it matters, it matters a great deal. Debugging a production incident at 3am is not the moment to discover your team cannot go one level below the abstraction.</p>

<p>Test coverage is another place where the numbers look good but the picture is incomplete. AI generates test cases faster than any human ever did. Coverage metrics are rising across every team that adopts these tools. But coverage is not confidence. A test suite full of AI-generated tests can pass completely and still miss the thing that actually matters. Someone has to check that the tests are testing the right things.</p>

<h2>The skills that matter most in AI-assisted software development</h2>

<p>The skill premium has shifted, and it has shifted fast.</p>

<table class="skills-table">
  <tr><td>Syntax mastery</td><td>&rarr;</td><td>Architecture judgment</td></tr>
  <tr><td>Knowing the API</td><td>&rarr;</td><td>Knowing when the AI is wrong</td></tr>
  <tr><td>Writing every line</td><td>&rarr;</td><td>Reading and owning what is generated</td></tr>
  <tr><td>Writing boilerplate</td><td>&rarr;</td><td>Framing the problem precisely</td></tr>
  <tr><td>Deep specialisation</td><td>&rarr;</td><td>Breadth to steer across domains</td></tr>
</table>

<p>Writing a good prompt is not a soft skill. It requires a clear mental model of the problem, an understanding of constraints, and the judgment to evaluate whether the output is actually right. That is engineering. It just looks different from the outside.</p>

<p>The engineers who thrive are using AI to think faster. Not instead of thinking.</p>

<h2>What engineering leaders need to do differently</h2>

<p>Raise your standards. For requirements, for code review, for test quality. The bar should go up, not down, precisely because the tools are so capable. The ease of generation is not a reason to review less carefully. It is a reason to review more carefully.</p>

<p>Invest in depth alongside speed. Make sure your teams can still go one level below the abstraction when they need to. Run sessions where engineers have to explain what their AI-generated code actually does. Not because AI is untrustworthy, but because ownership of the codebase cannot be delegated to a tool.</p>

<p>Schedule deliberate retrospectives. AI-assisted incident response wraps problems up too neatly. Someone has to ask the awkward questions about what actually went wrong and why. Do not let the machine do all the sense-making.</p>

<p>Think carefully about knowledge transfer. Junior developers learning primarily through AI-generated code are not building the same mental models that senior developers built over years of reading and writing code from scratch. That gap will show up eventually. Plan for it.</p>

<h2>The honest picture of AI in software development</h2>

<p>This is not AI replacing software engineers. It is AI changing what software engineering means.</p>

<p>The transformation is real, and it is mostly positive. But it comes with new failure modes that most organisations are not managing carefully enough. Velocity is up. Complexity is up faster. The bottleneck has moved from writing code to understanding what you have built.</p>

<p>The question for engineering leaders is not &ldquo;how do we adopt AI tools faster?&rdquo; It is &ldquo;what do we need to protect as we do?&rdquo;</p>

<p>The teams that get this right will be fast <em>and</em> rigorous. The teams that only get the first part will be fast until they are not.</p>

<hr>

<p class="bio"><em>Alun Davies-Baker is the founder of AltogetherAgile, a London-based agile training and consultancy practice. He works with software and product teams across pharmaceuticals, finance, and the public sector.</em></p>

</div>$CONTENT$,
  (SELECT id FROM public.blog_categories WHERE slug = 'techniques-tools'),
  false,
  false,
  9,
  'How AI Is Changing Software Development | AltogetherAgile',
  'AI is transforming software development by shifting the unit of work from code to intent. Here is what that means for engineers and engineering leaders.',
  ARRAY['how AI is changing software development','AI impact on software development','AI software engineering productivity','AI coding tools'],
  now(),
  now()
);

-- Re-enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
