import { Router } from 'express';
import { joinQueue, leaveQueue } from '../controllers/matchController.js';

const router = Router();

/**
 * 🎯 GLOBAL MATCHMAKING: Pair strangers using Upstash Redis.
 * This is stateless and safe for Vercel/Serverless deployment. 🚀🛡️
 */
router.post('/join', joinQueue);
router.post('/leave', leaveQueue);

export default router;
