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
    X?: string | undefined;
    O?: string | undefined;
  };
}

export interface GameResponse {
  success: boolean;
  message?: string;
  game?: GameState | undefined;
  assignedSide?: Player; // Tells the joiner if they are X or O
}
