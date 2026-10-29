import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { AccountController } from './controllers/account.controller';
import { RolesController } from './controllers/roles.controller';
import { TenantsController } from './controllers/tenants.controller';
import { UsersController } from './controllers/users.controller';

@Module({
  controllers: [AccountController, RolesController, TenantsController, UsersController],
  imports: [CommonModule],
})
export class AdminModule {}
