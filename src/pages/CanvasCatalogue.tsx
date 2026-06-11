import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, FileSpreadsheet } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

const CanvasCatalogue = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const withProject = (route: string) => (projectId ? `${route}?projectId=${projectId}` : route);
  const [pick, setPick] = useState<string>('');

  const recommended = PICKER.find((p) => p.value === pick);

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
            <Link to="/ai-tools" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to AI Tools
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
