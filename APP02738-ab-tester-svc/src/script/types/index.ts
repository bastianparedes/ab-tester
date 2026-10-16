import type { TypeLifecycleHookOption } from '@ab-tester/constants/types/constants';
import type { TypeAudienceScript, TypeCampaignScript, TypeExecutionGroupScript, TypeLifecycleHookScript, TypeTrackEventScript } from '@ab-tester/constants/types/script';

type TypeAbTester = {
  campaignsData: TypeCampaignScript[];
  executionGroupsData: TypeExecutionGroupScript[];
  trackEventsData: TypeTrackEventScript[];
  audiencesData: TypeAudienceScript[];
  serviceBaseUrl: string;
  lifecycleHooksData: Record<TypeLifecycleHookOption, TypeLifecycleHookScript[]>;
};

export type { TypeAbTester };
