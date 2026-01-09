import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

export const BackgroundEditor: React.FC = () => {
  const form = useFormContext();
  const background = form.watch('background') || '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Background & Context
        </CardTitle>
        <CardDescription>
          Rich text content providing detailed background information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RichTextEditor
          content={background}
          onChange={(content) => form.setValue('background', content)}
          placeholder="Enter detailed background information..."
        />
      </CardContent>
    </Card>
  );
};
