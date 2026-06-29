import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Download, Eye, Mail, Trash2, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";

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

type SortKey = "submitted_at" | "full_name" | "email" | "enquiry_type" | "subject" | "status";

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

const sortValue = (c: Lead, key: SortKey): string => {
  if (key === "submitted_at") return c.submitted_at || "";
  if (key === "status") return c.status || "unread";
  if (key === "enquiry_type") return c.enquiry_type || "";
  return (c[key] || "").toLowerCase();
};

const AdminContacts = () => {
  const queryClient = useQueryClient();
  const [reading, setReading] = useState<Lead | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("submitted_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
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

  const visible = useMemo(() => {
    const rows = contacts ?? [];
    const q = search.trim().toLowerCase();
    const filtered = rows.filter((c) => {
      const status = c.status ?? "unread";
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!q) return true;
      return [c.full_name, c.email, c.subject, c.message, c.phone].some((v) => (v || "").toLowerCase().includes(q));
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = sortValue(a, sortKey), bv = sortValue(b, sortKey);
      return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
    });
  }, [contacts, search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "submitted_at" ? "desc" : "asc"); }
  };

  const visibleIds = visible.map((c) => c.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = visibleIds.some((id) => selectedIds.has(id));
  const toggleAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(visibleIds));
  const toggleOne = (id: string) =>
    setSelectedIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const SortHead = ({ label, sortKey: key, className }: { label: string; sortKey: SortKey; className?: string }) => (
    <TableHead className={className}>
      <button onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        {sortKey === key ? (sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />}
      </button>
    </TableHead>
  );

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
            <span className="text-sm text-muted-foreground ml-auto">{visible.length} of {contacts?.length ?? 0}</span>
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

          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : !contacts?.length ? (
            <div className="text-center py-8 text-muted-foreground">No leads yet</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={allSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={toggleAll} aria-label="Select all" />
                    </TableHead>
                    <SortHead label="Date" sortKey="submitted_at" className="whitespace-nowrap" />
                    <SortHead label="Name" sortKey="full_name" />
                    <SortHead label="Email" sortKey="email" />
                    <SortHead label="Type" sortKey="enquiry_type" />
                    <SortHead label="Subject" sortKey="subject" />
                    <SortHead label="Status" sortKey="status" />
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((contact) => (
                    <TableRow
                      key={contact.id}
                      data-state={selectedIds.has(contact.id) ? "selected" : undefined}
                      className={`cursor-pointer ${(contact.status ?? "unread") === "unread" ? "font-medium" : ""}`}
                      onClick={() => setReading(contact)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selectedIds.has(contact.id)} onCheckedChange={() => toggleOne(contact.id)} aria-label="Select row" />
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {contact.submitted_at ? format(new Date(contact.submitted_at), "MMM dd, yyyy HH:mm") : "-"}
                      </TableCell>
                      <TableCell className="font-medium">{contact.full_name}</TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell><EnquiryBadge type={contact.enquiry_type ?? "general"} /></TableCell>
                      <TableCell className="max-w-xs truncate">{contact.subject}</TableCell>
                      <TableCell><StatusBadge status={contact.status ?? "unread"} /></TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => setReading(contact)}>
                          <Eye className="h-4 w-4 mr-1" />Read
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visible.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No leads match your filters</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
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
