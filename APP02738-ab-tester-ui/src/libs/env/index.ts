export const env = {
  NEXT_PUBLIC_BACKEND_URL_FROM_CLIENT_SIDE: process.env.NEXT_PUBLIC_BACKEND_URL_FROM_CLIENT_SIDE,
  NEXT_PUBLIC_BACKEND_URL_FROM_SERVER_SIDE: process.env.NEXT_PUBLIC_BACKEND_URL_FROM_SERVER_SIDE,
};

export function getBackendUrl(isServerSide: boolean): string {
  const variableName = isServerSide ? 'NEXT_PUBLIC_BACKEND_URL_FROM_SERVER_SIDE' : 'NEXT_PUBLIC_BACKEND_URL_FROM_CLIENT_SIDE';
  const value = isServerSide ? env.NEXT_PUBLIC_BACKEND_URL_FROM_SERVER_SIDE : env.NEXT_PUBLIC_BACKEND_URL_FROM_CLIENT_SIDE;

  if (!value) {
    throw new Error(`Missing required environment variable: ${variableName}`);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} must be a valid HTTP or HTTPS URL`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${variableName} must be a valid HTTP or HTTPS URL`);
  }

  return value.replace(/\/+$/, '');
}
