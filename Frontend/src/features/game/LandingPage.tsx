import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Users, ArrowRight, Loader2, User, Cpu } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useSearchParams } from 'react-router-dom';

interface LandingPageProps {
    onPlayVSComputer?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onPlayVSComputer }) => {
    const { createGame, joinGame, isSearching, playerName, setPlayerName } = useGame();
    const [roomIdInput, setRoomIdInput] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const inviteRoom = searchParams.get('room');
        if (inviteRoom) {
            setRoomIdInput(inviteRoom);
            setStatus(`Invite detected for room ${inviteRoom}! 🔗`);
        }
    }, [searchParams]);

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
            // Once we start the join attempt, clear the invite link from URL
            if (searchParams.has('room')) {
                setSearchParams({}, { replace: true });
            }
            
            await joinGame(roomIdInput);
            setStatus('Joined Successfully! Preparing the board...');
        } catch (err) {
            console.error(err);
            setStatus('Room not found or full! 🕵️‍♂️');
        }
    };

    return (
        <div className="h-dvh w-full bg-slate-900 overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 relative">
            {/* Animated Background Orbs for Premium Feel */}
            <div className="absolute top-1/4 -left-20 w-64 h-64 md:w-80 md:h-80 bg-cyan-500/20 rounded-full blur-[100px] md:blur-[120px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-64 h-64 md:w-80 md:h-80 bg-pink-500/20 rounded-full blur-[100px] md:blur-[120px] animate-pulse pointer-events-none" />

            {/* Main Landing Panel */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md z-10 flex flex-col h-full max-h-dvh justify-center"
            >
                <div className="text-center mb-4 md:mb-10 shrink-0">
                    <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className="inline-flex p-3 md:p-4 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 mb-3 md:mb-6"
                    >
                        <Gamepad2 className="text-cyan-400 w-10 h-10 md:w-12 md:h-12" />
                    </motion.div>
                    <h1 className="text-3xl md:text-5xl font-black bg-linear-to-r from-cyan-400 via-white to-pink-500 bg-clip-text text-transparent mb-2 md:mb-4 tracking-tight">
                        Tic Tac Toe
                    </h1>
                    <p className="text-slate-400 text-xs md:text-lg tracking-wide">Real-time multiplayer experience.</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-8 rounded-4xl shadow-2xl flex flex-col gap-3 md:gap-6 shrink">
                    
                    {/* Display Name Field */}
                    <div className="flex flex-col gap-1 md:gap-2">
                        <label htmlFor="playerName" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 px-1">
                            {roomIdInput ? 'Join the Arena As' : 'Your Identity'}
                        </label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors w-4 h-4 md:w-5 md:h-5" />
                            <input 
                                id="playerName"
                                type="text" 
                                placeholder="Enter Display Name..." 
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && roomIdInput && handleJoinRoom()}
                                aria-label="Enter your display name"
                                className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none rounded-xl md:rounded-2xl pl-10 md:pl-12 pr-4 py-3 md:py-4 text-white placeholder:text-slate-700 transition-all font-bold text-sm md:text-base"
                            />
                        </div>
                    </div>

                    <div className="h-px w-full bg-white/5" />

                    {/* Create Room Action */}
                    <motion.button
                        id="createRoomBtn"
                        disabled={isSearching}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreateRoom}
                        aria-label="Create a new private game room"
                        className="group flex items-center justify-between px-5 md:px-6 py-3 md:py-5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl md:rounded-2xl transition-all"
                    >
                        <div className="flex flex-col items-start gap-0 md:gap-1">
                            <span className="text-white font-black text-base md:text-lg">Start New Game</span>
                            <span className="text-slate-400 text-xs md:text-sm">Create a private lobby.</span>
                        </div>
                        {isSearching ? <Loader2 className="animate-spin text-cyan-400 w-5 h-5 md:w-6 md:h-6" /> : <Gamepad2 className="text-cyan-400 group-hover:rotate-12 transition-transform w-5 h-5 md:w-6 md:h-6" />}
                    </motion.button>

                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-px flex-1 bg-white/10"></div>
                        <span className="text-purple-500/70 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none">Or Face The AI</span>
                        <div className="h-px flex-1 bg-white/10"></div>
                    </div>

                    {/* PvE Action */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={onPlayVSComputer}
                        aria-label="Play against computer offline"
                        className="group flex items-center justify-between px-5 md:px-6 py-3 md:py-5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl md:rounded-2xl transition-all"
                    >
                        <div className="flex flex-col items-start gap-0 md:gap-1">
                            <span className="text-white font-black text-base md:text-lg">Cyber Match</span>
                            <span className="text-slate-400 text-xs md:text-sm hidden sm:block">Play locally against the Minimax Engine.</span>
                            <span className="text-slate-400 text-xs sm:hidden">Minimax Engine.</span>
                        </div>
                        <Cpu className="text-purple-400 group-hover:rotate-12 transition-transform w-5 h-5 md:w-6 md:h-6" />
                    </motion.button>

                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-px flex-1 bg-white/10"></div>
                        <span className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none">Or Join</span>
                        <div className="h-px flex-1 bg-white/10"></div>
                    </div>

                    {/* Join Room Action */}
                    <div className="flex flex-col gap-2 md:gap-3">
                        <div className="relative group">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors w-4 h-4 md:w-5 md:h-5" />
                            <input 
                                id="roomCodeInput"
                                type="text" 
                                placeholder="Enter Room Code..." 
                                value={roomIdInput}
                                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                                aria-label="Enter unique 6-digit room code to join"
                                className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none rounded-xl md:rounded-2xl pl-10 md:pl-12 pr-4 py-3 md:py-4 text-white placeholder:text-slate-600 transition-all font-mono text-sm md:text-base"
                            />
                        </div>
                        <motion.button
                            id="joinRoomBtn"
                            disabled={!roomIdInput || isSearching}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleJoinRoom}
                            aria-label="Join an existing game room with code"
                            className={`flex items-center justify-center gap-2 w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-black transition-all shadow-lg text-sm md:text-base ${
                                !roomIdInput ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 'bg-white text-slate-900 hover:bg-slate-100 shadow-white/10'
                            }`}
                        >
                            Join Game <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                        </motion.button>
                    </div>

                    {status && (
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-xs md:text-sm font-medium text-cyan-400 bg-cyan-400/5 py-1.5 md:py-2 rounded-lg"
                        >
                            {status}
                        </motion.p>
                    )}
                </div>

                <div className="mt-4 md:mt-8 text-center shrink-0">
                    <p className="text-slate-500 text-[10px] md:text-sm">
                        Built with <span className="text-cyan-400 font-mono">Pusher</span> • <span className="text-pink-400 font-mono">React</span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LandingPage;
