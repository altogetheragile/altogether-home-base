import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { KnowledgeCard } from "@/components/knowledge/KnowledgeCard";
import KnowledgeFilter from "@/components/knowledge/KnowledgeFilter";
import { useKnowledgeItems } from "@/hooks/useKnowledgeItems";
import { useKnowledgeCategories } from "@/hooks/useKnowledgeCategories";
import { usePlanningFocuses } from "@/hooks/usePlanningFocuses";
import { useActivityDomains } from "@/hooks/useActivityDomains";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

const Knowledge = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedFocus, setSelectedFocus] = useState<string>("all");
  const [sortBy, setSortBy] = useState("recent");
  
  const { data: categories } = useKnowledgeCategories();
  const { data: domains } = useActivityDomains();
  const { data: focuses } = usePlanningFocuses();
  
  const { data: knowledgeItems, isLoading } = useKnowledgeItems({
    search: searchQuery || undefined,
    categoryId: selectedCategory === "all" ? undefined : selectedCategory,
    domainId: selectedDomain === "all" ? undefined : selectedDomain,
    layerId: selectedFocus === "all" ? undefined : selectedFocus,
    sortBy: sortBy
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedDomain("all");
    setSelectedFocus("all");
    setSortBy("recent");
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || 
                          selectedDomain !== "all" || selectedFocus !== "all";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-4">
        <div className="space-y-4">
          <KnowledgeFilter
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedDomain={selectedDomain}
            onDomainChange={setSelectedDomain}
            selectedFocus={selectedFocus}
            onFocusChange={setSelectedFocus}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

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