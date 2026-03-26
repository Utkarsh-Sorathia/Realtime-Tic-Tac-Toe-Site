import axios from 'axios';

// Base API setup for our Backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.1.20:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const roomService = {
  createRoom: async (playerName?: string) => {
    const response = await api.post('/room/create', { playerName });
    return response.data;
  },
  
  joinRoom: async (roomId: string, playerName?: string) => {
    const response = await api.post(`/room/join/${roomId}`, { playerName });
    return response.data;
  },
  
  getRoomStatus: async (roomId: string) => {
    const response = await api.get(`/room/${roomId}`);
    return response.data;
  },

  makeMove: async (roomId: string, index: number, player: 'X' | 'O') => {
    const response = await api.post(`/room/${roomId}/move`, { index, player });
    return response.data;
  },

  rematch: async (roomId: string) => {
    const response = await api.post(`/room/${roomId}/rematch`);
    return response.data;
  },

  leaveRoom: async (roomId: string, player: 'X' | 'O', isForfeit = false) => {
    const response = await api.post(`/room/${roomId}/leave`, { player, isForfeit });
    return response.data;
  }
};

export default api;
