import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import EmojiReactions from './EmojiReactions';
import { Share2, RefreshCw, LogOut, Loader2, Play, Trophy, Check, ChevronLeft } from 'lucide-react';
import { roomService } from '../../services/api';
import confetti from 'canvas-confetti';

/**
 * Optimized individual cell to prevent unnecessary board re-renders
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
        aria-label={`Mark square ${idx + 1}${cell ? ` as ${cell}` : ''}`}
        whileHover={!cell && canMove ? { scale: 1.05, background: "rgba(255,255,255,0.08)" } : {}}
        whileTap={!cell && canMove ? { scale: 0.95 } : {}}
        className={`aspect-square rounded-2xl md:rounded-4xl border-2 border-white/5 bg-white/5 flex items-center justify-center text-5xl md:text-6xl font-black transition-all relative overflow-hidden ${
            !cell && canMove ? 'cursor-pointer hover:border-white/20' : 'cursor-default'
        }`}
    >
        {cell === 'X' && (
            <motion.span initial={{ scale:0, rotate:-45 }} animate={{ scale:1, rotate:0 }} className="text-(--primary-cyan) drop-shadow-[0_0_20px_var(--primary-glow)] z-10">X</motion.span>
        )}
        {cell === 'O' && (
            <motion.span initial={{ scale:0, scaleX:0.5 }} animate={{ scale:1, scaleX:1 }} className="text-(--secondary-pink) drop-shadow-[0_0_20px_var(--secondary-glow)] z-10">O</motion.span>
        )}
        {!cell && canMove && (
            <div className="absolute inset-0 bg-(--primary-cyan)/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
    </motion.button>
));

/**
 * Premium Game Room UI with a session-based scorecard.
 */
