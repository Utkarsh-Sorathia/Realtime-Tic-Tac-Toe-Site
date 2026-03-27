import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import axios from 'axios';

const EMOJIS = ['😠', '😂', '🔥', '💀', '🏆', '👑'];

interface Reaction {
  id: number;
  emoji: string;
  sender: string;
}

/**
 * Optimized Emoji Button component for performance
 */
const EmojiButton = React.memo(({ 
  emoji, 
  onClick, 
  disabled 
}: { 
  emoji: string, 
  onClick: (e: string) => void, 
  disabled: boolean 
}) => (
  <button
    onClick={() => onClick(emoji)}
    disabled={disabled}
    className={`
      text-2xl sm:text-3xl p-2 rounded-xl transition-all duration-300
      ${disabled ? 'opacity-40 grayscale scale-95' : 'hover:scale-125 hover:bg-slate-700/50 active:scale-90'}
    `}
  >
    {emoji}
  </button>
));

const EmojiReactions: React.FC = () => {
  const { roomId, playerName, pusherChannel } = useGame();
  const [activeReactions, setActiveReactions] = useState<Reaction[]>([]);
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    if (!pusherChannel) return;

    // Listen for incoming emoji reactions
    pusherChannel.bind('emoji-reaction', (data: { playerName: string; emoji: string }) => {
      const newReaction = {
        id: Date.now(),
        emoji: data.emoji,
        sender: data.playerName
      };
      
      setActiveReactions(prev => [...prev.slice(-10), newReaction]); // Keep only last 10
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        setActiveReactions(prev => prev.filter(r => r.id !== newReaction.id));
      }, 3000);
    });

    return () => {
      pusherChannel.unbind('emoji-reaction');
    };
  }, [pusherChannel]);

  const sendEmoji = React.useCallback(async (emoji: string) => {
    if (cooldown || !roomId || !playerName) return;

    setCooldown(true);
    setTimeout(() => setCooldown(false), 2000); // 2-second cooldown

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.post(`${apiUrl}/reaction/${roomId}/emoji`, {
        playerName,
        emoji
      });
    } catch (err) {
      console.error('Failed to send emoji:', err);
    }
  }, [cooldown, roomId, playerName]);

  return (
    <>
      {/* Floating Reactions Layer */}
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
        <AnimatePresence>
          {activeReactions.map((reaction) => (
            <motion.div
              key={reaction.id}
              initial={{ y: 200, x: reaction.sender === playerName ? -100 : 100, opacity: 0, scale: 0.5 }}
              animate={{ 
                y: -300, 
                x: reaction.sender === playerName ? -120 : 120, 
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.5, 1.5, 1],
                rotate: reaction.sender === playerName ? -15 : 15
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="absolute text-5xl sm:text-7xl filter drop-shadow-2xl"
            >
              {reaction.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Emoji Picker Bar */}
      <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6 bg-slate-800/40 p-2 rounded-2xl backdrop-blur-md border border-slate-700/50">
        {EMOJIS.map((emoji) => (
          <EmojiButton
            key={emoji}
            emoji={emoji}
            onClick={sendEmoji}
            disabled={cooldown}
          />
        ))}
      </div>
    </>
  );
};

export default EmojiReactions;
