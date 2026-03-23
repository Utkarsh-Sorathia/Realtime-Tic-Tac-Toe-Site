import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Users, ArrowRight, Loader2, User } from 'lucide-react';
import { useGame } from '../../context/GameContext';

/**
 * High-tier landing page for the Tic Tac Toe application.
 * Focused on premium aesthetics and hooks into the global game state.
 */
const LandingPage: React.FC = () => {
    const { createGame, joinGame, isSearching, playerName, setPlayerName } = useGame();
    const [roomIdInput, setRoomIdInput] = useState('');
    const [status, setStatus] = useState<string | null>(null);

    /**
     * 🔗 AUTO-DETECT INVITE LINK:
     * If the user arrived via a link like ?room=123456, pre-fill it.
     */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const inviteRoom = params.get('room');
        if (inviteRoom) {
            setRoomIdInput(inviteRoom);
            setStatus(`Invite detected for room ${inviteRoom}! 🔗`);
        }
    }, []);

    const handleCreateRoom = async () => {
        if (!playerName) {
            setStatus('Please enter your name first! 👋');
            return;
        }
        setStatus('Generating a private room code...');
        try {
            await createGame();
            setStatus('Room created! Entering...');
        } catch (err) {
            console.error(err);
            setStatus('Error creating room. Try again! 🚫');
        }
    };

    const handleJoinRoom = async () => {
        if (!playerName) {
            setStatus('Please enter your name first! 👋');
            return;
        }
        if (!roomIdInput) return;
        setStatus(`Joining room ${roomIdInput}...`);
        try {
            await joinGame(roomIdInput);
            setStatus('Joined Successfully! Preparing the board...');
        } catch (err) {
            console.error(err);
            setStatus('Room not found or full! 🕵️‍♂️');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 overflow-hidden flex flex-col items-center justify-center p-6 relative">
            {/* Animated Background Orbs for Premium Feel */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-pink-500/20 rounded-full blur-[120px] animate-pulse" />

            {/* Main Landing Panel */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-10">
                    <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className="inline-flex p-4 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 mb-6"
                    >
                        <Gamepad2 size={48} className="text-cyan-400" />
                    </motion.div>
                    <h1 className="text-5xl font-bold bg-linear-to-r from-cyan-400 via-white to-pink-500 bg-clip-text text-transparent mb-4">
                        Tic Tac Toe
                    </h1>
                    <p className="text-slate-400 text-lg">Real-time multiplayer experience.</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-4xl shadow-2xl flex flex-col gap-6">
                    
                    {/* Display Name Field */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Your Identity</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors" size={20} />
                            <input 
                                type="text" 
                                placeholder="Enter Display Name..." 
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none rounded-2xl px-12 py-4 text-white placeholder:text-slate-700 transition-all font-bold"
                            />
                        </div>
                    </div>

                    <div className="h-px w-full bg-white/5" />

                    {/* Create Room Action */}
                    <motion.button
                        disabled={isSearching}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreateRoom}
                        className="group flex items-center justify-between px-6 py-5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-2xl transition-all"
                    >
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-white font-black text-lg">Start New Game</span>
                            <span className="text-slate-400 text-sm">Create a private lobby.</span>
                        </div>
                        {isSearching ? <Loader2 className="animate-spin text-cyan-400" size={24} /> : <Gamepad2 className="text-cyan-400 group-hover:translate-x-1 transition-transform" size={24} />}
                    </motion.button>

                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/10"></div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Or Join Room</span>
                        <div className="h-px flex-1 bg-white/10"></div>
                    </div>

                    {/* Join Room Action */}
                    <div className="flex flex-col gap-3">
                        <div className="relative group">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={20} />
                            <input 
                                type="text" 
                                placeholder="Enter Room Code..." 
                                value={roomIdInput}
                                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                                className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none rounded-2xl px-12 py-4 text-white placeholder:text-slate-600 transition-all font-mono"
                            />
                        </div>
                        <motion.button
                            disabled={!roomIdInput || isSearching}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleJoinRoom}
                            className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black transition-all shadow-lg ${
                                !roomIdInput ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 'bg-white text-slate-900 hover:bg-slate-100 shadow-white/10'
                            }`}
                        >
                            Join Game <ArrowRight size={20} />
                        </motion.button>
                    </div>

                    {status && (
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-sm font-medium text-cyan-400 bg-cyan-400/5 py-2 rounded-lg"
                        >
                            {status}
                        </motion.p>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm">
                        Built with <span className="text-cyan-400 font-mono">Pusher</span> • <span className="text-pink-400 font-mono">React</span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LandingPage;
