import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Image, Printer, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { exportBMC, downloadBMC, printBMC, BMCData } from '@/utils/bmcExport';
import { BusinessModelCanvasRef } from './BusinessModelCanvas';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BMCExportDialogProps {
  companyName?: string;
  canvasRef?: React.RefObject<BusinessModelCanvasRef>;
  bmcData?: BMCData;
}

const BMCExportDialog: React.FC<BMCExportDialogProps> = ({ companyName, canvasRef, bmcData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'png' | 'jpeg'>('pdf');
  const [filename, setFilename] = useState(
    companyName ? `${companyName.replace(/\s+/g, '-').toLowerCase()}-bmc` : 'business-model-canvas'
  );
  const [quality, setQuality] = useState('95');
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      console.log('🎯 Starting new export system...');
      
      // Get BMC data - try from prop first, then from canvas ref
      let currentBmcData = bmcData;
      
      if (!currentBmcData && canvasRef?.current) {
        console.log('📊 Getting BMC data from canvas ref...');
        currentBmcData = canvasRef.current.getBMCData?.();
      }
      
      if (!currentBmcData) {
        toast({
          title: "Export Failed",
          description: "No BMC data available to export.",
          variant: "destructive"
        });
        return;
      }

      console.log('📋 BMC data to export:', currentBmcData);

      const options = {
        format,
        filename,
        quality: format === 'jpeg' ? parseInt(quality) / 100 : 0.95,
        companyName,
      };
      
      console.log('⚙️ Export options:', options);

      // Use new BMC export utility
      const dataUrl = await exportBMC(currentBmcData, options);
      
      if (!dataUrl || dataUrl === 'data:,') {
        throw new Error('Export generated empty result');
      }
      
      console.log('✅ Export successful, downloading file...');
      
      // Download the file
      downloadBMC(dataUrl, filename, format);

      toast({
        title: "Export Successful",
        description: `BMC exported as ${format.toUpperCase()}`,
      });
      setIsOpen(false);
    } catch (error) {
      console.error('❌ Export error:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export Business Model Canvas: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    try {
      console.log('🖨️ Starting new print system...');
      
      // Get BMC data - try from prop first, then from canvas ref
      let currentBmcData = bmcData;
      
      if (!currentBmcData && canvasRef?.current) {
        console.log('📊 Getting BMC data from canvas ref for print...');
        currentBmcData = canvasRef.current.getBMCData?.();
      }
      
      if (!currentBmcData) {
        toast({
          title: "Print Failed",
          description: "No BMC data available to print.",
          variant: "destructive"
        });
        return;
      }

      console.log('📋 BMC data to print:', currentBmcData);

      // Use new BMC print utility
      await printBMC(currentBmcData, companyName);
      
      toast({
        title: "Print Dialog Opened",
        description: "Print dialog has been opened in a new window.",
      });
    } catch (error) {
      console.error('❌ Print error:', error);
      toast({
        title: "Print Failed",
        description: `Failed to open print dialog: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // If user is not authenticated, show sign-in requirement
  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="text-bmc-orange border-bmc-orange hover:bg-bmc-orange hover:text-white"
            onClick={(e) => {
              e.preventDefault();
              toast({
                title: "Sign In Required",
                description: "Create a free account to export your Business Model Canvas",
                action: (
                  <Button size="sm" onClick={() => navigate('/auth')}>
                    Sign Up Free
                  </Button>
                )
              });
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export BMC
          </Button>
        </DialogTrigger>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-bmc-orange border-bmc-orange hover:bg-bmc-orange hover:text-white">
          <Download className="w-4 h-4 mr-2" />
          Export BMC
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-bmc-orange-dark">Export Business Model Canvas</DialogTitle>
          <DialogDescription>Choose your preferred export format and settings</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select value={format} onValueChange={(value: 'pdf' | 'png' | 'jpeg') => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-red-500" />
                    PDF Document
                  </div>
                </SelectItem>
                <SelectItem value="png">
                  <div className="flex items-center">
                    <Image className="w-4 h-4 mr-2 text-blue-500" />
                    PNG Image
                  </div>
                </SelectItem>
                <SelectItem value="jpeg">
                  <div className="flex items-center">
                    <Image className="w-4 h-4 mr-2 text-green-500" />
                    JPEG Image
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="business-model-canvas"
            />
          </div>

          {format === 'jpeg' && (
            <div className="space-y-2">
              <Label htmlFor="quality">Quality (%)</Label>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="70">70% - Small file size</SelectItem>
                  <SelectItem value="85">85% - Balanced</SelectItem>
                  <SelectItem value="95">95% - High quality</SelectItem>
                  <SelectItem value="100">100% - Maximum quality</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="flex-1 h-8 text-xs"
                    size="sm"
                  >
                    <Printer className="w-3 h-3 mr-1" />
                    Print
                  </Button>
                </TooltipTrigger>
              </Tooltip>
            </TooltipProvider>
            
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 h-8 text-xs bg-bmc-orange hover:bg-bmc-orange-dark text-white"
              size="sm"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BMCExportDialog;