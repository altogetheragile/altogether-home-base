import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { KnowledgeItemEditor } from '@/components/admin/knowledge/KnowledgeItemEditor';

// Example: fetch a knowledge item by ID from params (adjust to your data source)
export default function EditKnowledgeItem() {
  const { id } = useParams<{ id: string }>();

  // State for editor visibility
  const [open, setOpen] = useState(true);

  // Placeholder knowledge item (replace with real fetch)
  const knowledgeItem = {
    id,
    title: 'Example Knowledge Item',
    description: 'This is placeholder content — fetch the real item here.',
  };

  return (
    <div className="p-6">
      <KnowledgeItemEditor
        open={open}
        onOpenChange={setOpen}
        knowledgeItem={knowledgeItem}
        onSuccess={() => {
          setOpen(false);
          console.log('✅ Item saved successfully');
          // TODO: navigate back to dashboard or show a toast
        }}
      />
    </div>
  );
}
