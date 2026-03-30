import type { Request, Response } from 'express';
import type { Player, GameResponse } from '../types/game.js';
import { getGameStateFromCache, updateGameStateSync } from './roomController.js';

/**
 * Validates the win/draw condition of the board.
 * Returns the winning player AND the winning line.
 */
const checkWinner = (board: (Player | null)[]) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    const valA = board[a as keyof typeof board];
    const valB = board[b as keyof typeof board];
    const valC = board[c as keyof typeof board];
    
    if (valA && valA === valB && valA === valC) {
      return { winner: valA as Player, line };
    }
  }

  if (!board.includes(null)) return { winner: 'DRAW' as const, line: null };
  return null;
};

/**
 * Handles a player's move with Persistent Async Logic.
 */
export const makeMove = async (req: Request, res: Response<GameResponse>) => {
  try {
    const roomId = req.params.roomId as string;
    const { index, player } = req.body;
    
    // 🔄 Fetch from Cache/DB
    const game = await getGameStateFromCache(roomId);

    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    if (game.status !== 'PLAYING') {
      // 🛡️ STATUS AUTO-HEALER: If both players are present but the room is stuck in WAITING (e.g. after a session crash/reset)
      // we allow the move to proceed if it's the correct turn, and we force the status to PLAYING.
      if (game.players.X && game.players.O && (game.status === 'WAITING' || game.status === 'WON' || game.status === 'DRAW')) {
          console.log(`📡 Auto-Heal: Room ${roomId} was ${game.status}, but both players are here. Activating...`);
          game.status = 'PLAYING';
      } else {
          return res.status(400).json({ success: false, message: "Game is not active" });
      }
    }

    if (game.currentTurn !== player) {
      return res.status(400).json({ success: false, message: "It's not your turn!" });
    }

    if (game.board[index] !== null) {
      return res.status(400).json({ success: false, message: "Cell already occupied" });
    }

    // Record the move
    game.board[index] = player;
    
    const result = checkWinner(game.board);
    
    if (result) {
        if (result.winner === 'DRAW') {
          game.status = 'DRAW';
          game.scores.DRAW++; // Record the stalemate
        } else {
          game.status = 'WON';
          game.winner = result.winner;
          game.winningLine = result.line;
          // 📈 PROMOTION: Increment the winner's score
          if (result.winner === 'X' || result.winner === 'O') {
              game.scores[result.winner]++;
          }
        }
    } else {
      game.currentTurn = game.currentTurn === 'X' ? 'O' : 'X';
    }

    // 💾 Update Both Cache & DB
    await updateGameStateSync(roomId, game);

    res.json({
      success: true,
      message: result ? (result.winner === 'DRAW' ? "It's a draw!" : `Player ${result.winner} won!`) : "Move accepted",
      game
    });
  } catch (error) {
    console.error(`Move Error for ${req.params?.roomId}:`, error);
    res.status(500).json({ success: false, message: "Failed to process move" });
  }
};
