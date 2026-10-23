import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { auditLogger } from '@/utils/auditLogger';
import { toast } from 'sonner';

export const useUpdateUserRole = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      // Prevent admins from removing their own admin role
      if (userId === user?.id && newRole !== 'admin') {
        throw new Error('You cannot remove your own admin role');
      }

      // Update the role in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (profileError) throw profileError;

      // The new role goes in before the old ones come out. The other way round, an admin editing
      // their own row deleted their own admin role first, and the insert after it was then refused,
      // because they were no longer an admin: they kept the badge and lost the rights.
      const { error: insertError } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: userId, role: newRole as Database['public']['Enums']['app_role'] },
          { onConflict: 'user_id,role', ignoreDuplicates: true },
        );

      if (insertError) throw insertError;

      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .neq('role', newRole as Database['public']['Enums']['app_role']);

      if (deleteError) throw deleteError;

      // Log the action
      await auditLogger.update('user_roles', userId, {
        new_role: newRole,
        action: 'role_change',
      });

      return { userId, newRole };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User role updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user role');
    },
  });
};
