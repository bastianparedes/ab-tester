import type { TypeCampaignWithOptionalId } from '@ab-tester/constants/types/campaign';
import { ChevronDown } from 'lucide-react';
import type React from 'react';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import commonConstants from '@/config/sharedConstants';

interface Props {
  requirement: TypeCampaignWithOptionalId['requirements']['data']['children'][number];
  setCampaign: (campaign: (TypeCampaign: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => void;
}

const Element = ({ setCampaign, requirement }: Props) => {
  const { translation } = useTranslationContext();

  if (requirement.type !== 'device') throw new Error('Type device expected in requirement');

  const comparatorPermittedValues = [commonConstants.comparisons.equal, commonConstants.comparisons.isNot];
  const devicePermittedValues = [commonConstants.devices.desktop, commonConstants.devices.mobile];

  const handleOnChangeComparator = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newComparator = event.target.value as (typeof comparatorPermittedValues)[number];
    setCampaign((campaign) => {
      requirement.data.comparator = newComparator;
      return structuredClone(campaign);
    });
  };

  const handleOnChangeDevice = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDevice = event.target.value as (typeof devicePermittedValues)[number];
    setCampaign((campaign) => {
      requirement.data.device = newDevice;
      return structuredClone(campaign);
    });
  };

  return (
    <>
      <div className="flex-1 relative">
        <select
          className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer transition-all hover:border-blue-400"
          onChange={handleOnChangeComparator}
          value={requirement.data.comparator}
        >
          {comparatorPermittedValues.map((value) => (
            <option key={value} value={value}>
              {translation.campaign[value]}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600">
          <ChevronDown />
        </div>
      </div>

      <div className="flex-1 relative">
        <select
          className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer transition-all hover:border-blue-400"
          onChange={handleOnChangeDevice}
          value={requirement.data.device}
        >
          {devicePermittedValues.map((value) => (
            <option key={value} value={value}>
              {translation.campaign[value]}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600">
          <ChevronDown />
        </div>
      </div>
    </>
  );
};

export default Element;
