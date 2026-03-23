import express from 'express';
import { createRoom, joinRoom, getRoomStatus, rematch, leaveRoom } from '../controllers/roomController.js';
import { makeMove } from '../controllers/gameController.js';

const router = express.Router();

// Public routes for room management
router.post('/create', createRoom);
router.get('/:roomId', getRoomStatus);
router.post('/join/:roomId', joinRoom);
router.post('/:roomId/rematch', rematch);
router.post('/:roomId/leave', leaveRoom);

// Game actions
router.post('/:roomId/move', makeMove);

export default router;
