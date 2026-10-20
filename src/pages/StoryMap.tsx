import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { StoryMapEditor } from '@/components/storyMap/StoryMapEditor';

const StoryMapPage = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="User Story Map"
        description="Build a user story map in three tiers: the journey as a backbone, stories beneath each step, and smaller stories in priority order. Slice it into Now, Next and Later, each with its own Product Goal, then send the Now slice to your backlog. Export to PNG, PDF, JSON and Markdown."
        path="/story-map"
      />
      <Navigation />

      <main className="flex-grow">
        <section className="border-b border-border bg-gradient-to-b from-accent to-background px-4 py-10">
          <div className="mx-auto max-w-6xl">
            <Link to={projectId ? `/projects/${projectId}` : '/ai-tools'} className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> {projectId ? 'Back to Initiative' : 'Back to AI Tools'}
            </Link>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">User Story Map</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Lay out the user's journey as a backbone, put the stories under each step and the smaller stories
              under those, highest priority at the top. Slice across the smaller stories into Now, Next and Later,
              give each slice a Product Goal, and make Now the thinnest thing that still works end to end. Then send
              Now to your backlog.
            </p>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <StoryMapEditor />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default StoryMapPage;
