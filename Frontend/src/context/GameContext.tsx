import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { GameState, Player } from '../types/game';
import { subscribeToGame, setPlayerContext, pusherClient } from '../services/pusher';
import { roomService, matchService } from '../services/api';

/**
 * Interface for our global Game State manager.
 */
interface GameContextType {
  gameState: GameState | null;
  playerSide: Player | null;
  roomId: string | null;
  playerName: string;
  isSearching: boolean;
  isSearchingMatch: boolean;
  opponentDisconnected: boolean;
  opponentForfeit: boolean;
  setPlayerName: (name: string) => void;
  createGame: () => Promise<void>;
  joinGame: (id: string, side?: Player) => Promise<void>;
  joinMatchmaking: () => Promise<void>;
  updateGameLocally: (newState: GameState) => void;
  leaveRoom: () => Promise<void>;
  refreshRoom: () => Promise<void>;
  pusherChannel: any | null; // The low-level Pusher channel for custom events
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Storage keys for persistence
const STORAGE_KEY_ROOM = 'tic_tac_toe_roomId';
const STORAGE_KEY_SIDE = 'tic_tac_toe_playerSide';
const STORAGE_KEY_NAME = 'tic_tac_toe_playerName';

/**
 * Provider component that wraps our app and gives access to game state.
 */
export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerSide, setPlayerSide] = useState<Player | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerName, setPlayerNameState] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [opponentForfeit, setOpponentForfeit] = useState(false);
  const [pusherChannel, setPusherChannel] = useState<any | null>(null);
  const evictionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameStateRef = useRef<GameState | null>(null);

  // Sync ref with state for use in Pusher closures
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  /**
   * 🔄 ON MOUNT: Check for an existing session in local storage.
   */
  useEffect(() => {
    const savedRoomId = localStorage.getItem(STORAGE_KEY_ROOM);
    const savedSide = localStorage.getItem(STORAGE_KEY_SIDE) as Player | null;
    const savedName = localStorage.getItem(STORAGE_KEY_NAME);

    if (savedName) setPlayerNameState(savedName);
    
    if (savedRoomId && savedSide) {
      console.log(`🏠 Restoring session: Room ${savedRoomId} as Side ${savedSide}`);
      setRoomId(savedRoomId);
      setPlayerSide(savedSide);
    }
  }, []);

  /**
   * Internal setter that also persists to localStorage
   */
  const setPlayerName = (name: string) => {
      setPlayerNameState(name);
      localStorage.setItem(STORAGE_KEY_NAME, name);
  };

  const disconnectGraceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 📡 REAL-TIME SYNC: Setup Pusher exactly once whenever roomId changes.
   */
  useEffect(() => {
    if (roomId && playerName && playerSide) {
      console.log(`📡 Subscribing to Pusher presence channel: presence-game-${roomId}`);
      
      // Set player context BEFORE subscribing so the authorizer handshake has correct data
      setPlayerContext(playerName, playerSide);

      const { unsubscribe, channel } = subscribeToGame(
        roomId,
        (updatedGame: GameState) => {
          console.log('⚡ Real-time update:', updatedGame);
          setGameState(updatedGame);
        },
        () => {
          // 👻 Opponent's socket dropped — start grace period check
          console.log('👻 Socket dropped. Checking intent...');

          // Clear any existing handshakes
          if (disconnectGraceRef.current) clearTimeout(disconnectGraceRef.current);

          disconnectGraceRef.current = setTimeout(() => {
              const opponentSide: Player = playerSide === 'X' ? 'O' : 'X';
              const latestPlayers = gameStateRef.current?.players;
              
              // Only trigger if the opponent is actually still in the game data (indicates crash, not exit)
              if (latestPlayers && latestPlayers[opponentSide]) {
                  console.log('🚨 Unexpected disconnect. Starting 10s grace...');
                  setOpponentDisconnected(true);

                  if (evictionTimerRef.current) clearTimeout(evictionTimerRef.current);

                  evictionTimerRef.current = setTimeout(async () => {
                    console.log('⏰ Expiry. Awarding forfeit...');
                    setOpponentForfeit(true);

                    setTimeout(async () => {
                      try {
                        await roomService.leaveRoom(roomId, opponentSide, true);
                      } catch (err) {
                        refreshRoom();
                      }
                      setOpponentDisconnected(false);
                      setOpponentForfeit(false);
                      evictionTimerRef.current = null;
                    }, 3500);
                  }, 10000);
              }
          }, 1500); // 1.5s baseline for broadcast arrival
        },
        () => {
          // ✅ Opponent reconnected within grace period — cancel ALL pending timers
          console.log('✅ Reconnected! Cancelling all timers.');
          
          if (disconnectGraceRef.current) {
            clearTimeout(disconnectGraceRef.current);
            disconnectGraceRef.current = null;
          }
          if (evictionTimerRef.current) {
            clearTimeout(evictionTimerRef.current);
            evictionTimerRef.current = null;
          }
          setOpponentDisconnected(false);
        }
      );

      setPusherChannel(channel);

      // Fetch immediate baseline state
      refreshRoom();

      const timeoutId = setTimeout(() => {
        console.log('🔄 Delayed handshake sync...');
        refreshRoom();
      }, 1500);

      return () => {
        clearTimeout(timeoutId);
        if (evictionTimerRef.current) clearTimeout(evictionTimerRef.current);
        console.log(`🔌 Unsubscribing from game-${roomId}`);
        if (unsubscribe) unsubscribe();
        setPusherChannel(null);
      };
    }
  }, [roomId, playerName, playerSide]);

  // No sendBeacon needed — presence channel handles disconnect detection natively

  const createGame = async () => {
    setIsSearching(true);
    try {
      const res = await roomService.createRoom(playerName);
      if (res.success && res.game) {
        const id = res.game.roomId;
        setGameState(res.game);
        setRoomId(id);
        setPlayerSide('X');
        
        localStorage.setItem(STORAGE_KEY_ROOM, id);
        localStorage.setItem(STORAGE_KEY_SIDE, 'X');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const joinGame = async (id: string, side?: Player) => {
    setIsSearching(true);
    try {
      const res = await roomService.joinRoom(id, playerName);
      if (res.success && res.game) {
        setGameState(res.game);
        setRoomId(id);
        const finalSide = side || res.assignedSide;
        if (finalSide) {
          setPlayerSide(finalSide);
          localStorage.setItem(STORAGE_KEY_ROOM, id);
          localStorage.setItem(STORAGE_KEY_SIDE, finalSide);
        }
      }
    } finally {
      setIsSearching(false);
    }
  };

  const joinMatchmaking = async () => {
    if (!playerName) return;
    setIsSearchingMatch(true);

    const socketId = pusherClient.connection.socket_id;
    if (!socketId) {
        console.error('Pusher not connected');
        setIsSearchingMatch(false);
        return;
    }

    // Subscribe to our own private channel for match notification
    const personalChannel = pusherClient.subscribe(`private-notification-${socketId}`);
    
    personalChannel.bind('match-found', async (data: { roomId: string, side: Player }) => {
        console.log('🎯 Match found!', data);
        await joinGame(data.roomId, data.side);
        setIsSearchingMatch(false);
        personalChannel.unbind_all();
        pusherClient.unsubscribe(`private-notification-${socketId}`);
    });

    try {
        await matchService.joinQueue(playerName, socketId);
    } catch (err) {
        console.error('Matchmaking join failed:', err);
        setIsSearchingMatch(false);
    }
  };

  const leaveRoom = async () => {
    if (roomId && playerSide) {
        try {
            await roomService.leaveRoom(roomId, playerSide);
        } catch (err) {
            console.error("Error notifying backend of departure:", err);
        }
    }
    
    setGameState(null);
    setRoomId(null);
    setPlayerSide(null);
    
    localStorage.removeItem(STORAGE_KEY_ROOM);
    localStorage.removeItem(STORAGE_KEY_SIDE);
  };

  const refreshRoom = async () => {
    if (!roomId) return;
    try {
      const res = await roomService.getRoomStatus(roomId);
      if (res.success && res.game) {
        setGameState(res.game);
      }
    } catch (err) {
      console.error("Refresh failure:", err);
      if ((err as any).response?.status === 404) {
          // If room gone on server, just clear locally
          setGameState(null);
          setRoomId(null);
          setPlayerSide(null);
          localStorage.removeItem(STORAGE_KEY_ROOM);
          localStorage.removeItem(STORAGE_KEY_SIDE);
      }
    }
  };

  const updateGameLocally = (newState: GameState) => {
      setGameState(newState);
  };

  return (
    <GameContext.Provider value={{ 
        gameState, 
        playerSide, 
        roomId, 
        playerName,
        isSearching,
        opponentDisconnected,
        opponentForfeit,
        setPlayerName,
        createGame, 
        joinGame,
        joinMatchmaking,
        updateGameLocally,
        leaveRoom,
        refreshRoom,
        isSearchingMatch,
        pusherChannel
    }}>
      {children}
    </GameContext.Provider>
  );
};

export default GameContext;

/**
 * Hook to easily consume game state in any component.
 */
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
