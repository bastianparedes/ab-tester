import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AbTestModule } from './modules/ab-test/ab-test.module';
import { AdminModule } from './modules/admin/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from './modules/common/common.module';

@Module({
  controllers: [],
  imports: [
    CommonModule,
    AuthModule,
    AdminModule,
    AbTestModule,
    RouterModule.register([
      { module: AuthModule, path: 'auth' },
      { module: AdminModule, path: 'admin' },
      { module: AbTestModule, path: 'tenants/:tenantId/ab-test' },
    ]),
  ],
  providers: [],
})
export class AppModule {}
