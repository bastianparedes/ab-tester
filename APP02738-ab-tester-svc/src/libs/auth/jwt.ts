import { TypeUser } from '@ab-tester/constants/types/user';
import jwt from 'jsonwebtoken';
import { env } from '../env';

type TokenPurpose = 'access' | 'refresh_token';
type TokenData = { valid: true; id: TypeUser['id']; secondsLeft: number } | { valid: false; id: null };
type Payload = { id: TypeUser['id']; purpose: TokenPurpose };
type FullPayload = Payload & { iat: number; exp: number };

export const secondsAccessTokenIsValid = 60 * 15; // 15 minutes
export const secondsRefreshTokenIsValid = 60 * 60 * 24; // 1 day

export const getTokenData = ({ token, purpose }: { token: string; purpose: TokenPurpose }): TokenData => {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as FullPayload;
    if (purpose !== payload.purpose) throw new Error('Invalid token purpose');

    const now = Math.floor(Date.now() / 1000);
    const secondsLeft = payload.exp - now;

    return { id: payload.id, secondsLeft, valid: true };
  } catch {
    return { id: null, valid: false };
  }
};

export const generateToken = (payload: Payload) => {
  const duration = {
    access: secondsAccessTokenIsValid,
    refresh_token: secondsRefreshTokenIsValid,
  }[payload.purpose];

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: duration,
  });

  return token;
};
