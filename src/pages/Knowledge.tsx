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
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Trophy, Target } from "lucide-react";

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
  
  const { data: featuredItems } = useKnowledgeItems({ 
    featured: true, 
    limit: 3 
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
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Knowledge Base
            </h1>
            <p className="text-base text-muted-foreground mb-4">
              Discover proven techniques, frameworks, and best practices for agile transformation, 
              team collaboration, and organizational excellence.
            </p>

            {/* Stats */}
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{knowledgeItems?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Techniques</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{categories?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{domains?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Domains</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-semibold">
              {hasActiveFilters ? "Search Results" : "All Techniques"}
            </h2>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search techniques..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

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

          {/* Featured Items - Only show when no filters are active */}
          {!hasActiveFilters && featuredItems && featuredItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Featured Techniques
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {featuredItems.map((item) => (
                  <KnowledgeCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* All Items */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            ) : knowledgeItems && knowledgeItems.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {knowledgeItems.map((item) => (
                  <KnowledgeCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No techniques found</h3>
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "Try adjusting your search criteria"
                    : "No techniques have been published yet"
                  }
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
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