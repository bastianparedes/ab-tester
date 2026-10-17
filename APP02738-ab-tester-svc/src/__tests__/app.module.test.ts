import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';

describe('AppModule', () => {
  it('registers API controllers, repositories, and services with Nest', () => {
    const controllers = Reflect.getMetadata('controllers', AppModule);
    const providers = Reflect.getMetadata('providers', AppModule);

    expect(controllers).toHaveLength(10);
    expect(providers).toHaveLength(13);
  });
});
