
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useEventRegistration = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const registerForEvent = async (eventId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to register for events.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { eventId },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Failed to start registration process",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId },
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        title: "Payment verification failed",
        description: error instanceof Error ? error.message : "Failed to verify payment",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    registerForEvent,
    verifyPayment,
    loading,
  };
};
