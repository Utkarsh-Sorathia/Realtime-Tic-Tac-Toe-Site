import express from 'express';
import { pusher } from '../config/pusher.js';

const router = express.Router();

/**
 * 🔐 PUSHER PRESENCE AUTH
 * Authorizes clients to subscribe to presence channels.
 * Pusher calls this endpoint during the handshake.
 * We send back a signed token with the player's identity (side + name).
 */
router.post('/auth', (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;

  // Player info is passed as query parameters from the frontend
  const playerName = (req.query.playerName as string) || 'Unknown';
  const playerSide = (req.query.playerSide as string) || 'X';

  if (!socketId || !channel) {
    return res.status(400).json({ error: 'socket_id and channel_name are required' });
  }

  // Handle private channels (notifications)
  if (channel.startsWith('private-')) {
    const authResponse = pusher.authorizeChannel(socketId, channel);
    return res.json(authResponse);
  }

  const presenceData = {
    // If it's the global lobby, use a unique ID so every tab counts as a new player.
    // If it's a game room, use playerSide ('X' or 'O') to prevent joining twice.
    user_id: channel === 'presence-lobby' ? `lobby-${socketId}` : playerSide,
    user_info: { name: playerName }
  };

  try {
    const authResponse = pusher.authorizeChannel(socketId, channel, presenceData);
    console.log(`✅ Presence auth for [${playerName}] as [${playerSide}] on [${channel}]`);
    res.json(authResponse);
  } catch (err) {
    console.error('❌ Pusher Auth Error:', err);
    res.status(500).json({ error: 'Auth failed' });
  }
});

export default router;
