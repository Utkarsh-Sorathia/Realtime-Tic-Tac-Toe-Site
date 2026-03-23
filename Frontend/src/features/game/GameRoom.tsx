import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { Share2, RefreshCw, LogOut, Loader2, Play, Trophy, Check } from 'lucide-react';
import { roomService } from '../../services/api';

/**
 * Premium Game Room UI with a session-based scorecard.
 */
const GameRoom: React.FC = () => {
    const { gameState, playerSide, roomId, leaveRoom, refreshRoom } = useGame();
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    if (!gameState || !roomId || !playerSide) return null;

    const handleCellClick = async (index: number) => {
        if (gameState.currentTurn !== playerSide || 
            gameState.board[index] !== null || 
            gameState.status !== 'PLAYING' ||
            isActionLoading) {
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
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
                <div className="absolute top-10 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="z-10 w-full max-w-lg"
            >
                {/* Header: Room Code & Play Side */}
                <div className="flex items-center justify-between mb-6 px-2">
                    <div className="flex flex-col">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Combat Zone</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-mono font-black text-white uppercase tracking-tighter">{roomId}</span>
                            <button 
                                onClick={handleShare}
                                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition-all group active:scale-95"
                            >
                                {isCopied ? <Check size={14} className="text-green-500" /> : <Share2 size={14} className="text-slate-400 group-hover:text-cyan-400" />}
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-widest">{isCopied ? 'Copied' : 'Invite'}</span>
                            </button>
                        </div>
                    </div>

                    <div className={`px-5 py-2 rounded-full font-black text-xs border-2 transition-all tracking-widest ${playerSide === 'X' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'bg-pink-500/10 border-pink-500/30 text-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.15)]'}`}>
                       PLAYING AS {playerSide}
                    </div>
                </div>

                {/* Tournament Scoreboard */}
                <div className="flex items-center gap-4 mb-8">
                    <div className={`flex-1 bg-white/5 border-2 rounded-4xl p-5 flex flex-col items-center relative transition-all duration-500 ${gameState.currentTurn === 'X' && gameState.status === 'PLAYING' ? 'border-cyan-500/40 shadow-[0_0_35px_rgba(34,211,238,0.15)] scale-105' : 'border-white/5'}`}>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 mb-2 truncate max-w-[100px]">
                            {gameState.players.X || "GUEST_X"}
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-5xl font-black text-white tracking-tighter">{gameState.scores.X}</span>
                            {gameState.scores.X > gameState.scores.O && <Trophy size={20} className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />}
                        </div>
                        {gameState.currentTurn === 'X' && gameState.status === 'PLAYING' && <motion.div layoutId="turn" className="absolute -bottom-1 w-16 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,1)]" />}
                    </div>
                    
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-2xl font-black text-slate-700 italic tracking-tighter">VS</div>
                        <div className="bg-white/5 px-3 py-1 rounded-full border border-white/5">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">DRAWS: {gameState.scores.DRAW}</span>
                        </div>
                    </div>

                    <div className={`flex-1 bg-white/5 border-2 rounded-4xl p-5 flex flex-col items-center relative transition-all duration-500 ${gameState.currentTurn === 'O' && gameState.status === 'PLAYING' ? 'border-pink-500/40 shadow-[0_0_35px_rgba(236,72,153,0.15)] scale-105' : 'border-white/5'}`}>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500/60 mb-2 truncate max-w-[100px]">
                            {gameState.players.O || "GUEST_O"}
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-5xl font-black text-white tracking-tighter">{gameState.scores.O}</span>
                            {gameState.scores.O > gameState.scores.X && <Trophy size={20} className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />}
                        </div>
                        {gameState.currentTurn === 'O' && gameState.status === 'PLAYING' && <motion.div layoutId="turn" className="absolute -bottom-1 w-16 h-1.5 bg-pink-500 rounded-full shadow-[0_0_15px_rgba(236,72,153,1)]" />}
                    </div>
                </div>

                {/* The Board */}
                <div className="grid grid-cols-3 gap-4 bg-white/5 backdrop-blur-3xl border border-white/10 p-6 rounded-[3.5rem] shadow-2xl aspect-square mb-10 relative group/board">
                    <AnimatePresence>{renderWinningLine()}</AnimatePresence>

                    {gameState.board.map((cell, idx) => (
                        <motion.button
                            key={idx}
                            onClick={() => handleCellClick(idx)}
                            whileHover={!cell && canMove ? { scale: 1.05, background: "rgba(255,255,255,0.08)" } : {}}
                            whileTap={!cell && canMove ? { scale: 0.95 } : {}}
                            className={`aspect-square rounded-4xl border-2 border-white/5 bg-white/5 flex items-center justify-center text-6xl font-black transition-all relative overflow-hidden ${
                                !cell && canMove ? 'cursor-pointer hover:border-white/20' : 'cursor-default'
                            }`}
                        >
                            {cell === 'X' && (
                                <motion.span initial={{ scale:0, rotate:-45 }} animate={{ scale:1, rotate:0 }} className="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">X</motion.span>
                            )}
                            {cell === 'O' && (
                                <motion.span initial={{ scale:0, scaleX:0.5 }} animate={{ scale:1, scaleX:1 }} className="text-pink-500 drop-shadow-[0_0_20px_rgba(236,72,153,0.6)]">O</motion.span>
                            )}
                            {!cell && canMove && (
                                <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </motion.button>
                    ))}
                    
                    <AnimatePresence>
                        {gameState.status !== 'PLAYING' && gameState.status !== 'WAITING' && (
                            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="absolute inset-x-4 inset-y-4 z-40 bg-slate-950/80 backdrop-blur-2xl rounded-[3rem] flex flex-col items-center justify-center p-8 text-center border border-white/10 shadow-2xl">
                                <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} className="w-full">
                                    <div className="mb-4 inline-flex p-4 rounded-full bg-white/5 border border-white/10">
                                        <Trophy size={48} className={gameState.status === 'WON' ? "text-yellow-500" : "text-slate-500"} />
                                    </div>
                                    <h3 className="text-5xl font-black mb-2 italic tracking-tighter">
                                        {gameState.status === 'WON' ? (gameState.winner === playerSide ? 'VICTORY' : 'DEFEAT') : "STALEMATE"}
                                    </h3>
                                    <p className="text-slate-500 mb-10 text-xs font-bold uppercase tracking-[0.3em]">
                                        {gameState.status === 'WON' ? (gameState.winner === playerSide ? 'THE CROWN IS YOURS' : 'BETTER LUCK NEXT ROUND') : "A BATTLE OF EQUALS"}
                                    </p>
                                    <button onClick={handleRematch} disabled={isActionLoading} className="w-full h-18 bg-white text-slate-950 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-cyan-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 disabled:opacity-50">
                                        {isActionLoading ? <Loader2 className="animate-spin" /> : <><Play size={20} fill="currentColor" /> INITIATE REMATCH</>}
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 flex items-center gap-4 overflow-hidden group">
                        <div className={`w-2 h-2 rounded-full ${gameState.status === 'PLAYING' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse' : 'bg-yellow-500'}`} />
                        <span className="font-black text-[10px] tracking-[0.2em] text-slate-400 uppercase">
                             {gameState.status === 'WAITING' ? 'WAITING FOR CHALLENGER...' : 
                              gameState.status === 'PLAYING' ? (canMove ? 'YOUR STRIKE' : 'OPPONENT THINKING') : 'MATCH CONCLUDED'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button title="Refresh" onClick={handleRefresh} className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all active:scale-90">
                            <RefreshCw className={isActionLoading ? "animate-spin" : ""} size={20} />
                        </button>
                        
                        <button title="Leave" onClick={leaveRoom} className="p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-red-500 transition-all active:scale-90">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default GameRoom;
