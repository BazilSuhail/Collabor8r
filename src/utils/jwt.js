// Reads the expiry from an access token without verifying the signature. Returns epoch milliseconds or null.
export const decodeExp = (token) => {
  if (typeof token !== 'string') return null;
  const segment = token.split('.')[1];
  if (!segment) return null;
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4)));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};
