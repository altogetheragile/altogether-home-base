import { BarChart3, TrendingUp, Eye, Calendar, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface KnowledgeItemAnalyticsProps {
  knowledgeItem: any;
  useCases?: any[];
}

export const KnowledgeItemAnalytics = ({ knowledgeItem, useCases = [] }: KnowledgeItemAnalyticsProps) => {
  const useCasesCount = useCases.length;
  const genericUseCasesCount = useCases.filter((uc: any) => uc.case_type === 'generic').length;
  const exampleUseCasesCount = useCases.filter((uc: any) => uc.case_type === 'example').length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics & Insights
        </h3>
        <p className="text-sm text-muted-foreground">
          Performance metrics and usage statistics for this knowledge item
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Views</p>
                <p className="text-2xl font-bold">{knowledgeItem.view_count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Use Cases</p>
                <p className="text-2xl font-bold">{useCasesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Status</p>
                <Badge variant={knowledgeItem.is_published ? 'default' : 'secondary'}>
                  {knowledgeItem.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Updated</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(knowledgeItem.updated_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Audit Trail
          </CardTitle>
          <CardDescription>
            Creation and modification history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(knowledgeItem.created_at).toLocaleString()}
                </p>
              </div>
              <Badge variant="outline">
                {formatDistanceToNow(new Date(knowledgeItem.created_at), { addSuffix: true })}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(knowledgeItem.updated_at).toLocaleString()}
                </p>
              </div>
              <Badge variant="outline">
                {formatDistanceToNow(new Date(knowledgeItem.updated_at), { addSuffix: true })}
              </Badge>
            </div>

            {knowledgeItem.created_by && (
              <div className="flex items-center justify-between py-2 border-t border-border">
                <div>
                  <p className="text-sm font-medium">Created By</p>
                  <p className="text-xs text-muted-foreground">
                    User ID: {knowledgeItem.created_by}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base text-blue-900 dark:text-blue-100">
            Recommendations
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Suggestions to improve this knowledge item
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            {!knowledgeItem.background && (
              <li>• Add background content to provide more context</li>
            )}
            {useCasesCount === 0 && (
              <li>• Add use cases to show practical applications</li>
            )}
            {genericUseCasesCount === 0 && exampleUseCasesCount > 0 && (
              <li>• Consider adding generic use cases for broader applicability</li>
            )}
            {exampleUseCasesCount === 0 && genericUseCasesCount > 0 && (
              <li>• Add example use cases with real-world scenarios</li>
            )}
            {!knowledgeItem.category_id && (
              <li>• Assign a category for better organization</li>
            )}
            {!knowledgeItem.is_published && (
              <li>• Consider publishing this item if content is complete</li>
            )}
            {knowledgeItem.view_count === 0 && knowledgeItem.is_published && (
              <li>• Promote this item to increase visibility</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};