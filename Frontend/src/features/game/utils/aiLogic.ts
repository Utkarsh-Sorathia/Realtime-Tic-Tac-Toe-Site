export type Player = 'X' | 'O';
export type BoardState = (Player | null)[];
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export function checkWinner(board: BoardState): Player | null {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Player;
    }
  }
  return null;
}

export function isBoardFull(board: BoardState): boolean {
  return board.every((cell) => cell !== null);
}

/**
 * Minimax algorithm to calculate the optimal score for a given board state.
 * It deeply simulates all possible future moves.
 */
function minimax(
  board: BoardState,
  depth: number,
  isMaximizing: boolean,
  aiPlayer: Player,
  humanPlayer: Player
): number {
  const winner = checkWinner(board);
  
  // Terminal states: returning score based on depth ensures we pick the FASTEST win or SLOWEST loss
  if (winner === aiPlayer) return 10 - depth;
  if (winner === humanPlayer) return depth - 10;
  if (isBoardFull(board)) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = aiPlayer; // Make the move
        const score = minimax(board, depth + 1, false, aiPlayer, humanPlayer);
        board[i] = null; // Undo the move (backtrack)
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = humanPlayer; // Make the opponent's move
        const score = minimax(board, depth + 1, true, aiPlayer, humanPlayer);
        board[i] = null; // Undo the move (backtrack)
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

/**
 * Calculates the best move for the AI layer. 
 * Supports 3 difficulties via probability layering over the minimax engine.
 */
export function getBestMove(
  board: BoardState,
  aiPlayer: Player,
  difficulty: Difficulty = 'HARD'
): number {
  const humanPlayer: Player = aiPlayer === 'X' ? 'O' : 'X';
  const emptySpots = board.map((cell, index) => (cell === null ? index : null)).filter((val) => val !== null) as number[];

  if (emptySpots.length === 0) return -1;

  // -- HEURISTIC HELPER: Find an immediate 1-move win or block --
  const findImmediateMove = (targetPlayer: Player): number => {
    for (const spot of emptySpots) {
      const boardCopy = [...board];
      boardCopy[spot] = targetPlayer;
      if (checkWinner(boardCopy) === targetPlayer) {
        return spot;
      }
    }
    return -1;
  };

  // -- DIFFICULTY LAYER: EASY --
  // 50% chance to make a completely random move (It makes silly mistakes, but occasionally plays optimally)
  if (difficulty === 'EASY') {
    if (Math.random() < 0.5) {
      return emptySpots[Math.floor(Math.random() * emptySpots.length)];
    }
  }

  // -- DIFFICULTY LAYER: MEDIUM (The Mistake-Prone Pro) --
  if (difficulty === 'MEDIUM') {
    // 1. Never miss an obvious win
    const winningMove = findImmediateMove(aiPlayer);
    if (winningMove !== -1) return winningMove;

    // 2. Never miss an obvious block
    const blockingMove = findImmediateMove(humanPlayer);
    if (blockingMove !== -1) return blockingMove;

    // 3. But it fails to see "Forks" (long-term traps) 30% of the time and just plays randomly
    if (Math.random() < 0.3) {
      return emptySpots[Math.floor(Math.random() * emptySpots.length)];
    }
  }

  // -- DIFFICULTY LAYER: HARD (The Unbeatable God Engine) --
  // We use Minimax, but we explicitly test the most strategic spots first.
  // If multiple spots return a "0" (Draw) score, the first one tested is chosen.
  // Center (4) -> Corners (0, 2, 6, 8) -> Edges (1, 3, 5, 7)
  const strategicOrder = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  
  let bestScore = -Infinity;
  let bestMove = -1;

  // Clone the board to maintain pure immutability for the React state
  const boardCopy = [...board];

  for (const i of strategicOrder) {
    // Skip spots that are not empty
    if (!emptySpots.includes(i)) continue;

    boardCopy[i] = aiPlayer;
    const score = minimax(boardCopy, 0, false, aiPlayer, humanPlayer);
    boardCopy[i] = null; // Backtrack

    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }

  // Safety fallback
  return bestMove !== -1 ? bestMove : emptySpots[0];
}
