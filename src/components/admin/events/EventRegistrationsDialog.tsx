
import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2 } from 'lucide-react';
import { useEventRegistrations, useDeleteRegistration } from '@/hooks/useEventRegistrations';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { ExternalLink, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getStripeDashboardSearchUrl } from '@/utils/stripe';


interface EventRegistrationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string;
  eventTitle?: string;
}

const EventRegistrationsDialog = ({
  open,
  onOpenChange,
  eventId,
  eventTitle,
}: EventRegistrationsDialogProps) => {
  const { data: registrations, isLoading } = useEventRegistrations(eventId);
  const deleteRegistration = useDeleteRegistration(eventId);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage Registrations</DialogTitle>
            <DialogDescription>
              {eventTitle ? `Event: ${eventTitle}` : 'View and manage registrations for this event.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-9 w-20" />
                  </div>
                ))}
              </div>
            ) : (registrations?.length || 0) === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No registrations found for this event.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registered At</TableHead>
                      <TableHead>User Details</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Reg. ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations?.map((r) => {
                      const dateStr = r.registered_at
                        ? format(new Date(r.registered_at), 'MMM dd, yyyy HH:mm')
                        : '—';

                      const displayName =
                        (r as any).user?.full_name?.trim() ||
                        (r as any).user?.email ||
                        (r.user_id ? `${r.user_id.slice(0, 8)}…` : 'Unknown');

                      const emailSub =
                        (r as any).user?.full_name && (r as any).user?.email
                          ? (r as any).user?.email
                          : null;

                      const sessionShort = r.stripe_session_id
                        ? `${r.stripe_session_id.slice(0, 10)}…`
                        : '—';

                      const paymentVariant =
                        r.payment_status === 'paid'
                          ? 'default'
                          : r.payment_status === 'unpaid'
                          ? 'secondary'
                          : 'secondary';

                      return (
                        <TableRow key={r.id}>
                          <TableCell>{dateStr}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">{displayName}</span>
                              {(r as any).user?.username && (
                                <span className="text-xs text-muted-foreground">
                                  @{(r as any).user.username}
                                </span>
                              )}
                              {emailSub && (
                                <span className="text-xs text-muted-foreground">{emailSub}</span>
                              )}
                              {r.user_id && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="text-xs text-muted-foreground/60 cursor-help">
                                        ID: {r.user_id.slice(0, 8)}...
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <span className="font-mono text-xs">{r.user_id}</span>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={(r as any).user?.role === 'admin' ? 'destructive' : 'outline'}>
                              {(r as any).user?.role || 'user'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={paymentVariant as any}>
                              {r.payment_status || 'unknown'}
                            </Badge>
                          </TableCell>
<TableCell>
  {r.stripe_session_id ? (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-mono text-xs cursor-help">{sessionShort}</span>
          </TooltipTrigger>
          <TooltipContent>
            <span className="font-mono text-xs">{r.stripe_session_id}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Copy session ID"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(r.stripe_session_id as string);
            toast({ title: 'Copied session ID', description: 'Stripe session ID copied to clipboard.' });
          } catch (e) {
            toast({ title: 'Copy failed', description: 'Could not copy to clipboard.', variant: 'destructive' as any });
          }
        }}
      >
        <Copy className="h-4 w-4" />
      </Button>
      <a
        href={getStripeDashboardSearchUrl(r.stripe_session_id)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open in Stripe Dashboard"
      >
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </a>
    </div>
  ) : (
    <span className="text-muted-foreground">—</span>
  )}
</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="font-mono text-xs cursor-help">
                                      {r.id.slice(0, 8)}...
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <span className="font-mono text-xs">{r.id}</span>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  navigator.clipboard.writeText(r.id);
                                  toast({ title: 'Copied', description: 'Registration ID copied to clipboard.' });
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setToDeleteId(r.id)}
                              disabled={deleteRegistration.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDeleteId} onOpenChange={(open) => !open && setToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete registration</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the registration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRegistration.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!toDeleteId) return;
                try {
                  await deleteRegistration.mutateAsync(toDeleteId);
                } finally {
                  setToDeleteId(null);
                }
              }}
              disabled={deleteRegistration.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EventRegistrationsDialog;
