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
  if (requirement.type !== 'url') throw new Error('Type url expected in requirement');

  const { translation } = useTranslationContext();
  const comparatorPermittedValues = [
    commonConstants.comparisons.contains,
    commonConstants.comparisons.doesNotContain,
    commonConstants.comparisons.equal,
    commonConstants.comparisons.isNot,
  ];

  const handleOnChangeValue = (event: React.FocusEvent<HTMLInputElement>) => {
    setCampaign((campaign) => {
      const newValue = event.target.value;
      requirement.data.value = newValue;
      return structuredClone(campaign);
    });
  };

  const handleOnChangeComparator = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newComparator = event.target.value as (typeof comparatorPermittedValues)[number];
    requirement.data.comparator = newComparator;
    setCampaign((campaign) => {
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

      <input
        value={requirement.data.value}
        onChange={handleOnChangeValue}
        placeholder={translation.campaign.placeholderValue}
        type="text"
        className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all hover:border-blue-400"
      />
    </>
  );
};

export default Element;
