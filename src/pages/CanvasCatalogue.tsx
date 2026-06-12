import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, FileSpreadsheet, Loader2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { CANVASES } from '@/config/canvases';

interface CatalogueItem {
  key: string;
  name: string;
  blurb: string;
  route: string;
}

const PICKER = [
  { value: 'bmc', label: 'The whole business model of a venture', route: '/bmc-generator', name: 'Business Model Canvas' },
  { value: 'business-case', label: 'The case for a specific investment or change', route: '/canvases/business-case', name: 'Business Case Canvas' },
  { value: 'product-vision', label: 'The direction for a product', route: '/canvases/product-vision', name: 'Product Vision Canvas' },
];

// Map the Knowledge Base technique a recommendation names to the canvas that fills it.
const CANVAS_BY_TECHNIQUE: Record<string, { route: string; name: string }> = {
  'business-model-canvas': { route: '/bmc-generator', name: 'Business Model Canvas' },
  'business-case': { route: '/canvases/business-case', name: 'Business Case Canvas' },
  'product-vision-board': { route: '/canvases/product-vision', name: 'Product Vision Canvas' },
};

interface PatternStep { order?: number; techniqueIds?: string[]; rationale?: string }

// Pick the first canvas named by the recommended flow, earliest step first.
function canvasFromPattern(steps: PatternStep[]): { route: string; name: string; rationale: string } | null {
  const ordered = [...(steps || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (const s of ordered) {
    for (const t of s.techniqueIds || []) {
      if (CANVAS_BY_TECHNIQUE[t]) return { ...CANVAS_BY_TECHNIQUE[t], rationale: s.rationale || '' };
    }
  }
  return null;
}

const CanvasCatalogue = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const withProject = (route: string) => (projectId ? `${route}?projectId=${projectId}` : route);
  const [pick, setPick] = useState<string>('');

  const recommended = PICKER.find((p) => p.value === pick);

  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [ai, setAi] = useState<{ diagnosis: string; canvas: { route: string; name: string; rationale: string } | null } | null>(null);

  const handleRecommend = async () => {
    if (scenario.trim().length < 10) return;
    setLoading(true);
    setAi(null);
    setAiError(null);
    try {
      const { data, error } = await supabase.functions.invoke('recommend-pattern', { body: { scenario: scenario.trim() } });
      if (error) throw error;
      if (!data?.success) {
        setAiError(data?.error || 'Could not get a recommendation. Please try again.');
        return;
      }
      setAi({ diagnosis: data.data?.diagnosis || '', canvas: canvasFromPattern(data.data?.steps || []) });
    } catch {
      setAiError('Something went wrong reaching the coach. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const items: CatalogueItem[] = [
    { key: 'bmc', name: 'Business Model Canvas', blurb: 'Map a whole business model across nine building blocks, with AI examples to start.', route: '/bmc-generator' },
    ...CANVASES.map((c) => ({ key: c.key, name: c.name, blurb: c.blurb, route: `/canvases/${c.key}` })),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Canvas Catalogue - Altogether Agile"
        description="Coached strategy canvases: Business Model Canvas, Business Case, and Product Vision. Fill each through a coaching conversation, then export."
        path="/canvases"
      />
      <Navigation />
      <main className="flex-grow">
        <section className="border-b border-border bg-gradient-to-b from-accent to-background px-4 py-10">
          <div className="mx-auto max-w-5xl">
            <Link to={projectId ? `/projects/${projectId}` : '/ai-tools'} className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> {projectId ? 'Back to Project' : 'Back to AI Tools'}
            </Link>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Canvas Catalogue</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Choose a canvas and fill it through a coaching conversation, in your own words. Each one exports to PDF and more.
            </p>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="mx-auto max-w-5xl space-y-8">
            {/* Canvas Picker */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" /> Not sure which canvas?
                </CardTitle>
                <CardDescription>What are you mainly working on right now?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {PICKER.map((p) => (
                  <label key={p.value} className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-background/60">
                    <input type="radio" name="canvas-pick" value={p.value} checked={pick === p.value} onChange={() => setPick(p.value)} />
                    <span className="text-sm">{p.label}</span>
                  </label>
                ))}
                {recommended && (
                  <div className="mt-2 flex items-center justify-between rounded-md border border-primary/30 bg-background/70 p-3">
                    <span className="text-sm">Recommended: <strong>{recommended.name}</strong></span>
                    <Link to={withProject(recommended.route)}>
                      <Button size="sm">Open <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
                    </Link>
                  </div>
                )}

                <div className="mt-3 border-t border-primary/20 pt-3">
                  <p className="mb-2 text-sm text-muted-foreground">
                    Or describe your situation in a sentence or two and let the coach recommend one, grounded in the Knowledge Base.
                  </p>
                  <Textarea
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    placeholder="e.g. We are exploring a new subscription product for an audience we already serve, and need to decide whether it is worth building."
                    rows={3}
                  />
                  <Button size="sm" className="mt-2" disabled={loading || scenario.trim().length < 10} onClick={handleRecommend}>
                    {loading ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Thinking...</> : 'Recommend with AI'}
                  </Button>
                  {aiError && <p className="mt-2 text-sm text-destructive">{aiError}</p>}
                  {ai && (
                    <div className="mt-3 space-y-2 rounded-md border border-primary/30 bg-background/70 p-3">
                      {ai.diagnosis && <p className="text-sm text-muted-foreground">{ai.diagnosis}</p>}
                      {ai.canvas ? (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm">
                            Recommended: <strong>{ai.canvas.name}</strong>
                            {ai.canvas.rationale ? `. ${ai.canvas.rationale}` : ''}
                          </span>
                          <Link to={withProject(ai.canvas.route)}>
                            <Button size="sm">Open <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
                          </Link>
                        </div>
                      ) : (
                        <p className="text-sm">No single canvas is the obvious fit here. Pick the closest above, or start in the Coaching Studio.</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Canvas cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {items.map((item) => (
                <Card key={item.key} className="flex flex-col border-border transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-2 w-fit rounded-lg bg-primary/10 p-3">
                      <FileSpreadsheet className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{item.name}</CardTitle>
                    <CardDescription>{item.blurb}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <Link to={withProject(item.route)}>
                      <Button variant="outline" className="w-full">Open Canvas <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CanvasCatalogue;
