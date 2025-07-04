import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SimpleFormProps {
  onSubmit: (data: { name: string }) => void;
  initialData?: { name: string };
  isLoading?: boolean;
  onCancel?: () => void;
}

const SimpleForm: React.FC<SimpleFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  onCancel,
}) => {
  const [name, setName] = useState(initialData?.name || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name"
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
};

export default SimpleForm;