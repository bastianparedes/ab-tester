import bcrypt from 'bcrypt';
import { env } from '../env';

export function getPasswordHashed(password: string) {
  const hash = bcrypt.hashSync(password, env.SALT_ROUNDS);
  return hash;
}

export const isPasswordCorrect = ({ password, passwordHash }: { password: string; passwordHash: string }) => {
  return bcrypt.compareSync(password, passwordHash);
};
