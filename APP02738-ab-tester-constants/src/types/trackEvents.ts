import type { TypeStatus } from './constants';
import type { TypeTenant } from './tenant';

export type TypeOrderTrackEventBy = 'id' | 'name' | 'status' | 'updatedAt';

export type TypeTrackEvent = {
  id: number;
  name: string;
  status: TypeStatus;
  getData: string;
  multipleTimes: boolean;
  tenantId: TypeTenant['id'];
  createdAt: Date;
  updatedAt: Date;
};

export type TypeTrackEventWithOptionalId = Omit<Pick<TypeTrackEvent, 'name' | 'status' | 'getData' | 'multipleTimes' | 'tenantId'>, 'id'> & { id?: number | undefined };

export type TypeTrackEventUpdatable = Pick<TypeTrackEvent, 'name' | 'status' | 'getData' | 'multipleTimes'>;
export type TypeTrackEventForMenu = Pick<TypeTrackEvent, 'id' | 'name' | 'status' | 'createdAt' | 'updatedAt'>;
export type TypeTrackEventForAudience = Pick<TypeTrackEvent, 'id' | 'name'>;
