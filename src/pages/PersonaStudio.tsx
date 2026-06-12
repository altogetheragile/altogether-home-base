import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { PersonaEditor } from '@/components/persona/PersonaEditor';

const PersonaStudioPage = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Persona Studio - Altogether Agile"
        description="Build and export a coached persona: a named character with goals, pains and behaviours, grounded in Jobs to Be Done. Export to PNG, PDF, JSON and Markdown."
        path="/personas"
      />
      <Navigation />

      <main className="flex-grow">
        <section className="border-b border-border bg-gradient-to-b from-accent to-background px-4 py-10">
          <div className="mx-auto max-w-5xl">
            <Link to={projectId ? `/projects/${projectId}` : '/ai-tools'} className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> {projectId ? 'Back to Project' : 'Back to AI Tools'}
            </Link>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Persona Studio</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Shape a clear, named persona through conversation. The coach helps you describe who they are, what they
              are trying to get done, and what gets in the way, in your own words.
            </p>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="mx-auto max-w-5xl">
            <PersonaEditor />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PersonaStudioPage;
