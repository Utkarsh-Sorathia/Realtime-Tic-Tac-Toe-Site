import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, LogOut, Play, ChevronLeft } from 'lucide-react';
import { useGamePvE } from '../../hooks/useGamePvE';
import confetti from 'canvas-confetti';
import type { Difficulty } from './utils/aiLogic';

interface GameRoomPvEProps {
    onExit: () => void;
}

/**
 * Optimized individual cell for PvE to prevent board re-renders
 */
const BoardCell = React.memo(({ 
    idx, 
    cell, 
    onClick, 
    canMove 
}: { 
    idx: number, 
    cell: string | null, 
    onClick: (i: number) => void, 
    canMove: boolean 
}) => (
    <motion.button
        onClick={() => onClick(idx)}
        aria-label={`Mark square ${idx + 1}`}
        whileHover={!cell && canMove ? { scale: 1.05, background: "rgba(255,255,255,0.08)" } : {}}
        whileTap={!cell && canMove ? { scale: 0.95 } : {}}
        className={`aspect-square rounded-2xl md:rounded-4xl border-2 border-white/5 bg-white/5 flex items-center justify-center text-5xl md:text-6xl font-black transition-all relative z-10 overflow-hidden ${
            !cell && canMove ? 'cursor-pointer hover:border-white/20' : 'cursor-default'
        }`}
    >
        {cell === 'X' && (
            <motion.span initial={{ scale:0, rotate:-45 }} animate={{ scale:1, rotate:0 }} className="text-(--primary-cyan) drop-shadow-[0_0_20px_var(--primary-glow)]">X</motion.span>
        )}
        {cell === 'O' && (
            <motion.span initial={{ scale:0, scaleX:0.5 }} animate={{ scale:1, scaleX:1 }} className="text-(--accent-purple) drop-shadow-[0_0_20px_var(--accent-purple)]">O</motion.span>
        )}
    </motion.button>
));

