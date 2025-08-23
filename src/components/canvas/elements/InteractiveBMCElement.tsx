import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Move3D, Sparkles, Loader2, X, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AIToolElement from './AIToolElement';

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

interface InteractiveBMCElementProps {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data?: BMCData;
  isSelected?: boolean;
  onSelect?: () => void;
  onResize?: (size: { width: number; height: number }) => void;
  onMove?: (position: { x: number; y: number }) => void;
  onContentChange?: (data: BMCData) => void;
  onDelete?: () => void;
}

export const InteractiveBMCElement: React.FC<InteractiveBMCElementProps> = ({
  id,
  position,
  size,
  data,
  isSelected,
  onSelect,
  onResize,
  onMove,
  onContentChange,
  onDelete,
}) => {
  const [mode, setMode] = useState<'input' | 'display'>(!data ? 'input' : 'display');
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    targetCustomers: '',
    productService: '',
    businessStage: 'startup',
  });
  const [bmcData, setBmcData] = useState<BMCData | null>(data || null);
  
  const { toast } = useToast();

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Education', 
    'Manufacturing', 'Consulting', 'Entertainment', 'Food & Beverage',
    'Real Estate', 'Transportation', 'Energy', 'SaaS', 'Other'
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

      if (error) throw new Error(error.message);

      const raw = typeof data === "string" ? JSON.parse(data) : data;
      if (!raw?.success) {
        throw new Error('AI response could not be parsed');
      }

      const generatedBMC = raw.data;
      setBmcData(generatedBMC);
      onContentChange?.(generatedBMC);
      setMode('display');
      
      toast({
        title: "BMC Generated Successfully!",
        description: "Your Business Model Canvas is ready"
      });
    } catch (error) {
      console.error('Error generating BMC:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate BMC. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = () => {
    setMode('input');
  };

  const handleCancel = () => {
    if (bmcData) {
      setMode('display');
    } else {
      onDelete?.();
    }
  };

  const handleUpdate = (element: any) => {
    onMove?.(element.position);
  };

  const renderInputForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-xs font-medium">
            Company Name *
          </Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            placeholder="e.g., TechStart Inc."
            className="text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry" className="text-xs font-medium">
            Industry *
          </Label>
          <Select
            value={formData.industry}
            onValueChange={(value) => handleInputChange('industry', value)}
          >
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map(industry => (
                <SelectItem key={industry} value={industry} className="text-xs">
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetCustomers" className="text-xs font-medium">
            Target Customers *
          </Label>
          <Input
            id="targetCustomers"
            value={formData.targetCustomers}
            onChange={(e) => handleInputChange('targetCustomers', e.target.value)}
            placeholder="e.g., Small businesses"
            className="text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="productService" className="text-xs font-medium">
            Product/Service *
          </Label>
          <Textarea
            id="productService"
            value={formData.productService}
            onChange={(e) => handleInputChange('productService', e.target.value)}
            placeholder="Describe your offering..."
            className="text-xs min-h-16"
          />
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="text-xs"
        >
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
        <Button
          onClick={generateBMC}
          disabled={isGenerating}
          size="sm"
          className="text-xs"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 mr-1" />
              Generate BMC
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderBMCDisplay = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1">
          <div className="font-medium text-muted-foreground">Key Partners</div>
          <div className="text-[10px] line-clamp-2">
            {bmcData?.keyPartners || 'Not defined'}
          </div>
        </div>
        <div className="space-y-1">
          <div className="font-medium text-muted-foreground">Value Propositions</div>
          <div className="text-[10px] line-clamp-2">
            {bmcData?.valuePropositions || 'Not defined'}
          </div>
        </div>
        <div className="space-y-1">
          <div className="font-medium text-muted-foreground">Key Activities</div>
          <div className="text-[10px] line-clamp-2">
            {bmcData?.keyActivities || 'Not defined'}
          </div>
        </div>
        <div className="space-y-1">
          <div className="font-medium text-muted-foreground">Customer Segments</div>
          <div className="text-[10px] line-clamp-2">
            {bmcData?.customerSegments || 'Not defined'}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={handleEdit}
          className="text-xs"
        >
          <Settings className="w-3 h-3 mr-1" />
          Edit
        </Button>
        <Button
          onClick={generateBMC}
          disabled={isGenerating}
          size="sm"
          variant="secondary"
          className="text-xs"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Regenerate
        </Button>
      </div>
    </div>
  );

  const element = {
    id,
    type: 'bmc' as const,
    position,
    size,
    content: bmcData || {}
  };

  return (
    <AIToolElement
      element={element}
      isSelected={isSelected || false}
      onSelect={onSelect || (() => {})}
      onUpdate={handleUpdate}
      onDelete={onDelete || (() => {})}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Business Model Canvas</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          AI Tool
        </Badge>
      </div>
      
      {mode === 'input' ? renderInputForm() : renderBMCDisplay()}
    </AIToolElement>
  );
};