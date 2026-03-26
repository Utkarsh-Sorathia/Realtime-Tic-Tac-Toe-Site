import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { Share2, RefreshCw, LogOut, Loader2, Play, Trophy, Check, ChevronLeft } from 'lucide-react';
import { roomService } from '../../services/api';
import confetti from 'canvas-confetti';

/**
 * Premium Game Room UI with a session-based scorecard.
 */
const GameRoom: React.FC = () => {
    const { gameState, playerSide, roomId, leaveRoom, refreshRoom, opponentDisconnected, opponentForfeit } = useGame();
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Victory celebration (Confetti + Haptics)
    React.useEffect(() => {
        if (gameState?.status === 'WON' && gameState?.winner === playerSide) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#22d3ee', '#ffffff', '#ec4899'] // Match PvP themed colors (Cyan/Pink)
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
        if (gameState.currentTurn !== playerSide || 
            gameState.board[index] !== null || 
            gameState.status !== 'PLAYING' ||
            isActionLoading ||
            opponentDisconnected) {  // 🚫 Block moves during opponent grace period
            return;
        }

        setIsActionLoading(true);
        try {
            await roomService.makeMove(roomId, index, playerSide);
        } catch (err) {
            console.error('Failed to make move:', err);
        } finally {
            setIsActionLoading(false);
        }
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
        const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
        
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
        const lineColor = gameState.winner === 'X' ? 'bg-cyan-400' : 'bg-pink-500';
        const shadowColor = gameState.winner === 'X' ? 'shadow-[0_0_15px_rgba(34,211,238,0.8)]' : 'shadow-[0_0_15px_rgba(236,72,153,0.8)]';
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
        <div className="h-dvh bg-slate-900 text-white flex flex-col items-center justify-center p-2 md:p-4 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
                <div className="absolute top-10 left-10 w-64 md:w-96 h-64 md:h-96 bg-cyan-500/10 rounded-full blur-[80px] md:blur-[100px]" />
                <div className="absolute bottom-10 right-10 w-64 md:w-96 h-64 md:h-96 bg-pink-500/10 rounded-full blur-[80px] md:blur-[100px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="z-10 w-full max-w-lg flex flex-col h-full max-h-dvh justify-center py-2 md:py-4"
            >
                {/* Header: Combat Zone Namespace & Session Details */}
                <div className="w-full mb-3 md:mb-8 px-2 shrink-0">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <button 
                            onClick={leaveRoom} 
                            className="p-2 md:p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90 group"
                            aria-label="Leave Game"
                        >
                            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-1.5 h-4 md:h-6 bg-cyan-400 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
                            <h2 className="text-lg md:text-xl font-black uppercase tracking-[0.2em] text-white italic">
                                Combat <span className="text-cyan-400">Zone</span>
                            </h2>
                        </div>
                        <div className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full font-black text-[9px] md:text-[10px] border transition-all tracking-[0.2em] uppercase shrink-0 ${
                            playerSide === 'X' 
                                ? 'bg-cyan-500/10 border-cyan-400/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                                : 'bg-pink-500/10 border-pink-500/30 text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.1)]'
                        }`}>
                           TEAM {playerSide}
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 backdrop-blur-xl shadow-2xl">
                        <div className="flex flex-col">
                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mb-0.5 md:mb-1">Lobby Entry</span>
                            <span className="text-2xl md:text-4xl font-mono font-black text-white tracking-tighter leading-none">{roomId}</span>
                        </div>
                        <button 
                            onClick={handleShare}
                            aria-label={isCopied ? "Invite link copied" : "Share invite link"}
                            className="flex items-center gap-2 md:gap-3 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 px-4 py-2 md:px-6 md:py-3 rounded-xl transition-all group active:scale-95 shrink-0"
                        >
                            {isCopied ? <Check className="w-4 h-4 md:w-5 md:h-5 text-green-400" /> : <Share2 className="w-4 h-4 md:w-5 md:h-5 text-cyan-400 group-hover:scale-110 transition-transform" />}
                            <span className="text-[9px] md:text-[11px] font-black text-cyan-400 uppercase tracking-widest leading-none">{isCopied ? 'Copied' : 'Invite'}</span>
                        </button>
                    </div>
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
                        className="mx-2 mb-3 md:mb-4 shrink-0 flex items-center gap-3 bg-yellow-400/10 border border-yellow-400/40 rounded-xl px-4 py-3 backdrop-blur-xl shadow-[0_0_30px_rgba(250,204,21,0.15)]"
                    >
                        <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] shrink-0" />
                        <div>
                            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-yellow-400">🏆 You Win by Forfeit!</p>
                            <p className="text-[9px] text-yellow-400/60 font-medium">Opponent failed to reconnect in time</p>
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
                        className="mx-2 mb-3 md:mb-4 shrink-0 flex items-center gap-3 bg-orange-500/10 border border-orange-400/30 rounded-xl px-4 py-3 backdrop-blur-xl"
                    >
                        <div className="relative">
                            <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                        </div>
                        <div>
                            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-orange-400">Opponent Reconnecting...</p>
                            <p className="text-[9px] text-orange-400/60 font-medium">Waiting 10 seconds before ending the session</p>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* Tournament Scoreboard */}
                <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-8 shrink-0 px-2 md:px-0">
                    <div className={`flex-1 bg-white/5 border-2 rounded-2xl md:rounded-4xl p-3 md:p-5 flex flex-col items-center relative transition-all duration-500 ${gameState.currentTurn === 'X' && gameState.status === 'PLAYING' ? 'border-cyan-500/40 shadow-[0_0_35px_rgba(34,211,238,0.15)] scale-105' : 'border-white/5'}`}>
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 mb-1 md:mb-2 truncate max-w-[80px] md:max-w-[100px]">
                            {gameState.players.X || "GUEST_X"} {playerSide === 'X' && "(YOU)"}
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl md:text-5xl font-black text-white tracking-tighter">{gameState.scores.X}</span>
                            {gameState.scores.X > gameState.scores.O && <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />}
                        </div>
                        {gameState.currentTurn === 'X' && gameState.status === 'PLAYING' && <motion.div layoutId="turn" className="absolute -bottom-1 w-12 md:w-16 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,1)]" />}
                    </div>
                    
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-lg md:text-2xl font-black text-slate-700 italic tracking-tighter">VS</div>
                        <div className="bg-white/5 px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-white/5">
                            <span className="text-[7px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">DRAWS: {gameState.scores.DRAW}</span>
                        </div>
                    </div>

                    <div className={`flex-1 bg-white/5 border-2 rounded-2xl md:rounded-4xl p-3 md:p-5 flex flex-col items-center relative transition-all duration-500 ${gameState.currentTurn === 'O' && gameState.status === 'PLAYING' ? 'border-pink-500/40 shadow-[0_0_35px_rgba(236,72,153,0.15)] scale-105' : 'border-white/5'}`}>
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-pink-500/60 mb-1 md:mb-2 truncate max-w-[80px] md:max-w-[100px]">
                            {gameState.players.O || "GUEST_O"} {playerSide === 'O' && "(YOU)"}
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl md:text-5xl font-black text-white tracking-tighter">{gameState.scores.O}</span>
                            {gameState.scores.O > gameState.scores.X && <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />}
                        </div>
                        {gameState.currentTurn === 'O' && gameState.status === 'PLAYING' && <motion.div layoutId="turn" className="absolute -bottom-1 w-12 md:w-16 h-1.5 bg-pink-500 rounded-full shadow-[0_0_15px_rgba(236,72,153,1)]" />}
                    </div>
                </div>

                {/* The Board */}
                <div className="w-full max-w-[400px] mx-auto grid grid-cols-3 gap-2 md:gap-4 bg-white/5 backdrop-blur-3xl border border-white/10 p-3 md:p-6 rounded-4xl md:rounded-[3.5rem] shadow-2xl aspect-square mb-4 md:mb-10 relative group/board shrink pointer-events-auto">
                    <AnimatePresence>{renderWinningLine()}</AnimatePresence>

                    {gameState.board.map((cell, idx) => (
                        <motion.button
                            key={idx}
                            onClick={() => handleCellClick(idx)}
                            aria-label={`Mark square ${idx + 1}${cell ? ` as ${cell}` : ''}`}
                            whileHover={!cell && canMove ? { scale: 1.05, background: "rgba(255,255,255,0.08)" } : {}}
                            whileTap={!cell && canMove ? { scale: 0.95 } : {}}
                            className={`aspect-square rounded-2xl md:rounded-4xl border-2 border-white/5 bg-white/5 flex items-center justify-center text-5xl md:text-6xl font-black transition-all relative overflow-hidden ${
                                !cell && canMove ? 'cursor-pointer hover:border-white/20' : 'cursor-default'
                            }`}
                        >
                            {cell === 'X' && (
                                <motion.span initial={{ scale:0, rotate:-45 }} animate={{ scale:1, rotate:0 }} className="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)] z-10">X</motion.span>
                            )}
                            {cell === 'O' && (
                                <motion.span initial={{ scale:0, scaleX:0.5 }} animate={{ scale:1, scaleX:1 }} className="text-pink-500 drop-shadow-[0_0_20px_rgba(236,72,153,0.6)] z-10">O</motion.span>
                            )}
                            {!cell && canMove && (
                                <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </motion.button>
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
                                    <p className="text-slate-500 mb-6 md:mb-10 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]">
                                        {gameState.status === 'WON' ? (gameState.winner === playerSide ? 'THE CROWN IS YOURS' : 'BETTER LUCK NEXT ROUND') : "A BATTLE OF EQUALS"}
                                    </p>
                                    <button onClick={handleRematch} disabled={isActionLoading} className="w-full h-14 md:h-18 bg-white text-slate-950 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 md:gap-3 hover:bg-cyan-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 disabled:opacity-50 text-sm md:text-base">
                                        {isActionLoading ? <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" /> : <><Play className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" /> INITIATE REMATCH</>}
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-3 md:gap-4 shrink-0 px-2 md:px-0">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl py-3 px-4 md:py-4 md:px-6 flex items-center gap-3 md:gap-4 overflow-hidden group">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${gameState.status === 'PLAYING' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse' : 'bg-yellow-500'}`} />
                        <span className="font-black text-[9px] md:text-[10px] tracking-[0.2em] text-slate-400 uppercase">
                             {gameState.status === 'WAITING' ? 'WAITING FOR CHALLENGER...' : 
                              gameState.status === 'PLAYING' ? (canMove ? 'YOUR STRIKE' : 'OPPONENT THINKING') : 'MATCH CONCLUDED'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button title="Refresh" onClick={handleRefresh} disabled={isActionLoading} aria-label="Refresh game state" className="p-3 md:p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl md:rounded-2xl text-slate-500 hover:text-white transition-all active:scale-90 disabled:opacity-50">
                            <RefreshCw className={`w-5 h-5 md:w-6 md:h-6 ${isActionLoading ? "animate-spin" : ""}`} />
                        </button>
                        
                        <button title="Leave" onClick={leaveRoom} aria-label="Leave this room" className="p-3 md:p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl md:rounded-2xl text-red-500 transition-all active:scale-90">
                            <LogOut className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default GameRoom;
