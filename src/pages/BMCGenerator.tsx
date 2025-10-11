import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, ExternalLink, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

const BMCGenerator = () => {
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    industry: '',
    targetCustomers: '',
    productService: '',
    businessStage: 'startup',
    additionalContext: ''
  });
  
  const [generatedBMC, setGeneratedBMC] = useState<BMCData | null>(null);
  const [filledPdfUrl, setFilledPdfUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFilling, setIsFilling] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateBMC = async () => {
    if (!formData.companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    setIsGenerating(true);
    console.log('[BMC] Starting generation request...');

    try {
      const { data, error } = await supabase.functions.invoke('generate-business-model-canvas', {
        body: {
          companyName: formData.companyName,
          industry: formData.industry,
          targetCustomers: formData.targetCustomers,
          productService: formData.productService,
          businessStage: formData.businessStage,
          additionalContext: formData.additionalContext,
          templateUrl: 'https://wqaplkypnetifpqrungv.supabase.co/storage/v1/object/public/pdf-templates/templates/988f2f19-fe29-49e4-971c-56c0dc9f872c.pdf'
        }
      });

      if (error) throw error;
      
      const bmcData = data as BMCData;
      setGeneratedBMC(bmcData);
      console.log('[BMC] ✅ BMC generated successfully');
      
      // Automatically fill the PDF
      await fillPDF(bmcData);
      
      toast.success('Business Model Canvas generated successfully!');
    } catch (error: any) {
      console.error('[BMC] Generation error:', error);
      toast.error(error.message || 'Failed to generate BMC');
    } finally {
      setIsGenerating(false);
    }
  };

  const fillPDF = async (bmcData: BMCData) => {
    setIsFilling(true);
    console.log('[BMC] Filling PDF with data...');

    try {
      const { data, error } = await supabase.functions.invoke('fill-bmc-pdf', {
        body: {
          bmcData,
          templateUrl: 'https://wqaplkypnetifpqrungv.supabase.co/storage/v1/object/public/pdf-templates/templates/988f2f19-fe29-49e4-971c-56c0dc9f872c.pdf',
          companyName: formData.companyName
        }
      });

      console.log('[BMC] Fill PDF response:', { data, error });
      console.log('[BMC] Response data type:', typeof data);
      console.log('[BMC] Response data keys:', data ? Object.keys(data) : 'null');

      if (error) {
        console.error('[BMC] Fill PDF error:', error);
        throw error;
      }

      // The response might be the dataUrl directly or wrapped in an object
      const pdfUrl = typeof data === 'string' ? data : (data?.dataUrl || data?.pdfDataUrl);
      
      if (pdfUrl) {
        setFilledPdfUrl(pdfUrl);
        console.log('[BMC] ✅ PDF filled successfully');
      } else {
        console.warn('[BMC] No dataUrl in response:', data);
        toast.error('PDF was generated but URL is missing');
      }
    } catch (error: any) {
      console.error('[BMC] PDF fill error:', error);
      toast.error(error.message || 'Failed to fill PDF template');
    } finally {
      setIsFilling(false);
    }
  };

  const downloadPDF = () => {
    if (!filledPdfUrl) return;

    const link = document.createElement('a');
    link.href = filledPdfUrl;
    link.download = `${formData.companyName.replace(/\s+/g, '_')}_BMC.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('PDF downloaded!');
  };

  const openPDFInNewTab = () => {
    if (!filledPdfUrl) return;
    window.open(filledPdfUrl, '_blank');
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
    setFilledPdfUrl('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Business Model Canvas Generator</h1>
              <p className="text-muted-foreground">
                Generate a comprehensive Business Model Canvas using AI. Fill in your company details and get a professional BMC instantly.
              </p>
            </div>

            {!generatedBMC ? (
              <Card>
                <CardHeader>
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
                      <Button variant="outline" onClick={resetForm}>
                        Generate New BMC
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isFilling ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Filling PDF template...</span>
                      </div>
                    ) : filledPdfUrl ? (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Button onClick={downloadPDF}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </Button>
                          <Button variant="outline" onClick={openPDFInNewTab}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open in New Tab
                          </Button>
                          <Button variant="outline" onClick={() => fillPDF(generatedBMC)}>
                            Re-fill PDF
                          </Button>
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden bg-white">
                          <iframe
                            src={filledPdfUrl}
                            className="w-full h-[800px]"
                            title="Business Model Canvas PDF"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        PDF generation in progress...
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BMCGenerator;
