import { useState, useEffect, useCallback } from 'react';
import { checkWinner, isBoardFull, getBestMove } from '../features/game/utils/aiLogic';
import type { Player, BoardState, Difficulty } from '../features/game/utils/aiLogic';

export type GameStatus = 'PLAYING' | 'WON' | 'DRAW';

interface UseGamePvEReturn {
    board: BoardState;
    currentTurn: Player;
    status: GameStatus;
    winner: Player | null;
    difficulty: Difficulty;
    setDifficulty: (diff: Difficulty) => void;
    makeMove: (index: number) => void;
    resetGame: () => void;
    isAiThinking: boolean;
}

/**
 * Custom hook to handle the entirely localized Player vs Environment (AI) game state.
 * Ensures zero-latency for human moves and adds a slight simulated delay for AI moves
 * to make the game feel natural.
 */
export function useGamePvE(humanPlayerSide: Player = 'X'): UseGamePvEReturn {
    const [board, setBoard] = useState<BoardState>(() => {
        const saved = sessionStorage.getItem('pve_board');
        return saved ? JSON.parse(saved) : Array(9).fill(null);
    });
    const [currentTurn, setCurrentTurn] = useState<Player>(() => 
        (sessionStorage.getItem('pve_currentTurn') as Player) || 'X'
    );
    const [status, setStatus] = useState<GameStatus>(() => 
        (sessionStorage.getItem('pve_status') as GameStatus) || 'PLAYING'
    );
    const [winner, setWinner] = useState<Player | null>(() => 
        (sessionStorage.getItem('pve_winner') as Player) || null
    );
    const [difficulty, setDifficulty] = useState<Difficulty>(() => 
        (sessionStorage.getItem('pve_difficulty') as Difficulty) || 'HARD'
    );
    const [isAiThinking, setIsAiThinking] = useState(false);

    const aiPlayerSide: Player = humanPlayerSide === 'X' ? 'O' : 'X';

    // Synchronize all local state with sessionStorage to survive browser reloads
    useEffect(() => {
        sessionStorage.setItem('pve_board', JSON.stringify(board));
        sessionStorage.setItem('pve_currentTurn', currentTurn);
        sessionStorage.setItem('pve_status', status);
        if (winner) sessionStorage.setItem('pve_winner', winner);
        else sessionStorage.removeItem('pve_winner');
        sessionStorage.setItem('pve_difficulty', difficulty);
    }, [board, currentTurn, status, winner, difficulty]);

    // Core logic to process a move and check for win/draw immediately
    const processMove = useCallback((index: number, player: Player) => {
        setBoard((prev) => {
            const newBoard = [...prev];
            newBoard[index] = player;
            return newBoard;
        });
        setCurrentTurn(player === 'X' ? 'O' : 'X');
    }, []);

    // Effect to observe board changes and determine terminal states
    useEffect(() => {
        const currentWinner = checkWinner(board);
        if (currentWinner) {
            setWinner(currentWinner);
            setStatus('WON');
            return;
        }
        
        if (isBoardFull(board)) {
            setStatus('DRAW');
            return;
        }

        // If it's the AI's turn, trigger the 'Thinking' process
        if (currentTurn === aiPlayerSide && status === 'PLAYING') {
            setIsAiThinking(true);
            
            // Add a simulated delay (e.g. 500ms) so the AI doesn't feel "instant and robotic"
            // It gives the user time to process their own move before the AI snaps back.
            const thinkTimer = setTimeout(() => {
                const bestMoveIndex = getBestMove(board, aiPlayerSide, difficulty);
                if (bestMoveIndex !== -1) {
                    processMove(bestMoveIndex, aiPlayerSide);
                }
                setIsAiThinking(false);
            }, 600); 

            return () => clearTimeout(thinkTimer);
        }
    }, [board, currentTurn, status, aiPlayerSide, difficulty, processMove]);

    const makeMove = (index: number) => {
        // Prevent moves if game over, spot taken, or it's the AI's turn
        if (status !== 'PLAYING' || board[index] !== null || currentTurn === aiPlayerSide || isAiThinking) {
            return;
        }
        processMove(index, humanPlayerSide);
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setCurrentTurn('X');
        setStatus('PLAYING');
        setWinner(null);
        setIsAiThinking(false);
    };

    return {
        board,
        currentTurn,
        status,
        winner,
        difficulty,
        setDifficulty,
        makeMove,
        resetGame,
        isAiThinking
    };
}
