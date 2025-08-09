import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminKnowledgeTechniques from './AdminKnowledgeTechniques';
import AdminKnowledgeCategories from './AdminKnowledgeCategories';
import AdminKnowledgeTags from './AdminKnowledgeTags';
import { ContentAnalyticsDashboard } from '@/components/admin/ContentAnalyticsDashboard';
import { BarChart, Tag, BookOpen, Folder } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const AdminKnowledgeBase = () => {
  const knowledgeItems = [
    {
      label: 'Techniques',
      href: '#techniques',
      icon: BookOpen,
      description: 'Manage delivery techniques'
    },
    {
      label: 'Analytics',
      href: '#analytics', 
      icon: BarChart,
      description: 'View content analytics'
    },
    {
      label: 'Categories',
      href: '#categories',
      icon: Folder,
      description: 'Organize content categories'
    },
    {
      label: 'Tags',
      href: '#tags',
      icon: Tag,
      description: 'Manage content tags'
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Knowledge Base</h2>
      </div>

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

        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {knowledgeItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.label}
                  className="group relative bg-white rounded-lg border border-gray-200 p-4 hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    const tabs = document.querySelector('[role="tablist"]');
                    const trigger = tabs?.querySelector(`[value="${item.href.slice(1)}"]`) as HTMLElement;
                    trigger?.click();
                  }}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-primary/10 transition-colors">
                      <IconComponent className="h-5 w-5 text-gray-600 group-hover:text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{item.label}</h3>
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

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