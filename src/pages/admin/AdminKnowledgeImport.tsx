import KnowledgeBaseImportManager from "@/components/admin/knowledge/KnowledgeBaseImportManager";
import { IsaO3ExportImport } from "@/components/admin/knowledge/IsaO3ExportImport";

const AdminKnowledgeImport = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <IsaO3ExportImport />
      <KnowledgeBaseImportManager />
    </div>
  );
};

export default AdminKnowledgeImport;
