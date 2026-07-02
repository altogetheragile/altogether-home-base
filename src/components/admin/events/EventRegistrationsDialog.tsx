
import { useMemo, useState } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { useEventRegistrations, useDeleteRegistration } from '@/hooks/useEventRegistrations';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { ExternalLink, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getStripeDashboardSearchUrl } from '@/utils/stripe';
import type { BadgeProps } from '@/components/ui/badge';
import type { AdminRegistrationWithUser } from '@/hooks/useEventRegistrations';


interface EventRegistrationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string;
  eventTitle?: string;
}

const displayNameOf = (r: AdminRegistrationWithUser) =>
  r.user?.full_name?.trim() ||
  r.user?.email ||
  (r.user_id ? `${r.user_id.slice(0, 8)}…` : 'Unknown');

const EventRegistrationsDialog = ({
  open,
  onOpenChange,
  eventId,
  eventTitle,
}: EventRegistrationsDialogProps) => {
  const { data: registrations, isLoading } = useEventRegistrations(eventId);
  const deleteRegistration = useDeleteRegistration(eventId);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  const columns: DataTableColumn<AdminRegistrationWithUser>[] = useMemo(() => [
    {
      id: 'registered_at',
      header: 'Registered At',
      sortable: true,
      sortValue: (r) => r.registered_at ?? '',
      cell: (r) =>
        r.registered_at ? format(new Date(r.registered_at), 'MMM dd, yyyy HH:mm') : '—',
    },
    {
      id: 'user',
      header: 'User Details',
      sortable: true,
      sortValue: (r) => displayNameOf(r),
      cell: (r) => {
        const displayName = displayNameOf(r);
        const emailSub = r.user?.full_name && r.user?.email ? r.user.email : null;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{displayName}</span>
            {r.user?.username && (
              <span className="text-xs text-muted-foreground">
                @{r.user.username}
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
        );
      },
    },
    {
      id: 'role',
      header: 'Role',
      sortable: true,
      sortValue: (r) => r.user?.role || 'user',
      cell: (r) => (
        <Badge variant={r.user?.role === 'admin' ? 'destructive' : 'outline'}>
          {r.user?.role || 'user'}
        </Badge>
      ),
    },
    {
      id: 'payment',
      header: 'Payment',
      sortable: true,
      sortValue: (r) => r.payment_status || 'unknown',
      cell: (r) => {
        const paymentVariant: BadgeProps['variant'] =
          r.payment_status === 'paid' ? 'default' : 'secondary';
        return <Badge variant={paymentVariant}>{r.payment_status || 'unknown'}</Badge>;
      },
    },
    {
      id: 'session',
      header: 'Session',
      cell: (r) => {
        const sessionShort = r.stripe_session_id
          ? `${r.stripe_session_id.slice(0, 10)}…`
          : '—';
        return r.stripe_session_id ? (
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
                  toast({ title: 'Copy failed', description: 'Could not copy to clipboard.', variant: 'destructive' });
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
        );
      },
    },
    {
      id: 'reg_id',
      header: 'Reg. ID',
      cell: (r) => (
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
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (r) => (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setToDeleteId(r.id)}
          disabled={deleteRegistration.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
    // deleteRegistration.isPending gates the per-row delete button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [deleteRegistration.isPending]);

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
            <DataTable
              data={registrations}
              columns={columns}
              rowKey={(r) => r.id}
              isLoading={isLoading}
              searchable
              searchPlaceholder="Search by name or email..."
              getSearchText={(r) =>
                [displayNameOf(r), r.user?.email ?? '', r.user?.username ?? '']
                  .filter(Boolean)
                  .join(' ')
              }
              emptyMessage="No registrations found for this event."
            />
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
