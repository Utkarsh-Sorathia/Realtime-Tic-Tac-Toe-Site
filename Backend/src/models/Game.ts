import mongoose from 'mongoose';
import type { GameState } from '../types/game.js';

/**
 * Mongoose Schema for our Elite Tic Tac Toe room.
 * Stores every single detail of the match to prevent data loss.
 */
const GameSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  board: { type: [String], default: Array(9).fill(null) },
  firstMove: { type: String, enum: ['X', 'O'], default: 'X' },
  currentTurn: { type: String, enum: ['X', 'O'], default: 'X' },
  status: { type: String, enum: ['WAITING', 'PLAYING', 'WON', 'DRAW'], default: 'WAITING' },
  winner: { type: String, enum: ['X', 'O', null], default: null },
  winningLine: { type: [Number], default: null },
  scores: {
    X: { type: Number, default: 0 },
    O: { type: Number, default: 0 },
    DRAW: { type: Number, default: 0 }
  },
  players: {
    X: { type: String, default: undefined },
    O: { type: String, default: undefined }
  },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true // Tracks when the game room was created and touched
});

// 🧹 GHOST ROOM CLEANUP: Auto-delete rooms inactive for 24 hours
GameSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

const Game = mongoose.model<GameState & mongoose.Document>('Game', GameSchema);

export default Game;
