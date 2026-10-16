import { TypeUser } from '@ab-tester/constants/types/user';
import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';
import { secondsRefreshTokenIsValid } from '../libs/auth/jwt';
import { env } from '../libs/env';

const client = createClient({
  url: env.DATABASE_URL_REDIS,
});
client.connect();

/* ============================================================
 * Generic cache helpers
 * ============================================================ */

const cache = {
  async del({ key }: { key: string }) {
    await client.del(key);
  },

  async get({ key }: { key: string }) {
    return await client.get(key);
  },
  async set({ key, value, minutes }: { key: string; value: string; minutes: number }) {
    await client.set(key, value, { EX: minutes * 60 });
  },
};

@Injectable()
export class CacheService {
  scripts = {
    async del({ tenantId }: { tenantId: number }): Promise<void> {
      const key = `tenant:${tenantId}:public_script`;
      await cache.del({ key });
    },

    async get({ tenantId }: { tenantId: number }): Promise<string | null> {
      const key = `tenant:${tenantId}:public_script`;
      return cache.get({ key });
    },
    async save({ tenantId, code }: { tenantId: number; code: string }) {
      if (env.NODE_ENV !== 'production') return;
      const key = `tenant:${tenantId}:public_script`;
      const minutes = 1;
      await cache.set({ key, minutes, value: code });
    },
  };
  users = {
    async clear({ userIds }: { userIds: TypeUser['id'][] }) {
      if (userIds.length === 0) return;
      const keys = userIds.map((id) => `user:${id}`);
      await client.del(keys);
    },
    async get({ userId }: { userId: TypeUser['id'] }): Promise<TypeUser | null> {
      const key = `user:${userId}`;
      const result = await cache.get({ key });
      if (!result) return null;
      return JSON.parse(result);
    },
    async save({ user }: { user: TypeUser }) {
      if (env.NODE_ENV !== 'production') return;
      const key = `user:${user.id}`;
      const minutes = 5;
      await cache.set({ key, minutes, value: JSON.stringify(user) });
    },
  };
  refreshToken = {
    async clear({ userId }: { userId: TypeUser['id'] }) {
      await client.del(`refresh_token:user:${userId}`);
    },
    async get({ userId }: { userId: TypeUser['id'] }): Promise<string | null> {
      const key = `refresh_token:user:${userId}`;
      const result = await cache.get({ key });
      if (!result) return null;
      return JSON.parse(result);
    },
    async save({ userId, refreshToken }: { userId: TypeUser['id']; refreshToken: string }) {
      const key = `refresh_token:user:${userId}`;
      const minutes = secondsRefreshTokenIsValid / 60;
      await cache.set({ key, minutes, value: JSON.stringify(refreshToken) });
    },
  };
}
