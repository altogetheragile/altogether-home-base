
import { useState, useEffect } from "react";
import { Search, Filter, BookOpen, Users, Lightbulb, TrendingUp } from "lucide-react";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { useBlogTags } from "@/hooks/useBlogTags";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { BlogAdvancedSearch } from "@/components/blog/BlogAdvancedSearch";
import { BlogCard } from "@/components/blog/BlogCard";

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState("newest");
  
  const { data: categories, isLoading: categoriesLoading } = useBlogCategories();
  const { data: popularTags, isLoading: tagsLoading } = useBlogTags(20);
  const { data: posts, isLoading: postsLoading } = useBlogPosts({
    search: searchQuery,
    categoryId: selectedCategory === "all" ? undefined : selectedCategory,
    tag: selectedTag === "all" ? undefined : selectedTag,
    sortBy: sortBy,
  });
  const { data: featuredPosts } = useBlogPosts({ featured: true, limit: 3 });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedTag("all");
    setSortBy("newest");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Agile Insights & Resources
            </h1>
            <p className="text-base text-muted-foreground mb-4">
              Expert insights, practical tips, and thought leadership on agile methodologies, 
              team dynamics, and organizational transformation.
            </p>
            
            {/* Inline Advanced Search */}
            <div className="max-w-6xl mx-auto mb-4">
              <BlogAdvancedSearch
                searchQuery={searchQuery}
                onSearchChange={handleSearch}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedTag={selectedTag}
                onTagChange={setSelectedTag}
                sortBy={sortBy}
                onSortChange={setSortBy}
                resultsCount={posts?.length || 0}
              />
            </div>

            {/* Compact Stats */}
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{posts?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Blog Posts</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{categories?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{popularTags?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Tags</div>
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
                {(selectedCategory && selectedCategory !== "all" || selectedTag && selectedTag !== "all" || searchQuery) && (
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
            {/* Featured Posts */}
            {!searchQuery && (!selectedCategory || selectedCategory === "all") && (!selectedTag || selectedTag === "all") && featuredPosts && featuredPosts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Lightbulb className="h-6 w-6 text-primary" />
                  Featured Posts
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {featuredPosts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {/* All Posts */}
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                {searchQuery || (selectedCategory && selectedCategory !== "all") || (selectedTag && selectedTag !== "all") ? 'Search Results' : 'All Posts'}
              </h2>
              
              {postsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-48 w-full" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : posts && posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No blog posts found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || (selectedCategory && selectedCategory !== "all") || (selectedTag && selectedTag !== "all")
                      ? "Try adjusting your search criteria"
                      : "No blog posts have been published yet"
                    }
                  </p>
                  {(searchQuery || (selectedCategory && selectedCategory !== "all") || (selectedTag && selectedTag !== "all")) && (
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

      <Footer />
    </div>
  );
};

export default Blog;
