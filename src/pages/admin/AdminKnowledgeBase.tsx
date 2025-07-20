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
        <TabsList className="flex w-full h-auto min-h-[60px] p-1 gap-1">
          <TabsTrigger value="techniques" className="flex-1 flex flex-col items-center justify-center p-2 h-auto text-[10px] leading-tight whitespace-normal min-h-[56px]">
            <BookOpen className="h-3 w-3 mb-1 shrink-0" />
            <span className="text-center">Tech</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 flex flex-col items-center justify-center p-2 h-auto text-[10px] leading-tight whitespace-normal min-h-[56px]">
            <BarChart className="h-3 w-3 mb-1 shrink-0" />
            <span className="text-center">Data</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex-1 flex flex-col items-center justify-center p-2 h-auto text-[10px] leading-tight whitespace-normal min-h-[56px]">
            <Folder className="h-3 w-3 mb-1 shrink-0" />
            <span className="text-center">Cats</span>
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex-1 flex flex-col items-center justify-center p-2 h-auto text-[10px] leading-tight whitespace-normal min-h-[56px]">
            <Tag className="h-3 w-3 mb-1 shrink-0" />
            <span className="text-center">Tags</span>
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