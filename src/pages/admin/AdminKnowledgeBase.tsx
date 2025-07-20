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
          <TabsTrigger value="techniques" className="flex flex-col items-center justify-center gap-1 px-0.5 py-1.5 md:flex-row md:gap-2 md:px-3 md:py-2">
            <FileStack className="h-4 w-4 md:h-4 md:w-4 flex-shrink-0" />
            <span className="hidden md:inline text-sm">Techniques</span>
            <span className="md:hidden text-[10px] leading-tight">Tech</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex flex-col items-center justify-center gap-1 px-0.5 py-1.5 md:flex-row md:gap-2 md:px-3 md:py-2">
            <BarChart className="h-4 w-4 md:h-4 md:w-4 flex-shrink-0" />
            <span className="hidden md:inline text-sm">Analytics</span>
            <span className="md:hidden text-[10px] leading-tight">Data</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex flex-col items-center justify-center gap-1 px-0.5 py-1.5 md:flex-row md:gap-2 md:px-3 md:py-2">
            <TrendingUp className="h-4 w-4 md:h-4 md:w-4 flex-shrink-0" />
            <span className="hidden md:inline text-sm">Categories</span>
            <span className="md:hidden text-[10px] leading-tight">Cat</span>
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex flex-col items-center justify-center gap-1 px-0.5 py-1.5 md:flex-row md:gap-2 md:px-3 md:py-2">
            <Settings className="h-4 w-4 md:h-4 md:w-4 flex-shrink-0" />
            <span className="hidden md:inline text-sm">Tags</span>
            <span className="md:hidden text-[10px] leading-tight">Tags</span>
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