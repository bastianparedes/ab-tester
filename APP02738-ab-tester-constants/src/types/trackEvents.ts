import type { TypeStatus } from './constants';
import type { TypeTenant } from './tenant';

export type TypeOrderTrackEventBy = 'id' | 'name' | 'status' | 'updatedAt';

export type TypeTrackEvent = {
  id: number;
  name: string;
  status: TypeStatus;
  javascript: string;
  multipleTimes: boolean;
  tenantId: TypeTenant['id'];
  createdAt: Date;
  updatedAt: Date;
};

export type TypeTrackEventWithOptionalId = Omit<Pick<TypeTrackEvent, 'name' | 'status' | 'javascript' | 'multipleTimes' | 'tenantId'>, 'id'> & { id?: number | undefined };

export type TypeTrackEventUpdatable = Pick<TypeTrackEvent, 'name' | 'status' | 'javascript' | 'multipleTimes'>;
export type TypeTrackEventForMenu = Pick<TypeTrackEvent, 'id' | 'name' | 'status' | 'createdAt' | 'updatedAt'>;
export type TypeTrackEventForAudience = Pick<TypeTrackEvent, 'id' | 'name'>;
