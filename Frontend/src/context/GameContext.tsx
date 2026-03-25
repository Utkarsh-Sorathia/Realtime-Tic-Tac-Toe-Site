import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { GameState, Player } from '../types/game';
import { subscribeToGame } from '../services/pusher';
import { roomService } from '../services/api';

/**
 * Interface for our global Game State manager.
 */
interface GameContextType {
  gameState: GameState | null;
  playerSide: Player | null;
  roomId: string | null;
  playerName: string;
  isSearching: boolean;
  setPlayerName: (name: string) => void;
  createGame: () => Promise<void>;
  joinGame: (id: string) => Promise<void>;
  updateGameLocally: (newState: GameState) => void;
  leaveRoom: () => Promise<void>;
  refreshRoom: () => Promise<void>;
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

  /**
   * 📡 REAL-TIME SYNC: Setup Pusher exactly once whenever roomId changes.
   */
  useEffect(() => {
    if (roomId) {
      console.log(`📡 Subscribing to Pusher: game-${roomId}`);
      const unsubscribe = subscribeToGame(roomId, (updatedGame: GameState) => {
        console.log('⚡ Real-time update:', updatedGame);
        setGameState(updatedGame);
      });

      // Fetch immediate baseline state
      refreshRoom();

      // Delayed fetch to ensure no web-socket handshake events were missed
      const timeoutId = setTimeout(() => {
        console.log('🔄 Delayed handshake sync...');
        refreshRoom();
      }, 1500);

      // (Note: Removed continuous interval polling to trust Pusher strictly)

      return () => {
        clearTimeout(timeoutId);
        console.log(`🔌 Unsubscribing from game-${roomId}`);
        unsubscribe();
      };
    }
  }, [roomId]);

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

  const joinGame = async (id: string) => {
    setIsSearching(true);
    try {
      const res = await roomService.joinRoom(id, playerName);
      if (res.success && res.game && res.assignedSide) {
        setGameState(res.game);
        setRoomId(id);
        setPlayerSide(res.assignedSide);

        localStorage.setItem(STORAGE_KEY_ROOM, id);
        localStorage.setItem(STORAGE_KEY_SIDE, res.assignedSide);
      }
    } finally {
      setIsSearching(false);
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
        setPlayerName,
        createGame, 
        joinGame,
        updateGameLocally,
        leaveRoom,
        refreshRoom
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
