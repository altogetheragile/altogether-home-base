import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Download, Eye, Mail, Trash2 } from "lucide-react";

type Lead = {
  id: string;
  submitted_at: string | null;
  full_name: string | null;
  email: string;
  phone: string | null;
  enquiry_type: string | null;
  subject: string | null;
  message: string | null;
  attachment_url: string | null;
  attachment_filename: string | null;
  status: string | null;
};

// Lead lifecycle. 'unread' is the status every contact/enquiry/interest form inserts,
// so it must be a first-class, selectable state (previously the dropdown only offered
// new/in_progress/resolved, leaving every real lead's control blank and un-actionable).
const STATUSES = [
  { value: "unread", label: "Unread" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const statusBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  unread: "default", new: "default", in_progress: "secondary", resolved: "outline",
};
const StatusBadge = ({ status }: { status: string }) => (
  <Badge variant={statusBadgeVariant[status] || "default"}>{status.replace("_", " ")}</Badge>
);

const enquiryBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  general: "outline", support: "default", partnership: "secondary", feedback: "outline",
};
const EnquiryBadge = ({ type }: { type: string }) => (
  <Badge variant={enquiryBadgeVariant[type] || "outline"}>{type}</Badge>
);

const AdminContacts = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Lead | null>(null);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, submitted_at, full_name, email, phone, enquiry_type, subject, message, attachment_url, attachment_filename, status")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("contacts").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-unread-leads"] });
      toast.success("Status updated successfully");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const setStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
    setSelected((s) => (s && s.id === id ? { ...s, status } : s));
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // .select() returns the deleted rows; an empty result with no error means RLS
      // silently blocked the delete (no admin DELETE policy) rather than a real success.
      const { data, error } = await supabase.from("contacts").delete().eq("id", id).select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("blocked");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-unread-leads"] });
      setSelected(null);
      toast.success("Lead deleted");
    },
    onError: (e: Error) => {
      toast.error(
        e.message === "blocked"
          ? "Delete blocked - the admin delete policy is missing. Apply the contacts delete migration."
          : "Failed to delete lead",
      );
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this lead permanently? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const unreadCount = contacts?.filter((c) => (c.status ?? "unread") === "unread").length ?? 0;

  const StatusSelect = ({ contact, className }: { contact: Lead; className?: string }) => (
    <Select value={contact.status ?? "unread"} onValueChange={(v) => setStatus(contact.id, v)}>
      <SelectTrigger className={className ?? "w-36"}><SelectValue /></SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        {contact.status && !STATUSES.some((s) => s.value === contact.status) && (
          <SelectItem value={contact.status}>{contact.status.replace("_", " ")}</SelectItem>
        )}
      </SelectContent>
    </Select>
  );

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-3">
            <span>Leads</span>
            <span className="text-sm font-normal text-muted-foreground">Contact, coaching and course-interest submissions</span>
            {unreadCount > 0 && <Badge variant="default" className="ml-auto">{unreadCount} unread</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : !contacts?.length ? (
            <div className="text-center py-8 text-muted-foreground">No leads yet</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className={`cursor-pointer ${(contact.status ?? "unread") === "unread" ? "font-medium" : ""}`}
                      onClick={() => setSelected(contact)}
                    >
                      <TableCell className="text-sm whitespace-nowrap">
                        {contact.submitted_at ? format(new Date(contact.submitted_at), "MMM dd, yyyy HH:mm") : "-"}
                      </TableCell>
                      <TableCell className="font-medium">{contact.full_name}</TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell><EnquiryBadge type={contact.enquiry_type ?? "general"} /></TableCell>
                      <TableCell className="max-w-xs truncate">{contact.subject}</TableCell>
                      <TableCell><StatusBadge status={contact.status ?? "unread"} /></TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => setSelected(contact)}>
                          <Eye className="h-4 w-4 mr-1" />Read
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full lead reader */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent
          className="overflow-auto"
          style={{ width: "min(42rem, 95vw)", maxWidth: "95vw", minWidth: "20rem", height: "auto", maxHeight: "90vh", minHeight: "18rem", resize: "both" }}
        >
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.subject || "Lead"}</DialogTitle>
                <DialogDescription>
                  {selected.full_name || "Unknown"}
                  {selected.submitted_at ? ` · ${format(new Date(selected.submitted_at), "MMM dd, yyyy HH:mm")}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Email</div>
                  <a href={`mailto:${selected.email}`} className="text-primary hover:underline break-all">{selected.email}</a>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Phone</div>
                  <div>{selected.phone || "-"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Type</div>
                  <EnquiryBadge type={selected.enquiry_type ?? "general"} />
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Status</div>
                  <StatusBadge status={selected.status ?? "unread"} />
                </div>
              </div>

              <div>
                <div className="text-muted-foreground text-xs mb-1">Message</div>
                <div className="rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap break-words">
                  {selected.message || "(no message)"}
                </div>
              </div>

              {selected.attachment_url && (
                <Button variant="outline" size="sm" asChild className="w-fit">
                  <a href={selected.attachment_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-1" />{selected.attachment_filename || "Download attachment"}
                  </a>
                </Button>
              )}

              <DialogFooter className="gap-2 sm:justify-between sm:items-center">
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selected.id)} disabled={deleteMutation.isPending}>
                  <Trash2 className="h-4 w-4 mr-1" />Delete
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusSelect contact={selected} className="w-40" />
                  <Button asChild>
                    <a href={`mailto:${selected.email}?subject=${encodeURIComponent("Re: " + (selected.subject || ""))}`}>
                      <Mail className="h-4 w-4 mr-1" />Reply by email
                    </a>
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminContacts;
