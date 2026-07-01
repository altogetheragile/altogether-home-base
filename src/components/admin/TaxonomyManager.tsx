// Generic admin CRUD manager for the simple "taxonomy" tables (event categories, types,
// levels, formats, certification bodies, locations). Driven entirely by a TaxonomyConfig
// from src/config/taxonomyRegistry.ts, it replaces six near-identical page components.
// Reuses each entity's existing list hook (config.useList) so other consumers' caches stay
// in sync, and rebuilds create/update/delete on the shared optimistic-mutation helpers.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimisticCreate, useOptimisticUpdate, useOptimisticDelete } from '@/hooks/useOptimisticMutation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TaxonomyConfig, TaxonomyField } from '@/config/taxonomyRegistry';

type Row = { id: string } & Record<string, unknown>;

// The config's table name is dynamic, so the strongly-typed supabase client can't narrow
// it. Correctness is enforced by the registry, not the type system.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (table: string) => (supabase as any).from(table);

async function auditField(kind: 'created_by' | 'updated_by'): Promise<Record<string, string | undefined>> {
  const { data: { user } } = await supabase.auth.getUser();
  return { [kind]: user?.id };
}

function renderCell(field: TaxonomyField, value: unknown): ReactNode {
  const str = value == null ? '' : String(value);
  if (field.renderCell) return field.renderCell(str);
  if (!str) return <span className="text-muted-foreground">—</span>;
  if (field.type === 'url') {
    return <a href={str} target="_blank" rel="noreferrer" className="text-primary hover:underline">{str}</a>;
  }
  return str;
}

export function TaxonomyManager({ config }: { config: TaxonomyConfig }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  const { data: rows, isLoading, error } = config.useList();
  const lower = config.singularLabel.toLowerCase();

  const createMutation = useOptimisticCreate<Row, Record<string, unknown>>({
    queryKey: config.queryKey,
    mutationFn: async (data) => {
      const payload = config.stampAudit ? { ...data, ...(await auditField('created_by')) } : data;
      const { data: row, error: e } = await from(config.table).insert([payload]).select().single();
      if (e) throw e;
      return row as Row;
    },
    successMessage: `${config.singularLabel} created successfully`,
    errorMessage: `Failed to create ${lower}`,
    createTempItem: (data) => ({ id: `temp-${Date.now()}`, name: '', ...data }) as Row,
  });

  const updateMutation = useOptimisticUpdate<Row, { id: string } & Record<string, unknown>>({
    queryKey: config.queryKey,
    mutationFn: async (vars) => {
      const { id, ...fields } = vars;
      const payload = config.stampAudit ? { ...fields, ...(await auditField('updated_by')) } : fields;
      const { data: row, error: e } = await from(config.table).update(payload).eq('id', id).select().single();
      if (e) throw e;
      return row as Row;
    },
    successMessage: `${config.singularLabel} updated successfully`,
    errorMessage: `Failed to update ${lower}`,
  });

  const deleteMutation = useOptimisticDelete<{ success: boolean }, string>({
    queryKey: config.queryKey,
    mutationFn: async (id) => {
      const { error: e } = await from(config.table).delete().eq('id', id);
      if (e) throw e;
      return { success: true };
    },
    successMessage: `${config.singularLabel} deleted successfully`,
    errorMessage: `Failed to delete ${lower}`,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Error loading {config.pageTitle.toLowerCase()}: {(error as Error).message}
      </div>
    );
  }

  const extraColumns = config.fields.filter((f) => f.showInTable);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{config.pageTitle}</h1>
          <p className="text-muted-foreground">{config.pageSubtitle}</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {config.addButtonLabel}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New {config.singularLabel}</DialogTitle>
            </DialogHeader>
            <TaxonomyForm
              config={config}
              submitLabel="Create"
              pending={createMutation.isPending}
              onCancel={() => setIsCreateOpen(false)}
              onSubmit={(values) => createMutation.mutate(values, { onSuccess: () => setIsCreateOpen(false) })}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{config.cardTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {extraColumns.map((f) => <TableHead key={f.key}>{f.label}</TableHead>)}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{String(row.name ?? '')}</TableCell>
                  {extraColumns.map((f) => <TableCell key={f.key}>{renderCell(f, row[f.key])}</TableCell>)}
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog open={editing?.id === row.id} onOpenChange={(open) => { if (!open) setEditing(null); }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditing(row)}>
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit {config.singularLabel}</DialogTitle>
                          </DialogHeader>
                          <TaxonomyForm
                            config={config}
                            initialValues={row}
                            submitLabel="Save"
                            pending={updateMutation.isPending}
                            onCancel={() => setEditing(null)}
                            onSubmit={(values) => updateMutation.mutate({ id: row.id, ...values }, { onSuccess: () => setEditing(null) })}
                          />
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>{config.deleteWarning(String(row.name ?? ''))}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(row.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Confirm
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows?.length === 0 && <div className="text-center py-8 text-muted-foreground">{config.emptyState}</div>}
        </CardContent>
      </Card>
    </div>
  );
}

function TaxonomyForm({
  config, initialValues, submitLabel, pending, onCancel, onSubmit,
}: {
  config: TaxonomyConfig;
  initialValues?: Row;
  submitLabel: string;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of config.fields) init[f.key] = initialValues ? String(initialValues[f.key] ?? '') : '';
    return init;
  });

  const canSubmit = config.fields.every((f) => !f.required || (values[f.key] ?? '').trim());

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        const out: Record<string, unknown> = {};
        for (const f of config.fields) out[f.key] = (values[f.key] ?? '').trim();
        onSubmit(out);
      }}
      className="space-y-4"
    >
      {config.fields.map((f) => (
        <div key={f.key} className="space-y-2">
          <Label htmlFor={f.key}>{f.label}{f.required ? ' *' : ''}</Label>
          <Input
            id={f.key}
            type={f.type === 'url' ? 'url' : 'text'}
            value={values[f.key] ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            required={f.required}
          />
        </div>
      ))}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!canSubmit || pending}>{pending ? 'Saving...' : submitLabel}</Button>
      </div>
    </form>
  );
}
