import { KnowledgeItemEditorPage } from '@/components/admin/knowledge/KnowledgeItemEditorPage';

const CreateKnowledgeItem = () => {
  return (
    <KnowledgeItemEditorPage 
      knowledgeItem={null} 
      isEditing={false} 
    />
  );
};

export default CreateKnowledgeItem;