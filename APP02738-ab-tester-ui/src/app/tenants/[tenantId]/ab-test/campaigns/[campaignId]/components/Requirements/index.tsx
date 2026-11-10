import { TypeAudienceForCampaign } from '@ab-tester/constants/types/audience';
import type { TypeCampaignWithOptionalId } from '@ab-tester/constants/types/campaign';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import Requirement from './Requirement';

interface Props {
  requirements: TypeCampaignWithOptionalId['requirements'];
  setCampaign: (campaign: (TypeCampaign: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => void;
  audiences: TypeAudienceForCampaign[];
}

const Requirements = ({ setCampaign, requirements, audiences }: Props) => {
  const { translation } = useTranslationContext();

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-blue-900">{translation.campaign.requirementsTitle}</h2>
      </div>
      <Requirement grandParentNode={null} id="0" index={0} parentNode={null} requirement={requirements} setCampaign={setCampaign} audiences={audiences} />
    </>
  );
};

export default Requirements;
