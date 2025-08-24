import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Building2, Save, X } from 'lucide-react';
import { Badge } from '../../ui/badge';
import FabricBMCCanvas, { FabricBMCCanvasRef, BMCData } from '../../bmc/FabricBMCCanvas';
import { useRef } from 'react';

interface BMCEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: BMCData;
  companyName?: string;
  onSave: (data: BMCData) => void;
}

const BMCEditorDialog: React.FC<BMCEditorDialogProps> = ({
  isOpen,
  onClose,
  data,
  companyName,
  onSave,
}) => {
  const [currentData, setCurrentData] = useState<BMCData>(data);
  const bmcRef = useRef<FabricBMCCanvasRef>(null);

  // Update current data when prop data changes
  useEffect(() => {
    setCurrentData(data);
  }, [data]);

  const handleSave = () => {
    onSave(currentData);
  };

  const handleDataChange = (newData: BMCData) => {
    setCurrentData(newData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <DialogTitle>
                {companyName ? `${companyName} - Business Model Canvas` : 'Business Model Canvas'}
              </DialogTitle>
              <Badge variant="secondary" className="text-xs">
                AI Generated
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button onClick={onClose} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
          <DialogDescription>
            Edit your Business Model Canvas. Changes are saved automatically as you type.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <FabricBMCCanvas
            ref={bmcRef}
            data={currentData}
            isEditable={true}
            onDataChange={handleDataChange}
            width={1200}
            height={800}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BMCEditorDialog;