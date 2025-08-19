import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BusinessModelCanvas from './BusinessModelCanvas';

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
    'Real Estate', 'Transportation', 'Energy', 'Agriculture', 'Other'
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
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-business-model-canvas', {
        body: formData
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedBMC(data.data);
        setCompanyName(data.companyName);
        toast({
          title: "BMC Generated!",
          description: "Your Business Model Canvas has been created successfully"
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error generating BMC:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate Business Model Canvas. Please try again.",
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
    // Don't reset form immediately, let user see results
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate with AI
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Business Model Canvas Generator</DialogTitle>
        </DialogHeader>
        
        {!generatedBMC ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="e.g., TechStart Inc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
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
                <Label htmlFor="targetCustomers">Target Customers *</Label>
                <Input
                  id="targetCustomers"
                  value={formData.targetCustomers}
                  onChange={(e) => handleInputChange('targetCustomers', e.target.value)}
                  placeholder="e.g., Small business owners, millennials"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessStage">Business Stage</Label>
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
              <Label htmlFor="productService">Product/Service Description *</Label>
              <Textarea
                id="productService"
                value={formData.productService}
                onChange={(e) => handleInputChange('productService', e.target.value)}
                placeholder="Describe what your company offers..."
                className="min-h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalContext">Additional Context (Optional)</Label>
              <Textarea
                id="additionalContext"
                value={formData.additionalContext}
                onChange={(e) => handleInputChange('additionalContext', e.target.value)}
                placeholder="Any additional information that might help generate a better BMC..."
                className="min-h-16"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={generateBMC}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
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
          <div className="space-y-4">
            <BusinessModelCanvas
              data={generatedBMC}
              companyName={companyName}
              isEditable={true}
              onDataChange={setGeneratedBMC}
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={resetForm}
              >
                Generate New BMC
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BMCGeneratorDialog;