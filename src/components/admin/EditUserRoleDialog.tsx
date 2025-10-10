import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface EditUserRoleDialogProps {
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (userId: string, newRole: string) => void;
  isLoading?: boolean;
}

export function EditUserRoleDialog({
  user,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: EditUserRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'user');

  if (!user) return null;

  const handleConfirm = () => {
    onConfirm(user.id, selectedRole);
  };

  const hasRoleChanged = selectedRole !== user.role;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User Role</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Changing role for: <span className="font-medium text-foreground">{user.full_name || user.email}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Current Role</Label>
            <div className="px-3 py-2 rounded-md bg-muted text-sm">
              {user.role || 'user'}
            </div>
          </div>

          <div className="space-y-2">
            <Label>New Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedRole === 'admin' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Admin users have full access to all system features and can manage other users.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!hasRoleChanged || isLoading}>
            {isLoading ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
