import type { TypeStatus } from './constants';
import type { TypeExecutionGroup } from './executionGroup';
import type { TypeTenant } from './tenant';

// TRIGGERS
export type TypeClickOnElementTrigger = {
  readonly id: number;
  type: 'clickOnElement';
  data: {
    selector: string;
  };
};

export type TypeCustomTrigger = {
  readonly id: number;
  type: 'custom';
  data: {
    name: string;
    javascript: string;
  };
};

export type TypePageLoadTrigger = {
  readonly id: number;
  type: 'pageLoad';
  data: Record<string, never>;
};

export type TypeTimeOnPageTrigger = {
  readonly id: number;
  type: 'timeOnPage';
  data: {
    milliseconds: number;
  };
};

export type TypeTriggerData = TypeClickOnElementTrigger | TypeCustomTrigger | TypePageLoadTrigger | TypeTimeOnPageTrigger;

// REQUIREMENTS
type TypeStorageComparisonData =
  | {
      name: string;
      comparator: 'equal' | 'isNot' | 'contains' | 'doesNotContain';
      value: string;
    }
  | {
      name: string;
      comparator: 'exists' | 'doesNotExist';
      value?: never;
    };

export type TypeCookieRequirement = {
  type: 'cookie';
  data: TypeStorageComparisonData;
};

export type TypeLocalStorageRequirement = {
  type: 'localStorage';
  data: TypeStorageComparisonData;
};

export type TypeSessionStorageRequirement = {
  type: 'sessionStorage';
  data: TypeStorageComparisonData;
};

export type TypeQueryParamRequirement = {
  type: 'queryParam';
  data: TypeStorageComparisonData;
};

export type TypeCustomRequirement = {
  type: 'custom';
  data: {
    name: string;
    javascript: string;
  };
};

export type TypeDeviceRequirement = {
  type: 'device';
  data: {
    comparator: 'equal' | 'isNot';
    device: 'desktop' | 'mobile';
  };
};

export type TypeUrlRequirement = {
  type: 'url';
  data: {
    comparator: 'equal' | 'isNot' | 'contains' | 'doesNotContain';
    value: string;
  };
};

export type TypeAudienceRequirement = {
  type: 'audience';
  data: {
    id: number;
  };
};

export type TypeNodeRequirement = {
  type: 'node';
  data: {
    children: (
      | TypeNodeRequirement
      | TypeCookieRequirement
      | TypeLocalStorageRequirement
      | TypeSessionStorageRequirement
      | TypeQueryParamRequirement
      | TypeCustomRequirement
      | TypeDeviceRequirement
      | TypeUrlRequirement
      | TypeAudienceRequirement
    )[];
    operator: 'and' | 'or';
  };
};

export type TypeRequirement = TypeNodeRequirement['data']['children'][number];

// VARIATIONS
export type TypeVariationData = {
  css: string;
  html: string;
  id: number;
  javascript: string;
  name: string;
  traffic: number;
};

export type TypeOrderCampaignsBy = 'name' | 'id' | 'status' | 'updatedAt';
export type TypeCampaign = {
  id: number;
  name: string;
  status: TypeStatus;
  triggers: TypeTriggerData[];
  requirements: TypeNodeRequirement;
  variations: TypeVariationData[];
  tenantId: TypeTenant['id'];
  executionGroupId: TypeExecutionGroup['id'] | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TypeCampaignUpdatable = Pick<TypeCampaign, 'name' | 'status' | 'triggers' | 'requirements' | 'variations'>;
export type TypeCampaignWithOptionalId = Omit<
  Pick<TypeCampaign, 'id' | 'name' | 'status' | 'triggers' | 'requirements' | 'variations' | 'tenantId' | 'executionGroupId'>,
  'id'
> & { id?: number | undefined };
export type TypeCampaignForMenu = Pick<TypeCampaign, 'name' | 'id' | 'status' | 'updatedAt' | 'tenantId' | 'executionGroupId' | 'createdAt'>;
export type TypeCampaignForExecutionGroup = Pick<TypeCampaign, 'name' | 'id' | 'status' | 'tenantId' | 'executionGroupId'>;
