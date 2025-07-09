import { useState } from "react";
import { Search, Filter, BookOpen, Users, Lightbulb } from "lucide-react";
import { useKnowledgeTechniques } from "@/hooks/useKnowledgeTechniques";
import { useKnowledgeCategories } from "@/hooks/useKnowledgeCategories";
import { useKnowledgeTags } from "@/hooks/useKnowledgeTags";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

const KnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  
  const { data: categories, isLoading: categoriesLoading } = useKnowledgeCategories();
  const { data: popularTags, isLoading: tagsLoading } = useKnowledgeTags(20);
  const { data: techniques, isLoading: techniquesLoading } = useKnowledgeTechniques({
    search: searchQuery,
    categoryId: selectedCategory,
    tag: selectedTag,
  });
  const { data: featuredTechniques } = useKnowledgeTechniques({ featured: true, limit: 3 });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(undefined);
    setSelectedTag(undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Product Delivery Techniques
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Discover, learn, and apply proven techniques for building better products
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search techniques, methods, or concepts..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{techniques?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Techniques</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{categories?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{popularTags?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Tags</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </h3>
                {(selectedCategory || selectedTag || searchQuery) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
              </div>

              {/* Categories Filter */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Categories</h4>
                {categoriesLoading ? (
                  <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : (
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Popular Tags */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Popular Tags</h4>
                {tagsLoading ? (
                  <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-20 inline-block mr-2" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {popularTags?.slice(0, 10).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTag === tag.slug ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => setSelectedTag(selectedTag === tag.slug ? undefined : tag.slug)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Techniques */}
            {!searchQuery && !selectedCategory && !selectedTag && featuredTechniques && featuredTechniques.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Lightbulb className="h-6 w-6 text-primary" />
                  Featured Techniques
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {featuredTechniques.map((technique) => (
                    <Card key={technique.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg leading-tight">
                            <Link 
                              to={`/knowledge/${technique.slug}`} 
                              className="hover:text-primary transition-colors"
                            >
                              {technique.name}
                            </Link>
                          </CardTitle>
                          {technique.knowledge_categories && (
                            <Badge 
                              variant="secondary" 
                              style={{ backgroundColor: `${technique.knowledge_categories.color}20`, color: technique.knowledge_categories.color }}
                            >
                              {technique.knowledge_categories.name}
                            </Badge>
                          )}
                        </div>
                        {technique.purpose && (
                          <CardDescription className="text-sm">
                            {technique.purpose}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {technique.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                            {technique.description}
                          </p>
                        )}
                        {technique.knowledge_tags && technique.knowledge_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {technique.knowledge_tags.slice(0, 3).map((tag) => (
                              <Badge key={tag.id} variant="outline" className="text-xs">
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Techniques */}
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                {searchQuery || selectedCategory || selectedTag ? 'Search Results' : 'All Techniques'}
              </h2>
              
              {techniquesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : techniques && techniques.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {techniques.map((technique) => (
                    <Card key={technique.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg leading-tight">
                            <Link 
                              to={`/knowledge/${technique.slug}`} 
                              className="hover:text-primary transition-colors"
                            >
                              {technique.name}
                            </Link>
                          </CardTitle>
                          {technique.knowledge_categories && (
                            <Badge 
                              variant="secondary" 
                              style={{ backgroundColor: `${technique.knowledge_categories.color}20`, color: technique.knowledge_categories.color }}
                            >
                              {technique.knowledge_categories.name}
                            </Badge>
                          )}
                        </div>
                        {technique.purpose && (
                          <CardDescription className="text-sm">
                            {technique.purpose}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {technique.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                            {technique.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {technique.knowledge_tags && technique.knowledge_tags.slice(0, 2).map((tag) => (
                              <Badge key={tag.id} variant="outline" className="text-xs">
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {technique.view_count > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {technique.view_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No techniques found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || selectedCategory || selectedTag 
                      ? "Try adjusting your search criteria"
                      : "No techniques have been published yet"
                    }
                  </p>
                  {(searchQuery || selectedCategory || selectedTag) && (
                    <Button variant="outline" onClick={clearFilters} className="mt-4">
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;