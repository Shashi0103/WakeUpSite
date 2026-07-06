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
        const isStreamlit = site.website_url.includes('.streamlit.app');
        const browserlessToken = process.env.BROWSERLESS_TOKEN;

        if (isStreamlit && browserlessToken) {
          console.log(`[Cron Job] Waking up Streamlit app: ${site.website_name} (${site.website_url}) via Browserless...`);
          try {
            const browserlessUrl = `https://chrome.browserless.io/run?token=${browserlessToken}`;
            const response = await fetch(browserlessUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: `
                  module.exports = async ({ page }) => {
                    await page.goto('${site.website_url}', { waitUntil: 'networkidle2', timeout: 30000 });
                    
                    const wakeButton = await page.evaluateHandle(() => {
                      const buttons = Array.from(document.querySelectorAll('button'));
                      return buttons.find(b => b.textContent && b.textContent.includes('get this app back up'));
                    });
                    
                    const element = await wakeButton.asElement();
                    if (element) {
                      console.log('Streamlit app is asleep. Clicking wake up button...');
                      await element.click();
                      try {
                        await page.waitForSelector('.stApp', { timeout: 50000 });
                        console.log('Streamlit app loaded successfully.');
                      } catch (e) {
                        console.log('Timeout waiting for Streamlit container to load.');
                      }
                    } else {
                      console.log('Streamlit app is already awake.');
                    }
                  };
                `
              })
            });

            if (!response.ok) {
              const errText = await response.text();
              throw new Error(`Browserless API returned status ${response.status}: ${errText}`);
            }

            const resData = await response.json();
            console.log(`[Cron Job] Browserless response logs:`, resData.logs || 'No logs');

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

            return { site: site.website_name, status: 'woken', success: true };
          } catch (err: any) {
            console.error(`[Cron Job] Browserless wake up failed for ${site.website_name}:`, err.message);
            return await standardPing(site);
          }
        } else {
          if (isStreamlit && !browserlessToken) {
            console.warn(`[Cron Job] Streamlit app ${site.website_name} detected, but BROWSERLESS_TOKEN is not configured. Falling back to HTTP ping.`);
          }
          return await standardPing(site);
        }

        async function standardPing(siteRecord: typeof site) {
          console.log(`[Cron Job] Sending standard HTTP ping to ${siteRecord.website_name} (${siteRecord.website_url})...`);
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for ping

            const res = await fetch(siteRecord.website_url, {
              method: 'GET',
              headers: { 'User-Agent': 'WakeUpSite-Ping-Bot/1.0' },
              redirect: 'manual',
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            const nextPing = new Date(Date.now() + siteRecord.schedule_minutes * 60 * 1000);

            if (isMock) {
              await mockDb.updateWebsite(siteRecord.id, {
                last_ping_at: new Date().toISOString(),
                next_ping_at: nextPing.toISOString(),
              });
            } else {
              await db.website.update({
                where: { id: siteRecord.id },
                data: {
                  last_ping_at: new Date(),
                  next_ping_at: nextPing,
                },
              });
            }

            return { site: siteRecord.website_name, status: res.status, success: true };
          } catch (err: any) {
            console.error(`[Cron Job] Ping failed for ${siteRecord.website_name}:`, err.message);
            const nextPing = new Date(Date.now() + siteRecord.schedule_minutes * 60 * 1000);

            if (isMock) {
              await mockDb.updateWebsite(siteRecord.id, {
                last_ping_at: new Date().toISOString(),
                next_ping_at: nextPing.toISOString(),
              });
            } else {
              await db.website.update({
                where: { id: siteRecord.id },
                data: {
                  last_ping_at: new Date(),
                  next_ping_at: nextPing,
                },
              });
            }

            return { site: siteRecord.website_name, error: err.message, success: false };
          }
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
