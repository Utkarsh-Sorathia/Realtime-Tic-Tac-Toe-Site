import { Router } from 'express';
import { pusher } from '../config/pusher.js';

const router = Router();

/**
 * 😠 LIVE REACTIONS: Broadcast an elite emoji to the game room.
 * This is a high-speed, real-time broadcast via Pusher. 🚀🛡️
 */
router.post('/:roomId/emoji', (req, res) => {
    const { roomId } = req.params;
    const { playerName, emoji } = req.body;

    if (!playerName || !emoji) {
        return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    try {
        // Broadcast the emote event to the presence channel
        pusher.trigger(`presence-game-${roomId}`, 'emoji-reaction', {
            playerName,
            emoji
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Emoji broadcast error:', err);
        res.status(500).json({ success: false, message: 'Failed to broadcast react' });
    }
});

export default router;