const GameRoom: React.FC = () => {
    const { gameState, playerSide, roomId, leaveRoom, refreshRoom, opponentDisconnected, opponentForfeit, makeMove } = useGame();
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Victory celebration (Confetti + Haptics)
    React.useEffect(() => {
        if (gameState?.status === 'WON' && gameState?.winner === playerSide) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#22d3ee', '#ffffff', '#ec4899'] // Match PvP themed colors (Primary/Secondary)
            });
            if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
        } else if (gameState?.status === 'DRAW' && navigator.vibrate) {
            navigator.vibrate(50);
        }
    }, [gameState?.status, gameState?.winner, playerSide]);

    // 🏆 Forfeit Victory: opponent didn't reconnect in time
    React.useEffect(() => {
        if (opponentForfeit) {
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#fbbf24', '#f59e0b', '#ffffff', '#22d3ee', '#ec4899']
            });
            if (navigator.vibrate) navigator.vibrate([100, 50, 200, 50, 300]);
        }
    }, [opponentForfeit]);

    if (!gameState || !roomId || !playerSide) return null;

    const handleCellClick = async (index: number) => {
        // All validation and optimistic update logic is now inside GameContext's makeMove
        await makeMove(index);
    };

    const handleRematch = async () => {
        setIsActionLoading(true);
        try {
            await roomService.rematch(roomId);
        } catch (err) {
            console.error("Rematch failed:", err);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsActionLoading(true);
        await refreshRoom();
        setIsActionLoading(false);
    };

    const handleShare = async () => {
        const inviteUrl = `${window.location.origin}/room/${roomId}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Tic Tac Toe Elite',
                    text: `Join me for a match in room ${roomId}!`,
                    url: inviteUrl,
                });
            } catch (err) {
                console.log('Sharing failed', err);
            }
        } else {
            // Fallback to clipboard
            await navigator.clipboard.writeText(inviteUrl);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const canMove = gameState.currentTurn === playerSide && gameState.status === 'PLAYING' && !isActionLoading;

    const renderWinningLine = () => {
        if (gameState.status !== 'WON' || !gameState.winningLine) return null;
        const line = gameState.winningLine.join(',');
        let style = "";
        if (line === '0,1,2') style = "top-[18.2%] w-[90%] left-[5%] h-[2px]";
        if (line === '3,4,5') style = "top-[50%] w-[90%] left-[5%] h-[2px] -translate-y-1/2";
        if (line === '6,7,8') style = "bottom-[18.2%] w-[90%] left-[5%] h-[2px]";
        if (line === '0,3,6') style = "left-[18.2%] h-[90%] top-[5%] w-[2px]";
        if (line === '1,4,7') style = "left-[50%] h-[90%] top-[5%] w-[2px] -translate-x-1/2";
        if (line === '2,5,8') style = "right-[18.2%] h-[90%] top-[5%] w-[2px]";
        if (line === '0,4,8') style = "top-[50%] left-[50%] w-[120%] h-[2px] -translate-x-1/2 -translate-y-1/2 rotate-45";
        if (line === '2,4,6') style = "top-[50%] left-[50%] w-[120%] h-[2px] -translate-x-1/2 -translate-y-1/2 -rotate-45";
        const lineColor = gameState.winner === 'X' ? 'bg-(--primary-cyan)' : 'bg-(--secondary-pink)';
        const shadowColor = gameState.winner === 'X' ? 'shadow-[0_0_8px_var(--primary-glow)]' : 'shadow-[0_0_8px_var(--secondary-glow)]';
        return (
            <motion.div 
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`absolute rounded-full z-30 pointer-events-none origin-center ${style} ${lineColor} ${shadowColor}`}
            />
        );
    };

    return (
        <div className="h-dvh bg-(--site-bg) text-white flex flex-col items-center p-2 md:p-6 relative overflow-hidden font-sans">
            {/* Animated Background Orbs (Optimized for Mobile) */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30 overflow-hidden">
                <div className="absolute -top-20 -left-20 w-64 md:w-96 h-64 md:h-96 bg-(--primary-cyan)/20 rounded-full blur-[60px] md:blur-[120px] animate-pulse will-change-[filter,transform]" />
                <div className="absolute -bottom-20 -right-20 w-64 md:w-96 h-64 md:h-96 bg-(--secondary-pink)/20 rounded-full blur-[60px] md:blur-[120px] animate-pulse will-change-[filter,transform]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md z-10 flex flex-col h-full max-h-dvh justify-center"
            >
                {/* Header: Combat Zone Namespace & Session Details */}
                <div className="w-full mb-3 md:mb-8 px-2 shrink-0">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <button 
                            onClick={leaveRoom} 
                            className="p-2 md:p-2.5 rounded-xl bg-(--surface-bg) border border-(--surface-border) text-(--text-muted) hover:text-white hover:bg-white/10 transition-all active:scale-90 group"
                            aria-label="Leave Game"
                        >
                            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-1.5 h-4 md:h-6 bg-(--primary-cyan) rounded-full shadow-[0_0_8px_var(--primary-glow)]" />
                            <h2 className="text-lg md:text-xl font-black uppercase tracking-[0.2em] text-white italic">
                                Combat <span className="text-(--primary-cyan)">Zone</span>
                            </h2>
                        </div>
                        <div className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full font-black text-[9px] md:text-[10px] border transition-all tracking-[0.2em] uppercase shrink-0 ${
                            playerSide === 'X' 
                                ? 'bg-(--primary-cyan)/10 border-(--primary-cyan)/30 text-(--primary-cyan) shadow-[0_0_10px_var(--primary-glow)]' 
                                : 'bg-(--secondary-pink)/10 border-(--secondary-pink)/30 text-(--secondary-pink) shadow-[0_0_10px_var(--secondary-glow)]'
                        }`}>
                           TEAM {playerSide}
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-(--surface-bg) border border-(--surface-border) rounded-xl md:rounded-2xl p-3 md:p-4 backdrop-blur-xl shadow-2xl">
                        <div className="flex flex-col">
                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] text-(--text-muted) mb-0.5 md:mb-1">Lobby Entry</span>
                            <span className="text-2xl md:text-4xl font-mono font-black text-white tracking-tighter leading-none">{roomId}</span>
                        </div>
                        <button 
                            onClick={handleShare}
                            aria-label={isCopied ? "Invite link copied" : "Share invite link"}
                            className="flex items-center gap-2 md:gap-3 bg-(--primary-cyan)/10 hover:bg-(--primary-cyan)/20 border border-(--primary-cyan)/30 px-4 py-2 md:px-6 md:py-3 rounded-xl transition-all group active:scale-95 shrink-0"
                        >
                            {isCopied ? <Check className="w-4 h-4 md:w-5 md:h-5 text-(--accent-emerald)" /> : <Share2 className="w-4 h-4 md:w-5 md:h-5 text-(--primary-cyan) group-hover:scale-110 transition-transform" />}
                            <span className="text-[9px] md:text-[11px] font-black text-(--primary-cyan) uppercase tracking-widest leading-none">{isCopied ? 'Copied' : 'Invite'}</span>
                        </button>
                    </div>

                    {/* Elite Reactions System 😠😂🔥 */}
                    <EmojiReactions />
                </div>

                {/* 🏆 FORFEIT WIN BANNER — shown when grace period expires */}
                <AnimatePresence>
                {opponentForfeit && (
                    <motion.div
                        key="forfeit-banner"
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ duration: 0.4, type: 'spring', bounce: 0.4 }}
                        className="mx-2 mb-3 md:mb-4 shrink-0 flex items-center gap-3 bg-(--accent-orange)/10 border border-(--accent-orange)/40 rounded-xl px-4 py-3 backdrop-blur-xl shadow-[0_0_30px_var(--accent-orange)]"
                    >
                        <Trophy className="w-5 h-5 text-(--accent-orange) drop-shadow-[0_0_5px_var(--accent-orange)] shrink-0" />
                        <div>
                            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-(--accent-orange)">🏆 You Win by Forfeit!</p>
                            <p className="text-[9px] text-(--accent-orange)/60 font-medium">Opponent left the game.</p>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* 👻 RECONNECTION BANNER — shown during grace period */}
                <AnimatePresence>
                {opponentDisconnected && (
                    <motion.div
                        key="reconnect-banner"
                        initial={{ opacity: 0, y: -10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.96 }}
                        transition={{ duration: 0.3 }}
                        className="mx-2 mb-3 md:mb-4 shrink-0 flex items-center gap-3 bg-(--accent-orange)/10 border border-(--accent-orange)/30 rounded-xl px-4 py-3 backdrop-blur-xl"
                    >
                        <div className="relative">
                            <Loader2 className="w-4 h-4 text-(--accent-orange) animate-spin" />
                        </div>
                        <div>
                            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-(--accent-orange)">Opponent Reconnecting...</p>
                            <p className="text-[9px] text-(--accent-orange)/60 font-medium">Waiting 10 seconds before ending the session</p>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* Tournament Scoreboard */}
                <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-8 shrink-0 px-2 md:px-0">
                    <div className={`flex-1 bg-(--surface-bg) border-2 rounded-2xl md:rounded-4xl p-3 md:p-5 flex flex-col items-center relative transition-all duration-500 ${gameState.currentTurn === 'X' && gameState.status === 'PLAYING' ? 'border-(--primary-cyan)/40 shadow-[0_0_20px_var(--primary-glow)] scale-105' : 'border-white/5'}`}>
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-(--primary-cyan)/60 mb-1 md:mb-2 truncate max-w-[80px] md:max-w-[100px]">
                            {gameState.players.X || "GUEST_X"} {playerSide === 'X' && "(YOU)"}
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl md:text-5xl font-black text-white tracking-tighter">{gameState.scores.X}</span>
                            {gameState.scores.X > gameState.scores.O && <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />}
                        </div>
                        {gameState.currentTurn === 'X' && gameState.status === 'PLAYING' && <motion.div layoutId="turn" className="absolute -bottom-1 w-12 md:w-16 h-1.5 bg-(--primary-cyan) rounded-full shadow-[0_0_10px_var(--primary-glow)]" />}
                    </div>
                    
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-lg md:text-2xl font-black text-slate-700 italic tracking-tighter">VS</div>
                        <div className="bg-(--surface-bg) px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-(--surface-border)">
                            <span className="text-[7px] md:text-[9px] font-black text-(--text-muted) uppercase tracking-widest whitespace-nowrap">DRAWS: {gameState.scores.DRAW}</span>
                        </div>
                    </div>

                    <div className={`flex-1 bg-(--surface-bg) border-2 rounded-2xl md:rounded-4xl p-3 md:p-5 flex flex-col items-center relative transition-all duration-500 ${gameState.currentTurn === 'O' && gameState.status === 'PLAYING' ? 'border-(--secondary-pink)/40 shadow-[0_0_20px_var(--secondary-glow)] scale-105' : 'border-white/5'}`}>
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-(--secondary-pink)/60 mb-1 md:mb-2 truncate max-w-[80px] md:max-w-[100px]">
                            {gameState.players.O || "GUEST_O"} {playerSide === 'O' && "(YOU)"}
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl md:text-5xl font-black text-white tracking-tighter">{gameState.scores.O}</span>
                            {gameState.scores.O > gameState.scores.X && <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />}
                        </div>
                        {gameState.currentTurn === 'O' && gameState.status === 'PLAYING' && <motion.div layoutId="turn" className="absolute -bottom-1 w-12 md:w-16 h-1.5 bg-(--secondary-pink) rounded-full shadow-[0_0_10px_var(--secondary-glow)]" />}
                    </div>
                </div>

                {/* The Board */}
                <div className="w-full max-w-[400px] mx-auto grid grid-cols-3 gap-2 md:gap-4 bg-(--surface-bg) backdrop-blur-3xl border border-(--surface-border) p-3 md:p-6 rounded-4xl md:rounded-[3.5rem] shadow-2xl aspect-square mb-4 md:mb-10 relative group/board shrink pointer-events-auto">
                    <AnimatePresence>{renderWinningLine()}</AnimatePresence>

                    {gameState.board.map((cell, idx) => (
                        <BoardCell 
                            key={idx}
                            idx={idx}
                            cell={cell}
                            canMove={canMove}
                            onClick={handleCellClick}
                        />
                    ))}
                    
                    <AnimatePresence>
                        {gameState.status !== 'PLAYING' && gameState.status !== 'WAITING' && (
                            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="absolute inset-x-2 inset-y-2 md:inset-x-4 md:inset-y-4 z-40 bg-slate-950/80 backdrop-blur-2xl rounded-3xl md:rounded-[3rem] flex flex-col items-center justify-center p-4 md:p-8 text-center border border-white/10 shadow-2xl">
                                <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} className="w-full">
                                    <div className="mb-2 md:mb-4 inline-flex p-3 md:p-4 rounded-full bg-white/5 border border-white/10">
                                        <Trophy className={`w-8 h-8 md:w-12 md:h-12 ${gameState.status === 'WON' ? 'text-yellow-500' : 'text-slate-500'}`} />
                                    </div>
                                    <h3 className="text-3xl md:text-5xl font-black mb-1 md:mb-2 italic tracking-tighter">
                                        {gameState.status === 'WON' ? (gameState.winner === playerSide ? 'VICTORY' : 'DEFEAT') : "STALEMATE"}
                                    </h3>
                                    <p className="text-(--text-muted) mb-6 md:mb-10 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]">
                                        {gameState.status === 'WON' ? (gameState.winner === playerSide ? 'THE CROWN IS YOURS' : 'BETTER LUCK NEXT ROUND') : "A BATTLE OF EQUALS"}
                                    </p>
                                    <button onClick={handleRematch} disabled={isActionLoading} className="w-full h-14 md:h-18 bg-white text-slate-950 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 md:gap-3 hover:bg-(--primary-cyan)/10 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 disabled:opacity-50 text-sm md:text-base">
                                        {isActionLoading ? <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" /> : <><Play className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" /> INITIATE REMATCH</>}
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-3 md:gap-4 shrink-0 px-2 md:px-0">
                    <div className="flex-1 bg-(--surface-bg) border border-(--surface-border) rounded-xl md:rounded-2xl py-3 px-4 md:py-4 md:px-6 flex items-center gap-3 md:gap-4 overflow-hidden group">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${gameState.status === 'PLAYING' ? 'bg-(--accent-emerald) shadow-[0_0_10px_var(--accent-emerald)] animate-pulse' : 'bg-(--accent-orange)'}`} />
                        <span className="font-black text-[9px] md:text-[10px] tracking-[0.2em] text-(--text-muted) uppercase">
                             {gameState.status === 'WAITING' ? 'WAITING FOR CHALLENGER...' : 
                              gameState.status === 'PLAYING' ? (canMove ? 'YOUR STRIKE' : 'OPPONENT THINKING') : 'MATCH CONCLUDED'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button title="Refresh" onClick={handleRefresh} disabled={isActionLoading} aria-label="Refresh game state" className="p-3 md:p-4 bg-(--surface-bg) hover:bg-white/10 border border-(--surface-border) rounded-xl md:rounded-2xl text-(--text-muted) hover:text-white transition-all active:scale-90 disabled:opacity-50">
                            <RefreshCw className={`w-5 h-5 md:w-6 md:h-6 ${isActionLoading ? "animate-spin" : ""}`} />
                        </button>
                        
                        <button title="Leave" onClick={leaveRoom} aria-label="Leave this room" className="p-3 md:p-4 bg-(--accent-red)/10 hover:bg-(--accent-red)/20 border border-(--accent-red)/20 rounded-xl md:rounded-2xl text-(--accent-red) transition-all active:scale-90">
                            <LogOut className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default GameRoom;
