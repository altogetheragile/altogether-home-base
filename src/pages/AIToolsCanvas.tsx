import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BMCGeneratorDialog from '@/components/bmc/BMCGeneratorDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, FileText, StickyNote, Lightbulb } from 'lucide-react';

export default function AIToolsCanvas() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">AI Tools Canvas</h1>
              <p className="text-muted-foreground">
                Generate business models, user stories, and more with AI-powered tools
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Business Model Canvas Generator */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Business Model Canvas</CardTitle>
                  <CardDescription>
                    Generate a complete business model canvas for your startup or project
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <BMCGeneratorDialog />
            </CardContent>
          </Card>

          {/* Future AI Tools */}
          <Card className="opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <StickyNote className="h-6 w-6 text-muted-foreground" />
                <div>
                  <CardTitle className="text-muted-foreground">AI Sticky Notes</CardTitle>
                  <CardDescription>
                    Generate contextual sticky notes for brainstorming sessions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                <Lightbulb className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lightbulb className="h-6 w-6 text-muted-foreground" />
                <div>
                  <CardTitle className="text-muted-foreground">More AI Tools</CardTitle>
                  <CardDescription>
                    Additional AI-powered tools for project management
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                <Sparkles className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Authentication Notice */}
        {!user && (
          <div className="mt-8 p-6 bg-muted/50 rounded-lg border border-dashed">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Ready to Save Your Work?</h3>
              <p className="text-muted-foreground mb-4">
                Sign in to save your AI-generated content as projects and access them anytime.
              </p>
              <Button asChild>
                <a href="/auth">Sign In / Register</a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}