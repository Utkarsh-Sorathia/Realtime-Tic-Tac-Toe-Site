import type { Request, Response } from 'express';
import type { GameState, Player, GameResponse } from '../types/game.js';
import { broadcastGameUpdate } from '../config/pusher.js';
import GameModel from '../models/Game.js';
import { connectDB } from '../config/db.js';

/**
 * HIGH-PERFORMANCE HYBRID ARCHITECTURE:
 * We use an in-memory cache for Sub-Millisecond Speed (Elite Experience)
 * and MongoDB for Extreme Reliability (Vercel/Stable Experience).
 */
const gameCache: Record<string, GameState> = {};

/**
 * Generates a random numeric 6-digit code.
 */
const generateNumericCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Creates a unique game room in DB & Cache.
 */
export const createRoom = async (req: Request, res: Response<GameResponse>) => {
  try {
    await connectDB();
    const { playerName } = req.body;
    const roomId = generateNumericCode();
    
    const initialState: any = {
      roomId,
      board: Array(9).fill(null),
      firstMove: 'X', 
      currentTurn: 'X',
      status: 'WAITING',
      winner: null,
      winningLine: null,
      scores: { X: 0, O: 0, DRAW: 0 },
      players: {
        X: playerName || "Player 1",
        O: undefined
      }
    };

    const gameDB = await GameModel.create(initialState);
    const game = gameDB.toObject() as GameState;
    gameCache[roomId] = game;

    res.json({
      success: true,
      message: `Room created: ${roomId}`,
      game
    });
  } catch (err) {
      console.error("Room formation failed:", err);
      res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Allows a player to join an existing room with Auto-Recsync.
 */
export const joinRoom = async (req: Request, res: Response<GameResponse>) => {
  try {
      await connectDB();
      const roomId = req.params.roomId as string;
      const { playerName } = req.body;
      let game = gameCache[roomId];

      if (!game) {
          const dbDoc = await GameModel.findOne({ roomId });
          if (dbDoc) {
              game = dbDoc.toObject() as GameState;
              gameCache[roomId] = game;
          }
      }

      if (!game) {
        return res.status(404).json({ success: false, message: "Room not found" });
      }

      if (game.players.X && game.players.O) {
        return res.status(400).json({ success: false, message: "Room is full" });
      }

      const assignedPlayer: Player = game.players.X ? 'O' : 'X';
      game.players[assignedPlayer] = playerName || `Player ${assignedPlayer === 'X' ? '1' : '2'}`;

      if (game.players.X && game.players.O) {
          game.status = 'PLAYING';
      }

      await GameModel.findOneAndUpdate({ roomId }, game);
      gameCache[roomId] = game;

      await broadcastGameUpdate(roomId, game);
 
      res.json({ success: true, message: "Joined successfully", game, assignedSide: assignedPlayer });
  } catch (err) {
      console.error("Join Room Error:", err);
      res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Fetches the current state of a room with Cache Hit logic.
 */
export const getRoomStatus = async (req: Request, res: Response<GameResponse>) => {
  try {
    await connectDB();
    const roomId = req.params.roomId as string;
    let game = gameCache[roomId];

    if (!game) {
      const dbDoc = await GameModel.findOne({ roomId });
      if (dbDoc) {
          game = dbDoc.toObject() as GameState;
          gameCache[roomId] = game;
      }
    }

    if (!game) {
        return res.status(404).json({ success: false, message: "Room not found" });
    }

    res.json({ success: true, game });
  } catch (error) {
    console.error(`Status Fetch Error for ${req.params.roomId}:`, error);
    res.status(500).json({ success: false, message: "Database lookup failed" });
  }
};

/**
 * Resets the room state for a rematch with persistent scoring.
 */
export const rematch = async (req: Request, res: Response<GameResponse>) => {
  try {
    await connectDB();
    const roomId = req.params.roomId as string;
    let game = gameCache[roomId];

    if (!game) {
      const dbDoc = await GameModel.findOne({ roomId });
      if (dbDoc) {
          game = dbDoc.toObject() as GameState;
          gameCache[roomId] = game;
      }
    }

    if (!game) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const nextToStart: Player = game.firstMove === 'X' ? 'O' : 'X';
    game.board = Array(9).fill(null);
    game.status = 'PLAYING';
    game.winner = null;
    game.winningLine = null;
    game.firstMove = nextToStart;
    game.currentTurn = nextToStart; 

    await GameModel.findOneAndUpdate({ roomId }, game);
    gameCache[roomId] = game;
    await broadcastGameUpdate(roomId, game);

    res.json({ success: true, game });
  } catch (error) {
    console.error(`Rematch Error for ${req.params.roomId}:`, error);
    res.status(500).json({ success: false, message: "Failed to process rematch" });
  }
};

/**
 * Safe player departure with DB Sync.
 */
export const leaveRoom = async (req: Request, res: Response<GameResponse>) => {
  try {
    await connectDB();
    const roomId = req.params.roomId as string;
    const { player, isForfeit } = req.body;
    
    let game = gameCache[roomId];
    if (!game) {
        const dbDoc = await GameModel.findOne({ roomId });
        if (dbDoc) {
            game = dbDoc.toObject() as GameState;
            gameCache[roomId] = game;
        }
    }

    if (!game) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (player === 'X') game.players.X = undefined;
    if (player === 'O') game.players.O = undefined;

    if (!game.players.X && !game.players.O) {
        delete gameCache[roomId];
        await GameModel.deleteOne({ roomId });
        console.log(`🗑️ DB Clean: ${roomId}`);
    } else {
        // Only award a point if this was a forfeit (e.g. grace period expired)
        if (game.status === 'PLAYING' && isForfeit) {
            const remainingPlayer = game.players.X ? 'X' : 'O';
            game.scores[remainingPlayer]++;
            console.log(`🏆 Forfeit win awarded to ${remainingPlayer} in room ${roomId}`);
        }

        game.status = 'WAITING';
        game.board = Array(9).fill(null);
        game.winner = null;
        game.winningLine = null;
        
        await GameModel.findOneAndUpdate({ roomId }, game);
        gameCache[roomId] = game;
        await broadcastGameUpdate(roomId, game);
    }

    res.json({ success: true, message: "Left room successfully" });
  } catch (error) {
    console.error(`Leave Error for ${req.params.roomId}:`, error);
    res.status(500).json({ success: false, message: "Server error on leave" });
  }
};

// Internal utility to keep Game Actions fast
export const getGameStateFromCache = async (roomId: string) => {
    await connectDB();
    let game = gameCache[roomId];
    if (!game) {
        const dbDoc = await GameModel.findOne({ roomId });
        if (dbDoc) {
            game = dbDoc.toObject() as GameState;
            gameCache[roomId] = game;
        }
    }
    return game;
};

export const updateGameStateSync = async (roomId: string, newState: GameState) => {
    await connectDB();
    gameCache[roomId] = newState;
    await GameModel.findOneAndUpdate({ roomId }, newState);
    await broadcastGameUpdate(roomId, newState);
};
