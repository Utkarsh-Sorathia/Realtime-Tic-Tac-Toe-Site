import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mongoose from 'mongoose';
import roomRoutes from './routes/roomRoutes.js';
import pusherRoutes from './routes/pusherRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'https://tictactoe-elite.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Required for Pusher auth form-encoded payload

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// API Routes initialization
app.use('/api/room', roomRoutes);
app.use('/api/pusher', pusherRoutes);

// Health check & Showcase endpoint
app.get('/', (req, res) => {
    const uptimeInSeconds = process.uptime();
    const hours = Math.floor(uptimeInSeconds / 3600);
    const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeInSeconds % 60);
    
    res.render('index', { 
        status: 'Systems Online', 
        version: '1.0.0',
        uptime: `${hours}h ${minutes}m ${seconds}s` 
    });
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
