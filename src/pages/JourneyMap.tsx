import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { JourneyMapEditor } from '@/components/journeyMap/JourneyMapEditor';

const JourneyMapPage = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Journey Map Studio - Altogether Agile"
        description="Map a persona's journey stage by stage: what they are doing, thinking and feeling, the pains and the opportunities. Coached throughout, with pains and opportunities you can send to the backlog. Export to PNG, PDF, JSON and Markdown."
        path="/journey-map"
      />
      <Navigation />

      <main className="flex-grow">
        <section className="border-b border-border bg-gradient-to-b from-accent to-background px-4 py-10">
          <div className="mx-auto max-w-6xl">
            <Link to={projectId ? `/projects/${projectId}` : '/ai-tools'} className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> {projectId ? 'Back to Project' : 'Back to AI Tools'}
            </Link>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Journey Map Studio</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Walk a persona through their journey, one stage at a time. The coach helps you describe what they are
              doing, thinking and feeling, then surface the pains and opportunities, in your own words.
            </p>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <JourneyMapEditor />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default JourneyMapPage;
