import type { TypeDirection } from '../constants';
import type { TypeLifecycleHook, TypeLifecycleHookForMenu, TypeOrderLifecycleHookBy } from '../lifecycleHooks';
import type { TypeTenant } from '../tenant';

type TypeLifecycleHookValues = Pick<TypeLifecycleHook, 'status' | 'name' | 'option' | 'javascript'>;

export type TypeApiLifecycleHooks = {
  get: {
    request: {
      pathParams: { tenantId: TypeTenant['id']; lifecycleHookId: TypeLifecycleHook['id'] };
    };
    response: {
      lifecycleHook: TypeLifecycleHook;
    };
  };
  getMany: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
      queryParams: {
        textSearch: string;
        orderBy: TypeOrderLifecycleHookBy;
        orderDirection: TypeDirection;
        page: number;
        quantity: number;
        statusList: TypeLifecycleHook['status'][];
      };
    };
    response: {
      lifecycleHooks: TypeLifecycleHookForMenu[];
      count: number;
    };
  };
  create: {
    request: {
      pathParams: { tenantId: TypeTenant['id'] };
      body: TypeLifecycleHookValues;
    };
    response: Record<string, never>;
  };
  update: {
    request: {
      pathParams: { tenantId: TypeTenant['id']; lifecycleHookId: TypeLifecycleHook['id'] };
      body: TypeLifecycleHookValues;
    };
    response: Record<string, never>;
  };
  delete: {
    request: {
      pathParams: { tenantId: TypeTenant['id']; lifecycleHookId: TypeLifecycleHook['id'] };
    };
    response: Record<string, never>;
  };
};
