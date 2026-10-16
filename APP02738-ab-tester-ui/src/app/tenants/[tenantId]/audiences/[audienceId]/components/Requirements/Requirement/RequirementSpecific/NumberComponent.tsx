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
  if (requirement.type !== 'number') throw new Error('Type number expected in requirement');

  const comparatorPermittedValues = [
    commonConstants.audienceNumberComparators.equal,
    commonConstants.audienceNumberComparators.moreThan,
    commonConstants.audienceNumberComparators.atLeast,
    commonConstants.audienceNumberComparators.lessThan,
    commonConstants.audienceNumberComparators.atMost,
  ];

  const handleOnChangeComparator = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newComparator = event.target.value as (typeof comparatorPermittedValues)[number];
    requirement.data.comparator = newComparator;
    setAudience((audience) => {
      return structuredClone(audience);
    });
  };

  return (
    <>
      <div className="relative w-24">
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
        className="px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all hover:border-blue-400"
        min={0}
        onChange={(event) => {
          const valueAsNumber = Math.round(event.target.valueAsNumber);
          const newValue = Math.abs(Math.trunc(Number.isNaN(valueAsNumber) ? 0 : valueAsNumber));
          event.target.value = String(newValue);
          requirement.data.value = newValue;
          setAudience((audience) => {
            return structuredClone(audience);
          });
        }}
        step={1}
        type="number"
        value={requirement.data.value}
      />
    </>
  );
};

export default Element;
