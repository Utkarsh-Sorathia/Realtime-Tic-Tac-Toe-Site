import Pusher from 'pusher-js';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || '069e6fdbe5efc2219f47';
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'ap2';
const API_BASE = import.meta.env.VITE_API_URL || 'http://192.168.1.20:5000/api';

// Player context — set once before subscription
let _playerName = '';
let _playerSide = '';

export const setPlayerContext = (name: string, side: string) => {
  _playerName = name;
  _playerSide = side;
};

/**
 * Initialize the global Pusher client with a custom authorizer.
 * The authorizer is called by Pusher during the presence channel handshake.
 * We use it to pass the player's name/side to the backend auth endpoint.
 */
export const pusherClient = new Pusher(PUSHER_KEY, {
  cluster: PUSHER_CLUSTER,
  forceTLS: true,
  authorizer: (channel) => ({
    authorize: (socketId, callback) => {
      const url = `${API_BASE}/pusher/auth?playerName=${encodeURIComponent(_playerName)}&playerSide=${encodeURIComponent(_playerSide)}`;

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `socket_id=${encodeURIComponent(socketId)}&channel_name=${encodeURIComponent(channel.name)}`,
      })
        .then((res) => res.json())
        .then((data) => callback(null, data))
        .catch((err) => {
          console.error('❌ Pusher Auth request failed:', err);
          callback(new Error('Auth failed'), null);
        });
    },
  }),
});

/**
 * Subscribes to a game's presence channel for:
 * 1. Real-time game state updates via 'game-updated'
 * 2. Opponent disconnect detection via 'pusher:member_removed'
 */
export const subscribeToGame = (
  roomId: string,
  onUpdate: (data: any) => void,
  onOpponentLeft?: () => void,
  onOpponentReconnected?: () => void
) => {
  const channelName = `presence-game-${roomId}`;
  const channel = pusherClient.subscribe(channelName);

  channel.bind('game-updated', onUpdate);

  // 👻 OPPONENT LEFT: Triggered when their socket drops (tab close, crash, refresh)
  channel.bind('pusher:member_removed', (member: { id: string }) => {
    console.log(`👤 Member [${member.id}] left the channel`);
    if (onOpponentLeft) onOpponentLeft();
  });

  // ✅ OPPONENT RETURNED: Triggered when they reconnect (page refresh, network back)
  channel.bind('pusher:member_added', (member: { id: string }) => {
    console.log(`👤 Member [${member.id}] rejoined the channel`);
    if (onOpponentReconnected) onOpponentReconnected();
  });

  return () => {
    channel.unbind('game-updated', onUpdate);
    channel.unbind('pusher:member_removed');
    channel.unbind('pusher:member_added');
    pusherClient.unsubscribe(channelName);
  };
};

export default pusherClient;
