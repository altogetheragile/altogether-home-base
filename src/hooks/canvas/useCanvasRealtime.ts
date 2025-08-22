import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CanvasData } from '@/components/canvas/BaseCanvas';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseCanvasRealtimeProps {
  canvasId: string;
  onDataChange: (data: CanvasData) => void;
  isEnabled?: boolean;
}

interface RealtimeUpdate {
  id: string;
  canvas_id: string;
  data: CanvasData;
  updated_by: string;
  updated_at: string;
}

export const useCanvasRealtime = ({
  canvasId,
  onDataChange,
  isEnabled = true,
}: UseCanvasRealtimeProps) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!isEnabled || !canvasId) return;

    const channel = supabase.channel(`canvas_${canvasId}`, {
      config: {
        presence: {
          key: 'user_id',
        },
      },
    });

    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.entries(state).map(([key, presences]) => ({
          id: key,
          name: (presences as any[])[0]?.name || 'Unknown User'
        }));
        setActiveUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      });

    // Listen for canvas updates
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'canvases',
        filter: `id=eq.${canvasId}`,
      },
      (payload) => {
        console.log('Canvas update received:', payload);
        const update = payload.new as RealtimeUpdate;
        if (update.data) {
          onDataChange(update.data);
        }
      }
    );

    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        
        // Track current user presence
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await channel.track({
            id: user.id,
            name: user.email || 'Anonymous',
            online_at: new Date().toISOString(),
          });
        }
      } else {
        setIsConnected(false);
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
      setActiveUsers([]);
    };
  }, [canvasId, isEnabled, onDataChange]);

  const broadcastUpdate = async (data: CanvasData) => {
    if (!channelRef.current || !isConnected) return;

    try {
      // Update database (this will trigger the postgres_changes event)
      const { error } = await supabase
        .from('canvases')
        .update({ 
          data, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', canvasId);

      if (error) {
        console.error('Error updating canvas:', error);
      }
    } catch (error) {
      console.error('Error broadcasting update:', error);
    }
  };

  return {
    isConnected,
    activeUsers,
    broadcastUpdate,
  };
};