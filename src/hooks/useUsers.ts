import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  username: string | null;
  role: string | null;
  created_at: string | null;
  profile_image_url: string | null;
}

/** Same precedence as useUserRole: admin, then moderator, then user. */
function strongestRole(held: { user_id: string; role: string }[], id: string): string | null {
  const mine = held.filter((r) => r.user_id === id).map((r) => r.role);
  return ['admin', 'moderator', 'user'].find((r) => mine.includes(r)) ?? null;
}

interface UseUsersFilters {
  search?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}

export const useUsers = (filters: UseUsersFilters = {}) => {
  const { user } = useAuth();
  const { data: userRole } = useUserRole();
  const { search, role, page = 1, pageSize = 20 } = filters;

  return useQuery({
    queryKey: ['users', search, role, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply search filter
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`);
      }

      // The role is user_roles', not the profile's. Every permission check reads user_roles, and an
      // admin cannot write somebody else's profile (RLS allows only your own, and refuses silently),
      // so after Edit Role the profile still said "user" for somebody who was by then an admin.
      if (role && role !== 'all') {
        // Somebody can hold more than one row (user and admin); the filter goes by the strongest, as
        // the badge does, so an admin is not also listed under "user".
        const { data: all, error: rolesError } = await supabase.from('user_roles').select('user_id, role');
        if (rolesError) throw rolesError;
        const ids = [...new Set((all ?? []).map((r) => r.user_id))].filter((id) => strongestRole(all ?? [], id) === role);
        if (ids.length === 0) return { users: [], totalCount: 0, totalPages: 0 };
        query = query.in('id', ids);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const profiles = (data || []) as UserProfile[];
      const { data: held, error: heldError } = profiles.length
        ? await supabase.from('user_roles').select('user_id, role').in('user_id', profiles.map((p) => p.id))
        : { data: [] as { user_id: string; role: string }[] };
      if (heldError) throw heldError;
      const users = profiles.map((p) => ({ ...p, role: strongestRole(held ?? [], p.id) ?? p.role }));

      return {
        users,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    enabled: !!user && userRole === 'admin',
  });
};
