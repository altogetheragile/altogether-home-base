import { ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useReadingBooks, useReadingCategories, useReadingSettings } from '@/hooks/useReadingList';
import { ReadingBooksTab } from '@/components/admin/readingList/ReadingBooksTab';
import { ReadingCategoriesTab } from '@/components/admin/readingList/ReadingCategoriesTab';
import { ReadingSettingsTab } from '@/components/admin/readingList/ReadingSettingsTab';

// The reading list's books, categories, Associates tag and CSV. The public page is the Site's
// (/resources/reading-list), so the link to it is a plain anchor: this app does not answer it.

const AdminReadingList = () => {
  const categories = useReadingCategories();
  const books = useReadingBooks();
  const settings = useReadingSettings();

  const error = categories.error ?? books.error ?? settings.error;
  const loading = categories.isLoading || books.isLoading || settings.isLoading;
  const tag = settings.data?.amazon_associate_tag ?? '';
  const live = settings.data?.show_reading_list === true;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reading List</h1>
          <p className="text-sm text-muted-foreground">Recommended books, grouped by category, each with an Amazon link.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={live ? 'default' : 'secondary'}>{live ? 'Live' : 'Hidden from visitors'}</Badge>
          <a href="/resources/reading-list" target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
            View page <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </div>

      {error ? (
        <p className="text-destructive">Could not load the reading list: {error.message}</p>
      ) : loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <Tabs defaultValue="books">
          <TabsList>
            <TabsTrigger value="books">Books ({books.data!.length})</TabsTrigger>
            <TabsTrigger value="categories">Categories ({categories.data!.length})</TabsTrigger>
            <TabsTrigger value="settings">Settings and CSV</TabsTrigger>
          </TabsList>
          <TabsContent value="books" className="mt-4">
            <ReadingBooksTab books={books.data!} categories={categories.data!} tag={tag} />
          </TabsContent>
          <TabsContent value="categories" className="mt-4">
            <ReadingCategoriesTab categories={categories.data!} books={books.data!} />
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <ReadingSettingsTab books={books.data!} categories={categories.data!} settings={settings.data ?? null} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdminReadingList;
