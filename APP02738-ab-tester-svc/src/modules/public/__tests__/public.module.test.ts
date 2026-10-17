import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { PublicModule } from '../public.module';

describe('PublicModule', () => {
  it('registers public controllers and required providers', () => {
    expect(Reflect.getMetadata('controllers', PublicModule)).toHaveLength(2);
    expect(Reflect.getMetadata('providers', PublicModule)).toHaveLength(12);
  });
});
