import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { BenefitsScorecardEditor } from '@/components/benefitsScorecard/BenefitsScorecardEditor';

const BenefitsScorecardPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Benefits Scorecard - Altogether Agile"
        description="Track whether the numbers actually moved. Each outcome carries a leading indicator, a target and dated readings, with a simple trend line and a Benefits on a Page PDF export."
        path="/benefits"
      />
      <Navigation />

      <main className="flex-grow">
        <section className="border-b border-border bg-gradient-to-b from-accent to-background px-4 py-10">
          <div className="mx-auto max-w-5xl">
            <Link to="/ai-tools" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to AI Tools
            </Link>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Benefits Scorecard</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Outputs are easy to count. Outcomes are what matter. Track a leading indicator and dated readings for each
              outcome, watch the trend, and export Benefits on a Page when you need to show whether anything changed.
            </p>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="mx-auto max-w-5xl">
            <BenefitsScorecardEditor />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BenefitsScorecardPage;
