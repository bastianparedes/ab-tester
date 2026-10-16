import { NextRequest, NextResponse } from 'next/server';
import sharedconstants from '@/config/sharedConstants';
import { apiCaller } from '@/libs/restClient';

type CookieOptions = {
  path?: string;
  expires?: Date;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
};

export async function proxy(req: NextRequest) {
  const response = NextResponse.next();

  const accessToken = req.cookies.get(sharedconstants.cookieNames.accessToken)?.value;
  const refreshToken = req.cookies.get(sharedconstants.cookieNames.refreshToken)?.value;

  if (!accessToken && refreshToken) {
    const backendRes = await apiCaller.sessions.refreshAccessToken();
    if (!backendRes.ok) return response;

    const setCookieHeader = backendRes.headers.get('set-cookie');
    if (setCookieHeader) {
      const cookies = setCookieHeader.split(/,(?=\s*\w+=)/);

      cookies.forEach((cookieStr) => {
        const [cookiePair, ...attributes] = cookieStr.split(';').map((c) => c.trim());
        const [name, value] = cookiePair.split('=');

        const options: CookieOptions = {};

        attributes.forEach((attr) => {
          const [attrName, attrValue] = attr.split('=');

          switch (attrName.toLowerCase()) {
            case 'path':
              options.path = attrValue;
              break;
            case 'expires':
              options.expires = new Date(attrValue);
              break;
            case 'max-age':
              options.maxAge = Number(attrValue);
              break;
            case 'httponly':
              options.httpOnly = true;
              break;
            case 'secure':
              options.secure = true;
              break;
            case 'samesite':
              if (attrValue && ['lax', 'strict', 'none'].includes(attrValue.toLowerCase())) {
                options.sameSite = attrValue.toLowerCase() as CookieOptions['sameSite'];
              }
              break;
          }
        });

        response.cookies.set(name, value, options);
      });
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
