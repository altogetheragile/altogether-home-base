import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';

interface AdminStats {
  totalEvents: number;
  totalKnowledgeItems: number;
  totalUsers: number;
  totalRegistrations: number;
  paidRegistrations: number;
  unpaidRegistrations: number;
  recentActions: number;
}

export const useAdminStats = () => {
  const { user } = useAuth();
  const { data: userRole } = useUserRole();

  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      // Fetch all stats in parallel
      const [
        eventsResult,
        knowledgeItemsResult,
        usersResult,
        registrationsResult,
        paidRegsResult,
        unpaidRegsResult,
        recentActionsResult,
      ] = await Promise.all([
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true),
        supabase
          .from('knowledge_items')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('event_registrations')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('event_registrations')
          .select('id', { count: 'exact', head: true })
          .eq('payment_status', 'paid'),
        supabase
          .from('event_registrations')
          .select('id', { count: 'exact', head: true })
          .eq('payment_status', 'unpaid'),
        supabase
          .from('admin_audit_log')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      return {
        totalEvents: eventsResult.count || 0,
        totalKnowledgeItems: knowledgeItemsResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalRegistrations: registrationsResult.count || 0,
        paidRegistrations: paidRegsResult.count || 0,
        unpaidRegistrations: unpaidRegsResult.count || 0,
        recentActions: recentActionsResult.count || 0,
      };
    },
    enabled: !!user && userRole === 'admin',
    staleTime: 60000, // 1 minute
  });
};
