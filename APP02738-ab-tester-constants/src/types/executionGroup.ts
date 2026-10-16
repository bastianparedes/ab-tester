import type { TypeStatus } from './constants';
import type { TypeTenant } from './tenant';

export type TypeOrderExecutionGroupsBy = 'name' | 'status' | 'id' | 'updatedAt';

export type TypeExecutionGroup = {
  id: number;
  name: string;
  status: TypeStatus;
  waitForEveryCampaignToBeEvaluated: boolean;
  onlyOneCampaignPerPageLoad: boolean;
  onlyCampaignsPreviouslyExecuted: boolean;
  createdAt: Date;
  updatedAt: Date;
  tenantId: TypeTenant['id'];
};

export type TypeExecutionGroupUpdatable = Pick<
  TypeExecutionGroup,
  'name' | 'status' | 'waitForEveryCampaignToBeEvaluated' | 'onlyOneCampaignPerPageLoad' | 'onlyCampaignsPreviouslyExecuted'
>;

export type TypeExecutionGroupWithOptionalId = Omit<
  Pick<TypeExecutionGroup, 'id' | 'name' | 'status' | 'waitForEveryCampaignToBeEvaluated' | 'onlyOneCampaignPerPageLoad' | 'onlyCampaignsPreviouslyExecuted' | 'tenantId'>,
  'id'
> & { id?: number | undefined };
export type TypeExecutionGroupForMenu = Pick<TypeExecutionGroup, 'id' | 'name' | 'status' | 'createdAt' | 'updatedAt'>;
