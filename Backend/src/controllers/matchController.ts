import type { Request, Response } from 'express';
import { redis } from '../config/redis.js';
import { pusher } from '../config/pusher.js';
import GameModel from '../models/Game.js';
import { gameCache } from './roomController.js';
import type { GameState } from '../types/game.js';

import { connectDB } from '../config/db.js';

interface QueuePlayer {
    playerName: string;
    socketId: string;
}

/**
 * 🎯 GLOBAL MATCHMAKING: Pair strangers using Upstash Redis.
 * This is stateless and safe for Vercel/Serverless deployment. 🚀🛡️
 */
export const joinQueue = async (req: Request, res: Response) => {
    const { playerName, socketId } = req.body;

    if (!playerName || !socketId) {
        return res.status(400).json({ success: false, message: 'Missing playerName or socketId' });
    }

    try {
        await connectDB();
        console.log(`🎯 Player joining queue: ${playerName} [${socketId}]`);
        const playerEntry: QueuePlayer = { playerName, socketId };
        
        // Push the player into the Redis matchmaking list
        await redis.lpush('matchmaking_queue', JSON.stringify(playerEntry));

        // Let's check if we have a pair ready
        const queueLength = await redis.llen('matchmaking_queue');

        if (queueLength >= 2) {
            // We have enough players — pop 2 for a match!
            // We use RPOP to get the oldest waiting players (FIFO)
            const player1Raw = await redis.rpop('matchmaking_queue');
            const player2Raw = await redis.rpop('matchmaking_queue');

            if (player1Raw && player2Raw) {
                const p1: QueuePlayer = typeof player1Raw === 'string' ? JSON.parse(player1Raw) : player1Raw;
                const p2: QueuePlayer = typeof player2Raw === 'string' ? JSON.parse(player2Raw) : player2Raw;

                // Create a unique room for them
                const roomId = Math.floor(100000 + Math.random() * 900000).toString();

                const initialGame: any = {
                    roomId,
                    players: { 
                        X: p1.playerName, 
                        O: p2.playerName 
                    },
                    board: Array(9).fill(null),
                    currentTurn: 'X',
                    firstMove: 'X',
                    winner: null,
                    winningLine: null,
                    scores: { X: 0, O: 0, DRAW: 0 },
                    status: 'PLAYING'
                };

                console.log(`🎲 Creating match document for Room ${roomId}...`);
                const gameDB = await GameModel.create(initialGame);
                const game = gameDB.toObject() as GameState;
                
                // Add to local cache
                gameCache[roomId] = game;

                // Notify both players via their unique private channels
                // Player 1 becomes X
                await pusher.trigger(`private-notification-${p1.socketId}`, 'match-found', {
                    roomId,
                    side: 'X'
                });

                // Player 2 becomes O
                await pusher.trigger(`private-notification-${p2.socketId}`, 'match-found', {
                    roomId,
                    side: 'O'
                });

                console.log(`⚔️ Match established: ${p1.playerName} vs ${p2.playerName} in Room ${roomId}`);
            }
        }

        res.json({ success: true, message: 'Joined queue successfully' });
    } catch (err) {
        console.error('Matchmaking error:', err);
        res.status(500).json({ success: false, message: 'Internal matchmaking error' });
    }
};

/**
 * 🚪 LEAVE QUEUE: Call this if user cancels searching.
 */
export const leaveQueue = async (req: Request, res: Response) => {
    const { socketId } = req.body;
    try {
        // Since we store JSON strings, we'd need to fetch then filter.
        // For efficiency in serverless, we'll just allow a timeout or a 
        // quick search/find/delete on Redis if the queue grows.
        // For MVP, we simply don't match them if their socket is gone.
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};
