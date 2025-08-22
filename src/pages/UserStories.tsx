import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { StoryList } from '@/components/stories/StoryList';

export default function UserStories() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <StoryList />
        </div>
      </div>
      <Footer />
    </div>
  );
}