import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 🍃 REDIS CONFIGURATION (Upstash REST API)
 * Using the REST API for optimal performance on Vercel/Serverless.
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

export default redis;
