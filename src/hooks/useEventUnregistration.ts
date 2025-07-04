import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export const useEventUnregistration = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const unregisterFromEvent = async (registrationId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to unregister from events.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('id', registrationId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Invalidate and refetch user registrations
      queryClient.invalidateQueries({ queryKey: ['user-registrations', user.id] });

      toast({
        title: "Successfully unregistered",
        description: "You have been unregistered from the event.",
      });
    } catch (error) {
      console.error('Unregistration error:', error);
      toast({
        title: "Unregistration failed",
        description: error instanceof Error ? error.message : "Failed to unregister from event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    unregisterFromEvent,
    loading,
  };
};