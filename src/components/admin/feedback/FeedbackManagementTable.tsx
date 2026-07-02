import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCourseFeedback, useBulkApproveFeedback, useUpdateFeedback, useDeleteFeedback } from "@/hooks/useCourseFeedback";
import { CheckCircle, XCircle, Star, Trash2, ExternalLink } from "lucide-react";

type FeedbackItem = {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  job_title: string | null;
  course_name: string;
  rating: number;
  comment: string;
  source: string;
  source_url: string | null;
  is_approved: boolean;
  is_featured: boolean;
};

const FeedbackManagementTable = () => {
  const [approvalFilter, setApprovalFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: feedback, isLoading } = useCourseFeedback({
    isApproved: approvalFilter === "all" ? undefined : approvalFilter === "approved",
  });

  const bulkApproveMutation = useBulkApproveFeedback();
  const updateMutation = useUpdateFeedback();
  const deleteMutation = useDeleteFeedback();

  const handleBulkApprove = () => {
    if (selectedIds.size > 0) {
      bulkApproveMutation.mutate([...selectedIds]);
      setSelectedIds(new Set());
    }
  };

  const handleToggleApproval = (id: string, currentStatus: boolean) => {
    updateMutation.mutate({ id, updates: { is_approved: !currentStatus } });
  };

  const handleToggleFeatured = (id: string, currentStatus: boolean) => {
    updateMutation.mutate({ id, updates: { is_featured: !currentStatus } });
  };

  const columns: DataTableColumn<FeedbackItem>[] = useMemo(() => [
    {
      id: "name",
      header: "Name",
      sortable: true,
      sortValue: (item) => `${item.first_name} ${item.last_name}`.toLowerCase(),
      cell: (item) => (
        <div>
          <p className="font-medium">{item.first_name} {item.last_name}</p>
          {item.company && <p className="text-sm text-muted-foreground">{item.company}</p>}
          {item.job_title && <p className="text-xs text-muted-foreground">{item.job_title}</p>}
        </div>
      ),
    },
    {
      id: "course",
      header: "Course",
      sortable: true,
      sortValue: (item) => item.course_name.toLowerCase(),
      cell: (item) => item.course_name,
    },
    {
      id: "rating",
      header: "Rating",
      sortable: true,
      sortValue: (item) => item.rating,
      cell: (item) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
          <span className="font-medium">{item.rating}/10</span>
        </div>
      ),
    },
    {
      id: "comment",
      header: "Comment",
      cell: (item) => <p className="max-w-xs truncate text-sm">{item.comment}</p>,
    },
    {
      id: "source",
      header: "Source",
      cell: (item) => (
        <>
          <Badge variant="outline">{item.source}</Badge>
          {item.source_url && (
            <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="ml-1">
              <ExternalLink className="w-3 h-3 inline" />
            </a>
          )}
        </>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (item) => (
        <div className="flex flex-col gap-1">
          <Badge variant={item.is_approved ? "default" : "secondary"}>
            {item.is_approved ? "Approved" : "Pending"}
          </Badge>
          {item.is_featured && (
            <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900">
              Featured
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (item) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleToggleApproval(item.id, item.is_approved)}
            title={item.is_approved ? "Unapprove" : "Approve"}
          >
            {item.is_approved ? (
              <XCircle className="w-4 h-4 text-destructive" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-600" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleToggleFeatured(item.id, item.is_featured)}
            title={item.is_featured ? "Unfeature" : "Feature"}
          >
            <Star className={`w-4 h-4 ${item.is_featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteMutation.mutate(item.id)}
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          data={feedback as FeedbackItem[] | undefined}
          columns={columns}
          rowKey={(item) => item.id}
          isLoading={isLoading}
          searchable
          searchPlaceholder="Search feedback..."
          getSearchText={(item) =>
            `${item.first_name} ${item.last_name} ${item.course_name} ${item.comment}`
          }
          pageSize={20}
          selection={{ selectedIds, onChange: setSelectedIds }}
          emptyMessage="No feedback found"
          toolbar={
            <>
              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Feedback</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              {selectedIds.size > 0 && (
                <Button onClick={handleBulkApprove} variant="default">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Selected ({selectedIds.size})
                </Button>
              )}
            </>
          }
        />
      </CardContent>
    </Card>
  );
};

export default FeedbackManagementTable;
