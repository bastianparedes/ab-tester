import { type TypeUser } from '@ab-tester/constants/types/user';
import { type Request as ExpressRequest } from 'express';

export type Request = Omit<ExpressRequest, 'cookies'> & {
  cookies: Record<string, string | undefined>;
  user?: TypeUser;
};
