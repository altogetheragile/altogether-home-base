-- Rewrite the AI blog post content using simple inline-styled HTML
-- instead of <style> blocks and CSS classes. This makes the content
-- editable in the Rich Text (TipTap) editor.

ALTER TABLE public.blog_posts DISABLE ROW LEVEL SECURITY;

UPDATE public.blog_posts
SET content = $CONTENT$<p style="font-size: 15px; color: #888; margin-bottom: 2rem;">By Alun Davies-Baker, AltogetherAgile</p>

<p>Something significant has happened in software development. Not overnight, and not for the first time. But this one is moving faster than any previous shift in the industry.</p>

<p>We have moved up a level of abstraction. And if you lead software teams, you need to understand what that means — both the opportunities and the failure modes it creates.</p>

<h2>Every generation of developers inherits a higher floor</h2>

<p>The history of software development is a history of rising abstraction. Each generation builds on a platform the previous one created, and the unit of work gets bigger each time.</p>

<table style="width: 100%; border-collapse: collapse; margin: 2rem 0; font-size: 15px;">
  <tr style="border-bottom: 1px solid #e5e7eb;">
    <td style="padding: 12px 16px; background: #e8e6df; color: #555; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; width: 60px; text-align: center;">50s</td>
    <td style="padding: 12px 16px;">
      <strong style="color: #1a1a1a;">Machine code and assembly</strong><br>
      <span style="color: #555; font-size: 14px;">Every instruction written by hand. Memory addresses managed manually. You thought in bits and registers.</span><br>
      <span style="display: inline-block; margin-top: 6px; background: #e8e6df; color: #555; font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 20px;">Unit of work: instruction</span>
    </td>
  </tr>
  <tr style="border-bottom: 1px solid #e5e7eb;">
    <td style="padding: 12px 16px; background: #d3d1c7; color: #333; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">70s</td>
    <td style="padding: 12px 16px;">
      <strong style="color: #1a1a1a;">High-level languages</strong><br>
      <span style="color: #555; font-size: 14px;">C, Fortran, Cobol. You described logic, not hardware. The compiler handled the translation. Enormous productivity leap.</span><br>
      <span style="display: inline-block; margin-top: 6px; background: #d3d1c7; color: #333; font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 20px;">Unit of work: function</span>
    </td>
  </tr>
  <tr style="border-bottom: 1px solid #e5e7eb;">
    <td style="padding: 12px 16px; background: #b5e8d8; color: #085041; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">90s</td>
    <td style="padding: 12px 16px;">
      <strong style="color: #1a1a1a;">Object-oriented languages and frameworks</strong><br>
      <span style="color: #555; font-size: 14px;">Reusable components, design patterns, libraries. You stopped writing everything from scratch. You assembled systems.</span><br>
      <span style="display: inline-block; margin-top: 6px; background: #b5e8d8; color: #085041; font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 20px;">Unit of work: component</span>
    </td>
  </tr>
  <tr style="border-bottom: 1px solid #e5e7eb;">
    <td style="padding: 12px 16px; background: #5DCAA5; color: #04342C; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">10s</td>
    <td style="padding: 12px 16px;">
      <strong style="color: #1a1a1a;">Cloud, APIs, and platform services</strong><br>
      <span style="color: #555; font-size: 14px;">Entire capabilities became API calls. Auth, payments, storage, messaging. You integrated, not built.</span><br>
      <span style="display: inline-block; margin-top: 6px; background: #5DCAA5; color: #04342C; font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 20px;">Unit of work: service</span>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 16px; background: #1D9E75; color: #fff; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">Now</td>
    <td style="padding: 14px 16px; background: #f5fdf9; border: 1px solid rgba(15,110,86,0.25); border-radius: 0 8px 8px 0;">
      <strong style="color: #1a1a1a; font-size: 17px;">AI-assisted development</strong><br>
      <span style="color: #555; font-size: 14px;">You describe the outcome. The AI writes the code. The unit of thought is shifting from implementation to intent.</span><br>
      <span style="display: inline-block; margin-top: 6px; background: #1D9E75; color: #fff; font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 20px;">Unit of work: intent</span>
    </td>
  </tr>
</table>

<p>Each shift followed the same pattern. More people could participate. Experienced developers got dramatically more productive. And something got hidden underneath your feet that you used to have to understand yourself.</p>

<h2>How AI is changing software development right now</h2>

<p>Now we have AI-assisted development, and it is the same pattern again — only faster.</p>

<p>Tools like GitHub Copilot, Claude Code, and Cursor are not sophisticated autocomplete. They write whole functions, refactor existing code, explain unfamiliar codebases, and catch obvious bugs before the developer notices them. The unit of work is shifting from implementation to intent. You describe the outcome. The AI writes the code.</p>

<p>The productivity gains are real. I see them every week across the teams I work with. Prototypes that took weeks now take hours. Junior developers are producing at something close to senior speed. Seniors are producing more than they ever did.</p>

<p>Speed of exploration is the biggest change. Teams can test ten directions before committing to one. That used to be expensive. Now it is not. The constraint has shifted from "can we build it" to "should we build it" — which is a much more interesting question to be spending your time on.</p>

<h2>What the AI productivity gains are hiding</h2>

