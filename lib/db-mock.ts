import fs from 'fs';
import path from 'path';

const mockDbPath = path.join(process.cwd(), 'mock-db.json');

interface MockUser {
  id: string;
  firebase_uid: string;
  name: string | null;
  email: string;
  is_pro: boolean;
  created_at: string;
}

interface MockWebsite {
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

interface MockDbSchema {
  users: MockUser[];
  websites: MockWebsite[];
}

function readMockDb(): MockDbSchema {
  if (!fs.existsSync(mockDbPath)) {
    const defaultDb = { users: [], websites: [] };
    fs.writeFileSync(mockDbPath, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }
  try {
    return JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
  } catch {
    return { users: [], websites: [] };
  }
}

function writeMockDb(data: MockDbSchema) {
  fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2));
}

export const mockDb = {
  isMock: () => {
    return (
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'placeholder-api-key' ||
      !process.env.DATABASE_URL ||
      process.env.DATABASE_URL.includes('localhost:5432') ||
      process.env.DATABASE_URL.includes('placeholder')
    );
  },

  syncUser: async (firebaseUid: string, email: string, name: string | null) => {
    const db = readMockDb();
    let user = db.users.find((u) => u.firebase_uid === firebaseUid);
    if (!user) {
      user = {
        id: Math.random().toString(36).substring(2, 9),
        firebase_uid: firebaseUid,
        name,
        email,
        is_pro: false,
        created_at: new Date().toISOString(),
      };
      db.users.push(user);
      writeMockDb(db);
    } else {
      user.name = name || user.name;
      user.email = email;
      writeMockDb(db);
    }
    return user;
  },

  getUserByFirebaseUid: async (firebaseUid: string) => {
    const db = readMockDb();
    return db.users.find((u) => u.firebase_uid === firebaseUid) || null;
  },

  getWebsites: async (userId: string) => {
    const db = readMockDb();
    return db.websites.filter((w) => w.user_id === userId);
  },

  getWebsite: async (id: string) => {
    const db = readMockDb();
    return db.websites.find((w) => w.id === id) || null;
  },

  createWebsite: async (userId: string, name: string, url: string, scheduleMins: number) => {
    const db = readMockDb();
    const website = {
      id: Math.random().toString(36).substring(2, 9),
      user_id: userId,
      website_name: name,
      website_url: url,
      schedule_minutes: scheduleMins,
      enabled: true,
      last_ping_at: null,
      next_ping_at: new Date(Date.now() + scheduleMins * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.websites.push(website);
    writeMockDb(db);
    return website;
  },

  updateWebsite: async (id: string, updateData: any) => {
    const db = readMockDb();
    const idx = db.websites.findIndex((w) => w.id === id);
    if (idx === -1) return null;

    const website = db.websites[idx];
    const updated = {
      ...website,
      ...updateData,
      updated_at: new Date().toISOString(),
    };
    db.websites[idx] = updated;
    writeMockDb(db);
    return updated;
  },

  deleteWebsite: async (id: string) => {
    const db = readMockDb();
    db.websites = db.websites.filter((w) => w.id !== id);
    writeMockDb(db);
    return true;
  },
};
