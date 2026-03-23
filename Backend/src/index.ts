import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mongoose from 'mongoose';
import roomRoutes from './routes/roomRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tic-tac-toe';

// Connect to MongoDB: The source of truth for all games
mongoose.connect(mongoUri)
  .then(() => console.log('🍃 MongoDB Connected! 🚀'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Standard middleware for secure and efficient cross-origin requests
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// API Routes initialization
app.use('/api/room', roomRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('🎮 Real-time Tic Tac Toe API is Online! (MongoDB Active) 🚀');
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong on the server!');
});

app.listen(port, () => {
  console.log(`
  ✅ Server is Online!
  🚀 Port: ${port}
  🌐 API Root: http://localhost:${port}/api
  `);
});

export default app;
