import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

// Sanitize DATABASE_URL to remove any accidental wrapping quotes
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.trim().replace(/^"/, '').replace(/"$/, '');
}

// Prevent multiple database connections in development hot-reloading
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1')
      ? { rejectUnauthorized: false }
      : undefined,
  });

const adapter = new PrismaPg(pool);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
  globalForPrisma.pool = pool;
}

// -----------------------------------------------------------------------------
// In-Memory Background Ping Worker
// -----------------------------------------------------------------------------
interface MockWebsiteRecord {
  id: string;
  user_id: string;
  website_name: string;
  website_url: string;
  schedule_minutes: number;
  enabled: boolean;
  last_ping_at: string | null;
  next_ping_at: string | null;
  created_at: string;
  updated_at: string;
}

if (typeof window === 'undefined') {
  const globalForWorker = globalThis as unknown as { pingWorkerStarted: boolean | undefined };

  const shouldStartWorker =
    process.env.NODE_ENV !== 'production' ||
    process.env.ENABLE_IN_MEMORY_WORKER === 'true';

  if (!globalForWorker.pingWorkerStarted && shouldStartWorker) {
    globalForWorker.pingWorkerStarted = true;
    console.log("[Worker] Starting lightweight in-memory background website ping scheduler...");

    setInterval(async () => {
      try {
        const isMock =
          process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'placeholder-api-key' ||
          !process.env.DATABASE_URL ||
          process.env.DATABASE_URL.includes('localhost:5432') ||
          process.env.DATABASE_URL.includes('placeholder');

        const now = new Date();

        if (isMock) {
          // Dynamic imports to avoid circular dependency loops during initialization
          const { mockDb } = await import('./db-mock');
          const fs = await import('fs');
          const path = await import('path');
          const mockDbPath = path.join(process.cwd(), 'mock-db.json');

          if (fs.existsSync(mockDbPath)) {
            let dbData = { users: [], websites: [] };
            try {
              dbData = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
            } catch {
              // Ignore parse errors
            }

            const websitesList = (dbData.websites || []) as MockWebsiteRecord[];
            const dueWebsites = websitesList.filter(
              (w) => w.enabled && (!w.next_ping_at || new Date(w.next_ping_at) <= now)
            );

            for (const site of dueWebsites) {
              console.log(`[Mock Worker] Pinging ${site.website_name} (${site.website_url})...`);
              fetch(site.website_url, {
                method: 'GET',
                headers: { 'User-Agent': 'WakeUpSite-Ping-Bot/1.0' },
                redirect: 'manual',
              })
                .then(async (res) => {
                  console.log(`[Mock Worker] Ping returned status ${res.status}`);
                  const nextPing = new Date(Date.now() + site.schedule_minutes * 60 * 1000).toISOString();
                  await mockDb.updateWebsite(site.id, {
                    last_ping_at: new Date().toISOString(),
                    next_ping_at: nextPing,
                  });
                })
                .catch(async (err) => {
                  console.error(`[Mock Worker] Ping failed:`, err.message);
                  const nextPing = new Date(Date.now() + site.schedule_minutes * 60 * 1000).toISOString();
                  await mockDb.updateWebsite(site.id, {
                    last_ping_at: new Date().toISOString(),
                    next_ping_at: nextPing,
                  });
                });
            }
          }
        } else {
          const dueWebsites = await db.website.findMany({
            where: {
              enabled: true,
              next_ping_at: {
                lte: now,
              },
            },
          });

          for (const site of dueWebsites) {
            console.log(`[Worker] Pinging ${site.website_name} (${site.website_url})...`);
            fetch(site.website_url, {
              method: 'GET',
              headers: { 'User-Agent': 'WakeUpSite-Ping-Bot/1.0' },
              redirect: 'manual',
            })
              .then(async (res) => {
                console.log(`[Worker] Ping returned status ${res.status}`);
                const nextPing = new Date(Date.now() + site.schedule_minutes * 60 * 1000);
                await db.website.update({
                  where: { id: site.id },
                  data: {
                    last_ping_at: new Date(),
                    next_ping_at: nextPing,
                  },
                });
              })
              .catch(async (err) => {
                console.error(`[Worker] Ping failed:`, err.message);
                const nextPing = new Date(Date.now() + site.schedule_minutes * 60 * 1000);
                await db.website.update({
                  where: { id: site.id },
                  data: {
                    last_ping_at: new Date(),
                    next_ping_at: nextPing,
                  },
                });
              });
          }
        }
      } catch (err) {
        console.error("[Worker] Error in background worker loop:", err);
      }
    }, 60 * 1000); // Execute every 60 seconds
  }
}
