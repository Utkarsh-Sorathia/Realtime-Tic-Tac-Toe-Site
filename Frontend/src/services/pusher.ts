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
  mySide: string,
  onUpdate: (data: any) => void,
  onOpponentLeft?: () => void,
  onOpponentReconnected?: () => void
) => {
  const channelName = `presence-game-${roomId}`;
  const channel = pusherClient.subscribe(channelName);

  channel.bind('game-updated', onUpdate);

  // 👻 OPPONENT LEFT: Triggered ONLY if the member who left is the opponent
  channel.bind('pusher:member_removed', (member: { id: string }) => {
    const opponentSide = mySide === 'X' ? 'O' : 'X';
    if (member.id === opponentSide) {
        console.log(`👤 Opponent [${member.id}] left the channel`);
        if (onOpponentLeft) onOpponentLeft();
    } else {
        console.log(`👤 Local session ghost [${member.id}] cleared`);
    }
  });

  // ✅ OPPONENT RETURNED: Triggered ONLY if the member who joined is the opponent
  channel.bind('pusher:member_added', (member: { id: string }) => {
    const opponentSide = mySide === 'X' ? 'O' : 'X';
    if (member.id === opponentSide) {
        console.log(`👤 Opponent [${member.id}] rejoined the channel`);
        if (onOpponentReconnected) onOpponentReconnected();
    }
  });

  return {
    unsubscribe: () => {
      channel.unbind('game-updated', onUpdate);
      channel.unbind('pusher:member_removed');
      channel.unbind('pusher:member_added');
      pusherClient.unsubscribe(channelName);
    },
    channel
  };
};

export default pusherClient;
