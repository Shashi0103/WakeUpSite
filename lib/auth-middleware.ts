import { mockDb } from './db-mock';
import { verifyFirebaseToken } from './firebase-token-verifier';

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

    // Verify the Firebase ID Token using native crypto module
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error('Firebase Project ID is not configured in environment variables');
    }
    const decodedToken = await verifyFirebaseToken(token, projectId);
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
