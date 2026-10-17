import { afterEach, describe, expect, it } from 'vitest';
import { env } from '../env';
import { getScriptLocation } from '../script';

describe('getScriptLocation', () => {
  const originalNodeEnv = env.NODE_ENV;

  afterEach(() => {
    env.NODE_ENV = originalNodeEnv;
  });

  it('resolves the generated script in development and production', () => {
    env.NODE_ENV = 'development';
    expect(getScriptLocation()).toMatch(/[\\/]build[\\/]script\.js$/);

    env.NODE_ENV = 'production';
    expect(getScriptLocation()).toMatch(/[\\/]build[\\/]script\.js$/);
  });
});
