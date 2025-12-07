import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { populateBacklogItems } from '@/scripts/populateBacklogItems';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function PopulateBacklog() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);
  const { toast } = useToast();

  const handlePopulate = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const res = await populateBacklogItems();
      setResult(res);
      
      if (res.success) {
        toast({
          title: 'Backlog populated!',
          description: `Successfully added ${res.count} items to the backlog.`,
        });
      } else {
        toast({
          title: 'Failed to populate',
          description: res.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult({ success: false, error: errorMessage });
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Populate Backlog Items</CardTitle>
          <CardDescription>
            Add 10 product backlog items to the Altogether Agile project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handlePopulate} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Populating...
              </>
            ) : (
              'Populate Backlog'
            )}
          </Button>

          {result && (
            <div className={`flex items-center gap-2 p-3 rounded-md ${
              result.success ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'
            }`}>
              {result.success ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Added {result.count} items successfully!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  <span>{result.error}</span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
