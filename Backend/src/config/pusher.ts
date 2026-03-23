import Pusher from 'pusher';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configure Pusher client for real-time broadcasts.
 */
export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.PUSHER_CLUSTER || "ap2",
  useTLS: true
});

// Helper for broadcasting game events
export const broadcastGameUpdate = async (roomId: string, data: any) => {
  try {
    await pusher.trigger(`game-${roomId}`, 'game-updated', data);
  } catch (error) {
    console.error(`❌ Pusher Error on game-${roomId}:`, error);
  }
};
