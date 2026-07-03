import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth-middleware';
import { mockDb } from '@/lib/db-mock';

export async function POST(req: Request) {
  try {
    const authUser = await verifyAuth(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = body.name || authUser.name || null;
    const email = authUser.email;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Upsert user in mock database or real database
    if (mockDb.isMock()) {
      const user = await mockDb.syncUser(authUser.uid, email, name);
      return NextResponse.json({ user });
    }

    const user = await db.user.upsert({
      where: { firebase_uid: authUser.uid },
      update: {
        email,
        name,
      },
      create: {
        firebase_uid: authUser.uid,
        email,
        name,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
