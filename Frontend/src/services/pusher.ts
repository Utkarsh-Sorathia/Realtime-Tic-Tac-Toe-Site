import Pusher from 'pusher-js';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || '';
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'ap2';

/**
 * Initialize the global Pusher client for the frontend.
 * This service handles real-time subscriptions and events.
 */
export const pusherClient = new Pusher(PUSHER_KEY, {
  cluster: PUSHER_CLUSTER,
  forceTLS: true,
});

// Helper for subscribing to a specific game's updates
export const subscribeToGame = (roomId: string, onUpdate: (data: any) => void) => {
  const channelName = `game-${roomId}`;
  const channel = pusherClient.subscribe(channelName);
  
  channel.bind('game-updated', onUpdate);
  
  return () => {
    pusherClient.unsubscribe(channelName);
  };
};

export default pusherClient;
