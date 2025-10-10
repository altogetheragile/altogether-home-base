import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';

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

      // Apply role filter
      if (role && role !== 'all') {
        query = query.eq('role', role);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        users: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    enabled: !!user && userRole === 'admin',
  });
};
