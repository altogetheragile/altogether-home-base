
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      console.log('🔍 useUserRole: Starting role fetch for user:', user?.id);
      if (!user?.id) {
        console.log('❌ useUserRole: No user ID, returning null');
        return null;
      }

      // Prefer roles from user_roles with priority: admin > moderator > user
      console.log('🔍 useUserRole: Checking user_roles table...');
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      console.log('📊 useUserRole: user_roles result:', { rolesData, rolesError });

      if (rolesError) {
        console.error('❌ useUserRole: Error fetching user roles:', rolesError);
      }

      const roles = (rolesData || []).map(r => r.role);
      console.log('📋 useUserRole: Extracted roles:', roles);
      
      if (roles.includes('admin')) {
        console.log('✅ useUserRole: Found admin role');
        return 'admin';
      }
      if (roles.includes('moderator')) {
        console.log('✅ useUserRole: Found moderator role');
        return 'moderator';
      }

      // Fallback to profiles.role for backward compatibility
      console.log('🔍 useUserRole: Checking profiles table fallback...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      console.log('📊 useUserRole: profiles result:', { profile, profileError });

      if (profileError) {
        console.error('❌ useUserRole: Error fetching profile role:', profileError);
        return 'user';
      }

      const finalRole = profile?.role || 'user';
      console.log('✅ useUserRole: Final role determined:', finalRole);
      return finalRole;
    },
    enabled: !!user?.id,
  });
};
