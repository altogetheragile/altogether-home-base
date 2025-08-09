import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminKnowledgeTechniques from './AdminKnowledgeTechniques';
import AdminKnowledgeCategories from './AdminKnowledgeCategories';
import AdminKnowledgeTags from './AdminKnowledgeTags';
import { ContentAnalyticsDashboard } from '@/components/admin/ContentAnalyticsDashboard';
import { BarChart, Tag, BookOpen, Folder } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const AdminKnowledgeBase = () => {

  return (
    <div className="space-y-4">
      <Tabs defaultValue="techniques" className="w-full">
        <TooltipProvider>
          <TabsList className="flex w-full h-auto min-h-[48px] p-1 gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="techniques" className="flex-1 flex items-center justify-center p-2 h-auto min-h-[44px]">
                  <BookOpen className="h-4 w-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Techniques</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="analytics" className="flex-1 flex items-center justify-center p-2 h-auto min-h-[44px]">
                  <BarChart className="h-4 w-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Analytics</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="categories" className="flex-1 flex items-center justify-center p-2 h-auto min-h-[44px]">
                  <Folder className="h-4 w-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Categories</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="tags" className="flex-1 flex items-center justify-center p-2 h-auto min-h-[44px]">
                  <Tag className="h-4 w-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tags</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>
        </TooltipProvider>


        <TabsContent value="techniques" className="space-y-4">
          <AdminKnowledgeTechniques />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ContentAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <AdminKnowledgeCategories />
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <AdminKnowledgeTags />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminKnowledgeBase;