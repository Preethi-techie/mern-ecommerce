//import Redis from "ioredis";
//import dotenv from "dotenv";
//dotenv.config()

//export const redis = new Redis(process.env.UPSTASH_REDIS_URL);
//key-value store 

import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
dotenv.config();

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});
