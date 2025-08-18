import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import KnowledgeFilter from "@/components/knowledge/KnowledgeFilter";
import { useKnowledgeCategories } from "@/hooks/useKnowledgeCategories";
import { useKnowledgeTags } from "@/hooks/useKnowledgeTags";
import { useKnowledgeTechniques } from "@/hooks/useKnowledgeTechniques";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Star, Trophy, Search } from "lucide-react";
import { DifficultyBadge } from "@/components/knowledge/DifficultyBadge";
import { Button } from "@/components/ui/button";
import { SmartSearchInput } from "@/components/search/SmartSearchInput";
import { RecommendationsSection } from "@/components/recommendations/RecommendationsSection";
import { useSearchAnalytics } from "@/hooks/useSearchAnalytics";
import { Link } from "react-router-dom";

const KnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>("all");
  const [selectedTag, setSelectedTag] = useState<string | undefined>("all");
  const [sortBy, setSortBy] = useState("popularity");

  const { data: categories } = useKnowledgeCategories();
  const { data: tags } = useKnowledgeTags();

  const logSearch = useSearchAnalytics();

  const { data: filteredTechniques, isLoading: loading } = useKnowledgeTechniques({
    search: searchQuery,
    categoryId: selectedCategory === "all" ? undefined : selectedCategory,
    tag: selectedTag === "all" ? undefined : selectedTag,
    sortBy: sortBy,
  });

  const { data: featuredTechniques, isLoading: featuredLoading } = useKnowledgeTechniques({
    featured: true,
    limit: 3
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
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
              Product Delivery Techniques
            </h1>
            <p className="text-base text-muted-foreground mb-4">
              Discover, learn, and apply proven techniques for building better products
            </p>

            {/* Compact Stats */}
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{filteredTechniques?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Techniques</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{categories?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{tags?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Tags</div>
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
              resultsCount={filteredTechniques?.length || 0}
              placeholder="Search techniques with AI suggestions..."
              showAISuggestions={true}
            />
          </div>
          <h2 className="text-xl font-semibold text-center">
            {searchQuery || selectedCategory !== "all" || selectedTag !== "all" 
              ? "Search Results" 
              : "All Techniques"
            }
          </h2>
        </div>

        <KnowledgeFilter
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Recommendations Section - Only show when no search is active */}
        {!searchQuery && selectedCategory === "all" && selectedTag === "all" && (
          <RecommendationsSection
            title="Recommended Techniques for You"
            contentType="technique"
            limit={6}
            className="mb-8"
          />
        )}

        {/* Featured Techniques - Only show when no filters are active */}
        {!searchQuery && selectedCategory === "all" && selectedTag === "all" && (
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
                featuredTechniques?.slice(0, 3).map((technique) => (
                  <Link key={technique.id} to={`/knowledge/${technique.slug}`}>
                     <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                       <CardHeader className="pb-3">
                         <div className="flex items-start justify-between">
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                               {technique.knowledge_categories && (
                                 <Badge 
                                   variant="secondary" 
                                   className="text-xs"
                                   style={{ backgroundColor: `${technique.knowledge_categories.color}20`, color: technique.knowledge_categories.color }}
                                 >
                                   {technique.knowledge_categories.name}
                                 </Badge>
                               )}
                               <DifficultyBadge difficulty={technique.difficulty} />
                             </div>
                             <CardTitle className="text-xl font-bold leading-tight mb-1 text-foreground">
                               {technique.title}
                             </CardTitle>
                           </div>
                         </div>
                       </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-sm line-clamp-3 mb-3">
                          {technique.description}
                        </CardDescription>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{technique.views || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              <span>{technique.popularity_score || 0}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {technique.knowledge_technique_tags?.slice(0, 2).map((tag) => (
                              <Badge key={tag.knowledge_tags.id} variant="outline" className="text-xs px-1 py-0">
                                {tag.knowledge_tags.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {/* All Techniques */}
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
          ) : filteredTechniques && filteredTechniques.length > 0 ? (
            filteredTechniques.map((technique) => (
              <Link key={technique.id} to={`/knowledge/${technique.slug}`}>
                 <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                   <CardHeader className="pb-3">
                     <div className="flex items-start justify-between">
                       <div className="flex-1">
                         <div className="flex items-center gap-2 mb-2">
                           {technique.knowledge_categories && (
                             <Badge 
                               variant="secondary" 
                               className="text-xs"
                               style={{ backgroundColor: `${technique.knowledge_categories.color}20`, color: technique.knowledge_categories.color }}
                             >
                               {technique.knowledge_categories.name}
                             </Badge>
                           )}
                           <DifficultyBadge difficulty={technique.difficulty} />
                         </div>
                         <CardTitle className="text-xl font-bold leading-tight mb-1 text-foreground">
                           {technique.title}
                         </CardTitle>
                       </div>
                     </div>
                   </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm line-clamp-3 mb-3">
                      {technique.description}
                    </CardDescription>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{technique.views || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span>{technique.popularity_score || 0}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {technique.knowledge_technique_tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag.knowledge_tags.id} variant="outline" className="text-xs px-1 py-0">
                            {tag.knowledge_tags.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-center">
                <div className="text-lg font-medium text-muted-foreground mb-2">
                  No techniques found
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || selectedCategory !== "all" || selectedTag !== "all"
                    ? "Try adjusting your search criteria"
                    : "No techniques have been published yet"
                  }
                </p>
                {(searchQuery || selectedCategory !== "all" || selectedTag !== "all") && (
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