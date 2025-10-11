import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, RotateCcw, Save, ExternalLink, FileText, Download, RefreshCw, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectMutations } from '@/hooks/useProjects';
import { useCanvasMutations } from '@/hooks/useCanvas';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BusinessModelCanvas, { BusinessModelCanvasRef } from './BusinessModelCanvas';
import BMCExportDialog from './BMCExportDialog';
import { Badge } from '@/components/ui/badge';

const DEFAULT_BMC_TEMPLATE_URL = "https://wqaplkypnetifpqrungv.supabase.co/storage/v1/object/public/pdf-templates/templates/988f2f19-fe29-49e4-971c-56c0dc9f872c.pdf";

interface BMCData {
  keyPartners: string;
  keyActivities: string;
  keyResources: string;
  valuePropositions: string;
  customerRelationships: string;
  channels: string;
  customerSegments: string;
  costStructure: string;
  revenueStreams: string;
}

interface BMCGeneratorDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  projectId?: string;
  saveToCanvas?: boolean;
  onBMCGenerated?: (bmcData: any) => void;
}

const BMCGeneratorDialog: React.FC<BMCGeneratorDialogProps> = ({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  projectId,
  saveToCanvas = false,
  onBMCGenerated,
}) => {
  const GUEST_GENERATION_LIMIT = 3;
  
  // Get hooks first before using them in state initializers
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createProject } = useProjectMutations();
  const { createCanvas } = useCanvasMutations();
  
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnClose ? externalOnClose : setInternalIsOpen;
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedBMC, setGeneratedBMC] = useState<BMCData | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [filledPdfUrl, setFilledPdfUrl] = useState<string | null>(null);
  const [isFillingPdf, setIsFillingPdf] = useState(false);
  const canvasRef = useRef<BusinessModelCanvasRef>(null);
  const [bmcTemplate, setBmcTemplate] = useState<{ url: string; title: string } | null>(null);
  const [usingDefaultTemplate, setUsingDefaultTemplate] = useState(false);
  const [guestGenerationCount, setGuestGenerationCount] = useState(() => {
    if (typeof window !== 'undefined' && !user) {
      return parseInt(localStorage.getItem('guestBMCCount') || '0');
    }
    return 0;
  });
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    targetCustomers: '',
    productService: '',
    businessStage: 'startup',
    additionalContext: ''
  });

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Education', 
    'Manufacturing', 'Consulting', 'Entertainment', 'Food & Beverage',
    'Real Estate', 'Transportation', 'Energy', 'Agriculture', 'SaaS',
    'E-commerce', 'Fintech', 'AI/Machine Learning', 'Biotech', 'Other'
  ];

  const businessStages = [
    { value: 'startup', label: 'Startup (Idea/Early Stage)' },
    { value: 'growth', label: 'Growth Stage' },
    { value: 'established', label: 'Established Business' },
    { value: 'pivot', label: 'Pivoting/Transformation' }
  ];

  // Fetch BMC template from Knowledge Base
  useEffect(() => {
    const fetchBMCTemplate = async () => {
      try {
        const { data, error } = await supabase
          .from('knowledge_item_templates')
          .select(`
            template_id,
            knowledge_templates:template_id (
              pdf_url,
              title
            )
          `)
          .eq('knowledge_item_id', '2c82f234-71f9-43a2-b6c2-6d7f785f3540')
          .limit(1)
          .maybeSingle();

        if (error || !data?.knowledge_templates) {
          console.log('[BMC] Using default template fallback');
          setBmcTemplate({ url: DEFAULT_BMC_TEMPLATE_URL, title: "Business Model Canvas (Default)" });
          setUsingDefaultTemplate(true);
          toast({
            title: "Using default template",
            description: "Template loaded from storage",
          });
          return;
        }

        const template = Array.isArray(data.knowledge_templates) 
          ? data.knowledge_templates[0] 
          : data.knowledge_templates;
        
        if (template?.pdf_url) {
          setBmcTemplate({
            url: template.pdf_url,
            title: template.title || 'Business Model Canvas Template'
          });
          setUsingDefaultTemplate(false);
          toast({
            title: "Template loaded",
            description: template.title || 'Business Model Canvas Template',
          });
        } else {
          setBmcTemplate({ url: DEFAULT_BMC_TEMPLATE_URL, title: "Business Model Canvas (Default)" });
          setUsingDefaultTemplate(true);
        }
      } catch (error) {
        console.error('[BMC] Error fetching template:', error);
        setBmcTemplate({ url: DEFAULT_BMC_TEMPLATE_URL, title: "Business Model Canvas (Default)" });
        setUsingDefaultTemplate(true);
      }
    };

    fetchBMCTemplate();
  }, [toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Close any open dropdowns when dialog opens
  const handleDialogOpen = (open: boolean) => {
    if (open) {
      // Close any open dropdowns by clicking elsewhere
      const event = new MouseEvent('click', { bubbles: true });
      document.body.dispatchEvent(event);
    }
    if (externalOnClose) {
      if (!open) externalOnClose();
    } else {
      setInternalIsOpen(open);
    }
  };

  const normalizeBMCData = (bmcData: BMCData): any => {
    const normalizeSection = (text: string | undefined): string[] => {
      if (!text) return [];
      
      return text
        .split(/[•\n;,]/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .filter((item, index, arr) => arr.indexOf(item) === index)
        .slice(0, 10);
    };

    return {
      keyPartners: normalizeSection(bmcData.keyPartners),
      keyActivities: normalizeSection(bmcData.keyActivities),
      keyResources: normalizeSection(bmcData.keyResources),
      valuePropositions: normalizeSection(bmcData.valuePropositions),
      customerRelationships: normalizeSection(bmcData.customerRelationships),
      channels: normalizeSection(bmcData.channels),
      customerSegments: normalizeSection(bmcData.customerSegments),
      costStructure: normalizeSection(bmcData.costStructure),
      revenueStreams: normalizeSection(bmcData.revenueStreams),
    };
  };

  const generateBMC = async (retryCount = 0) => {
    // Check generation limit for guest users
    if (!user && guestGenerationCount >= GUEST_GENERATION_LIMIT) {
      toast({
        title: "Generation Limit Reached",
        description: `You've used all ${GUEST_GENERATION_LIMIT} free generations. Sign up for unlimited access!`,
        action: (
          <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
            Sign Up Free
          </Button>
        )
      });
      return;
    }

    if (!formData.companyName || !formData.industry || !formData.targetCustomers || !formData.productService) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to generate a comprehensive BMC",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedBMC(null);
    setFilledPdfUrl(null);
    
    try {
      console.log('[BMC] Starting generation request...');
      console.log('[BMC] Form data:', formData);
      
      // Add timeout to detect hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error('[BMC] Request timeout after 60 seconds');
      }, 60000); // 60 second timeout
      
      const { data, error } = await supabase.functions.invoke('generate-business-model-canvas', {
        body: {
          companyName: formData.companyName,
          industry: formData.industry,
          targetCustomers: formData.targetCustomers,
          productService: formData.productService,
          businessStage: formData.businessStage,
          additionalContext: formData.additionalContext,
          templateTitle: bmcTemplate?.title,
          templateUrl: bmcTemplate?.url
        }
      });
      
      clearTimeout(timeoutId);
      console.log('[BMC] Edge function response received:', { data, error });

      if (error) {
        console.error('[BMC] Edge function error:', error);
        
        if (error.message?.includes('Failed to send a request') && retryCount < 2) {
          console.log(`[BMC] Retrying... (attempt ${retryCount + 1}/2)`);
          await new Promise(resolve => setTimeout(resolve, 800));
          return generateBMC(retryCount + 1);
        }
        
        throw new Error(error.message || 'Edge function call failed');
      }

      const raw = typeof data === "string" ? JSON.parse(data) : data;
      console.log('[BMC] Parsed response:', raw);
      
      if (!raw?.success) {
        console.error('[BMC] Generation failed:', raw?.error);
        throw new Error(raw?.error || 'AI failed to generate BMC. Please try again.');
      }

      const bmcData = raw.data;
      console.log('[BMC] ✅ BMC data extracted:', bmcData);
      const normalizedBMC = normalizeBMCData(bmcData);
      setGeneratedBMC(bmcData);
      setCompanyName(formData.companyName);
      
      toast({
        title: "Business Model Canvas generated!",
        description: "Creating PDF...",
      });
      
      // Fill the PDF with the normalized data
      await fillPDFWithData(normalizedBMC);
      
      // Increment guest generation count
      if (!user) {
        const newCount = guestGenerationCount + 1;
        setGuestGenerationCount(newCount);
        localStorage.setItem('guestBMCCount', newCount.toString());
      }
      
      // If canvas integration is enabled, pass the data back
      if (saveToCanvas && onBMCGenerated) {
        onBMCGenerated({
          companyName: formData.companyName,
          bmcData: bmcData
        });
        externalOnClose?.();
        return;
      }
      
      toast({
        title: "🎉 BMC Generated Successfully!",
        description: "Your strategic Business Model Canvas is ready for review and export"
      });
    } catch (error) {
      console.error('[BMC] ❌ Generation error:', error);
      
      let errorMessage = 'Unknown error occurred';
      let errorTitle = 'Generation Failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more specific error messages
        if (error.name === 'AbortError' || errorMessage.includes('aborted')) {
          errorTitle = 'Request Timeout';
          errorMessage = 'The request took too long. Please try again or simplify your inputs.';
        } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
          errorTitle = 'Network Error';
          errorMessage = 'Unable to connect to the AI service. Please check your internet connection and try again.';
        } else if (errorMessage.includes('rate limit')) {
          errorTitle = 'Rate Limit Exceeded';
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const fillPDFWithData = async (bmcDataArrays: any, retryCount = 0) => {
    if (!bmcTemplate?.url) {
      console.error('[BMC] No template URL available');
      toast({
        title: "Template error",
        description: "No template available for PDF generation",
        variant: "destructive",
      });
      return;
    }

    setIsFillingPdf(true);
    console.log('[BMC] Filling PDF with data...');
    console.log('[BMC] Template URL:', bmcTemplate.url);

    try {
      const { data: pdfData, error: pdfError } = await supabase.functions.invoke(
        'fill-bmc-pdf',
        {
          body: {
            bmcData: bmcDataArrays,
            templateUrl: bmcTemplate.url,
            companyName: formData.companyName,
          },
        }
      );

      if (pdfError) {
        console.error('[BMC] PDF fill error:', pdfError);
        
        if (pdfError.message?.includes('Failed to send a request') && retryCount < 2) {
          console.log(`[BMC] Retrying PDF fill... (attempt ${retryCount + 1}/2)`);
          await new Promise(resolve => setTimeout(resolve, 800));
          return fillPDFWithData(bmcDataArrays, retryCount + 1);
        }
        
        throw pdfError;
      }

      if (pdfData?.pdfDataUrl) {
        console.log('[BMC] ✅ PDF filled successfully');
        setFilledPdfUrl(pdfData.pdfDataUrl);
        toast({
          title: "PDF created",
          description: "Your Business Model Canvas is ready",
        });
      }
    } catch (error: any) {
      console.error('[BMC] ❌ PDF fill error:', error);
      toast({
        title: "PDF generation failed",
        description: error.message || "Could not create PDF from template",
        variant: "destructive",
      });
    } finally {
      setIsFillingPdf(false);
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
    setCompanyName('');
    setFilledPdfUrl(null);
  };

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const saveAsProject = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your BMC as a project",
        variant: "destructive"
      });
      return;
    }

    if (!generatedBMC) {
      toast({
        title: "No BMC Generated",
        description: "Please generate a BMC first before saving as project",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Create the project
      const projectResult = await createProject.mutateAsync({
        name: `${companyName} - Business Model Canvas`,
        description: `AI-generated Business Model Canvas for ${companyName} in the ${formData.industry} industry`,
        color_theme: '#F97316'
      });

      // Create the canvas with BMC data
      const bmcElement = {
        id: crypto.randomUUID(),
        type: 'bmc' as const,
        position: { x: 100, y: 100 },
        size: { width: 800, height: 600 },
        content: {
          companyName,
          bmcData: generatedBMC
        }
      };

      await createCanvas.mutateAsync({
        projectId: projectResult.id,
        data: {
          elements: [bmcElement],
          metadata: {
            generatedAt: new Date().toISOString(),
            source: 'AI BMC Generator'
          }
        }
      });

      toast({
        title: "🎉 Project Created!",
        description: `${companyName} BMC has been saved as a project and you can now collaborate on it.`
      });

      // Navigate to the project canvas
      navigate(`/projects/${projectResult.id}/canvas`);
      setIsOpen(false);
      
    } catch (error) {
      console.error('Error saving BMC as project:', error);
      toast({
        title: "Save Failed",
        description: "Unable to save BMC as project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      {!externalOnClose && (
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-bmc-orange/30 hover:bg-bmc-orange/10 text-bmc-orange-dark hover:text-bmc-orange-dark"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI BMC Generator
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="max-w-7xl h-[98vh] overflow-y-auto bg-background border-2 shadow-2xl p-3">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-bold text-bmc-orange-dark flex items-center">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Business Model Canvas Generator
          </DialogTitle>
          <DialogDescription>
            Provide company information to generate an AI-powered Business Model Canvas
          </DialogDescription>
        </DialogHeader>
        
        {!generatedBMC ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-bmc-orange/10 to-bmc-orange-light/10 p-4 rounded-lg border border-bmc-orange/30 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-bmc-text">
                    <strong>✨ Enhanced AI Generation:</strong> Our GPT-5 powered system creates strategic, 
                    industry-specific Business Model Canvases with actionable insights and competitive analysis.
                  </p>
                  {bmcTemplate && (
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="bg-bmc-orange/10 border-bmc-orange/30 text-bmc-orange-dark">
                        <FileText className="h-3 w-3 mr-1" />
                        Based on {bmcTemplate.title}
                      </Badge>
                    </div>
                  )}
                </div>
                {bmcTemplate && (
                  <div className="flex items-center gap-2">
                    {usingDefaultTemplate && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        Using default template
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(bmcTemplate.url, '_blank')}
                      className="border-bmc-orange/30 text-bmc-text hover:bg-bmc-orange/10"
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      View Template
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-bmc-text font-semibold">
                  Company Name *
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="e.g., TechStart Inc."
                  className="border-bmc-orange/30 focus:border-bmc-orange focus:ring-bmc-orange/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry" className="text-bmc-text font-semibold">
                  Industry *
                </Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => handleInputChange('industry', value)}
                >
                  <SelectTrigger className="border-bmc-orange/30 focus:border-bmc-orange focus:ring-bmc-orange/20">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetCustomers" className="text-bmc-text font-semibold">
                  Target Customers *
                </Label>
                <Input
                  id="targetCustomers"
                  value={formData.targetCustomers}
                  onChange={(e) => handleInputChange('targetCustomers', e.target.value)}
                  placeholder="e.g., Small business owners, millennials, enterprises"
                  className="border-bmc-orange/30 focus:border-bmc-orange focus:ring-bmc-orange/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessStage" className="text-bmc-text font-semibold">
                  Business Stage
                </Label>
                <Select
                  value={formData.businessStage}
                  onValueChange={(value) => handleInputChange('businessStage', value)}
                >
                  <SelectTrigger className="border-bmc-orange/30 focus:border-bmc-orange focus:ring-bmc-orange/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {businessStages.map(stage => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productService" className="text-bmc-text font-semibold">
                Product/Service Description *
              </Label>
              <Textarea
                id="productService"
                value={formData.productService}
                onChange={(e) => handleInputChange('productService', e.target.value)}
                placeholder="Describe what your company offers, its key features, and competitive advantages..."
                className="min-h-24 border-bmc-orange/30 focus:border-bmc-orange focus:ring-bmc-orange/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalContext" className="text-bmc-text font-semibold">
                Additional Context (Optional)
              </Label>
              <Textarea
                id="additionalContext"
                value={formData.additionalContext}
                onChange={(e) => handleInputChange('additionalContext', e.target.value)}
                placeholder="Market size, competitive landscape, unique challenges, funding stage, partnerships..."
                className="min-h-20 border-bmc-orange/30 focus:border-bmc-orange focus:ring-bmc-orange/20"
              />
            </div>

            <div className="space-y-3">
              {!user && (
                <div className="bg-muted/50 border border-border rounded-lg p-3">
                  <p className="text-sm text-center text-muted-foreground">
                    <strong>{GUEST_GENERATION_LIMIT - guestGenerationCount}</strong> free generation{GUEST_GENERATION_LIMIT - guestGenerationCount !== 1 ? 's' : ''} remaining.{' '}
                    <Button variant="link" size="sm" className="h-auto p-0 text-primary" onClick={() => navigate('/auth')}>
                      Sign up for unlimited
                    </Button>
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (externalOnClose) {
                      externalOnClose();
                    } else {
                      setInternalIsOpen(false);
                    }
                  }}
                  className="border-bmc-orange/30 text-bmc-text hover:bg-bmc-orange/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => generateBMC()}
                  disabled={isGenerating || (!user && guestGenerationCount >= GUEST_GENERATION_LIMIT)}
                  className="bg-gradient-to-r from-bmc-orange to-bmc-orange-dark hover:from-bmc-orange-dark hover:to-bmc-orange text-white px-8"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Strategic BMC...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate BMC
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {isFillingPdf ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-bmc-orange" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-bmc-text">Creating Your Professional PDF...</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Filling your Business Model Canvas template with AI-generated content
                  </p>
                </div>
              </div>
            ) : filledPdfUrl ? (
              <div className="space-y-4">
                <div className="bg-bmc-orange/10 border border-bmc-orange/30 rounded-lg p-4">
                  <p className="text-sm text-bmc-text">
                    <strong>✨ Your Professional BMC is Ready!</strong> The PDF has been filled with your AI-generated content.
                  </p>
                </div>
                <div className="border-2 border-bmc-orange/30 rounded-lg overflow-hidden shadow-lg bg-white">
                  <iframe
                    src={filledPdfUrl}
                    className="w-full h-[600px] border-none"
                    title={`Business Model Canvas - ${companyName}`}
                  />
                </div>
              </div>
            ) : (
              <BusinessModelCanvas
                ref={canvasRef}
                data={generatedBMC}
                companyName={companyName}
                isEditable={true}
                onDataChange={setGeneratedBMC}
              />
            )}
            
            <div className="flex justify-between items-center pt-4 border-t border-bmc-orange/20">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="border-bmc-orange/30 text-bmc-text hover:bg-bmc-orange/10"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Generate New BMC
                </Button>
                {generatedBMC && (
                  <Button
                    onClick={() => fillPDFWithData(normalizeBMCData(generatedBMC))}
                    variant="outline"
                    disabled={isFillingPdf}
                    className="border-bmc-orange/30 text-bmc-text hover:bg-bmc-orange/10"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isFillingPdf ? 'animate-spin' : ''}`} />
                    Re-Fill PDF
                  </Button>
                )}
                {filledPdfUrl && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = filledPdfUrl;
                      link.download = `${companyName || 'BMC'}-Business-Model-Canvas.pdf`;
                      link.click();
                      toast({
                        title: "Download Started",
                        description: "Your Business Model Canvas PDF is downloading"
                      });
                    }}
                    className="border-bmc-orange text-bmc-orange-dark hover:bg-bmc-orange/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-2">
                {!filledPdfUrl && (
                  <BMCExportDialog 
                    companyName={companyName} 
                    canvasRef={canvasRef}
                  />
                )}
                {user && (
                  <Button
                    onClick={saveAsProject}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving as Project...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save as Project
                      </>
                    )}
                  </Button>
                )}
                {!user && (
                  <Button
                    onClick={() => {
                      toast({
                        title: "Sign In Required",
                        description: "Please sign in to save BMC as a project"
                      });
                    }}
                    variant="outline"
                    className="border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save as Project (Sign In)
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-bmc-orange/30 text-bmc-text hover:bg-bmc-orange/10"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BMCGeneratorDialog;