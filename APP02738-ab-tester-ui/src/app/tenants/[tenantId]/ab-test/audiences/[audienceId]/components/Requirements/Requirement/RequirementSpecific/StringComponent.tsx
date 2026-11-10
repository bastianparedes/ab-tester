import type { TypeAudienceWithOptionalId } from '@ab-tester/constants/types/audience';
import { ChevronDown } from 'lucide-react';
import type React from 'react';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import commonConstants from '@/config/sharedConstants';

interface Props {
  requirement: TypeAudienceWithOptionalId['requirements']['data']['children'][number];
  setAudience: (audience: (TypeAudience: TypeAudienceWithOptionalId) => TypeAudienceWithOptionalId) => void;
}

const Element = ({ setAudience, requirement }: Props) => {
  const { translation } = useTranslationContext();
  if (requirement.type !== 'string') throw new Error('Type string expected in requirement');

  const comparatorPermittedValues = [
    commonConstants.audienceStringComparators.contains,
    commonConstants.audienceStringComparators.doesNotContain,
    commonConstants.audienceStringComparators.isNot,
    commonConstants.audienceStringComparators.equal,
  ];

  const handleOnChangeComparator = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newComparator = event.target.value as (typeof comparatorPermittedValues)[number];
    requirement.data.comparator = newComparator;
    setAudience((audience) => {
      return structuredClone(audience);
    });
  };

  const handleOnChangeValue = (event: React.FocusEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    requirement.data.value = newValue;
    setAudience((audience) => {
      return structuredClone(audience);
    });
  };

  return (
    <>
      <div className="relative w-48">
        <select
          className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer transition-all hover:border-blue-400"
          onChange={handleOnChangeComparator}
          value={requirement.data.comparator}
        >
          {comparatorPermittedValues.map((value) => (
            <option key={value} value={value}>
              {translation.audience[value]}
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
        type="text"
        className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all hover:border-blue-400"
      />
    </>
  );
};

export default Element;
