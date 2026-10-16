import type { TypeLifecycleHookOption, TypeStatus } from './constants';
import type { TypeTenant } from './tenant';

export type TypeLifecycleHook = {
  status: TypeStatus;
  id: number;
  name: string;
  option: TypeLifecycleHookOption;
  javascript: string;
  tenantId: TypeTenant['id'];
  createdAt: Date;
  updatedAt: Date;
};

export type TypeOrderLifecycleHookBy = 'id' | 'name' | 'option' | 'status' | 'updatedAt';

export type TypeLifecycleHookForMenu = Pick<TypeLifecycleHook, 'id' | 'name' | 'option' | 'status' | 'createdAt' | 'updatedAt'>;
