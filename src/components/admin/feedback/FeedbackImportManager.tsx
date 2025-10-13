import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CheckCircle, XCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface FeedbackRow {
  First_Name: string;
  Last_Name: string;
  Score: number;
  Company?: string;
  Job_Title?: string;
  'Course / Activity': string;
  Content: string;
  Creation_Date: string;
  Source: string;
  Source_Link?: string;
}

const FeedbackImportManager = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<FeedbackRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [autoApprove, setAutoApprove] = useState(true);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<FeedbackRow>(worksheet);
      
      setPreview(jsonData.slice(0, 10)); // Show first 10 rows
      
      toast({
        title: "File loaded",
        description: `Preview showing ${Math.min(10, jsonData.length)} of ${jsonData.length} rows`,
      });
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: "Error",
        description: "Failed to read file. Please ensure it's a valid Excel file.",
        variant: "destructive",
      });
    }
  };

  const parseDate = (dateStr: string): string => {
    try {
      // Try parsing as Excel date number first
      if (!isNaN(Number(dateStr))) {
        const excelDate = new Date((Number(dateStr) - 25569) * 86400 * 1000);
        return excelDate.toISOString();
      }
      // Otherwise parse as regular date string
      return new Date(dateStr).toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<FeedbackRow>(worksheet);

      const { data: { user } } = await supabase.auth.getUser();
      
      const feedbackData = jsonData.map(row => ({
        first_name: row.First_Name || 'Anonymous',
        last_name: row.Last_Name || '',
        rating: Math.min(10, Math.max(1, Math.round(row.Score || 5))),
        comment: row.Content || '',
        company: row.Company || null,
        job_title: row.Job_Title || null,
        course_name: row['Course / Activity'] || 'Unknown Course',
        source: row.Source?.toLowerCase().replace(/\s+/g, '_') || 'imported',
        source_url: row.Source_Link || null,
        submitted_at: parseDate(row.Creation_Date),
        is_approved: autoApprove || row.Source?.toLowerCase() === 'linkedin',
        is_featured: false,
        created_by: user?.id,
      }));

      const { error } = await supabase
        .from('course_feedback')
        .insert(feedbackData);

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `Imported ${feedbackData.length} feedback entries`,
      });

      setFile(null);
      setPreview([]);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "Failed to import feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Course Feedback</CardTitle>
          <CardDescription>
            Upload an Excel file containing course feedback and testimonials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Excel File</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground">
              Expected columns: First_Name, Last_Name, Score, Company, Job_Title, Course / Activity, Content, Creation_Date, Source, Source_Link
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-approve"
              checked={autoApprove}
              onCheckedChange={(checked) => setAutoApprove(checked as boolean)}
            />
            <Label htmlFor="auto-approve" className="text-sm font-normal cursor-pointer">
              Auto-approve all imported feedback (LinkedIn sources always auto-approved)
            </Label>
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Preview (first 10 rows)</h3>
              <div className="border rounded-md p-4 bg-muted/50 max-h-96 overflow-auto">
                <div className="space-y-2 text-sm">
                  {preview.map((row, idx) => (
                    <div key={idx} className="flex items-start gap-2 pb-2 border-b border-border/50 last:border-0">
                      <FileSpreadsheet className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{row.First_Name} {row.Last_Name} - {row.Score}/10</p>
                        <p className="text-muted-foreground">{row['Course / Activity']}</p>
                        <p className="text-xs line-clamp-2">{row.Content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full"
            >
              {importing ? (
                <>Importing...</>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Feedback
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackImportManager;
