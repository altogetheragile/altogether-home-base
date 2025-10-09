import { supabase } from '@/integrations/supabase/client';

export const logAdminAudit = async (
  action: string,
  targetTable: string,
  targetId: string,
  metadata?: Record<string, any>
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('Cannot log audit entry: No authenticated user');
      return;
    }
    
    const { error } = await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      action,
      target_table: targetTable,
      target_id: targetId,
      metadata: metadata || {}
    });
    
    if (error) {
      console.error('Failed to log audit entry:', error);
    }
  } catch (error) {
    console.error('Audit logging exception:', error);
    // Don't throw - audit logging should never block operations
  }
};

// Convenience functions for common actions
export const auditLogger = {
  view: (table: string, id: string, metadata?: Record<string, any>) =>
    logAdminAudit('VIEW', table, id, metadata),
  
  create: (table: string, id: string, metadata?: Record<string, any>) =>
    logAdminAudit('CREATE', table, id, metadata),
  
  update: (table: string, id: string, metadata?: Record<string, any>) =>
    logAdminAudit('UPDATE', table, id, metadata),
  
  delete: (table: string, id: string, metadata?: Record<string, any>) =>
    logAdminAudit('DELETE', table, id, metadata),
};
