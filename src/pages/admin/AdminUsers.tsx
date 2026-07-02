import { useMemo, useState } from 'react';
import { toCsv } from '@/utils/csv';
import { useUsers, UserProfile } from '@/hooks/useUsers';
import { useUpdateUserRole } from '@/hooks/useUserRoleManagement';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, MoreVertical, Eye, Shield, Download } from 'lucide-react';
import { format } from 'date-fns';
import { UserDetailsDialog } from '@/components/admin/UserDetailsDialog';
import { EditUserRoleDialog } from '@/components/admin/EditUserRoleDialog';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editRoleOpen, setEditRoleOpen] = useState(false);

  const { data, isLoading } = useUsers({ search, role: roleFilter, page, pageSize: 20 });
  const updateRoleMutation = useUpdateUserRole();

  const handleViewDetails = (user: UserProfile) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const handleEditRole = (user: UserProfile) => {
    setSelectedUser(user);
    setEditRoleOpen(true);
  };

  const handleEditRoleFromDetails = () => {
    setDetailsOpen(false);
    setEditRoleOpen(true);
  };

  const handleConfirmRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ userId, newRole }, {
      onSuccess: () => {
        setEditRoleOpen(false);
        setSelectedUser(null);
      },
    });
  };

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

  const columns: DataTableColumn<UserProfile>[] = useMemo(() => [
    {
      id: 'avatar',
      header: '',
      headClassName: 'w-[50px]',
      cell: (user) => {
        const initials = user.full_name
          ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase()
          : user.email?.[0].toUpperCase() || '?';
        return (
          <Avatar>
            <AvatarImage src={user.profile_image_url || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        );
      },
    },
    {
      id: 'name',
      header: 'Name',
      cellClassName: 'font-medium',
      cell: (user) =>
        user.full_name || <span className="text-muted-foreground">No name</span>,
    },
    { id: 'email', header: 'Email', cell: (user) => user.email },
    {
      id: 'username',
      header: 'Username',
      cell: (user) =>
        user.username ? `@${user.username}` : <span className="text-muted-foreground">—</span>,
    },
    {
      id: 'role',
      header: 'Role',
      cell: (user) => (
        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role || 'user'}</Badge>
      ),
    },
    {
      id: 'registered',
      header: 'Registered',
      cellClassName: 'text-muted-foreground',
      cell: (user) =>
        user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '-',
    },
    {
      id: 'actions',
      header: '',
      headClassName: 'w-[80px]',
      cell: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetails(user)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditRole(user)}>
              <Shield className="mr-2 h-4 w-4" />
              Edit Role
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const exportToCSV = () => {
    if (!data?.users) return;

    const headers = ['Name', 'Email', 'Username', 'Role', 'Registered'];
    const rows = data.users.map(user => [
      user.full_name || '',
      user.email || '',
      user.username || '',
      user.role || 'user',
      user.created_at ? format(new Date(user.created_at), 'yyyy-MM-dd') : '',
    ]);

    const csv = toCsv(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage registered users and their roles
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" disabled={!data?.users?.length}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table (search/filter/pagination are server-side, handled above/below) */}
      <DataTable
        data={data?.users}
        columns={columns}
        rowKey={(user) => user.id}
        isLoading={isLoading}
        emptyMessage="No users found"
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.totalCount)} of {data.totalCount} users
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <UserDetailsDialog
        user={selectedUser ? { ...selectedUser, created_at: selectedUser.created_at ?? '' } : null}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEditRole={handleEditRoleFromDetails}
      />
      <EditUserRoleDialog
        user={selectedUser}
        open={editRoleOpen}
        onOpenChange={setEditRoleOpen}
        onConfirm={handleConfirmRoleChange}
        isLoading={updateRoleMutation.isPending}
      />
    </div>
  );
}
