import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { AbTestModule } from '../modules/ab-test/ab-test.module';
import { ScriptController } from '../modules/ab-test/controllers/script.controller';
import { AdminModule } from '../modules/admin/common.module';
import { AuthModule } from '../modules/auth/auth.module';
import { CommonModule } from '../modules/common/common.module';

describe('AppModule', () => {
  it('registers feature modules with Nest', () => {
    const imports = Reflect.getMetadata('imports', AppModule);
    const controllers = Reflect.getMetadata('controllers', AbTestModule);

    expect(imports).toEqual(expect.arrayContaining([AbTestModule, AdminModule, AuthModule, CommonModule]));
    expect(controllers).toContain(ScriptController);
  });
});
