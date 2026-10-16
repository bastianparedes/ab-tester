import type { TypeAudience } from './audience';
import type { TypeCampaign, TypeCustomRequirement, TypeNodeRequirement, TypeRequirement, TypeTriggerData, TypeVariationData } from './campaign';
import type { TypeExecutionGroup } from './executionGroup';
import type { TypeLifecycleHook } from './lifecycleHooks';
import type { TypeTrackEvent } from './trackEvents';

type TypeCustomRequirementScript = Omit<TypeCustomRequirement, 'data'> & {
  data: {
    name: string;
    javascript: () => Promise<void>;
  };
};
type TypeRequirementWithoutNode = Exclude<Exclude<TypeRequirement, { type: 'custom' }>, { type: 'node' }> | TypeCustomRequirementScript;
type TypeNodeRequirementScript = Omit<TypeNodeRequirement, 'data'> & {
  data: Omit<TypeNodeRequirement['data'], 'children'> & {
    children: (TypeRequirementWithoutNode | TypeNodeRequirementScript)[];
  };
};
export type TypeCampaignRequirementScript = TypeNodeRequirementScript['data']['children'][number];

type TypeTriggerDataScript =
  | Exclude<TypeTriggerData, { type: 'custom' }>
  | (Omit<Extract<TypeTriggerData, { type: 'custom' }>, 'data'> & {
      data: Omit<Extract<TypeTriggerData, { type: 'custom' }>['data'], 'javascript'> & {
        javascript: () => Promise<void>;
      };
    });

type TypeVariationDataScript = Omit<TypeVariationData, 'javascript'> & {
  javascript: () => Promise<void>;
};

export type TypeCampaignScript = {
  id: TypeCampaign['id'];
  name: TypeCampaign['name'];
  triggers: TypeTriggerDataScript[];
  requirements: Extract<TypeCampaignRequirementScript, { type: 'node' }>;
  variations: TypeVariationDataScript[];
};

export type TypeExecutionGroupScript = {
  id: TypeExecutionGroup['id'];
  name: TypeExecutionGroup['name'];
  waitForEveryCampaignToBeEvaluated: TypeExecutionGroup['waitForEveryCampaignToBeEvaluated'];
  onlyOneCampaignPerPageLoad: TypeExecutionGroup['onlyOneCampaignPerPageLoad'];
  onlyCampaignsPreviouslyExecuted: TypeExecutionGroup['onlyCampaignsPreviouslyExecuted'];
  campaigns: TypeCampaign['id'][];
};

export type TypeTrackEventScript = {
  id: TypeTrackEvent['id'];
  name: TypeTrackEvent['name'];
  getData: () => Promise<unknown>;
  multipleTimes: TypeTrackEvent['multipleTimes'];
};

export type TypeAudienceScript = {
  id: TypeAudience['id'];
  name: TypeAudience['name'];
  requirements: TypeAudience['requirements'];
};

export type TypeLifecycleHookScript = {
  id: TypeLifecycleHook['id'];
  name: TypeLifecycleHook['name'];
  option: TypeLifecycleHook['option'];
  javascript: (props: {
    trackEvent?: { id: TypeTrackEvent['id']; name: TypeTrackEvent['name'] };
    executionGroup?: { id: TypeExecutionGroup['id']; name: TypeExecutionGroup['name'] };
    campaign?: { id: TypeCampaign['id']; name: TypeCampaign['name'] };
    variation?: { id: TypeVariationData['id']; name: TypeVariationData['name'] };
  }) => Promise<unknown>;
};
