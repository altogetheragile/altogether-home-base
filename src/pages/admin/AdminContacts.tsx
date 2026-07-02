import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Lead lifecycle. 'unread' is the status every contact/enquiry/interest form inserts.
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
  const [reading, setReading] = useState<Lead | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

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

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-contacts"] });
    queryClient.invalidateQueries({ queryKey: ["admin-unread-leads"] });
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase.from("contacts").update({ status }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_d, { ids }) => {
      refresh();
      setReading((s) => (s && ids.includes(s.id) ? { ...s } : s));
      toast.success(ids.length > 1 ? `${ids.length} leads updated` : "Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // .select() returns deleted rows; fewer than requested (or none) means RLS blocked
      // the delete (no admin DELETE policy) rather than a real success.
      const { data, error } = await supabase.from("contacts").delete().in("id", ids).select("id");
      if (error) throw error;
      if (!data || data.length < ids.length) throw new Error("blocked");
    },
    onSuccess: (_d, ids) => {
      refresh();
      setReading((s) => (s && ids.includes(s.id) ? null : s));
      setSelectedIds(new Set());
      toast.success(ids.length > 1 ? `${ids.length} leads deleted` : "Lead deleted");
    },
    onError: (e: Error) =>
      toast.error(
        e.message === "blocked"
          ? "Delete blocked - the admin delete policy is missing. Apply the contacts delete migration."
          : "Failed to delete lead",
      ),
  });

  const setStatus = (ids: string[], status: string) => {
    updateStatusMutation.mutate({ ids, status });
    setReading((s) => (s && ids.includes(s.id) ? { ...s, status } : s));
  };

  const confirmDelete = (ids: string[]) => {
    const msg = ids.length > 1 ? `Delete ${ids.length} leads permanently?` : "Delete this lead permanently?";
    if (window.confirm(`${msg} This cannot be undone.`)) deleteMutation.mutate(ids);
  };

  const unreadCount = contacts?.filter((c) => (c.status ?? "unread") === "unread").length ?? 0;

  // Search + status filter live here (for the "X of Y" count and the two empty states);
  // sorting, selection and row rendering are delegated to DataTable below.
  const filtered = useMemo(() => {
    const rows = contacts ?? [];
    const q = search.trim().toLowerCase();
    return rows.filter((c) => {
      const status = c.status ?? "unread";
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!q) return true;
      return [c.full_name, c.email, c.subject, c.message, c.phone].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [contacts, search, statusFilter]);

  const StatusSelect = ({ contact, className }: { contact: Lead; className?: string }) => (
    <Select value={contact.status ?? "unread"} onValueChange={(v) => setStatus([contact.id], v)}>
      <SelectTrigger className={className ?? "w-36"}><SelectValue /></SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        {contact.status && !STATUSES.some((s) => s.value === contact.status) && (
          <SelectItem value={contact.status}>{contact.status.replace("_", " ")}</SelectItem>
        )}
      </SelectContent>
    </Select>
  );

  const columns: DataTableColumn<Lead>[] = useMemo(() => [
    {
      id: "submitted_at",
      header: "Date",
      sortable: true,
      sortValue: (c) => c.submitted_at || "",
      headClassName: "whitespace-nowrap",
      cellClassName: "text-sm whitespace-nowrap",
      cell: (c) => (c.submitted_at ? format(new Date(c.submitted_at), "MMM dd, yyyy HH:mm") : "-"),
    },
    {
      id: "full_name",
      header: "Name",
      sortable: true,
      sortValue: (c) => (c.full_name || "").toLowerCase(),
      cellClassName: "font-medium",
      cell: (c) => c.full_name,
    },
    {
      id: "email",
      header: "Email",
      sortable: true,
      sortValue: (c) => (c.email || "").toLowerCase(),
      cell: (c) => c.email,
    },
    {
      id: "enquiry_type",
      header: "Type",
      sortable: true,
      sortValue: (c) => c.enquiry_type || "",
      cell: (c) => <EnquiryBadge type={c.enquiry_type ?? "general"} />,
    },
    {
      id: "subject",
      header: "Subject",
      sortable: true,
      sortValue: (c) => (c.subject || "").toLowerCase(),
      cellClassName: "max-w-xs truncate",
      cell: (c) => c.subject,
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      sortValue: (c) => c.status || "unread",
      cell: (c) => <StatusBadge status={c.status ?? "unread"} />,
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      cell: (contact) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setReading(contact)}>
            <Eye className="h-4 w-4 mr-1" />Read
          </Button>
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const selectedArr = [...selectedIds];

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
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Input placeholder="Search name, email, subject, message..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-72" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground ml-auto">{filtered.length} of {contacts?.length ?? 0}</span>
          </div>

          {/* Bulk actions bar */}
          {selectedArr.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-3 rounded-md border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium">{selectedArr.length} selected</span>
              <span className="text-sm text-muted-foreground">Mark as:</span>
              {STATUSES.map((s) => (
                <Button key={s.value} variant="outline" size="sm" onClick={() => { setStatus(selectedArr, s.value); setSelectedIds(new Set()); }}>{s.label}</Button>
              ))}
              <Button variant="destructive" size="sm" onClick={() => confirmDelete(selectedArr)} disabled={deleteMutation.isPending}>
                <Trash2 className="h-4 w-4 mr-1" />Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
            </div>
          )}

          <DataTable
            data={filtered}
            columns={columns}
            rowKey={(c) => c.id}
            isLoading={isLoading}
            defaultSort={{ columnId: "submitted_at", direction: "desc" }}
            selection={{ selectedIds, onChange: setSelectedIds }}
            onRowClick={(c) => setReading(c)}
            rowClassName={(c) => ((c.status ?? "unread") === "unread" ? "font-medium" : "")}
            emptyMessage={contacts?.length ? "No leads match your filters" : "No leads yet"}
          />
        </CardContent>
      </Card>

      {/* Full lead reader */}
      <Dialog open={!!reading} onOpenChange={(o) => !o && setReading(null)}>
        <DialogContent
          className="overflow-auto"
          style={{ width: "min(42rem, 95vw)", maxWidth: "95vw", minWidth: "20rem", height: "auto", maxHeight: "90vh", minHeight: "18rem", resize: "both" }}
        >
          {reading && (
            <>
              <DialogHeader>
                <DialogTitle>{reading.subject || "Lead"}</DialogTitle>
                <DialogDescription>
                  {reading.full_name || "Unknown"}
                  {reading.submitted_at ? ` · ${format(new Date(reading.submitted_at), "MMM dd, yyyy HH:mm")}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Email</div>
                  <a href={`mailto:${reading.email}`} className="text-primary hover:underline break-all">{reading.email}</a>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Phone</div>
                  <div>{reading.phone || "-"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Type</div>
                  <EnquiryBadge type={reading.enquiry_type ?? "general"} />
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Status</div>
                  <StatusBadge status={reading.status ?? "unread"} />
                </div>
              </div>

              <div>
                <div className="text-muted-foreground text-xs mb-1">Message</div>
                <div className="rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap break-words">
                  {reading.message || "(no message)"}
                </div>
              </div>

              {reading.attachment_url && (
                <Button variant="outline" size="sm" asChild className="w-fit">
                  <a href={reading.attachment_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-1" />{reading.attachment_filename || "Download attachment"}
                  </a>
                </Button>
              )}

              <DialogFooter className="gap-2 sm:justify-between sm:items-center">
                <Button variant="destructive" size="sm" onClick={() => confirmDelete([reading.id])} disabled={deleteMutation.isPending}>
                  <Trash2 className="h-4 w-4 mr-1" />Delete
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusSelect contact={reading} className="w-40" />
                  <Button asChild>
                    <a href={`mailto:${reading.email}?subject=${encodeURIComponent("Re: " + (reading.subject || ""))}`}>
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
