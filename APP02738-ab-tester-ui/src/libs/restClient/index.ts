import { audiences } from './api/audiences';
import { campaigns } from './api/campaigns';
import { executionGroups } from './api/executionGroups';
import { lifecycleHooks } from './api/lifecycleHooks';
import { roles } from './api/roles';
import { scripts } from './api/scripts';
import { sessions } from './api/sessions';
import { tenants } from './api/tenants';
import { trackEvents } from './api/trackEvents';
import { users } from './api/users';

export const apiCaller = {
  audiences,
  campaigns,
  executionGroups,
  lifecycleHooks,
  roles,
  scripts,
  sessions,
  tenants,
  trackEvents,
  users,
};
