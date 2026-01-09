import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { KnowledgeCard } from "@/components/knowledge/KnowledgeCard";
import KnowledgeFilter from "@/components/knowledge/KnowledgeFilter";
import { useKnowledgeItems } from "@/hooks/useKnowledgeItems";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useUserRole } from "@/hooks/useUserRole";

const Knowledge = () => {
  const { settings } = useSiteSettings();
  const { data: userRole } = useUserRole();
  const isAdmin = userRole === 'admin';
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedDecisionLevel, setSelectedDecisionLevel] = useState<string>("all");
  const [sortBy, setSortBy] = useState("alphabetical");
  
  const { data: knowledgeItems, isLoading } = useKnowledgeItems({
    search: searchQuery || undefined,
    categoryId: selectedCategory === "all" ? undefined : selectedCategory,
    domainId: selectedDomain === "all" ? undefined : selectedDomain,
    decisionLevelId: selectedDecisionLevel === "all" ? undefined : selectedDecisionLevel,
    sortBy: sortBy
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedDomain("all");
    setSelectedDecisionLevel("all");
    setSortBy("alphabetical");
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || 
                          selectedDomain !== "all" || selectedDecisionLevel !== "all";

  // Defensive check - should not be reached if routes are configured correctly
  if (!settings?.show_knowledge) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <h1 className="text-2xl font-bold mb-2">Feature Unavailable</h1>
            <p className="text-muted-foreground">
              This feature is currently disabled.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <KnowledgeFilter
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedDomain={selectedDomain}
            onDomainChange={setSelectedDomain}
            selectedDecisionLevel={selectedDecisionLevel}
            onDecisionLevelChange={setSelectedDecisionLevel}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            </div>
            {isAdmin && (
              <Button asChild size="sm">
                <Link to="/knowledge/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Link>
              </Button>
            )}
          </div>

          <div>
            {isLoading ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }, (_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-40 w-full" />
                  </div>
                ))}
              </div>
            ) : knowledgeItems && knowledgeItems.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {knowledgeItems.map((item) => (
                  <KnowledgeCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-base font-medium text-muted-foreground mb-1">No techniques found</h3>
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "Try adjusting your search criteria"
                    : "No techniques have been published yet"
                  }
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="mt-3" size="sm">
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Knowledge;