const GameRoomPvE: React.FC<GameRoomPvEProps> = ({ onExit }) => {
    // We pass 'X' as human player side. They always start in this simple implementation.
    const humanSide = 'X';
    const { 
        board, 
        currentTurn, 
        status, 
        winner, 
        winningLine,
        difficulty, 
        setDifficulty, 
        makeMove, 
        resetGame, 
        isAiThinking 
    } = useGamePvE(humanSide);

    // Confetti effect on victory
    React.useEffect(() => {
        if (status === 'WON' && winner === 'X') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#22d3ee', '#ffffff', '#a855f7']
            });
        }
    }, [status, winner]);

    const [scores, setScores] = useState<Record<Difficulty, { X: number; O: number; DRAW: number; }>>(() => {
        const savedScores = sessionStorage.getItem('pve_scores_v2');
        if (savedScores) return JSON.parse(savedScores);
        return {
            EASY: { X: 0, O: 0, DRAW: 0 },
            MEDIUM: { X: 0, O: 0, DRAW: 0 },
            HARD: { X: 0, O: 0, DRAW: 0 }
        };
    });

    React.useEffect(() => {
        sessionStorage.setItem('pve_scores_v2', JSON.stringify(scores));
    }, [scores]);

    const handleCellClick = (index: number) => {
        makeMove(index);
    };

    const handleRematch = () => {
        // Update scoreboard before reset using the current difficulty context
        if (status === 'WON') {
            setScores(prev => ({
                ...prev,
                [difficulty]: {
                    ...prev[difficulty],
                    [winner as 'X' | 'O']: prev[difficulty][winner as 'X' | 'O'] + 1
                }
            }));
        } else if (status === 'DRAW') {
            setScores(prev => ({
                ...prev,
                [difficulty]: {
                    ...prev[difficulty],
                    DRAW: prev[difficulty].DRAW + 1
                }
            }));
        }
        resetGame();
    };

    const currentScores = scores[difficulty];

    const canMove = currentTurn === humanSide && status === 'PLAYING' && !isAiThinking;

    const renderWinningLine = () => {
        if (status !== 'WON' || !winningLine) return null;
        const line = winningLine.join(',');
        let style = "";
        if (line === '0,1,2') style = "top-[18.2%] w-[90%] left-[5%] h-[2px]";
        if (line === '3,4,5') style = "top-[50%] w-[90%] left-[5%] h-[2px] -translate-y-1/2";
        if (line === '6,7,8') style = "bottom-[18.2%] w-[90%] left-[5%] h-[2px]";
        if (line === '0,3,6') style = "left-[18.2%] h-[90%] top-[5%] w-[2px]";
        if (line === '1,4,7') style = "left-[50%] h-[90%] top-[5%] w-[2px] -translate-x-1/2";
        if (line === '2,5,8') style = "right-[18.2%] h-[90%] top-[5%] w-[2px]";
        if (line === '0,4,8') style = "top-[50%] left-[50%] w-[120%] h-[2px] -translate-x-1/2 -translate-y-1/2 rotate-45";
        if (line === '2,4,6') style = "top-[50%] left-[50%] w-[120%] h-[2px] -translate-x-1/2 -translate-y-1/2 -rotate-45";
        const lineColor = winner === 'X' ? 'bg-cyan-400' : 'bg-purple-500';
        const shadowColor = winner === 'X' ? 'shadow-[0_0_5px_rgba(34,211,238,0.2)]' : 'shadow-[0_0_5px_rgba(168,85,247,0.2)]';
        return (
            <motion.div 
                key={line}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`absolute rounded-full z-30 pointer-events-none origin-center ${style} ${lineColor} ${shadowColor}`}
            />
        );
    };

    return (
        <div className="h-dvh bg-(--site-bg) text-white flex flex-col items-center justify-center p-2 md:p-4 relative overflow-hidden font-sans">
            {/* Animated Background Orbs (Optimized for Mobile) */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
                <div className="absolute top-10 left-10 w-64 md:w-96 h-64 md:h-96 bg-(--accent-purple)/10 rounded-full blur-[60px] md:blur-[80px] animate-pulse" />
                <div className="absolute bottom-10 right-10 w-64 md:w-96 h-64 md:h-96 bg-(--primary-cyan)/10 rounded-full blur-[60px] md:blur-[80px] animate-pulse" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="z-10 w-full max-w-lg flex flex-col h-full max-h-dvh justify-center py-2 md:py-4"
            >
                {/* Header: PvE Namespace & Difficulty Selector */}
                <div className="w-full mb-3 md:mb-8 px-2 shrink-0">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <button 
                            onClick={onExit} 
                            className="p-2 md:p-2.5 rounded-xl bg-(--surface-bg) border border-(--surface-border) text-(--text-muted) hover:text-white hover:bg-white/10 transition-all active:scale-90 group"
                            aria-label="Back to Menu"
                        >
                            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-1.5 h-4 md:h-6 bg-(--accent-purple) rounded-full shadow-[0_0_8px_var(--accent-purple)]" />
                            <h2 className="text-lg md:text-xl font-black uppercase tracking-[0.2em] text-white italic">
                                Cyber <span className="text-(--accent-purple)">Match</span>
                            </h2>
                        </div>
                        <div className="px-3 py-1 md:px-4 md:py-1.5 bg-(--accent-purple)/10 border border-(--accent-purple)/30 rounded-full font-black text-[9px] md:text-[10px] text-(--accent-purple) transition-all tracking-[0.2em] uppercase shrink-0">
                           OFFLINE MODE
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-5 md:p-4 backdrop-blur-xl shadow-2xl w-full">
                        <div className="flex flex-col w-full">
                            <span className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.4em] text-slate-500 mb-3 md:mb-3 text-center">AI Difficulty</span>
                            <div className="flex bg-slate-950/50 rounded-lg overflow-hidden border border-white/5 p-1 w-full gap-1">
                                {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setDifficulty(level)}
                                        disabled={status === 'PLAYING' && board.some(cell => cell !== null)}
                                        className={`flex-1 py-2 md:py-2.5 text-[11px] md:text-[12px] font-black tracking-widest uppercase transition-all rounded-md ${
                                            difficulty === level 
                                                ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                                                : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'
                                        }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scoreboard */}
                <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-8 shrink-0 px-2 md:px-0">
                    <div className={`flex-1 bg-(--surface-bg) border-2 rounded-2xl md:rounded-4xl p-3 md:p-5 flex flex-col items-center relative transition-all duration-500 ${currentTurn === 'X' && status === 'PLAYING' ? 'border-(--primary-cyan)/40 shadow-[0_0_20px_var(--primary-glow)] scale-105' : 'border-white/5'}`}>
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-(--primary-cyan)/60 mb-1 md:mb-2">YOU</span>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl md:text-5xl font-black text-white tracking-tighter">{currentScores.X}</span>
                        </div>
                        {currentTurn === 'X' && status === 'PLAYING' && <motion.div layoutId="turn-pve" className="absolute -bottom-1 w-12 md:w-16 h-1.5 bg-(--primary-cyan) rounded-full shadow-[0_0_5px_var(--primary-glow)]" />}
                    </div>
                    
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-lg md:text-2xl font-black text-slate-700 italic tracking-tighter">VS</div>
                        <div className="bg-white/5 px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-white/5">
                            <span className="text-[7px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">DRAWS: {currentScores.DRAW}</span>
                        </div>
                    </div>

                    <div className={`flex-1 bg-(--surface-bg) border-2 rounded-2xl md:rounded-4xl p-3 md:p-5 flex flex-col items-center relative transition-all duration-500 ${currentTurn === 'O' && status === 'PLAYING' ? 'border-(--accent-purple)/40 shadow-[0_0_20px_var(--accent-purple)] scale-105' : 'border-white/5'}`}>
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-(--accent-purple)/60 mb-1 md:mb-2">ELITE AI</span>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl md:text-5xl font-black text-white tracking-tighter">{currentScores.O}</span>
                        </div>
                        {currentTurn === 'O' && status === 'PLAYING' && <motion.div layoutId="turn-pve" className="absolute -bottom-1 w-12 md:w-16 h-1.5 bg-(--accent-purple) rounded-full shadow-[0_0_15px_var(--accent-purple)]" />}
                    </div>
                </div>

                {/* The Board */}
                <div className="w-full max-w-[400px] mx-auto grid grid-cols-3 gap-2 md:gap-4 bg-(--surface-bg) backdrop-blur-2xl border border-(--surface-border) p-3 md:p-6 rounded-4xl md:rounded-[3.5rem] shadow-2xl aspect-square mb-4 md:mb-10 relative group/board shrink pointer-events-auto">
                    <AnimatePresence>{renderWinningLine()}</AnimatePresence>

                    {board.map((cell, idx) => (
                        <BoardCell 
                            key={idx}
                            idx={idx}
                            cell={cell}
                            canMove={canMove}
                            onClick={handleCellClick}
                        />
                    ))}
                    
                    <AnimatePresence>
                        {status !== 'PLAYING' && (
                            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="absolute inset-x-2 inset-y-2 md:inset-x-4 md:inset-y-4 z-40 bg-slate-950/80 backdrop-blur-2xl rounded-3xl md:rounded-[3rem] flex flex-col items-center justify-center p-4 md:p-8 text-center border border-white/10 shadow-2xl">
                                <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} className="w-full">
                                    <div className="mb-2 md:mb-4 inline-flex p-3 md:p-4 rounded-full bg-white/5 border border-white/10">
                                        <Trophy className={`w-8 h-8 md:w-12 md:h-12 ${status === 'WON' && winner === 'X' ? 'text-yellow-500' : 'text-slate-500'}`} />
                                    </div>
                                    <h3 className={`text-3xl md:text-5xl font-black mb-1 md:mb-2 italic tracking-tighter ${winner === 'X' ? 'text-(--primary-cyan)' : winner === 'O' ? 'text-(--accent-purple)' : 'text-white'}`}>
                                        {status === 'WON' ? (winner === 'X' ? 'VICTORY' : 'DEFEAT') : "STALEMATE"}
                                    </h3>
                                    <p className="text-(--text-muted) mb-6 md:mb-10 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]">
                                        {status === 'WON' ? (winner === 'X' ? 'YOU PREVAIL' : 'THE MACHINE WINS') : "A BATTLE OF EQUALS"}
                                    </p>
                                    <button onClick={handleRematch} className="w-full h-14 md:h-18 bg-white text-slate-950 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 md:gap-3 hover:bg-(--accent-purple)/10 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 text-sm md:text-base">
                                        <Play className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" /> NEXT ROUND
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center gap-3 md:gap-4 shrink-0 px-2 md:px-0">
                    <div className="flex-1 bg-(--surface-bg) border border-(--surface-border) rounded-xl md:rounded-2xl py-3 px-4 md:py-4 md:px-6 flex items-center gap-3 md:gap-4">
                        <div className={`w-2 h-2 rounded-full ${status === 'PLAYING' ? (isAiThinking ? 'bg-purple-500 animate-pulse' : 'bg-green-500 animate-pulse') : 'bg-yellow-500'}`} />
                        <span className="font-black text-[9px] md:text-[10px] tracking-[0.2em] text-(--text-muted) uppercase">
                             {status === 'PLAYING' ? (isAiThinking ? 'AI IS CALCULATING...' : 'YOUR STRIKE') : 'MATCH CONCLUDED'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button title="Refresh" onClick={resetGame} className="p-3 md:p-4 bg-(--surface-bg) hover:bg-white/10 border border-(--surface-border) rounded-xl md:rounded-2xl text-(--text-muted) hover:text-white transition-all active:scale-90">
                            <RefreshCw className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        
                        <button title="Leave" onClick={onExit} aria-label="Leave this room" className="p-3 md:p-4 bg-(--accent-red)/10 hover:bg-(--accent-red)/20 border border-(--accent-red)/20 rounded-xl md:rounded-2xl text-(--accent-red) transition-all active:scale-90">
                            <LogOut className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default GameRoomPvE;
