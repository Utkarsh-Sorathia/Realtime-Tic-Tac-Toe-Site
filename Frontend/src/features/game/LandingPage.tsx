import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Users, ArrowRight, Loader2, User, Cpu, Sparkles } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useSearchParams } from 'react-router-dom';
import { pusherClient } from '../../services/pusher';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

/**
 * Optimized Background Orbs that never re-render
 */
const BackgroundOrbs = React.memo(() => (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 md:w-96 h-64 md:h-96 bg-(--primary-cyan)/20 rounded-full blur-[60px] md:blur-[120px] animate-pulse will-change-[filter,transform]" />
        <div className="absolute -bottom-20 -right-20 w-64 md:w-96 h-64 md:h-96 bg-(--secondary-pink)/20 rounded-full blur-[60px] md:blur-[120px] animate-pulse will-change-[filter,transform]" />
    </div>
));

interface LandingPageProps {
    onPlayVSComputer?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onPlayVSComputer }) => {
    const { createGame, joinGame, isSearching, isSearchingMatch, joinMatchmaking, playerName, setPlayerName } = useGame();
    const [roomIdInput, setRoomIdInput] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [onlineCount, setOnlineCount] = useState<number>(0);

    // React Query for system health/stats check
    const { data: serverStats } = useQuery({
        queryKey: ['serverStats'],
        queryFn: async () => {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const { data } = await axios.get(`${apiUrl.replace('/api', '')}/`); // Root health check
            return data;
        },
        refetchInterval: 30000, // Refresh every 30s
    });

    useEffect(() => {
        // Subscribe to a global lobby channel just for counting players online
        const lobbyChannel = pusherClient.subscribe('presence-lobby');

        lobbyChannel.bind('pusher:subscription_succeeded', (members: { count: number }) => {
            setOnlineCount(members.count);
        });

        lobbyChannel.bind('pusher:member_added', () => {
            setOnlineCount((prev: number) => prev + 1);
        });

        lobbyChannel.bind('pusher:member_removed', () => {
            setOnlineCount((prev: number) => prev - 1);
        });

        return () => {
            lobbyChannel.unbind_all();
            pusherClient.unsubscribe('presence-lobby');
        };
    }, []);

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
        <div className="h-dvh bg-(--site-bg) text-white flex flex-col items-center p-2 md:p-6 relative overflow-hidden font-sans">
            <BackgroundOrbs />

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
                        className="inline-flex p-3 md:p-4 rounded-3xl bg-(--primary-cyan)/10 border border-(--primary-cyan)/20 mb-3 md:mb-6"
                    >
                        <Gamepad2 className="text-(--primary-cyan) w-10 h-10 md:w-12 md:h-12" />
                    </motion.div>
                    <h1 className="text-3xl md:text-5xl font-black bg-linear-to-r from-(--primary-cyan) via-white to-(--secondary-pink) bg-clip-text text-transparent mb-2 md:mb-4 tracking-tight">
                        Tic Tac Toe
                    </h1>
                    <div className="flex flex-col items-center gap-1 md:gap-2">
                        <p className="text-(--text-muted) text-xs md:text-lg tracking-wide">Real-time multiplayer experience.</p>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-(--accent-emerald)/10 border border-(--accent-emerald)/20 px-3 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-(--accent-emerald) rounded-full animate-pulse shadow-[0_0_6px_var(--accent-emerald)]" />
                                <span className="text-[9px] md:text-xs font-black text-(--accent-emerald) uppercase tracking-widest leading-none">
                                    {onlineCount > 0 ? `${onlineCount} Players Online` : 'Systems Online'}
                                </span>
                            </div>
                            {serverStats && (
                                <div className="flex items-center gap-2 bg-(--primary-cyan)/10 border border-(--primary-cyan)/20 px-3 py-1 rounded-full">
                                    <span className="text-[8px] md:text-[10px] font-black text-(--primary-cyan) uppercase tracking-widest leading-none">
                                        ver {serverStats.version || '1.0.0'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-(--surface-bg) backdrop-blur-xl border border-(--surface-border) p-5 md:p-8 rounded-4xl shadow-2xl flex flex-col gap-3 md:gap-6 shrink">
                    
                    {/* Display Name Field */}
                    <div className="flex flex-col gap-1 md:gap-2">
                        <label htmlFor="playerName" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-(--text-muted) px-1">
                            {roomIdInput ? 'Join the Arena As' : 'Your Identity'}
                        </label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-(--primary-cyan) transition-colors w-4 h-4 md:w-5 md:h-5" />
                            <input 
                                id="playerName"
                                type="text" 
                                placeholder="Enter Display Name..." 
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && roomIdInput && handleJoinRoom()}
                                aria-label="Enter your display name"
                                className="w-full bg-white/5 border border-white/10 focus:border-(--primary-cyan)/50 outline-none rounded-xl md:rounded-2xl pl-10 md:pl-12 pr-4 py-3 md:py-4 text-white placeholder:text-slate-700 transition-all font-bold text-sm md:text-base"
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
                        className="group flex items-center justify-between px-5 md:px-6 py-3 md:py-5 bg-(--primary-cyan)/10 hover:bg-(--primary-cyan)/20 border border-(--primary-cyan)/30 rounded-xl md:rounded-2xl transition-all"
                    >
                        <div className="flex flex-col items-start gap-0 md:gap-1">
                            <span className="text-white font-black text-base md:text-lg">Start New Game</span>
                            <span className="text-(--text-muted) text-xs md:text-sm">Create a private lobby.</span>
                        </div>
                        {isSearching ? <Loader2 className="animate-spin text-(--primary-cyan) w-5 h-5 md:w-6 md:h-6" /> : <Gamepad2 className="text-(--primary-cyan) group-hover:rotate-12 transition-transform w-5 h-5 md:w-6 md:h-6" />}
                    </motion.button>

                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-px flex-1 bg-white/10"></div>
                        <span className="text-(--accent-purple)/70 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none">Or Face The AI</span>
                        <div className="h-px flex-1 bg-white/10"></div>
                    </div>

                    {/* PvE Action */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={onPlayVSComputer}
                        aria-label="Play against computer offline"
                        className="group flex items-center justify-between px-5 md:px-6 py-3 md:py-5 bg-(--accent-purple)/10 hover:bg-(--accent-purple)/20 border border-(--accent-purple)/30 rounded-xl md:rounded-2xl transition-all"
                    >
                        <div className="flex flex-col items-start gap-0 md:gap-1">
                            <span className="text-white font-black text-base md:text-lg">Cyber Match</span>
                            <span className="text-(--text-muted) text-xs md:text-sm hidden sm:block">Play locally against the Minimax Engine.</span>
                            <span className="text-(--text-muted) text-xs sm:hidden">Minimax Engine.</span>
                        </div>
                        <Cpu className="text-(--accent-purple) group-hover:rotate-12 transition-transform w-5 h-5 md:w-6 md:h-6" />
                    </motion.button>

                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-px flex-1 bg-white/10"></div>
                        <span className="text-(--accent-emerald)/70 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none">Or Match Instantly</span>
                        <div className="h-px flex-1 bg-white/10"></div>
                    </div>

                    {/* Quick Match Action */}
                    <motion.button
                        id="quickMatchBtn"
                        disabled={isSearching || isSearchingMatch || !playerName}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setStatus('Searching for a worthy opponent...');
                            joinMatchmaking();
                        }}
                        aria-label="Find a public player instantly"
                        className={`group flex items-center justify-between px-5 md:px-6 py-3 md:py-5 rounded-xl md:rounded-2xl transition-all border ${
                            isSearchingMatch 
                                ? 'bg-(--accent-emerald)/20 border-(--accent-emerald)/40 animate-pulse' 
                                : 'bg-(--accent-emerald)/10 hover:bg-(--accent-emerald)/20 border-(--accent-emerald)/30'
                        } ${!playerName ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                    >
                        <div className="flex flex-col items-start gap-0 md:gap-1 text-left">
                            <span className="text-white font-black text-base md:text-lg">
                                {isSearchingMatch ? 'Scanning Arena...' : 'Quick Match'}
                            </span>
                            <span className="text-(--text-muted) text-xs md:text-sm">Battle a random player online.</span>
                        </div>
                        {isSearchingMatch ? (
                            <div className="relative">
                                <Loader2 className="animate-spin text-(--accent-emerald) w-5 h-5 md:w-6 md:h-6" />
                                <div className="absolute inset-0 bg-(--accent-emerald) blur-md opacity-30 animate-pulse" />
                            </div>
                        ) : (
                            <Sparkles className="text-(--accent-emerald) group-hover:rotate-12 transition-transform w-5 h-5 md:w-6 md:h-6" />
                        )}
                    </motion.button>

                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-px flex-1 bg-white/10"></div>
                        <span className="text-(--text-muted) text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none">Or Join</span>
                        <div className="h-px flex-1 bg-white/10"></div>
                    </div>

                    {/* Join Room Action */}
                    <div className="flex flex-col gap-2 md:gap-3">
                        <div className="relative group">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted) group-focus-within:text-(--primary-cyan) transition-colors w-4 h-4 md:w-5 md:h-5" />
                            <input 
                                id="roomCodeInput"
                                type="text" 
                                placeholder="Enter Room Code..." 
                                value={roomIdInput}
                                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                                aria-label="Enter unique 6-digit room code to join"
                                className="w-full bg-white/5 border border-white/10 focus:border-(--primary-cyan)/50 outline-none rounded-xl md:rounded-2xl pl-10 md:pl-12 pr-4 py-3 md:py-4 text-white placeholder:text-slate-600 transition-all font-mono text-sm md:text-base"
                            />
                        </div>
                        <motion.button
                            id="joinRoomBtn"
                            disabled={!roomIdInput || isSearching}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleJoinRoom}
                            aria-label="Join an existing game room with code"
                            className={`flex items-center justify-center gap-2 w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-black transition-all shadow-lg text-sm md:text-base ${
                                !roomIdInput ? 'bg-slate-800 text-(--text-muted) cursor-not-allowed opacity-50' : 'bg-white text-slate-900 hover:bg-slate-100 shadow-white/10'
                            }`}
                        >
                            Join Game <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                        </motion.button>
                    </div>

                    {status && (
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-xs md:text-sm font-medium text-(--primary-cyan) bg-(--primary-cyan)/5 py-1.5 md:py-2 rounded-lg"
                        >
                            {status}
                        </motion.p>
                    )}
                </div>

                <div className="mt-4 md:mt-8 text-center shrink-0">
                    <p className="text-(--text-muted) text-[10px] md:text-sm">
                        Built with <span className="text-(--primary-cyan) font-mono">Pusher</span> • <span className="text-(--secondary-pink) font-mono">React</span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LandingPage;
