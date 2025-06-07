
const Footer = () => {
  return (
    <footer className="bg-muted mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">AltogetherAgile</h3>
            <p className="text-muted-foreground">
              Empowering teams and organizations through agile transformation and coaching.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</a></li>
              <li><a href="/events" className="text-muted-foreground hover:text-primary transition-colors">Events</a></li>
              <li><a href="/blog" className="text-muted-foreground hover:text-primary transition-colors">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Contact</h4>
            <p className="text-muted-foreground">
              Ready to connect when Supabase integration is added.
            </p>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 AltogetherAgile. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
