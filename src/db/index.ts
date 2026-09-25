import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Connect lazily (on first query) instead of at module import time.
// Next.js imports this module while collecting build metadata even for
// dynamic routes, so connecting eagerly here would crash the production
// build whenever DATABASE_URL isn't visible at build time.
let cached: NeonHttpDatabase<typeof schema> | null = null;

function getDb(): NeonHttpDatabase<typeof schema> {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Add it in Vercel: Project Settings -> Environment Variables (it should be added automatically when you connect Neon), or in your local .env file."
      );
    }
    cached = drizzle(neon(url), { schema });
  }
  return cached;
}

export const db: NeonHttpDatabase<typeof schema> = new Proxy(
  {} as NeonHttpDatabase<typeof schema>,
  {
    get(_target, prop, receiver) {
      return Reflect.get(getDb(), prop, receiver);
    },
  }
);
