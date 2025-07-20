import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminKnowledgeTechniques from './AdminKnowledgeTechniques';
import AdminKnowledgeCategories from './AdminKnowledgeCategories';
import AdminKnowledgeTags from './AdminKnowledgeTags';
import { ContentAnalyticsDashboard } from '@/components/admin/ContentAnalyticsDashboard';
import { BarChart, Tag, BookOpen, Folder } from 'lucide-react';

const AdminKnowledgeBase = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Knowledge Base Management</h2>
        <p className="text-gray-600">Comprehensive content management with analytics and bulk operations</p>
      </div>

      <Tabs defaultValue="techniques" className="w-full">
        <TabsList className="grid w-full grid-cols-4 gap-1">
          <TabsTrigger value="techniques" className="flex flex-col items-center justify-center p-2 h-auto min-h-[44px] text-xs">
            <BookOpen className="h-4 w-4 mb-1" />
            <span className="leading-none">Tech</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex flex-col items-center justify-center p-2 h-auto min-h-[44px] text-xs">
            <BarChart className="h-4 w-4 mb-1" />
            <span className="leading-none">Data</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex flex-col items-center justify-center p-2 h-auto min-h-[44px] text-xs">
            <Folder className="h-4 w-4 mb-1" />
            <span className="leading-none">Cats</span>
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex flex-col items-center justify-center p-2 h-auto min-h-[44px] text-xs">
            <Tag className="h-4 w-4 mb-1" />
            <span className="leading-none">Tags</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="techniques" className="space-y-6">
          <AdminKnowledgeTechniques />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ContentAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <AdminKnowledgeCategories />
        </TabsContent>

        <TabsContent value="tags" className="space-y-6">
          <AdminKnowledgeTags />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminKnowledgeBase;