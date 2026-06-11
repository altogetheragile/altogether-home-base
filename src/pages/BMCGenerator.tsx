import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import { SITE_URL } from '@/config/featureFlags';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, ArrowLeft, Save, MessageCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import BusinessModelCanvas, { BusinessModelCanvasRef } from '@/components/bmc/BusinessModelCanvas';
import BMCExportDialog from '@/components/bmc/BMCExportDialog';
import { CoachedBMCEditor } from '@/components/bmc/CoachedBMCEditor';

interface BMCData {
  keyPartners: string[];
  keyActivities: string[];
  keyResources: string[];
  valuePropositions: string[];
  customerRelationships: string[];
  channels: string[];
  customerSegments: string[];
  costStructure: string[];
  revenueStreams: string[];
}

interface FormData {
  companyName: string;
  industry: string;
  targetCustomers: string;
  productService: string;
  businessStage: string;
  additionalContext: string;
}

// Helper to convert string | string[] | undefined to string[]
function toArray(val?: string | string[]): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map(s => `${s}`.replace(/^[-•\s]+/, '').trim()).filter(Boolean);
  }
  // Split on line breaks or bullets, clean bullets/dashes and trim
  return `${val}`
    .split(/\r?\n|•/g)
    .map(s => s.replace(/^[-•\s]+/, '').trim())
    .filter(Boolean);
}

// Normalize raw BMC data to ensure all fields are string arrays
function normalizeBmc(raw: Record<string, string | string[] | undefined>): BMCData {
  return {
    keyPartners: toArray(raw.keyPartners),
    keyActivities: toArray(raw.keyActivities),
    keyResources: toArray(raw.keyResources),
    valuePropositions: toArray(raw.valuePropositions),
    customerRelationships: toArray(raw.customerRelationships),
    channels: toArray(raw.channels),
    customerSegments: toArray(raw.customerSegments),
    costStructure: toArray(raw.costStructure),
    revenueStreams: toArray(raw.revenueStreams),
  };
}

const BMCGenerator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId');
  const { user } = useAuth();
  const bmcRef = useRef<BusinessModelCanvasRef>(null);
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    industry: '',
    targetCustomers: '',
    productService: '',
    businessStage: 'startup',
    additionalContext: ''
  });
  
  const [generatedBMC, setGeneratedBMC] = useState<BMCData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  // Coaching-first: choose how to fill the canvas. 'coach' (conversation) is the
  // recommended path; 'generate' keeps the one-shot AI draft as an accelerator.
  const [mode, setMode] = useState<'choose' | 'coach' | 'generate'>('choose');

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateBMC = async () => {
    if (!formData.companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-business-model-canvas', {
        body: {
          companyName: formData.companyName,
          industry: formData.industry,
          targetCustomers: formData.targetCustomers,
          productService: formData.productService,
          businessStage: formData.businessStage,
          additionalContext: formData.additionalContext,
          templateUrl: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pdf-templates/templates/988f2f19-fe29-49e4-971c-56c0dc9f872c.pdf`
        }
      });

      if (error) throw error;

      // Unwrap { success, data } wrapper from edge function
      const raw = (data && typeof data === 'object' && 'data' in data) ? (data as { data: unknown }).data : data;
      
      // Normalize to ensure all fields are string arrays
      const bmcData = normalizeBmc(raw as Record<string, string | string[] | undefined>);

      setGeneratedBMC(bmcData);
      toast.success('Business Model Canvas generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate BMC');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      industry: '',
      targetCustomers: '',
      productService: '',
      businessStage: 'startup',
      additionalContext: ''
    });
    setGeneratedBMC(null);
  };

  const handleSaveToProject = () => {
    if (!user) {
      toast.error('Please sign in to save to a project');
      navigate('/auth');
      return;
    }
    setSaveDialogOpen(true);
  };

  const handleSaveComplete = (projectId: string, _artifactId: string) => {
    toast.success('BMC saved to project successfully!', {
      action: {
        label: 'View Project',
        onClick: () => navigate(`/projects/${projectId}`),
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Business Model Canvas - Altogether Agile</title>
        <meta name="description" content="Build a Business Model Canvas through a coaching conversation, in your own words, or generate a draft with AI to refine. Export to PNG and PDF." />
        <link rel="canonical" href={`${SITE_URL}/bmc-generator`} />
      </Helmet>
      <Navigation />

      {/* Header with back button */}
      <div className="border-b bg-background sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(preselectedProjectId ? `/projects/${preselectedProjectId}` : '/ai-tools')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {preselectedProjectId ? 'Back to Project' : 'Back to AI Tools'}
            </Button>
            <h2 className="text-xl font-semibold">Business Model Canvas</h2>
          </div>
        </div>
      </div>
      
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Business Model Canvas</h1>
              <p className="text-muted-foreground">
                Build a Business Model Canvas through a coaching conversation, in your own words, or generate a draft with AI to refine.
              </p>
            </div>

            {mode === 'choose' && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="cursor-pointer transition-shadow hover:shadow-lg" onClick={() => setMode('coach')}>
                  <CardHeader>
                    <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Coach me through it</CardTitle>
                    <CardDescription>
                      Fill each block in conversation. The coach asks open questions and offers one gentle stretch per block, and never writes content you did not say. Recommended.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="default">Start coaching <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer transition-shadow hover:shadow-lg" onClick={() => setMode('generate')}>
                  <CardHeader>
                    <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <Sparkles className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <CardTitle>Generate a draft with AI</CardTitle>
                    <CardDescription>
                      Give a few company details and get a first-pass canvas instantly, then edit and refine it. A faster start when you already know the shape.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline">Generate a draft <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {mode === 'coach' && (
              <CoachedBMCEditor
                preselectedProjectId={preselectedProjectId || undefined}
                onBack={() => setMode('choose')}
              />
            )}

            {mode === 'generate' && (!generatedBMC ? (
              <Card>
                <CardHeader>
                  <Button variant="ghost" size="sm" className="mb-2 w-fit -ml-2" onClick={() => setMode('choose')}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Choose a different way
                  </Button>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>
                    Provide details about your company to generate a tailored Business Model Canvas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        placeholder="e.g., Acme Corp"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        placeholder="e.g., Technology, Healthcare"
                        value={formData.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetCustomers">Target Customers</Label>
                      <Input
                        id="targetCustomers"
                        placeholder="e.g., Small businesses, Individuals"
                        value={formData.targetCustomers}
                        onChange={(e) => handleInputChange('targetCustomers', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessStage">Business Stage</Label>
                      <Select
                        value={formData.businessStage}
                        onValueChange={(value) => handleInputChange('businessStage', value)}
                      >
                        <SelectTrigger id="businessStage">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="idea">Idea</SelectItem>
                          <SelectItem value="startup">Startup</SelectItem>
                          <SelectItem value="growth">Growth</SelectItem>
                          <SelectItem value="established">Established</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productService">Product/Service Description</Label>
                    <Input
                      id="productService"
                      placeholder="Brief description of what you offer"
                      value={formData.productService}
                      onChange={(e) => handleInputChange('productService', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalContext">Additional Context (Optional)</Label>
                    <Textarea
                      id="additionalContext"
                      placeholder="Any additional information that might help generate a better BMC..."
                      value={formData.additionalContext}
                      onChange={(e) => handleInputChange('additionalContext', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={generateBMC}
                    disabled={isGenerating || !formData.companyName.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating BMC...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Business Model Canvas
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Your Business Model Canvas</CardTitle>
                        <CardDescription>{formData.companyName}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSaveToProject}>
                          <Save className="h-4 w-4 mr-2" />
                          Save to Project
                        </Button>
                        <Button variant="outline" onClick={resetForm}>
                          Generate New BMC
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Export Dialog */}
                      <div className="flex gap-2">
                        <BMCExportDialog 
                          companyName={formData.companyName}
                          canvasRef={bmcRef}
                          bmcData={generatedBMC}
                        />
                      </div>
                      
                      {/* BMC Canvas Preview */}
                      <div className="border rounded-lg overflow-hidden bg-white p-4">
                        <BusinessModelCanvas
                          ref={bmcRef}
                          data={generatedBMC}
                          companyName={formData.companyName}
                          isEditable={false}
                          showWatermark={!user}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      
      {generatedBMC && (
        <SaveToProjectDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          artifactType="bmc"
          artifactName={`${formData.companyName} - Business Model Canvas`}
          artifactDescription={`Generated BMC for ${formData.companyName}${formData.industry ? ` in ${formData.industry}` : ''}`}
          artifactData={{
            formData,
            bmcData: generatedBMC,
          }}
          preselectedProjectId={preselectedProjectId || undefined}
          onSaveComplete={handleSaveComplete}
        />
      )}
    </div>
  );
};

export default BMCGenerator;
