import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Export the live Knowledge Base as isa_o3_master.json, and re-import a refined
// copy (upsert by slug). This is the round-trip used to review and refine the
// ISA-O3 classification with Claude.
export const IsaO3ExportImport: React.FC = () => {
  const { toast } = useToast();
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setBusy('export');
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('export-data', {
        body: { type: 'knowledge-base', format: 'json' },
      });
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `isa_o3_master_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const counts = data?.meta ? ` (${data.meta.artifacts} artifacts, ${data.meta.techniques} techniques)` : '';
      toast({ title: 'Export ready', description: `Downloaded isa_o3_master.json${counts}` });
    } catch (e) {
      toast({ title: 'Export failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async (file: File) => {
    setBusy('import');
    setResult(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const { data, error } = await supabase.functions.invoke('import-knowledge-json', {
        body: json,
      });
      if (error) throw error;
      setResult({ ok: !!data?.success, message: data?.message || 'Import complete' });
      toast({
        title: data?.success ? 'Import complete' : 'Import finished with issues',
        description: data?.message,
        variant: data?.success ? undefined : 'destructive',
      });
    } catch (e) {
      const message = (e as Error).message;
      setResult({ ok: false, message });
      toast({ title: 'Import failed', description: message, variant: 'destructive' });
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ISA-O3 Master (JSON)</CardTitle>
        <CardDescription>
          Export the whole Knowledge Base as isa_o3_master.json for review, then re-import the
          refined file. Import updates existing items by slug, and never creates new ones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExport} disabled={busy !== null}>
            <Download className="h-4 w-4 mr-2" />
            {busy === 'export' ? 'Exporting...' : 'Export JSON'}
          </Button>
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={busy !== null}
          >
            <Upload className="h-4 w-4 mr-2" />
            {busy === 'import' ? 'Importing...' : 'Import JSON'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
            }}
          />
        </div>

        {result && (
          <Alert variant={result.ok ? 'default' : 'destructive'}>
            {result.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.ok ? 'Done' : 'Issues'}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default IsaO3ExportImport;
