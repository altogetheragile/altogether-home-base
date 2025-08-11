
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Prefer roles from user_roles with priority: admin > moderator > user
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      }

      const roles = (rolesData || []).map(r => r.role);
      if (roles.includes('admin')) return 'admin';
      if (roles.includes('moderator')) return 'moderator';

      // Fallback to profiles.role for backward compatibility
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile role:', profileError);
        return 'user';
      }

      return profile?.role || 'user';
    },
    enabled: !!user?.id,
  });
};
