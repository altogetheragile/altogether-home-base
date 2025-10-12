import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, RotateCcw, Save, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectMutations } from '@/hooks/useProjects';
import { useCanvasMutations } from '@/hooks/useCanvas';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BusinessModelCanvas, { BusinessModelCanvasRef } from './BusinessModelCanvas';
import BMCExportDialog from './BMCExportDialog';

interface BMCData {
  keyPartners: string | string[];
  keyActivities: string | string[];
  keyResources: string | string[];
  valuePropositions: string | string[];
  customerRelationships: string | string[];
  channels: string | string[];
  customerSegments: string | string[];
  costStructure: string | string[];
  revenueStreams: string | string[];
}

const BMCGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedBMC, setGeneratedBMC] = useState<BMCData | null>(null);
  const [companyName, setCompanyName] = useState('');
  const canvasRef = useRef<BusinessModelCanvasRef>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    targetCustomers: '',
    productService: '',
    businessStage: 'startup',
    additionalContext: ''
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createProject } = useProjectMutations();
  const { createCanvas } = useCanvasMutations();

  // Restore BMC data from sessionStorage on mount
  useEffect(() => {
    const stash = sessionStorage.getItem('bmc:resume');
    if (stash) {
      try {
        const parsed = JSON.parse(stash);
        if (parsed?.generatedBMC) {
          setGeneratedBMC(parsed.generatedBMC);
          if (parsed?.companyName) setCompanyName(parsed.companyName);
          if (parsed?.formData) setFormData(parsed.formData);
          toast({
            title: "Welcome back!",
            description: "Your BMC has been restored. You can now save it.",
          });
        }
      } catch (err) {
        console.error('Failed to restore BMC:', err);
      }
      sessionStorage.removeItem('bmc:resume');
    }
  }, []);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateBMC = async () => {
    if (!formData.companyName || !formData.industry || !formData.targetCustomers || !formData.productService) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to generate a comprehensive BMC",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Calling BMC generation with data:', formData);
      
      const { data, error } = await supabase.functions.invoke('generate-business-model-canvas', {
        body: {
          companyName: formData.companyName,
          industry: formData.industry,
          targetCustomers: formData.targetCustomers,
          productService: formData.productService,
          businessStage: formData.businessStage,
          additionalContext: formData.additionalContext
        }
      });

      if (error) {
        console.error('[BMC] Edge function error:', error);
        throw new Error(error.message ?? 'Edge function failed');
      }

      const raw = typeof data === "string" ? JSON.parse(data) : data;
      if (!raw?.success) {
        console.error('[BMC] LLM parsing failed:', raw?.error, raw?.raw?.slice?.(0, 400));
        throw new Error('AI response could not be parsed. Please try again.');
      }

      const bmcData = raw.data;
      console.debug("[BMC] extracted BMC:", bmcData);
      setGeneratedBMC(bmcData);
      setCompanyName(formData.companyName);
      toast({
        title: "🎉 BMC Generated Successfully!",
        description: "Your strategic Business Model Canvas is ready for review and export"
      });
    } catch (error) {
      console.error('Error generating BMC:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Generation Failed",
        description: `Unable to generate BMC: ${errorMessage}. Please check your inputs and try again.`,
        variant: "destructive"
      });
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
    setCompanyName('');
  };

  const downloadBlankTemplate = () => {
    const templateUrl = 'https://wqaplkypnetifpqrungv.supabase.co/storage/v1/object/public/pdf-templates/templates/988f2f19-fe29-49e4-971c-56c0dc9f872c.pdf';
    window.open(templateUrl, '_blank');
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
      const projectResult = await createProject.mutateAsync({
        name: `${companyName} - Business Model Canvas`,
        description: `AI-generated Business Model Canvas for ${companyName} in the ${formData.industry} industry`,
        color_theme: '#F97316'
      });

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
        title: "🎉 BMC Saved Successfully!",
        description: `${companyName} is now in your projects.`,
      });
      
      navigate(`/projects/${projectResult.id}/bmc`);
      
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
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-6">
      {!generatedBMC ? (
        <>
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg border border-primary/20">
            <p className="text-sm text-foreground">
              <strong>✨ Enhanced AI Generation:</strong> Our AI-powered system creates strategic, 
              industry-specific Business Model Canvases with actionable insights and competitive analysis.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="font-semibold">
                Company Name *
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="e.g., TechStart Inc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry" className="font-semibold">
                Industry *
              </Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => handleInputChange('industry', value)}
              >
                <SelectTrigger>
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
              <Label htmlFor="targetCustomers" className="font-semibold">
                Target Customers *
              </Label>
              <Input
                id="targetCustomers"
                value={formData.targetCustomers}
                onChange={(e) => handleInputChange('targetCustomers', e.target.value)}
                placeholder="e.g., Small business owners, millennials, enterprises"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessStage" className="font-semibold">
                Business Stage
              </Label>
              <Select
                value={formData.businessStage}
                onValueChange={(value) => handleInputChange('businessStage', value)}
              >
                <SelectTrigger>
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
            <Label htmlFor="productService" className="font-semibold">
              Product/Service Description *
            </Label>
            <Textarea
              id="productService"
              value={formData.productService}
              onChange={(e) => handleInputChange('productService', e.target.value)}
              placeholder="Describe what your company offers, its key features, and competitive advantages..."
              className="min-h-24"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalContext" className="font-semibold">
              Additional Context (Optional)
            </Label>
            <Textarea
              id="additionalContext"
              value={formData.additionalContext}
              onChange={(e) => handleInputChange('additionalContext', e.target.value)}
              placeholder="Market size, competitive landscape, unique challenges, funding stage, partnerships..."
              className="min-h-20"
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={downloadBlankTemplate}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Blank PDF Template
            </Button>
            <Button
              onClick={generateBMC}
              disabled={isGenerating}
              className="px-8"
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
        </>
      ) : (
        <div className="space-y-6">
          <BusinessModelCanvas
            ref={canvasRef}
            data={generatedBMC}
            companyName={companyName}
            isEditable={true}
            onDataChange={setGeneratedBMC}
          />
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={resetForm}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Generate New BMC
              </Button>
            </div>
            
            <div className="flex space-x-2">
              {user && (
                <Button
                  onClick={saveAsProject}
                  disabled={isSaving}
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
                    try {
                      if (generatedBMC) {
                        sessionStorage.setItem('auth:returnTo', '/bmc-generator?resume=1');
                        sessionStorage.setItem('bmc:resume', JSON.stringify({
                          companyName,
                          formData,
                          generatedBMC,
                        }));
                      }
                    } catch (err) {
                      console.error('Failed to save BMC to sessionStorage:', err);
                    }
                    navigate('/auth');
                  }}
                  variant="outline"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sign In to Save
                </Button>
              )}
              <BMCExportDialog 
                companyName={companyName} 
                canvasRef={canvasRef}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BMCGenerator;