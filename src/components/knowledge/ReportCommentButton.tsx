import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flag } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useReportComment } from "@/hooks/useCommentReports";

interface ReportCommentButtonProps {
  commentId: string;
}

export const ReportCommentButton = ({ commentId }: ReportCommentButtonProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<"spam" | "offensive" | "off-topic" | "harassment" | "other">("spam");
  const [details, setDetails] = useState("");
  const { reportComment, isReporting } = useReportComment();

  const handleSubmit = async () => {
    try {
      await reportComment({
        commentId,
        reason,
        details: details.trim() || undefined,
      });
      
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe",
      });
      
      setOpen(false);
      setReason("spam");
      setDetails("");
    } catch (error) {
      toast({
        title: "Failed to submit report",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs">
          <Flag className="h-3 w-3 mr-1" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Comment</DialogTitle>
          <DialogDescription>
            Help us maintain a respectful community by reporting inappropriate content
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Reason for reporting</Label>
            <RadioGroup value={reason} onValueChange={(value: any) => setReason(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spam" id="spam" />
                <Label htmlFor="spam" className="font-normal cursor-pointer">
                  Spam or advertising
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="offensive" id="offensive" />
                <Label htmlFor="offensive" className="font-normal cursor-pointer">
                  Offensive or inappropriate
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="harassment" id="harassment" />
                <Label htmlFor="harassment" className="font-normal cursor-pointer">
                  Harassment or bullying
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="off-topic" id="off-topic" />
                <Label htmlFor="off-topic" className="font-normal cursor-pointer">
                  Off-topic or irrelevant
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="font-normal cursor-pointer">
                  Other
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              placeholder="Provide more context..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {details.length} / 500 characters
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isReporting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isReporting}>
            {isReporting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
