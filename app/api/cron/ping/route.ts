import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockDb } from '@/lib/db-mock';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const querySecret = searchParams.get('secret');
    const authHeader = req.headers.get('authorization');
    const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    const configuredSecret = process.env.CRON_SECRET;

    // Secure endpoint in production by enforcing a secret token check
    if (configuredSecret) {
      if (querySecret !== configuredSecret && bearerSecret !== configuredSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const now = new Date();
    let dueWebsites: any[] = [];
    const isMock = mockDb.isMock();

    if (isMock) {
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
        const websitesList = (dbData.websites || []) as any[];
        dueWebsites = websitesList.filter(
          (w) => w.enabled && (!w.next_ping_at || new Date(w.next_ping_at) <= now)
        );
      }
    } else {
      dueWebsites = await db.website.findMany({
        where: {
          enabled: true,
          OR: [
            { next_ping_at: null },
            { next_ping_at: { lte: now } },
          ],
        },
      });
    }

    if (dueWebsites.length === 0) {
      return NextResponse.json({ message: 'No websites due for ping' }, { status: 200 });
    }

    // Ping all due websites concurrently
    const results = await Promise.allSettled(
      dueWebsites.map(async (site) => {
        console.log(`[Cron Job] Pinging ${site.website_name} (${site.website_url})...`);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for ping

          const res = await fetch(site.website_url, {
            method: 'GET',
            headers: { 'User-Agent': 'WakeUpSite-Ping-Bot/1.0' },
            redirect: 'manual',
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const nextPing = new Date(Date.now() + site.schedule_minutes * 60 * 1000);

          if (isMock) {
            await mockDb.updateWebsite(site.id, {
              last_ping_at: new Date().toISOString(),
              next_ping_at: nextPing.toISOString(),
            });
          } else {
            await db.website.update({
              where: { id: site.id },
              data: {
                last_ping_at: new Date(),
                next_ping_at: nextPing,
              },
            });
          }

          return { site: site.website_name, status: res.status, success: true };
        } catch (err: any) {
          console.error(`[Cron Job] Ping failed for ${site.website_name}:`, err.message);
          const nextPing = new Date(Date.now() + site.schedule_minutes * 60 * 1000);

          if (isMock) {
            await mockDb.updateWebsite(site.id, {
              last_ping_at: new Date().toISOString(),
              next_ping_at: nextPing.toISOString(),
            });
          } else {
            await db.website.update({
              where: { id: site.id },
              data: {
                last_ping_at: new Date(),
                next_ping_at: nextPing,
              },
            });
          }

          return { site: site.website_name, error: err.message, success: false };
        }
      })
    );

    return NextResponse.json(
      { message: `Processed ${dueWebsites.length} websites`, results },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error running cron:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
