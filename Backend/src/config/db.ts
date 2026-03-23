import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tic-tac-toe';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    return;
  }

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    isConnected = true;
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('🍃 MongoDB Connected! 🚀');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    throw err;
  }
};
