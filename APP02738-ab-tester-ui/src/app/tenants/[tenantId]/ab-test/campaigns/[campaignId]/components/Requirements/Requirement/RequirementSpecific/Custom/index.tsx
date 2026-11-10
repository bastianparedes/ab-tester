import type { TypeCampaignWithOptionalId } from '@ab-tester/constants/types/campaign';
import type React from 'react';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import Editor from './Editor';

interface Props {
  requirement: TypeCampaignWithOptionalId['requirements']['data']['children'][number];
  setCampaign: (campaign: (TypeCampaign: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => void;
}

const Requirement = ({ setCampaign, requirement }: Props) => {
  const { translation } = useTranslationContext();

  if (requirement.type !== 'custom') throw new Error('Type custom expected in requirement');

  const handleOnChangeName = (event: React.FocusEvent<HTMLInputElement>) => {
    setCampaign((campaign) => {
      requirement.data.name = event.target.value;
      return structuredClone(campaign);
    });
  };

  return (
    <>
      <input
        value={requirement.data.name}
        onChange={handleOnChangeName}
        placeholder={translation.campaign.placeholderName}
        type="text"
        className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all hover:border-blue-400"
      />
      <Editor requirement={requirement} setCampaign={setCampaign} />
    </>
  );
};

export default Requirement;
