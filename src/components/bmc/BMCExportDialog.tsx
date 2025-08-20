import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Image, Printer, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportCanvas, printCanvas } from '@/utils/canvas/canvasExporter';

interface BMCExportDialogProps {
  companyName?: string;
}

const BMCExportDialog: React.FC<BMCExportDialogProps> = ({ companyName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'png' | 'jpeg'>('pdf');
  const [filename, setFilename] = useState(
    companyName ? `${companyName.replace(/\s+/g, '-').toLowerCase()}-bmc` : 'business-model-canvas'
  );
  const [quality, setQuality] = useState('95');
  
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Get the canvas reference from the BusinessModelCanvas component
      const bmcContainer = document.querySelector('#bmc-canvas');
      const canvasRef = (bmcContainer as any)?._canvasRef;
      
      if (!canvasRef) {
        toast({
          title: "Export Failed",
          description: "Canvas not found. Please ensure the BMC is loaded.",
          variant: "destructive"
        });
        return;
      }

      const options = {
        format,
        filename,
        quality: format === 'jpeg' ? parseInt(quality) / 100 : undefined,
      };
      
      const dataUrl = await canvasRef.exportCanvas(options);
      
      // Create download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${filename}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `BMC exported as ${format.toUpperCase()}`,
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export Business Model Canvas. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    try {
      // Get the canvas element directly
      const bmcContainer = document.querySelector('#bmc-canvas');
      const canvasElement = bmcContainer?.querySelector('[data-canvas="true"]') as HTMLElement;
      
      if (!canvasElement) {
        toast({
          title: "Print Failed",
          description: "Canvas not found. Please ensure the BMC is loaded.",
          variant: "destructive"
        });
        return;
      }

      await printCanvas(canvasElement);
      
      toast({
        title: "Print Dialog Opened",
        description: "Print dialog has been opened in a new window.",
      });
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Failed",
        description: "Failed to open print dialog. Please try again.",
        variant: "destructive"
      });
    }
  };

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
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 bg-bmc-orange hover:bg-bmc-orange-dark text-white"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
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