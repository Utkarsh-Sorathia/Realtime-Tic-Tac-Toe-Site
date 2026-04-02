import { useState, useEffect, useCallback, useRef } from 'react';
import { isBoardFull, getBestMove, checkWinDetails } from '../features/game/utils/aiLogic';
import type { Player, BoardState, Difficulty } from '../features/game/utils/aiLogic';

export type GameStatus = 'PLAYING' | 'WON' | 'DRAW';

interface UseGamePvEReturn {
    board: BoardState;
    currentTurn: Player;
    status: GameStatus;
    winner: Player | null;
    winningLine: number[] | null;
    difficulty: Difficulty;
    setDifficulty: (diff: Difficulty) => void;
    makeMove: (index: number) => void;
    resetGame: () => void;
    isAiThinking: boolean;
    // New Blitz & Streak State
    streak: number;
    bestStreak: number;
    timeLeft: number;
    maxTime: number;
    isBlitzActive: boolean;
}

/**
 * Custom hook to handle the entirely localized Player vs Environment (AI) game state.
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
    const [winningLine, setWinningLine] = useState<number[] | null>(() => {
        const saved = sessionStorage.getItem('pve_winningLine');
        return saved ? JSON.parse(saved) : null;
    });
    const [difficulty, setDifficulty] = useState<Difficulty>(() => 
        (sessionStorage.getItem('pve_difficulty') as Difficulty) || 'MEDIUM'
    );

    // Blitz & Streak Persistence
    const [streak, setStreak] = useState(() => Number(localStorage.getItem(`pve_streak_${difficulty}`) || 0));
    const [bestStreak, setBestStreak] = useState(() => Number(localStorage.getItem(`pve_best_${difficulty}`) || 0));
    
    const isBlitzActive = difficulty !== 'EASY';
    const maxTime = difficulty === 'EXPERT' ? 3 : difficulty === 'HARD' ? 5 : 8; // Seconds
    const [timeLeft, setTimeLeft] = useState(maxTime);
    const [isAiThinking, setIsAiThinking] = useState(false);

    const aiPlayerSide: Player = humanPlayerSide === 'X' ? 'O' : 'X';

    // Sync localStorage whenever difficulty or streaks change
    useEffect(() => {
        const s = Number(localStorage.getItem(`pve_streak_${difficulty}`) || 0);
        const b = Number(localStorage.getItem(`pve_best_${difficulty}`) || 0);
        setStreak(s);
        setBestStreak(b);
    }, [difficulty]);

    // Synchronize all local state with sessionStorage
    useEffect(() => {
        sessionStorage.setItem('pve_board', JSON.stringify(board));
        sessionStorage.setItem('pve_currentTurn', currentTurn);
        sessionStorage.setItem('pve_status', status);
        if (winner) sessionStorage.setItem('pve_winner', winner);
        else sessionStorage.removeItem('pve_winner');
        if (winningLine) sessionStorage.setItem('pve_winningLine', JSON.stringify(winningLine));
        else sessionStorage.removeItem('pve_winningLine');
        sessionStorage.setItem('pve_difficulty', difficulty);
    }, [board, currentTurn, status, winner, winningLine, difficulty]);

    // Use a ref to prevent double-processing of timeouts due to state batching
    const isProcessingTimeout = useRef(false);

    // Reset timeout guard when turn changes
    useEffect(() => {
        isProcessingTimeout.current = false;
    }, [currentTurn]);

    // Handle timeout penalty
    const handleTimeout = useCallback(() => {
        if (isProcessingTimeout.current || status !== 'PLAYING') return;
        isProcessingTimeout.current = true;

        setBoard((prevBoard) => {
            const emptySpots = prevBoard.map((c, i) => c === null ? i : null).filter(v => v !== null) as number[];
            if (emptySpots.length > 0) {
                const randomIdx = emptySpots[Math.floor(Math.random() * emptySpots.length)];
                const newBoard = [...prevBoard];
                newBoard[randomIdx] = humanPlayerSide;
                // Important: Manually switch turn here since we're in setBoard
                setCurrentTurn(aiPlayerSide);
                return newBoard;
            }
            return prevBoard;
        });
    }, [status, humanPlayerSide, aiPlayerSide]);

    // Blitz Timer Countdown
    useEffect(() => {
        if (!isBlitzActive || status !== 'PLAYING' || currentTurn === aiPlayerSide || isAiThinking) {
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0.1) {
                    clearInterval(timer);
                    handleTimeout();
                    return 0;
                }
                return prev - 0.1;
            });
        }, 100);

        return () => clearInterval(timer);
    }, [isBlitzActive, status, currentTurn, aiPlayerSide, isAiThinking, maxTime, handleTimeout]);

    // Reset timer on turn change
    useEffect(() => {
        setTimeLeft(maxTime);
    }, [currentTurn, maxTime]);

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
        // IMPORTANT: If we've already concluded the game, stop processing.
        // This prevents the infinite loop when updating streaks.
        if (status !== 'PLAYING') return;

        const { winner: currentWinner, line } = checkWinDetails(board);
        
        if (currentWinner) {
            setWinner(currentWinner);
            setWinningLine(line);
            setStatus('WON');
            
            // Streak Logic
            if (currentWinner === humanPlayerSide) {
                setStreak(prev => {
                    const newStreak = prev + 1;
                    localStorage.setItem(`pve_streak_${difficulty}`, String(newStreak));
                    setBestStreak(bPrev => {
                        if (newStreak > bPrev) {
                            localStorage.setItem(`pve_best_${difficulty}`, String(newStreak));
                            return newStreak;
                        }
                        return bPrev;
                    });
                    return newStreak;
                });
            } else {
                // LOSS: Reset streak
                setStreak(0);
                localStorage.setItem(`pve_streak_${difficulty}`, '0');
            }

            if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
            return;
        }
        
        if (isBoardFull(board)) {
            setStatus('DRAW');
            
            // Deadlock Streak on Expert: A Draw counts as a success!
            if (difficulty === 'EXPERT') {
                setStreak(prev => {
                    const newStreak = prev + 1;
                    localStorage.setItem(`pve_streak_${difficulty}`, String(newStreak));
                    setBestStreak(bPrev => {
                        if (newStreak > bPrev) {
                            localStorage.setItem(`pve_best_${difficulty}`, String(newStreak));
                            return newStreak;
                        }
                        return bPrev;
                    });
                    return newStreak;
                });
            }

            if (navigator.vibrate) navigator.vibrate(50);
            return;
        }

        // AI Turn
        if (currentTurn === aiPlayerSide && status === 'PLAYING') {
            setIsAiThinking(true);
            const thinkTimer = setTimeout(() => {
                const bestMoveIndex = getBestMove(board, aiPlayerSide, difficulty);
                if (bestMoveIndex !== -1) {
                    processMove(bestMoveIndex, aiPlayerSide);
                }
                setIsAiThinking(false);
            }, 600); 

            return () => clearTimeout(thinkTimer);
        }
    }, [board, currentTurn, status, aiPlayerSide, difficulty, humanPlayerSide, processMove]);

    const makeMove = (index: number) => {
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
        setWinningLine(null);
        setIsAiThinking(false);
        setTimeLeft(maxTime);
    };

    return {
        board,
        currentTurn,
        status,
        winner,
        winningLine,
        difficulty,
        setDifficulty,
        makeMove,
        resetGame,
        isAiThinking,
        streak,
        bestStreak,
        timeLeft,
        maxTime,
        isBlitzActive
    };
}
