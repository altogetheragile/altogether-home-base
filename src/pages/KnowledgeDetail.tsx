import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useKnowledgeItemBySlug, useUpdateKnowledgeItem, useCreateKnowledgeItem } from "@/hooks/useKnowledgeItems";
import { useKnowledgeUseCases } from "@/hooks/useKnowledgeUseCases";
import { useKnowledgeItemTemplates } from "@/hooks/useKnowledgeItemTemplates";
import { useKnowledgeItemUnifiedAssets } from "@/hooks/useUnifiedAssetManager";
import { useKnowledgeItemSteps } from "@/hooks/useKnowledgeItemSteps";
import { useKnowledgeItemComments } from "@/hooks/useKnowledgeItemComments";
import { useViewTracking } from "@/hooks/useViewTracking";
import { KnowledgeItemComments } from "@/components/knowledge/KnowledgeItemComments";
import { KnowledgeReadView } from "@/components/knowledge/KnowledgeReadView";
import { KnowledgeEditView } from "@/components/knowledge/KnowledgeEditView";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { 
  ArrowLeft, FileText, Download, Image as ImageIcon, Video, BookOpen, 
  ExternalLink, Pencil, ListOrdered, MessageCircle, ImagePlus,
  X, Save, Loader2, Plus
} from "lucide-react";
import { format } from "date-fns";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { HowToSection } from "@/components/admin/knowledge/editor/sections/HowToSection";
import { UseCasesSection } from "@/components/admin/knowledge/editor/sections/UseCasesSection";
import { knowledgeItemDefaults, type KnowledgeItemFormData } from "@/schemas/knowledgeItem";

// Use the schema type for form data
type FormData = KnowledgeItemFormData & { id?: string };

const KnowledgeDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromProjectModel = searchParams.get('from') === 'project-model';
  const artifactId = searchParams.get('artifactId');
  const projectId = searchParams.get('projectId');
  const { toast } = useToast();
  
  // Detect if this is the "new" route
  const isNewItem = location.pathname === '/knowledge/new';
  
  // Determine back URL based on context
  const backUrl = fromProjectModel && artifactId && projectId
    ? `/projects/${projectId}/artifacts/${artifactId}`
    : fromProjectModel
    ? '/project-modelling'
    : '/knowledge';
  
  // Only fetch if we have a slug (not creating new)
  const { data: item, isLoading, error } = useKnowledgeItemBySlug(isNewItem ? '' : slug!);
  const { data: useCases } = useKnowledgeUseCases(item?.id);
  const { data: templates } = useKnowledgeItemTemplates(item?.id || '');
  const { data: mediaAssets } = useKnowledgeItemUnifiedAssets(item?.id);
  const { data: steps } = useKnowledgeItemSteps(item?.id);
  const { commentCount } = useKnowledgeItemComments(item?.id || '');
  useViewTracking(item?.id || '');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { data: userRole } = useUserRole();
  const isAdmin = userRole === 'admin';

  // Edit mode state - start in edit mode if creating new
  const [isEditMode, setIsEditMode] = useState(isNewItem);
  const [isSaving, setIsSaving] = useState(false);
  const updateKnowledgeItem = useUpdateKnowledgeItem();
  const createKnowledgeItem = useCreateKnowledgeItem();

  // Form setup with defaults from schema
  const form = useForm<FormData>({
    defaultValues: {
      ...knowledgeItemDefaults,
      id: '',
    }
  });

  // Initialize form when item loads or edit mode activates
  useEffect(() => {
    if (isNewItem) {
      form.reset({ ...knowledgeItemDefaults, id: '' });
    } else if (item && isEditMode) {
      // Get primary IDs from classifications
      const primaryCategory = item.categories?.find(c => c.is_primary);
      const primaryDecisionLevel = item.decision_levels?.find(d => d.is_primary);
      const primaryDomain = item.domains?.find(d => d.is_primary);
      
      form.reset({
        ...knowledgeItemDefaults,
        id: item.id,
        name: item.name || '',
        slug: item.slug || '',
        description: item.description || '',
        background: item.background || '',
        item_type: (item as any).item_type || 'technique',
        why_it_exists: (item as any).why_it_exists || '',
        typical_output: (item as any).typical_output || '',
        use_this_when: (item as any).use_this_when || [],
        avoid_when: (item as any).avoid_when || [],
        decisions_supported: (item as any).decisions_supported || [],
        what_good_looks_like: (item as any).what_good_looks_like || [],
        decision_boundaries: (item as any).decision_boundaries || '',
        governance_value: (item as any).governance_value || '',
        decision_level_ids: item.decision_levels?.map(d => d.id) || [],
        category_ids: item.categories?.map(c => c.id) || [],
        domain_ids: item.domains?.map(d => d.id) || [],
        tag_ids: item.tags?.map(t => t.id) || [],
        primary_category_id: primaryCategory?.id || null,
        primary_decision_level_id: primaryDecisionLevel?.id || null,
        primary_domain_id: primaryDomain?.id || null,
        category_rationale: primaryCategory?.rationale || '',
        decision_level_rationale: primaryDecisionLevel?.rationale || '',
        domain_rationale: primaryDomain?.rationale || '',
      });
    }
  }, [item, isEditMode, form, isNewItem]);

  const filteredMediaAssets = (mediaAssets || []).filter((asset: any) => !asset.is_template);
  const imageAssets = filteredMediaAssets.filter((asset: any) => asset.type === 'image');

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleEnterEditMode = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    if (isNewItem) {
      // Navigate back to knowledge list when canceling new item
      navigate('/knowledge');
    } else {
      setIsEditMode(false);
      form.reset();
    }
  };

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  };

  const handleSave = async () => {
    const formValues = form.getValues();
    
    // Validate name is required
    if (!formValues.name?.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the knowledge item",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      // Build the data object with all fields including primary/rationale
      const itemData = {
        name: formValues.name,
        slug: formValues.slug || generateSlug(formValues.name),
        description: formValues.description,
        background: formValues.background,
        item_type: formValues.item_type,
        why_it_exists: formValues.why_it_exists,
        typical_output: formValues.typical_output,
        use_this_when: formValues.use_this_when,
        avoid_when: formValues.avoid_when,
        decisions_supported: formValues.decisions_supported,
        what_good_looks_like: formValues.what_good_looks_like,
        decision_boundaries: formValues.decision_boundaries,
        governance_value: formValues.governance_value,
        decision_level_ids: formValues.decision_level_ids,
        category_ids: formValues.category_ids,
        domain_ids: formValues.domain_ids,
        tag_ids: formValues.tag_ids,
        // Primary classification support
        primary_decision_level_id: formValues.primary_decision_level_id,
        primary_category_id: formValues.primary_category_id,
        primary_domain_id: formValues.primary_domain_id,
        decision_level_rationale: formValues.decision_level_rationale,
        category_rationale: formValues.category_rationale,
        domain_rationale: formValues.domain_rationale,
        is_published: true,
      };

      if (isNewItem) {
        // Create new knowledge item
        const newItem = await createKnowledgeItem.mutateAsync(itemData);
        
        toast({
          title: "Knowledge item created",
          description: "Your new knowledge item has been created successfully",
        });
        
        // Navigate to the newly created item
        navigate(`/knowledge/${newItem.slug}`);
      } else if (item?.id) {
        // Update existing item
        await updateKnowledgeItem.mutateAsync({
          id: item.id,
          ...itemData,
        });
        
        toast({
          title: "Changes saved",
          description: "Knowledge item updated successfully",
        });
        setIsEditMode(false);
      }
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({
        title: "Error saving",
        description: error.message || "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading only for existing items
  if (!isNewItem && isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </main>
        <Footer />
      </div>
    );
  }

  // Show error only for existing items that fail to load
  if (!isNewItem && (error || !item)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Knowledge Item Not Found</h1>
            <p className="text-muted-foreground mb-6">The item you're looking for doesn't exist.</p>
            <Button asChild>
              <Link to={backUrl}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        
        <main className="flex-1 pb-20">
          {/* Breadcrumb */}
          <div className="border-b bg-muted/20">
            <div className="container mx-auto px-4 py-4 flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to={backUrl} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div className="h-5 w-px bg-border/60" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/knowledge">Knowledge Base</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{isNewItem ? 'New Knowledge Item' : item?.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              
              {/* Edit Mode Indicator */}
              {isEditMode && (
                <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary">
                  {isNewItem ? (
                    <>
                      <Plus className="h-3 w-3 mr-1" />
                      Creating
                    </>
                  ) : (
                    <>
                      <Pencil className="h-3 w-3 mr-1" />
                      Editing
                    </>
                  )}
                </Badge>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-background">
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2">
                  {/* Edit Button for View Mode */}
                  {isAdmin && !isEditMode && !isNewItem && (
                    <div className="flex justify-end mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEnterEditMode}
                        className="flex items-center gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  )}

                  {/* Read View or Edit View */}
                  {isEditMode ? (
                    <KnowledgeEditView isNewItem={isNewItem} />
                  ) : item ? (
                    <KnowledgeReadView 
                      item={item} 
                      steps={steps}
                    />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Loading...</p>
                    </div>
                  )}
                </div>

                {/* Right Column - Templates & Tools Card */}
                <div className="lg:col-span-1">
                  <Card className="bg-orange-50/30 border-orange-200 sticky top-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-orange-900">
                        <FileText className="h-4 w-4 text-orange-600" />
                        Templates & Tools
                      </CardTitle>
                      <CardDescription className="text-xs text-orange-700">
                        Ready-to-use templates and practical tools
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {templates && templates.length > 0 ? (
                        templates.map((assoc: any) => (
                          <div key={assoc.id} className="space-y-3 pb-4 border-b border-orange-200 last:border-0 last:pb-0">
                            <div className="flex items-start gap-2">
                              <FileText className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-orange-900 mb-1">
                                  {assoc.template?.title || 'Untitled Template'}
                                </h4>
                                {assoc.template?.description && (
                                  <p className="text-xs text-orange-700 line-clamp-2">
                                    {assoc.template.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            {assoc.template?.pdf_url && (
                              <Button
                                variant="default"
                                size="sm"
                                className="w-full bg-orange-600 hover:bg-orange-700"
                                asChild
                              >
                                <a 
                                  href={assoc.template.pdf_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <Download className="mr-2 h-3 w-3" />
                                  Download Template
                                </a>
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-orange-700/70 italic">
                          No templates available yet for this knowledge item.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Metadata Card - only for existing items */}
                  {!isNewItem && item && !isEditMode && (
                    <Card className="mt-4">
                      <CardContent className="pt-4">
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>Last updated:</span>
                            <span className="font-medium">{format(new Date(item.updated_at), 'MMM d, yyyy')}</span>
                          </div>
                          {item.source && (
                            <div className="flex items-center gap-2">
                              <ExternalLink className="w-3 h-3" />
                              <span>Source: {item.source}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Content Tabs - Only show when not in edit mode */}
          {!isEditMode && item && (
            <div className="container mx-auto px-4 py-8 border-t">
              <Tabs defaultValue="background" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                  <TabsTrigger 
                    value="background" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Background
                  </TabsTrigger>
                  <TabsTrigger 
                    value="use-cases"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Use Cases
                    {useCases && useCases.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {useCases.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="how-to"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    <ListOrdered className="mr-2 h-4 w-4" />
                    How-To
                    {steps && steps.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {steps.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="images"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Media
                    {filteredMediaAssets.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {filteredMediaAssets.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="comments"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Comments
                    {commentCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {commentCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Background Tab */}
                <TabsContent value="background" className="mt-6">
                  {item.background ? (
                    <div 
                      className="prose prose-sm sm:prose lg:prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary prose-a:underline prose-img:rounded-lg prose-img:shadow-md"
                      dangerouslySetInnerHTML={{ __html: item.background }}
                    />
                  ) : (
                    <p className="text-muted-foreground">No background information available.</p>
                  )}
                </TabsContent>

                {/* Use Cases Tab */}
                <TabsContent value="use-cases" className="mt-6">
                  {useCases && useCases.length > 0 ? (
                    <div className="space-y-4">
                      {useCases.map((useCase) => (
                        <div key={useCase.id} className="border rounded-lg p-6 space-y-4 bg-muted/20">
                          {useCase.title && (
                            <h4 className="text-base font-semibold">{useCase.title}</h4>
                          )}
                          {useCase.summary && (
                            <p className="text-muted-foreground">{useCase.summary}</p>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {useCase.what && (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-primary uppercase tracking-wider">What</div>
                                <p className="text-sm">{useCase.what}</p>
                              </div>
                            )}
                            {useCase.why && (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-primary uppercase tracking-wider">Why</div>
                                <p className="text-sm">{useCase.why}</p>
                              </div>
                            )}
                            {useCase.when_used && (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-primary uppercase tracking-wider">When</div>
                                <p className="text-sm">{useCase.when_used}</p>
                              </div>
                            )}
                            {useCase.who && (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-primary uppercase tracking-wider">Who</div>
                                <p className="text-sm">{useCase.who}</p>
                              </div>
                            )}
                            {useCase.how && (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-primary uppercase tracking-wider">How</div>
                                <p className="text-sm">{useCase.how}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No use cases available yet.</p>
                  )}
                </TabsContent>

                {/* How-To Tab */}
                <TabsContent value="how-to" className="mt-6">
                  {steps && steps.length > 0 ? (
                    <div className="space-y-4">
                      {steps.map((step, index) => (
                        <div key={step.id} className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 pt-1">
                            <h4 className="font-semibold mb-1">{step.title}</h4>
                            {step.description && (
                              <p className="text-sm text-muted-foreground">{step.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No step-by-step instructions available.</p>
                  )}
                </TabsContent>

                {/* Media Tab */}
                <TabsContent value="images" className="mt-6">
                  {filteredMediaAssets.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No media available for this item
                      </p>
                      {isAdmin && item && (
                        <Button asChild variant="default" className="flex items-center gap-2 mx-auto">
                          <Link to={`/admin/media?attachTo=${item.id}`}>
                            <ImagePlus className="h-4 w-4" />
                            Attach Media
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredMediaAssets.map((asset: any, index: number) => (
                        <div 
                          key={asset.id} 
                          className="relative aspect-video rounded-lg overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => asset.type === 'image' && openLightbox(imageAssets.findIndex((img: any) => img.id === asset.id))}
                        >
                          {asset.type === 'image' ? (
                            <img
                              src={asset.url}
                              alt={asset.title || asset.file_name || 'Knowledge item media'}
                              className="w-full h-full object-cover"
                            />
                          ) : asset.type === 'video' ? (
                            <video
                              src={asset.url}
                              className="w-full h-full object-cover"
                              controls
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-muted">
                              <FileText className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          {asset.title && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                              <p className="text-white text-sm font-medium">{asset.title}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Comments Tab */}
                <TabsContent value="comments" className="mt-6">
                  <KnowledgeItemComments knowledgeItemId={item.id} />
                </TabsContent>

                <ImageLightbox
                  images={imageAssets.map((asset: any) => ({
                    url: asset.url,
                    title: asset.title,
                    description: asset.description,
                  }))}
                  currentIndex={lightboxIndex}
                  open={lightboxOpen}
                  onOpenChange={setLightboxOpen}
                  onNavigate={setLightboxIndex}
                />
              </Tabs>
            </div>
          )}

          {/* Back Button - Only show when not editing */}
          {!isEditMode && (
            <div className="container mx-auto px-4 pb-8">
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Knowledge Base
              </Button>
            </div>
          )}
        </main>
        
        {/* Floating Edit Mode Actions */}
        {isEditMode && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isNewItem ? (
                  <>
                    <Plus className="h-4 w-4 inline mr-2" />
                    Creating a new knowledge item
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4 inline mr-2" />
                    You're editing this knowledge item
                  </>
                )}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isNewItem ? 'Create Knowledge Item' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {!isEditMode && <Footer />}
      </div>
    </FormProvider>
  );
};

export default KnowledgeDetail;
