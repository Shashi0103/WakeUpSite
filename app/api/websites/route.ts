import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth-middleware';
import { mockDb } from '@/lib/db-mock';

// Helper function to validate URL
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (mockDb.isMock()) {
      const user = await mockDb.getUserByFirebaseUid(authUser.uid);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const websites = await mockDb.getWebsites(user.id);
      return NextResponse.json({ websites });
    }

    const user = await db.user.findUnique({
      where: { firebase_uid: authUser.uid },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const websites = await db.website.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ websites });
  } catch (error) {
    console.error('Error fetching websites:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (mockDb.isMock()) {
      const user = await mockDb.getUserByFirebaseUid(authUser.uid);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const body = await req.json();
      const { website_name, website_url, schedule_minutes } = body;

      // Validation
      if (!website_name || !website_url || schedule_minutes === undefined) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const trimmedUrl = website_url.trim();
      if (!isValidUrl(trimmedUrl)) {
        return NextResponse.json({ error: 'Please enter a valid URL (starting with http:// or https://)' }, { status: 400 });
      }

      const minutes = parseInt(schedule_minutes, 10);
      if (isNaN(minutes) || minutes < 10 || minutes > 1440) {
        return NextResponse.json({ error: 'Schedule must be between 10 and 1440 minutes for the Free tier.' }, { status: 400 });
      }

      const websites = await mockDb.getWebsites(user.id);
      if (websites.length >= 5) {
        return NextResponse.json({ error: 'Free tier is limited to 5 websites. Upgrade to Pro for unlimited websites!' }, { status: 400 });
      }

      const duplicate = websites.find((w) => w.website_url === trimmedUrl);
      if (duplicate) {
        return NextResponse.json({ error: 'You have already registered this website URL' }, { status: 400 });
      }

      const website = await mockDb.createWebsite(user.id, website_name.trim(), trimmedUrl, minutes);
      return NextResponse.json({ website }, { status: 201 });
    }

    const user = await db.user.findUnique({
      where: { firebase_uid: authUser.uid },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { website_name, website_url, schedule_minutes } = body;

    // Validation
    if (!website_name || !website_url || schedule_minutes === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const trimmedUrl = website_url.trim();

    if (!isValidUrl(trimmedUrl)) {
      return NextResponse.json({ error: 'Please enter a valid URL (starting with http:// or https://)' }, { status: 400 });
    }

    const minutes = parseInt(schedule_minutes, 10);
    const minMinutes = user.is_pro ? 5 : 10;
    if (isNaN(minutes) || minutes < minMinutes || minutes > 1440) {
      return NextResponse.json({ error: `Schedule must be between ${minMinutes} and 1440 minutes.` }, { status: 400 });
    }

    // Check tier limits (Free tier: max 5 websites, Pro tier: unlimited)
    if (!user.is_pro) {
      const count = await db.website.count({
        where: { user_id: user.id },
      });

      if (count >= 5) {
        return NextResponse.json({ error: 'Free tier is limited to 5 websites. Upgrade to Pro for unlimited websites!' }, { status: 400 });
      }
    }

    // Check for duplicates
    const duplicate = await db.website.findUnique({
      where: {
        user_id_website_url: {
          user_id: user.id,
          website_url: trimmedUrl,
        },
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: 'You have already registered this website URL' }, { status: 400 });
    }

    // Compute initial next ping time
    const nextPingAt = new Date(Date.now() + minutes * 60 * 1000);

    const website = await db.website.create({
      data: {
        user_id: user.id,
        website_name: website_name.trim(),
        website_url: trimmedUrl,
        schedule_minutes: minutes,
        enabled: true,
        next_ping_at: nextPingAt,
      },
    });

    return NextResponse.json({ website }, { status: 201 });
  } catch (error) {
    console.error('Error creating website:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
