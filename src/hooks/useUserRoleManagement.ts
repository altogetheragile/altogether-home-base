import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

      // Update user_roles table - first delete existing role, then insert new one
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole as any });

      if (insertError) throw insertError;

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
      console.error('Failed to update user role:', error);
      toast.error(error.message || 'Failed to update user role');
    },
  });
};
