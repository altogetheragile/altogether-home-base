import { Layout, X } from 'lucide-react';
import { TechniqueConfig } from '@/utils/techniqueMapping';
import { cn } from '@/lib/utils';

interface TechniqueTabNavigationProps {
  tabs: TechniqueConfig[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  onCloseTab?: (elementId: string) => void;
}

export const TechniqueTabNavigation = ({
  tabs,
  activeTab,
  onTabChange,
  onCloseTab,
}: TechniqueTabNavigationProps) => {
  return (
    <div className="border-b bg-card/50">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {/* Canvas Tab - Always visible */}
          <button
            onClick={() => onTabChange('canvas')}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
              "border-b-2 -mb-px",
              activeTab === 'canvas'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <Layout className="w-4 h-4" />
            Canvas
          </button>

          {/* Dynamic Technique Tabs */}
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <div
                key={tab.tabKey}
                className={cn(
                  "flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                  "border-b-2 -mb-px group",
                  activeTab === tab.tabKey
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <button
                  onClick={() => onTabChange(tab.tabKey)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
                {onCloseTab && tab.elementId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeTab === tab.tabKey) {
                        onTabChange('canvas');
                      }
                      onCloseTab(tab.elementId);
                    }}
                    className="ml-1 p-0.5 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Close tab (hexi remains on canvas)"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
