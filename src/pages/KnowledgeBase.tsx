import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { KnowledgeItemsFilter } from "@/components/knowledge/KnowledgeItemsFilter";
import { PlanningLayerBadges } from "@/components/knowledge/PlanningLayerBadges";
import { useKnowledgeCategories } from "@/hooks/useKnowledgeCategories";
import { useKnowledgeTags } from "@/hooks/useKnowledgeTags";
import { useKnowledgeItems } from "@/hooks/useKnowledgeItems";
import { useActivityCategories } from "@/hooks/useActivityCategories";
import { useActivityDomains } from "@/hooks/useActivityDomains";
import { usePlanningLayers } from "@/hooks/usePlanningLayers";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Star, Trophy, Search } from "lucide-react";
import { DifficultyBadge } from "@/components/knowledge/DifficultyBadge";
import { Button } from "@/components/ui/button";
import { SmartSearchInput } from "@/components/search/SmartSearchInput";
import { RecommendationsSection } from "@/components/recommendations/RecommendationsSection";
import { useSearchAnalytics } from "@/hooks/useSearchAnalytics";
import { EnhancedTechniqueCard } from "@/components/knowledge/EnhancedTechniqueCard";

const KnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPlanningLayer, setSelectedPlanningLayer] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState("popularity");

  const { data: categories } = useKnowledgeCategories();
  const { data: tags } = useKnowledgeTags();
  
  const { data: domains } = useActivityDomains();
  const { data: planningLayers } = usePlanningLayers();

  const logSearch = useSearchAnalytics();

  const { data: filteredItems, isLoading: loading } = useKnowledgeItems({
    search: searchQuery,
    domainId: selectedDomain === "all" ? undefined : selectedDomain,
    categoryId: selectedCategory === "all" ? undefined : selectedCategory,
    planningLayerId: selectedPlanningLayer === "all" ? undefined : selectedPlanningLayer,
    tag: selectedTag === "all" ? undefined : selectedTag,
    sortBy: sortBy,
  });

  const { data: featuredItems, isLoading: featuredLoading } = useKnowledgeItems({
    featured: true,
    limit: 3
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDomain("all");
    setSelectedCategory("all");
    setSelectedPlanningLayer("all");
    setSelectedTag("all");
    setSortBy("popularity");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Product Delivery Techniques Library
            </h1>
            <p className="text-base text-muted-foreground mb-4">
              Discover, learn, and master proven techniques for building exceptional products
            </p>

            {/* Compact Stats */}
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{filteredItems?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Techniques</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{categories?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{planningLayers?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Planning Layers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Smart Search Bar */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="text-center">
            <SmartSearchInput
              searchQuery={searchQuery}
              onSearchChange={handleSearch}
              onSearch={() => {}}
              resultsCount={filteredItems?.length || 0}
              placeholder="Search techniques with AI suggestions..."
              showAISuggestions={true}
            />
          </div>
          <h2 className="text-xl font-semibold text-center">
            {searchQuery || selectedDomain !== "all" || selectedCategory !== "all" || selectedPlanningLayer !== "all" || selectedTag !== "all"
              ? "Search Results" 
              : "All Techniques"
            }
          </h2>
        </div>

        <KnowledgeItemsFilter
          selectedDomain={selectedDomain}
          onDomainChange={setSelectedDomain}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedPlanningLayer={selectedPlanningLayer}
          onPlanningLayerChange={setSelectedPlanningLayer}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          onClearFilters={clearFilters}
        />

        {/* Recommendations Section - Only show when no search is active */}
        {!searchQuery && selectedDomain === "all" && selectedCategory === "all" && selectedPlanningLayer === "all" && selectedTag === "all" && (
          <RecommendationsSection
            title="Recommended Techniques for You"
            contentType="technique"
            limit={6}
            className="mb-8"
          />
        )}

        {/* Featured Knowledge Items - Only show when no filters are active */}
        {!searchQuery && selectedDomain === "all" && selectedCategory === "all" && selectedPlanningLayer === "all" && selectedTag === "all" && (
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Featured Techniques
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredLoading ? (
                Array.from({ length: 3 }, (_, i) => (
                  <Card key={i}>
                    <CardHeader className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                featuredItems?.slice(0, 3).map((item) => (
                  <EnhancedTechniqueCard key={item.id} item={item} showDetails={true} />
                ))
              )}
            </div>
          </div>
        )}

        {/* All Knowledge Items */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }, (_, i) => (
              <Card key={i}>
                <CardHeader className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filteredItems && filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <EnhancedTechniqueCard key={item.id} item={item} showDetails={false} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-center">
                <div className="text-lg font-medium text-muted-foreground mb-2">
                  No techniques found
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery || selectedDomain !== "all" || selectedCategory !== "all" || selectedPlanningLayer !== "all" || selectedTag !== "all"
                      ? "Try adjusting your search criteria"
                      : "No techniques have been published yet"
                    }
                </p>
                {(searchQuery || selectedDomain !== "all" || selectedCategory !== "all" || selectedPlanningLayer !== "all" || selectedTag !== "all") && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default KnowledgeBase;