import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Mail, Calendar, Shield, User } from 'lucide-react';

interface UserDetailsDialogProps {
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
    username: string | null;
    role: string | null;
    created_at: string;
    profile_image_url?: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditRole: () => void;
}

export function UserDetailsDialog({ user, open, onOpenChange, onEditRole }: UserDetailsDialogProps) {
  if (!user) return null;

  const initials = user.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.[0].toUpperCase() || '?';

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.profile_image_url || undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold">
                  {user.full_name || user.username || 'Unnamed User'}
                </h3>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {user.role || 'user'}
                </Badge>
              </div>
              {user.username && (
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              )}
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Email:</span>
              <span className="text-muted-foreground">{user.email}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Registered:</span>
              <span className="text-muted-foreground">
                {format(new Date(user.created_at), 'PPP')}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">User ID:</span>
              <span className="text-muted-foreground font-mono text-xs">{user.id}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={onEditRole}>
              <User className="mr-2 h-4 w-4" />
              Edit Role
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
