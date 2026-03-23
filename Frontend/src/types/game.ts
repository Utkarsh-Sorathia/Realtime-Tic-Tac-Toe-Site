export type Player = 'X' | 'O';
export type GameStatus = 'WAITING' | 'PLAYING' | 'WON' | 'DRAW';

export interface Move {
  index: number;
  player: Player;
}

export interface GameState {
  roomId: string;
  board: (Player | null)[];
  firstMove: Player; // Tracks who started the current round
  currentTurn: Player;
  status: GameStatus;
  winner: Player | null;
  winningLine: number[] | null;
  scores: {
    X: number;
    O: number;
    DRAW: number;
  };
  players: {
    X?: string;
    O?: string;
  };
}

export interface GameResponse {
  success: boolean;
  message?: string;
  game?: GameState | undefined;
  assignedSide?: Player;
}
