
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
        <DialogContent className="max-w-3xl">
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
                      <TableHead>User</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations?.map((r) => {
                      const dateStr = r.registered_at
                        ? format(new Date(r.registered_at), 'MMM dd, yyyy HH:mm')
                        : '—';
                      const userShort = r.user_id ? `${r.user_id.slice(0, 8)}…` : 'Unknown';
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
                          <TableCell className="font-mono text-sm">{userShort}</TableCell>
                          <TableCell>
                            <Badge variant={paymentVariant as any}>
                              {r.payment_status || 'unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{sessionShort}</TableCell>
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
