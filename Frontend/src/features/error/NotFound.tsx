import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, ChevronLeft, Ghost, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Premium 404 "Lost in Arena" Page
 * Uses the Combat Zone design language with a "glitched" battlefield theme.
 */
const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="h-dvh bg-(--site-bg) text-white flex flex-col items-center p-6 relative overflow-hidden font-sans">
            {/* Background Orbs with a "Glitchy" Color Palette (broken red/orange) */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 md:w-[600px] h-96 md:h-[600px] bg-(--accent-red)/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute top-20 right-20 w-64 md:w-96 h-64 md:h-96 bg-(--accent-orange)/10 rounded-full blur-[80px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md z-10 flex flex-col items-center justify-center h-full text-center"
            >
                {/* Visual Icon with "Broken" effect */}
                <div className="relative mb-8">
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.05, 1],
                            rotate: [0, -5, 5, 0],
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="p-6 rounded-3xl bg-white/5 border-2 border-(--accent-red)/30 backdrop-blur-xl shadow-[0_0_40px_rgba(239,68,68,0.2)]"
                    >
                        <Ghost className="w-16 h-16 md:w-20 md:h-20 text-(--accent-red)" />
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="absolute -bottom-2 -right-2 p-3 rounded-full bg-slate-950 border border-white/10"
                    >
                        <RefreshCw className="w-6 h-6 text-(--accent-orange) animate-spin" />
                    </motion.div>
                </div>

                <div className="space-y-4 mb-10">
                    <div className="relative inline-block">
                        <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter text-white opacity-10 blur-[2px] absolute inset-0 select-none">
                            404
                        </h1>
                        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter bg-linear-to-b from-white to-(--accent-red) bg-clip-text text-transparent relative">
                            CODE 404
                        </h1>
                    </div>
                    
                    <div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-[0.2em] mb-2 text-white italic">
                            LOST IN THE <span className="text-(--accent-red)">ARENA</span>
                        </h2>
                        <p className="text-(--text-muted) text-xs md:text-sm font-bold uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto">
                            This battlefield doesn't exist. Maybe the room was destroyed in combat?
                        </p>
                    </div>
                </div>

                {/* Tactical Actions */}
                <div className="w-full space-y-3">
                    <motion.button
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/')}
                        className="w-full bg-white text-slate-950 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 text-sm md:text-base group"
                    >
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        RETURN TO HQ
                    </motion.button>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all text-(--text-muted) hover:text-white text-xs md:text-sm tracking-widest uppercase"
                    >
                        REFRESH SENSORS
                        <RefreshCw className="w-4 h-4 opacity-50" />
                    </button>
                </div>

                {/* Footer Namespace */}
                <div className="mt-16 flex items-center gap-3 opacity-30 grayscale pointer-events-none">
                    <Gamepad2 size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Combat Zone Protocol </span>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;
