import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCourseFeedback, useBulkApproveFeedback, useUpdateFeedback, useDeleteFeedback } from "@/hooks/useCourseFeedback";
import { CheckCircle, XCircle, Star, Trash2, Edit, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const FeedbackManagementTable = () => {
  const [approvalFilter, setApprovalFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: feedback, isLoading } = useCourseFeedback({
    isApproved: approvalFilter === "all" ? undefined : approvalFilter === "approved",
  });
  
  const bulkApproveMutation = useBulkApproveFeedback();
  const updateMutation = useUpdateFeedback();
  const deleteMutation = useDeleteFeedback();

  const filteredFeedback = feedback?.filter(f => 
    f.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.comment.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = () => {
    if (selectedIds.length > 0) {
      bulkApproveMutation.mutate(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleToggleApproval = (id: string, currentStatus: boolean) => {
    updateMutation.mutate({ id, updates: { is_approved: !currentStatus } });
  };

  const handleToggleFeatured = (id: string, currentStatus: boolean) => {
    updateMutation.mutate({ id, updates: { is_featured: !currentStatus } });
  };

  if (isLoading) {
    return <div className="p-8">Loading feedback...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Feedback</CardTitle>
        <div className="flex gap-4 mt-4">
          <Input
            placeholder="Search feedback..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
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
          {selectedIds.length > 0 && (
            <Button onClick={handleBulkApprove} variant="default">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve Selected ({selectedIds.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Select</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFeedback.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={() => handleToggleSelect(item.id)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.first_name} {item.last_name}</p>
                    {item.company && <p className="text-sm text-muted-foreground">{item.company}</p>}
                    {item.job_title && <p className="text-xs text-muted-foreground">{item.job_title}</p>}
                  </div>
                </TableCell>
                <TableCell>{item.course_name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium">{item.rating}/10</span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="max-w-xs truncate text-sm">{item.comment}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.source}</Badge>
                  {item.source_url && (
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="ml-1">
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  )}
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default FeedbackManagementTable;
