import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UseFormReturn } from "react-hook-form";
import { KnowledgeItemFormData } from "@/schemas/knowledgeItem";
import { FileText, Hash, BookOpen } from "lucide-react";

interface BasicInfoSectionProps {
  form: UseFormReturn<KnowledgeItemFormData>;
}

export const BasicInfoSection = ({ form }: BasicInfoSectionProps) => {
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Basic Information</h2>
            <p className="text-muted-foreground">Set the fundamental details for this knowledge item</p>
          </div>
        </div>
      </div>

      {/* Form Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              Identity & Description
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter the knowledge item name" 
                      className="h-10 border-border/60 focus:border-primary transition-colors"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    A clear, descriptive name for this knowledge item
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">URL Slug *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="url-friendly-identifier" 
                      className="h-10 border-border/60 focus:border-primary transition-colors font-mono text-sm"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    Used in the URL. Only letters, numbers, and hyphens allowed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide a brief overview of this knowledge item..." 
                      className="min-h-[100px] border-border/60 focus:border-primary transition-colors resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    A concise summary that will appear in search results and previews
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Publication Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="primary_publication_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Primary Publication</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Select or enter publication..."
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-10 border-border/60 focus:border-primary transition-colors"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    Associate this knowledge item with a specific publication or source
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Publishing Status</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <span>Draft - Only visible to editors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Published - Available to all users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Featured - Highlighted in recommendations</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Complete the required fields to continue</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Step 1 of 6
        </div>
      </div>
    </div>
  );
};