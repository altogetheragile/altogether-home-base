import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { ProbeTrackerEditor } from '@/components/probeTracker/ProbeTrackerEditor';

const ProbeTrackerPage = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Probe Tracker - Altogether Agile"
        description="Run your output options as safe-to-fail experiments. A simple kanban moves each probe from Planned to Running to Kept or Killed, with the signal that would prove it wrong. Export to PNG, PDF, JSON and Markdown."
        path="/probes"
      />
      <Navigation />

      <main className="flex-grow">
        <section className="border-b border-border bg-gradient-to-b from-accent to-background px-4 py-10">
          <div className="mx-auto max-w-6xl">
            <Link to={projectId ? `/projects/${projectId}` : '/ai-tools'} className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> {projectId ? 'Back to Project' : 'Back to AI Tools'}
            </Link>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Probe Tracker</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Treat each output option as a hypothesis. Run the smallest safe-to-fail test, decide what would prove it
              wrong, then keep what works and kill what does not. The coach helps you find the smallest test.
            </p>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <ProbeTrackerEditor />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProbeTrackerPage;
