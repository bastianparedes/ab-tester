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
  if (requirement.type !== 'cookie' && requirement.type !== 'localStorage' && requirement.type !== 'sessionStorage' && requirement.type !== 'queryParam')
    throw new Error('Type cookie or localStorage or sessionStorage or queryParam expected in requirement');

  const comparatorPermittedValues = [
    commonConstants.comparisons.contains,
    commonConstants.comparisons.doesNotContain,
    commonConstants.comparisons.exists,
    commonConstants.comparisons.doesNotExist,
    commonConstants.comparisons.equal,
    commonConstants.comparisons.isNot,
  ];

  const handleOnChangeName = (event: React.FocusEvent<HTMLInputElement>) => {
    const newName = event.target.value;
    requirement.data.name = newName;
    setCampaign((campaign) => {
      return structuredClone(campaign);
    });
  };

  const handleOnChangeComparator = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newComparator = event.target.value as (typeof comparatorPermittedValues)[number];
    requirement.data.comparator = newComparator;

    if (requirement.data.comparator === 'exists' || requirement.data.comparator === 'doesNotExist')
      requirement.data = {
        comparator: requirement.data.comparator,
        name: requirement.data.name,
      };

    setCampaign((campaign) => {
      return structuredClone(campaign);
    });
  };

  const handleOnChangeValue = (event: React.FocusEvent<HTMLInputElement>) => {
    if (
      requirement.data.comparator !== commonConstants.comparisons.contains &&
      requirement.data.comparator !== commonConstants.comparisons.doesNotContain &&
      requirement.data.comparator !== commonConstants.comparisons.equal &&
      requirement.data.comparator !== commonConstants.comparisons.isNot
    )
      return;
    const newValue = event.target.value;
    requirement.data.value = newValue;
    setCampaign((campaign) => {
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
      {(requirement.data.comparator === commonConstants.comparisons.contains ||
        requirement.data.comparator === commonConstants.comparisons.doesNotContain ||
        requirement.data.comparator === commonConstants.comparisons.equal ||
        requirement.data.comparator === commonConstants.comparisons.isNot) && (
        <input
          value={requirement.data.value}
          onChange={handleOnChangeValue}
          placeholder={translation.campaign.placeholderValue}
          type="text"
          className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all hover:border-blue-400"
        />
      )}
    </>
  );
};

export default Element;