<p>Here is what I also see. Engineers are merging code they do not fully understand. The code looks right, it compiles, the tests pass. But nobody has really read it.</p>

<p>Code review culture is quietly weakening at exactly the moment it should be getting stronger. When generation becomes easy, review becomes the critical skill. Most teams have not made that adjustment yet.</p>

<p>There is also a more subtle risk in the analysis and requirements phase. AI turns vague briefs into structured user stories fast. The output looks complete. It is not always correct. It does not know your business. It does not know what your stakeholders actually mean when they say "flexible reporting." Teams are shipping AI-generated requirements nobody has truly interrogated. Arvind Narayanan and Sayash Kapoor make this point forcefully in <a href="https://www.aisnakeoil.com/" style="color: #0d9488; font-weight: 600; text-decoration: underline;">AI Snake Oil</a> — that AI systems are routinely deployed with misplaced confidence, in contexts where they lack the situational understanding to perform reliably. Requirements generation is exactly that kind of context.</p>

<h2>Complexity does not disappear. It moves.</h2>

<p>Every abstraction layer hides complexity. That is the point. But hidden complexity does not disappear. It shifts somewhere you are less likely to look, until something goes wrong and you need to look there urgently. Fred Brooks made this argument in his 1986 essay <a href="http://www.cs.unc.edu/techreports/86-020.pdf" style="color: #0d9488; font-weight: 600; text-decoration: underline;">No Silver Bullet</a> — that software's essential complexity is irreducible, and no single invention would ever give us an order-of-magnitude improvement in productivity by removing it. AI is not the silver bullet either. It moves the burden of complexity, spectacularly well. It does not make it vanish.</p>

<p>The engineers I watch most carefully are those starting their careers now who have never had to fight with raw code. They may never develop a feel for what the machine is actually doing. That gap matters rarely. But when it matters, it matters a great deal. Debugging a production incident at 3am is not the moment to discover your team cannot go one level below the abstraction.</p>

<p>Test coverage is another place where the numbers look good but the picture is incomplete. AI generates test cases faster than any human ever did. Coverage metrics are rising across every team that adopts these tools. But coverage is not confidence. A test suite full of AI-generated tests can pass completely and still miss the thing that actually matters. Someone has to check that the tests are testing the right things.</p>

<h2>The skills that matter most in AI-assisted software development</h2>

<p>The skill premium has shifted, and it has shifted fast.</p>

<table style="width: 100%; border-collapse: collapse; margin: 1.25rem 0 1.5rem; font-size: 16px;">
  <tr style="border-bottom: 1px solid rgba(0,0,0,0.07);">
    <td style="padding: 10px 0; color: #888; text-decoration: line-through; width: 45%; padding-right: 12px;">Syntax mastery</td>
    <td style="padding: 10px 0; color: #aaa; width: 10%; text-align: center;">→</td>
    <td style="padding: 10px 0; font-weight: 600; color: #1a1a1a;">Architecture judgment</td>
  </tr>
  <tr style="border-bottom: 1px solid rgba(0,0,0,0.07);">
    <td style="padding: 10px 0; color: #888; text-decoration: line-through; padding-right: 12px;">Knowing the API</td>
    <td style="padding: 10px 0; color: #aaa; text-align: center;">→</td>
    <td style="padding: 10px 0; font-weight: 600; color: #1a1a1a;">Knowing when the AI is wrong</td>
  </tr>
  <tr style="border-bottom: 1px solid rgba(0,0,0,0.07);">
    <td style="padding: 10px 0; color: #888; text-decoration: line-through; padding-right: 12px;">Writing every line</td>
    <td style="padding: 10px 0; color: #aaa; text-align: center;">→</td>
    <td style="padding: 10px 0; font-weight: 600; color: #1a1a1a;">Reading and owning what is generated</td>
  </tr>
  <tr style="border-bottom: 1px solid rgba(0,0,0,0.07);">
    <td style="padding: 10px 0; color: #888; text-decoration: line-through; padding-right: 12px;">Writing boilerplate</td>
    <td style="padding: 10px 0; color: #aaa; text-align: center;">→</td>
    <td style="padding: 10px 0; font-weight: 600; color: #1a1a1a;">Framing the problem precisely</td>
  </tr>
  <tr>
    <td style="padding: 10px 0; color: #888; text-decoration: line-through; padding-right: 12px;">Deep specialisation</td>
    <td style="padding: 10px 0; color: #aaa; text-align: center;">→</td>
    <td style="padding: 10px 0; font-weight: 600; color: #1a1a1a;">Breadth to steer across domains</td>
  </tr>
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

<p>The question for engineering leaders is not "how do we adopt AI tools faster?" It is "what do we need to protect as we do?"</p>

<p>The teams that get this right will be fast <em>and</em> rigorous. The teams that only get the first part will be fast until they are not.</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2.5rem 0;">

<p style="font-size: 15px; color: #888;"><em>Alun Davies-Baker is the founder of AltogetherAgile, a London-based agile training and consultancy practice. He works with software and product teams across pharmaceuticals, finance, and the public sector.</em></p>$CONTENT$,
updated_at = now()
WHERE slug = 'how-ai-is-changing-software-development';

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
