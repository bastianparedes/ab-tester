/* import { useTranslationContext } from '@/app/_common/contexts/Translation'; */
import { TypeAudienceForCampaign } from '@ab-tester/constants/types/audience';
import type { TypeCampaignWithOptionalId } from '@ab-tester/constants/types/campaign';
import { ChevronDown } from 'lucide-react';

interface Props {
  requirement: TypeCampaignWithOptionalId['requirements']['data']['children'][number];
  setCampaign: (campaign: (TypeCampaign: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => void;
  audiences: TypeAudienceForCampaign[];
}

const Element = ({ setCampaign, requirement, audiences }: Props) => {
  if (requirement.type !== 'audience') throw new Error('Type audience expected in requirement');

  /*   const { translation } = useTranslationContext(); */

  return (
    <div className="flex-1 relative">
      <select
        className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer transition-all hover:border-blue-400"
        onChange={(event) => {
          const newValue = Number(event.target.value);
          requirement.data.id = newValue;
          setCampaign((campaign) => {
            return structuredClone(campaign);
          });
        }}
        value={requirement.data.id}
      >
        {audiences.map((audience) => (
          <option key={audience.id} value={audience.id}>
            {audience.name}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600">
        <ChevronDown />
      </div>
    </div>
  );
};

export default Element;
