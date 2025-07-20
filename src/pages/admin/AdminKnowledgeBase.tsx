import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminKnowledgeTechniques from './AdminKnowledgeTechniques';
import AdminKnowledgeCategories from './AdminKnowledgeCategories';
import AdminKnowledgeTags from './AdminKnowledgeTags';
import { ContentAnalyticsDashboard } from '@/components/admin/ContentAnalyticsDashboard';
import { BarChart, Settings, FileStack, TrendingUp } from 'lucide-react';

const AdminKnowledgeBase = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Knowledge Base Management</h2>
        <p className="text-gray-600">Comprehensive content management with analytics and bulk operations</p>
      </div>

      <Tabs defaultValue="techniques" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="techniques" className="flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 px-1 md:px-3 py-2 text-xs md:text-sm">
            <FileStack className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
            <span className="hidden md:inline">Techniques</span>
            <span className="md:hidden text-xs">Tech</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 px-1 md:px-3 py-2 text-xs md:text-sm">
            <BarChart className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
            <span className="hidden md:inline">Analytics</span>
            <span className="md:hidden text-xs">Data</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 px-1 md:px-3 py-2 text-xs md:text-sm">
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
            <span className="hidden md:inline">Categories</span>
            <span className="md:hidden text-xs">Cat</span>
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 px-1 md:px-3 py-2 text-xs md:text-sm">
            <Settings className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
            <span className="hidden md:inline">Tags</span>
            <span className="md:hidden text-xs">Tags</span>
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