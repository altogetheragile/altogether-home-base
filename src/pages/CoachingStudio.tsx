import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { CoachingStudioEditor } from '@/components/coachingStudio/CoachingStudioEditor';

const CoachingStudioPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Coaching Studio - Altogether Agile"
        description="A standalone coaching conversation on whatever you bring. Think out loud, then harvest the conversation: the coach proposes where each goal, idea, probe or measure could live, with one tap to send it there."
        path="/coach"
      />
      <Navigation />

      <main className="flex-grow">
        <section className="border-b border-border bg-gradient-to-b from-accent to-background px-4 py-10">
          <div className="mx-auto max-w-3xl">
            <Link to="/ai-tools" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to AI Tools
            </Link>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Coaching Studio</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Bring whatever is on your mind. The coach asks open questions and follows your thinking, never tells you
              what to do. When you are ready, harvest the conversation and the coach proposes where each thing could
              live, from a goal to a backlog item to an experiment.
            </p>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="mx-auto max-w-3xl">
            <CoachingStudioEditor />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CoachingStudioPage;
