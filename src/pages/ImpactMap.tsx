import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { ImpactMapEditor } from '@/components/impactMap/ImpactMapEditor';

const ImpactMapPage = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Impact Map Builder - Altogether Agile"
        description="Build and export Impact Maps (Gojko Adzic). A guided tool that walks you through goal, actors, impacts, and deliverables, with FreeMind, PNG, PDF, and JSON export."
        path="/impact-map"
      />
      <Navigation />

      <main className="flex-grow">
        <section className="border-b border-border bg-gradient-to-b from-accent to-background px-4 py-10">
          <div className="mx-auto max-w-5xl">
            <Link to={projectId ? `/projects/${projectId}` : '/ai-tools'} className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> {projectId ? 'Back to Project' : 'Back to AI Tools'}
            </Link>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Impact Map Builder</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Impact Mapping (Gojko Adzic) connects what you build to the behaviour change and business goal
              behind it. Work top down through Why, Who, How, and What, then export your map.
            </p>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="mx-auto max-w-5xl">
            <ImpactMapEditor />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ImpactMapPage;
