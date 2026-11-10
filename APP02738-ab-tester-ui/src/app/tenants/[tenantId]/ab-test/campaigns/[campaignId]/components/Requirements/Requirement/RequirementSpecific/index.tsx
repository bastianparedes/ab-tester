import { TypeAudienceForCampaign } from '@ab-tester/constants/types/audience';
import type { TypeCampaignWithOptionalId } from '@ab-tester/constants/types/campaign';
import commonConstants from '@/config/sharedConstants';
import Audience from './Audience';
import Custom from './Custom';
import Device from './Device';
import Storage from './Storage';
import Url from './Url';

interface Props {
  requirement: Exclude<TypeCampaignWithOptionalId['requirements']['data']['children'][number], { type: 'node' }>;
  setCampaign: (campaign: (TypeCampaign: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => void;
  audiences: TypeAudienceForCampaign[];
}

const Element = ({ setCampaign, requirement, audiences }: Props) => {
  if (requirement.type === 'audience') return <Audience setCampaign={setCampaign} requirement={requirement} audiences={audiences} />;
  const requirements = {
    [commonConstants.requirementTypes.cookie]: Storage,
    [commonConstants.requirementTypes.custom]: Custom,
    [commonConstants.requirementTypes.device]: Device,
    [commonConstants.requirementTypes.localStorage]: Storage,
    [commonConstants.requirementTypes.queryParam]: Storage,
    [commonConstants.requirementTypes.sessionStorage]: Storage,
    [commonConstants.requirementTypes.url]: Url,
    [commonConstants.requirementTypes.audience]: Audience,
  };

  const Requirement = requirements[requirement.type];
  return <Requirement setCampaign={setCampaign} requirement={requirement} />;
};

export default Element;
