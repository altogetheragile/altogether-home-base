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
          <TabsTrigger value="techniques" className="flex items-center gap-1 px-2 text-xs sm:text-sm sm:gap-2 sm:px-3">
            <FileStack className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Techniques</span>
            <span className="sm:hidden">Tech</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1 px-2 text-xs sm:text-sm sm:gap-2 sm:px-3">
            <BarChart className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Data</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-1 px-2 text-xs sm:text-sm sm:gap-2 sm:px-3">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Categories</span>
            <span className="sm:hidden">Cat</span>
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-1 px-2 text-xs sm:text-sm sm:gap-2 sm:px-3">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Tags</span>
            <span className="sm:hidden">Tags</span>
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