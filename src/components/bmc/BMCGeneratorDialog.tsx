import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, RotateCcw, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BusinessModelCanvas, { BusinessModelCanvasRef } from './BusinessModelCanvas';
import BMCExportDialog from './BMCExportDialog';

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

const BMCGeneratorDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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

  // Close any open dropdowns when dialog opens
  const handleDialogOpen = (open: boolean) => {
    if (open) {
      // Close any open dropdowns by clicking elsewhere
      const event = new MouseEvent('click', { bubbles: true });
      document.body.dispatchEvent(event);
    }
    setIsOpen(open);
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
        // Supabase Functions client wraps non-2xx as error
        console.error('[BMC] Edge function error:', error);
        throw new Error(error.message ?? 'Edge function failed');
      }

      const raw = typeof data === "string" ? JSON.parse(data) : data;
      if (!raw?.success) {
        console.error('[BMC] LLM parsing failed:', raw?.error, raw?.raw?.slice?.(0, 400));
        throw new Error('AI response could not be parsed. Please try again.');
      }

      const bmcData = raw.data;        // <- flat object with the nine fields
      console.debug("[BMC] extracted BMC:", bmcData);
      setGeneratedBMC(bmcData);          // <- pass directly into BMC canvas
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

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
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
      
      <DialogContent className="max-w-7xl h-[98vh] overflow-y-auto bg-background border-2 shadow-2xl p-3">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-bold text-bmc-orange-dark flex items-center">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Business Model Canvas Generator
          </DialogTitle>
        </DialogHeader>
        
        {!generatedBMC ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-bmc-orange/10 to-bmc-orange-light/10 p-4 rounded-lg border border-bmc-orange/30 shadow-sm">
              <p className="text-sm text-bmc-text">
                <strong>✨ Enhanced AI Generation:</strong> Our GPT-5 powered system creates strategic, 
                industry-specific Business Model Canvases with actionable insights and competitive analysis.
              </p>
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

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-bmc-orange/30 text-bmc-text hover:bg-bmc-orange/10"
              >
                Cancel
              </Button>
              <Button
                onClick={generateBMC}
                disabled={isGenerating}
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
        ) : (
          <div className="space-y-6">
            <BusinessModelCanvas
              ref={canvasRef}
              data={generatedBMC}
              companyName={companyName}
              isEditable={true}
              onDataChange={setGeneratedBMC}
            />
            
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
              </div>
              
              <div className="flex space-x-2">
                <BMCExportDialog 
                  companyName={companyName} 
                  canvasRef={canvasRef}
                />
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