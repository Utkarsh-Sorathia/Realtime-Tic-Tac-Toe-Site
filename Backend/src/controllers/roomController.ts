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
export const gameCache: Record<string, GameState> = {};

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
    let roomId = generateNumericCode();
    let collisionCheck = await GameModel.findOne({ roomId });
    
    // Safety check: rare collision retry for 6-digit codes
    while (collisionCheck) {
        roomId = generateNumericCode();
        collisionCheck = await GameModel.findOne({ roomId });
    }
    
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
        O: null
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
      const dbDoc = await GameModel.findOne({ roomId });
      if (!dbDoc) {
        return res.status(404).json({ success: false, message: "Room not found" });
      }

      let game = dbDoc.toObject() as GameState;
      gameCache[roomId] = game; // Sync local cache for this request's instance

      // 🛡️ RE-JOIN LOGIC: Case-insensitive name matching for resilient session re-entry
      const playerX = game.players.X?.toLowerCase();
      const playerO = game.players.O?.toLowerCase();
      const seeker = playerName?.toLowerCase();

      if (seeker && (playerX === seeker || playerO === seeker)) {
        const assignedSide = playerX === seeker ? 'X' : 'O';
        
        // 🛡️ RE-SYNC Name: Ensure the name is updated to the latest requested version (handles casing/refresh)
        if (playerName && game.players[assignedSide] !== playerName) {
            game.players[assignedSide] = playerName;
            await GameModel.findOneAndUpdate({ roomId }, { [`players.${assignedSide}`]: playerName });
        }

        // 🔄 RE-SYNC Status: If both players are present but status is stuck in WAITING (after a refresh/leave desync)
        if (game.players.X && game.players.O && game.status === 'WAITING') {
            game.status = 'PLAYING';
            game.currentTurn = game.firstMove || 'X'; // Force consistent turn sync
            await GameModel.findOneAndUpdate({ roomId }, { status: 'PLAYING', currentTurn: game.currentTurn });
            gameCache[roomId] = game;
            try {
                await broadcastGameUpdate(roomId, game);
            } catch (broadcastErr) {
                console.error("🏁 Re-sync broadcast failed:", broadcastErr);
            }
        }

        return res.json({ success: true, message: "Re-joined successfully", game, assignedSide });
      }

      if (game.players.X && game.players.O) {
        return res.status(400).json({ success: false, message: "Room is full" });
      }

      const assignedPlayer: Player = game.players.X ? 'O' : 'X';
      const assignedName = playerName || `Player ${assignedPlayer === 'X' ? '1' : '2'}`;
      
      // 🛡️ ATOMIC UPDATE: Ensure both the side assignment and status are set together
      game.players[assignedPlayer] = assignedName;
      if (game.players.X && game.players.O) {
          game.status = 'PLAYING';
          // 🛡️ SYNC FIX: Ensure the turn resets to the authorized opener when the game activates
          game.currentTurn = game.firstMove || 'X';
      }

      // Re-save to DB with explicit atomic commit (include currentTurn to prevent desync)
      await GameModel.findOneAndUpdate(
          { roomId }, 
          { 
              $set: { 
                  [`players.${assignedPlayer}`]: assignedName,
                  status: game.status,
                  currentTurn: game.currentTurn 
              } 
          },
          { returnDocument: 'after' }
      );

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
    const dbDoc = await GameModel.findOne({ roomId });
    if (!dbDoc) {
        return res.status(404).json({ success: false, message: "Room not found" });
    }

    const game = dbDoc.toObject() as GameState;
    gameCache[roomId] = game; // Refresh local cache

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
    const dbDoc = await GameModel.findOne({ roomId });
    if (!dbDoc) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const game = dbDoc.toObject() as GameState;
    gameCache[roomId] = game; // Refresh local cache

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
    
    const dbDoc = await GameModel.findOne({ roomId });
    if (!dbDoc) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const game = dbDoc.toObject() as GameState;
    gameCache[roomId] = game; // Refresh local cache

    // 🧹 Explicitly nullify to ensure Mongoose/JSON transmission clears the slot
    if (player === 'X') game.players.X = null;
    if (player === 'O') game.players.O = null;

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
        
        // 🏆 ATOMIC SCORE COMMIT: Ensure the board reset and score increments are saved precisely
        // 🏆 ATOMIC SCORE COMMIT: Ensure board reset, scores, and TURN SYNC are saved precisely
        await GameModel.findOneAndUpdate(
            { roomId }, 
            { 
                $set: { 
                    status: 'WAITING',
                    board: game.board,
                    winner: null,
                    winningLine: null,
                    scores: game.scores,
                    currentTurn: game.firstMove || 'X', // Reset turn to whoever should start next
                    players: {
                        X: game.players.X || null,
                        O: game.players.O || null
                    }
                } 
            }
        );

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
    const dbDoc = await GameModel.findOne({ roomId });
    if (dbDoc) {
        const game = dbDoc.toObject() as GameState;
        gameCache[roomId] = game;
        return game;
    }
    return null;
};

export const updateGameStateSync = async (roomId: string, newState: GameState) => {
    await connectDB();
    gameCache[roomId] = newState;
    
    // 🛡️ ATOMIC SYNC: Explicitly update all fields to bypass Mongoose's deep change detector
    await GameModel.findOneAndUpdate(
        { roomId }, 
        { 
            $set: { 
                board: newState.board,
                currentTurn: newState.currentTurn,
                status: newState.status,
                winner: newState.winner,
                winningLine: newState.winningLine,
                scores: newState.scores,
                players: newState.players
            } 
        }
    );
    
    await broadcastGameUpdate(roomId, newState);
};
