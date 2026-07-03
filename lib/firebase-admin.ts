import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const getAdminAuth = () => {
  const apps = getApps();
  let app;
  
  if (apps.length > 0) {
    app = apps[0];
  } else {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ?.replace(/\\n/g, '\n')
      ?.replace(/^"/, '')   // Remove leading quote if copied directly from JSON
      ?.replace(/"$/, '');  // Remove trailing quote if copied directly from JSON

    // Build-time check for placeholders
    if (!projectId || !clientEmail || !privateKey || privateKey.includes('PLACEHOLDER')) {
      return {
        verifyIdToken: async () => {
          throw new Error('Firebase admin is not configured. Please supply valid credentials.');
        },
      } as any;
    }

    try {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error) {
      console.error('Firebase admin initialization error:', error);
      return {
        verifyIdToken: async () => {
          throw new Error('Firebase admin failed to initialize.');
        },
      } as any;
    }
  }

  return getAuth(app);
};

// Export proxy object with standard verifyIdToken signature for lazy execution
export const adminAuth = {
  verifyIdToken: (token: string) => getAdminAuth().verifyIdToken(token),
};
