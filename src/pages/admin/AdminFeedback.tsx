import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeedbackImportManager from "@/components/admin/feedback/FeedbackImportManager";
import FeedbackManagementTable from "@/components/admin/feedback/FeedbackManagementTable";

const AdminFeedback = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Course Feedback Management</h1>
        <p className="text-muted-foreground">Manage course feedback, testimonials, and reviews</p>
      </div>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList>
          <TabsTrigger value="manage">Manage Feedback</TabsTrigger>
          <TabsTrigger value="import">Import Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage" className="space-y-4">
          <FeedbackManagementTable />
        </TabsContent>
        
        <TabsContent value="import" className="space-y-4">
          <FeedbackImportManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFeedback;
