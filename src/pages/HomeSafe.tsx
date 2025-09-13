import React from 'react';

const HomeSafe: React.FC = () => {
  // Development log to confirm safe rendering
  if (process.env.NODE_ENV === 'development') {
    console.log('🏠 Home OK ✅');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-bold text-foreground">
            Home OK ✅
          </h1>
          <p className="text-lg text-muted-foreground">
            Safe home page is working. No dynamic content or protected routes.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✅ Static rendering</p>
            <p>✅ No recommendations</p>
            <p>✅ No protected routes</p>
            <p>✅ No dynamic CMS</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSafe;