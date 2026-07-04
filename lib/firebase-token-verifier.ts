import crypto from 'crypto';

export interface DecodedToken {
  uid: string;
  email: string;
  name?: string;
}

let googlePublicKeys: Record<string, string> = {};
let keysExpiry = 0;

async function fetchGooglePublicKeys() {
  const now = Date.now();
  if (now < keysExpiry && Object.keys(googlePublicKeys).length > 0) {
    return googlePublicKeys;
  }

  const res = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!res.ok) {
    throw new Error('Failed to fetch Google public keys');
  }

  // Parse Cache-Control header to set keysExpiry
  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;
  keysExpiry = now + maxAge * 1000;

  googlePublicKeys = await res.json();
  return googlePublicKeys;
}

export async function verifyFirebaseToken(token: string, projectId: string): Promise<DecodedToken> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Helper to decode base64url
  const decodeBase64 = (str: string) => {
    // Replace URL-safe base64 characters and decode
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
  };

  const header = decodeBase64(headerB64);
  const payload = decodeBase64(payloadB64);

  // Validate standard Firebase claims
  const now = Math.floor(Date.now() / 1000);
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error('Invalid token issuer');
  }
  if (payload.aud !== projectId) {
    throw new Error('Invalid token audience');
  }
  if (payload.exp < now) {
    throw new Error('Token has expired');
  }
  if (!payload.sub) {
    throw new Error('Token is missing subject claim');
  }

  // Fetch keys and get the corresponding certificate
  const keys = await fetchGooglePublicKeys();
  const certificate = keys[header.kid];
  if (!certificate) {
    throw new Error('Invalid token key ID (kid)');
  }

  // Verify signature
  const data = `${headerB64}.${payloadB64}`;
  const signature = Buffer.from(signatureB64, 'base64url');

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(data);
  const verified = verifier.verify(certificate, signature);

  if (!verified) {
    throw new Error('Invalid token signature');
  }

  return {
    uid: payload.sub,
    email: payload.email || '',
    name: payload.name,
  };
}
