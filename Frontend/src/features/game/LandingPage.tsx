import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Users, Loader2, User, Cpu, Sparkles } from 'lucide-react';
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
            // 🧹 Immediately strip the ?room= param from the URL so it stays clean
            setSearchParams({}, { replace: true });
        }
    }, []); // Only run on mount

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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md z-10 flex flex-col h-full md:max-h-[90vh] justify-center"
            >
                <div className="text-center mb-6 shrink-0">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex p-3 rounded-2xl bg-(--primary-cyan)/10 border border-(--primary-cyan)/20 mb-4"
                    >
                        <Gamepad2 className="text-(--primary-cyan) w-8 h-8 md:w-10 md:h-10" />
                    </motion.div>
                    <h1 className="text-3xl md:text-5xl font-black bg-linear-to-r from-(--primary-cyan) via-white to-(--secondary-pink) bg-clip-text text-transparent mb-1 md:mb-2 tracking-tight">
                        Tic Tac Toe
                    </h1>
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-(--accent-emerald)/10 border border-(--accent-emerald)/20 px-3 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 bg-(--accent-emerald) rounded-full animate-pulse shadow-[0_0_6px_var(--accent-emerald)]" />
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

                <div className="bg-(--surface-bg) backdrop-blur-xl border border-(--surface-border) p-4 md:p-6 rounded-3xl shadow-2xl flex flex-col gap-4 shrink">
                    
                    {/* Display Name Field */}
                    <div className="flex flex-col gap-1.5">
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
                                className="w-full bg-white/5 border border-white/10 focus:border-(--primary-cyan)/50 outline-none rounded-xl pl-10 md:pl-12 pr-4 py-3 text-white placeholder:text-slate-700 transition-all font-bold text-sm md:text-base"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Create Room Action */}
                        <motion.button
                            id="createRoomBtn"
                            disabled={isSearching}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCreateRoom}
                            aria-label="Create a new private game room"
                            className="group flex flex-col items-center justify-center p-3 bg-(--primary-cyan)/10 hover:bg-(--primary-cyan)/20 border border-(--primary-cyan)/30 rounded-xl transition-all aspect-square sm:aspect-auto sm:py-4"
                        >
                            <Gamepad2 className="text-(--primary-cyan) mb-2 w-5 h-5 md:w-6 md:h-6" />
                            <span className="text-white font-black text-xs md:text-sm uppercase tracking-tighter">Start Lobby</span>
                            <span className="text-(--text-muted) text-[8px] md:text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Private Room</span>
                        </motion.button>

                        {/* PvE Action */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={onPlayVSComputer}
                            aria-label="Play against computer offline"
                            className="group flex flex-col items-center justify-center p-3 bg-(--accent-purple)/10 hover:bg-(--accent-purple)/20 border border-(--accent-purple)/30 rounded-xl transition-all aspect-square sm:aspect-auto sm:py-4"
                        >
                            <Cpu className="text-(--accent-purple) mb-2 w-5 h-5 md:w-6 md:h-6" />
                            <span className="text-white font-black text-xs md:text-sm uppercase tracking-tighter">Cyber Match</span>
                            <span className="text-(--text-muted) text-[8px] md:text-[10px] uppercase font-bold tracking-[0.2em] mt-1">VS Robot</span>
                        </motion.button>
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
                        className={`group flex items-center justify-between px-5 py-3 rounded-xl transition-all border ${
                            isSearchingMatch 
                                ? 'bg-(--accent-emerald)/20 border-(--accent-emerald)/40 animate-pulse' 
                                : 'bg-(--accent-emerald)/10 hover:bg-(--accent-emerald)/20 border border-(--accent-emerald)/30'
                        } ${!playerName ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <Sparkles className="text-(--accent-emerald) w-5 h-5" />
                            <div className="flex flex-col items-start text-left">
                                <span className="text-white font-black text-sm md:text-base uppercase tracking-tight">
                                    {isSearchingMatch ? 'Scanning Arena...' : 'Quick Match'}
                                </span>
                                {!isSearchingMatch && <span className="text-(--accent-emerald) text-[9px] uppercase font-black tracking-widest leading-none mt-1">Auto-Match</span>}
                            </div>
                        </div>
                        {isSearchingMatch && <Loader2 className="animate-spin text-(--accent-emerald) w-4 h-4" />}
                    </motion.button>

                    <div className="h-px w-full bg-white/5" />

                    {/* Join Room Action */}
                    <div className="flex gap-2">
                        <div className="relative group flex-1">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted) group-focus-within:text-(--primary-cyan) transition-colors w-4 h-4" />
                            <input 
                                id="roomCodeInput"
                                type="text" 
                                placeholder="Room Code..." 
                                value={roomIdInput}
                                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                                aria-label="Enter unique 6-digit room code to join"
                                className="w-full bg-white/5 border border-white/10 focus:border-(--primary-cyan)/50 outline-none rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 transition-all font-mono text-sm"
                            />
                        </div>
                        <motion.button
                            id="joinRoomBtn"
                            disabled={!roomIdInput || isSearching}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleJoinRoom}
                            aria-label="Join an existing game room with code"
                            className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl font-black transition-all text-xs md:text-sm uppercase tracking-tight ${
                                !roomIdInput ? 'bg-slate-800 text-(--text-muted) cursor-not-allowed opacity-50' : 'bg-white text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <span>Join</span>
                            <span className="text-[7px] uppercase opacity-50 font-black tracking-widest leading-none mt-0.5">Enter</span>
                        </motion.button>
                    </div>

                    {status && (
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-[10px] md:text-xs font-medium text-(--primary-cyan) bg-(--primary-cyan)/5 py-1.5 rounded-lg"
                        >
                            {status}
                        </motion.p>
                    )}
                </div>

                <div className="mt-8 text-center shrink-0">
                    <p className="text-(--text-muted) text-[10px] md:text-xs opacity-50">
                        Built with <span className="text-(--primary-cyan) font-mono">Pusher</span> • <span className="text-(--secondary-pink) font-mono">React</span>
                    </p>
                </div>
            </motion.div>

            {/* Premium Floating Developer Badge */}
            <motion.a 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                href="https://utkarshsorathia.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 group flex items-center gap-3 bg-(--surface-bg) backdrop-blur-xl border border-white/5 p-1.5 pr-5 rounded-full shadow-2xl hover:border-(--primary-cyan)/30 hover:bg-white/5 transition-all active:scale-95 cursor-pointer pointer-events-auto"
            >
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-(--primary-cyan) to-(--accent-purple) p-[1.5px] group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-500">
                    <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                        <span className="text-[10px] font-black text-white italic tracking-tighter">US</span>
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] text-cyan-400/40 group-hover:text-cyan-400 transition-colors">Designed & Developed by</span>
                    <span className="text-[11px] md:text-xs font-black uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">Utkarsh Sorathia</span>
                </div>
            </motion.a>
        </div>
    );
};

export default LandingPage;
