import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';

interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_table: string;
  target_id: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

interface UseAdminAuditOptions {
  targetTable?: string;
  targetId?: string;
  adminId?: string;
  limit?: number;
}

export const useAdminAudit = (options: UseAdminAuditOptions = {}) => {
  const { user } = useAuth();
  const { data: userRole } = useUserRole();
  const { targetTable, targetId, adminId, limit = 50 } = options;

  return useQuery({
    queryKey: ['admin-audit-logs', targetTable, targetId, adminId, limit],
    queryFn: async () => {
      let query = supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (targetTable) {
        query = query.eq('target_table', targetTable);
      }

      if (targetId) {
        query = query.eq('target_id', targetId);
      }

      if (adminId) {
        query = query.eq('admin_id', adminId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AdminAuditLog[];
    },
    enabled: !!user && userRole === 'admin',
  });
};

// Hook to get audit logs for a specific user's profile
export const useProfileAuditLogs = (profileId: string) => {
  return useAdminAudit({
    targetTable: 'profiles',
    targetId: profileId,
  });
};

// Hook to get all recent admin actions
export const useRecentAdminActions = (limit: number = 100) => {
  return useAdminAudit({ limit });
};

// Hook to get audit logs for event registrations
export const useRegistrationAuditLogs = (registrationId: string) => {
  return useAdminAudit({
    targetTable: 'event_registrations',
    targetId: registrationId,
  });
};
