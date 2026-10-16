import type { TypeTenant } from './tenant';
import type { TypeTrackEvent } from './trackEvents';

// REQUIREMENTS
type TypeBaseComparator = {
  quantityOperator: 'equal' | 'moreThan' | 'lessThan' | 'atLeast' | 'atMost';
  trackEventId: TypeTrackEvent['id'];
  eventCount: number;
  timeUnit: 'days' | 'hours' | 'minutes';
  timeAmount: number;
};

type TypeStringComparator = {
  type: 'string';
  data: TypeBaseComparator & {
    comparator: 'equal' | 'isNot' | 'contains' | 'doesNotContain';
    value: string;
  };
};

type TypeNumberComparator = {
  type: 'number';
  data: TypeBaseComparator & {
    comparator: 'equal' | 'moreThan' | 'lessThan' | 'atLeast' | 'atMost';
    value: number;
  };
};
type TypeBooleanComparator = {
  type: 'boolean';
  data: TypeBaseComparator & {
    comparator: 'equal';
    value: boolean;
  };
};
type TypeAnyComparator = {
  type: 'any';
  data: TypeBaseComparator & {
    comparator?: never;
    value?: never;
  };
};

export type TypeNodeRequirement = {
  type: 'node';
  data: {
    children: (TypeNodeRequirement | TypeStringComparator | TypeNumberComparator | TypeBooleanComparator | TypeAnyComparator)[];
    operator: 'and' | 'or';
  };
};

export type TypeRequirement = TypeNodeRequirement['data']['children'][number];

export type TypeAudience = {
  id: number;
  name: string;
  requirements: TypeNodeRequirement;
  tenantId: TypeTenant['id'];
  createdAt: Date;
  updatedAt: Date;
};

export type TypeOrderAudiencesBy = 'name' | 'id' | 'updatedAt';
export type TypeAudienceUpdatable = Pick<TypeAudience, 'name' | 'requirements'>;
export type TypeAudienceWithOptionalId = Omit<Pick<TypeAudience, 'id' | 'name' | 'requirements' | 'tenantId'>, 'id'> & { id?: number | undefined };
export type TypeAudienceForMenu = Pick<TypeAudience, 'id' | 'name' | 'updatedAt' | 'createdAt'>;
export type TypeAudienceForCampaign = Pick<TypeAudience, 'id' | 'name'>;
