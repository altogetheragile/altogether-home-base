import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BlogFilter from "@/components/blog/BlogFilter";
import { BlogCard } from "@/components/blog/BlogCard";
import { UnifiedContentCard } from "@/components/content/UnifiedContentCard";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { useBlogTags } from "@/hooks/useBlogTags";
import { adaptBlogPostToUnifiedContent } from "@/utils/contentAdapters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search, Trophy, BookOpen } from "lucide-react";

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>("all");
  const [selectedTag, setSelectedTag] = useState<string | undefined>("all");
  const [sortBy, setSortBy] = useState("newest");
  
  const { data: categories } = useBlogCategories();
  const { data: popularTags } = useBlogTags(20);
  
  const { data: filteredPosts, isLoading: postsLoading } = useBlogPosts({
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

            {/* Compact Stats */}
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{filteredPosts?.length || 0}</div>
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
        <div className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-semibold">
              {searchQuery || selectedCategory !== "all" || selectedTag !== "all" 
                ? "Search Results" 
                : "All Posts"
              }
            </h2>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <BlogFilter
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {/* Featured Posts - Only show when no filters are active */}
          {!searchQuery && selectedCategory === "all" && selectedTag === "all" && featuredPosts && featuredPosts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Featured Posts
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {featuredPosts.map((post) => (
                  <UnifiedContentCard 
                    key={post.id} 
                    content={adaptBlogPostToUnifiedContent(post)} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Posts */}
          <div className="space-y-4">
            {postsLoading ? (
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
            ) : filteredPosts && filteredPosts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post) => (
                  <UnifiedContentCard 
                    key={post.id} 
                    content={adaptBlogPostToUnifiedContent(post)} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No blog posts found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || selectedCategory !== "all" || selectedTag !== "all"
                    ? "Try adjusting your search criteria"
                    : "No blog posts have been published yet"
                  }
                </p>
                {(searchQuery || selectedCategory !== "all" || selectedTag !== "all") && (
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

export default Blog;