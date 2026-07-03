import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth-middleware';
import { mockDb } from '@/lib/db-mock';

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (mockDb.isMock()) {
      const user = await mockDb.getUserByFirebaseUid(authUser.uid);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const website = await mockDb.getWebsite(id);
      if (!website || website.user_id !== user.id) {
        return NextResponse.json({ error: 'Website not found' }, { status: 404 });
      }

      const body = await req.json();
      const { website_name, website_url, schedule_minutes, enabled } = body;

      const updateData: any = {};

      if (website_name !== undefined) {
        updateData.website_name = website_name.trim();
      }

      if (website_url !== undefined) {
        const trimmedUrl = website_url.trim();
        if (trimmedUrl !== website.website_url) {
          if (!isValidUrl(trimmedUrl)) {
            return NextResponse.json({ error: 'Please enter a valid URL (starting with http:// or https://)' }, { status: 400 });
          }

          // Check for duplicates
          const websites = await mockDb.getWebsites(user.id);
          const duplicate = websites.find((w) => w.website_url === trimmedUrl && w.id !== id);
          if (duplicate) {
            return NextResponse.json({ error: 'You have already registered this website URL' }, { status: 400 });
          }

          updateData.website_url = trimmedUrl;
        }
      }

      if (schedule_minutes !== undefined) {
        const minutes = parseInt(schedule_minutes, 10);
        if (isNaN(minutes) || minutes < 15 || minutes > 1440) {
          return NextResponse.json({ error: 'Schedule must be between 15 and 1440 minutes for the Free tier.' }, { status: 400 });
        }
        updateData.schedule_minutes = minutes;
      }

      if (enabled !== undefined) {
        updateData.enabled = Boolean(enabled);
      }

      const currentEnabled = enabled !== undefined ? Boolean(enabled) : website.enabled;
      const currentMinutes = schedule_minutes !== undefined ? parseInt(schedule_minutes, 10) : website.schedule_minutes;

      if (
        (enabled !== undefined && enabled && !website.enabled) ||
        (schedule_minutes !== undefined && currentMinutes !== website.schedule_minutes) ||
        (website_url !== undefined && website_url.trim() !== website.website_url)
      ) {
        updateData.next_ping_at = new Date(Date.now() + currentMinutes * 60 * 1000).toISOString();
      } else if (enabled !== undefined && !enabled) {
        updateData.next_ping_at = null;
      }

      const updatedWebsite = await mockDb.updateWebsite(id, updateData);
      return NextResponse.json({ website: updatedWebsite });
    }

    const user = await db.user.findUnique({
      where: { firebase_uid: authUser.uid },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const website = await db.website.findUnique({
      where: { id },
    });

    if (!website || website.user_id !== user.id) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    const body = await req.json();
    const { website_name, website_url, schedule_minutes, enabled } = body;

    const updateData: any = {};

    if (website_name !== undefined) {
      updateData.website_name = website_name.trim();
    }

    if (website_url !== undefined) {
      const trimmedUrl = website_url.trim();
      if (trimmedUrl !== website.website_url) {
        if (!isValidUrl(trimmedUrl)) {
          return NextResponse.json({ error: 'Please enter a valid URL (starting with http:// or https://)' }, { status: 400 });
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

        if (duplicate && duplicate.id !== id) {
          return NextResponse.json({ error: 'You have already registered this website URL' }, { status: 400 });
        }

        updateData.website_url = trimmedUrl;
      }
    }

    if (schedule_minutes !== undefined) {
      const minutes = parseInt(schedule_minutes, 10);
      if (isNaN(minutes) || minutes < 15 || minutes > 1440) {
        return NextResponse.json({ error: 'Schedule must be between 15 and 1440 minutes for the Free tier.' }, { status: 400 });
      }
      updateData.schedule_minutes = minutes;
    }

    if (enabled !== undefined) {
      updateData.enabled = Boolean(enabled);
    }

    // Recalculate next_ping_at if:
    // - it is being enabled (was disabled before)
    // - or the schedule is changed
    const currentEnabled = enabled !== undefined ? Boolean(enabled) : website.enabled;
    const currentMinutes = schedule_minutes !== undefined ? parseInt(schedule_minutes, 10) : website.schedule_minutes;

    if (
      (enabled !== undefined && enabled && !website.enabled) ||
      (schedule_minutes !== undefined && currentMinutes !== website.schedule_minutes) ||
      (website_url !== undefined && website_url.trim() !== website.website_url)
    ) {
      updateData.next_ping_at = new Date(Date.now() + currentMinutes * 60 * 1000);
    } else if (enabled !== undefined && !enabled) {
      // Clear next_ping_at if disabled
      updateData.next_ping_at = null;
    }

    const updatedWebsite = await db.website.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ website: updatedWebsite });
  } catch (error) {
    console.error('Error updating website:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (mockDb.isMock()) {
      const user = await mockDb.getUserByFirebaseUid(authUser.uid);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const website = await mockDb.getWebsite(id);
      if (!website || website.user_id !== user.id) {
        return NextResponse.json({ error: 'Website not found' }, { status: 404 });
      }

      await mockDb.deleteWebsite(id);
      return NextResponse.json({ success: true, message: 'Website removed successfully' });
    }

    const user = await db.user.findUnique({
      where: { firebase_uid: authUser.uid },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const website = await db.website.findUnique({
      where: { id },
    });

    if (!website || website.user_id !== user.id) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    await db.website.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Website removed successfully' });
  } catch (error) {
    console.error('Error deleting website:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
