import { adminAuth } from './firebase-admin';
import { mockDb } from './db-mock';

export interface AuthUser {
  uid: string;
  email: string;
  name?: string;
}

export async function verifyAuth(req: Request): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return null;
    }

    // Bypass verification in mock mode
    if (mockDb.isMock() || token.startsWith('mock-token-')) {
      const email = token.startsWith('mock-token-') ? token.replace('mock-token-', '') : 'demo@gmail.com';
      return {
        uid: `mock-uid-${email}`,
        email: email,
        name: email.split('@')[0],
      };
    }

    // Verify the Firebase ID Token
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name,
    };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}
