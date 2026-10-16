import type { TypeAudienceWithOptionalId, TypeRequirement } from '@ab-tester/constants/types/audience';
import { TypeTrackEventForAudience } from '@ab-tester/constants/types/trackEvents';
import { cx } from 'class-variance-authority';
import { Brackets, ChevronDown, Trash2 } from 'lucide-react';
import type React from 'react';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import commonConstants from '@/config/sharedConstants';
import RequirementSpecific from './RequirementSpecific';

interface Props {
  grandParentNode: TypeAudienceWithOptionalId['requirements'] | null;
  id: string;
  index: number;
  parentNode: TypeAudienceWithOptionalId['requirements'] | null;
  requirement: TypeAudienceWithOptionalId['requirements']['data']['children'][number];
  setAudience: (audience: (TypeAudience: TypeAudienceWithOptionalId) => TypeAudienceWithOptionalId) => void;
  trackEvents: TypeTrackEventForAudience[];
}

const Requirement = ({ grandParentNode, id, index, parentNode, requirement, setAudience, trackEvents }: Props) => {
  const { translation } = useTranslationContext();

  const newRequirement = {
    data: {
      comparator: 'equal' as const,
      eventCount: 1,
      quantityOperator: 'atLeast' as const,
      timeAmount: 1,
      timeUnit: 'days' as const,
      trackEventId: trackEvents[0].id,
      value: '',
    },
    type: 'string' as const,
  };

  if (requirement.type === 'node') {
    const isRootNode = id === '0';
    const addNewRequirement = () => {
      requirement.data.children.push(newRequirement);

      setAudience((audience) => {
        return structuredClone(audience);
      });
    };

    const switchToAnd = () => {
      requirement.data.operator = 'and';
      setAudience((audience) => structuredClone(audience));
    };

    const switchToOr = () => {
      requirement.data.operator = 'or';
      setAudience((audience) => structuredClone(audience));
    };

    return (
      <div className={`${!isRootNode ? 'relative py-4' : ''}`}>
        {/* Corchete izquierdo */}
        {!isRootNode && (
          <div className="absolute left-0 top-0 bottom-0 w-6">
            <div className="absolute top-0 left-0 w-full h-6 border-l-4 border-t-4 border-black"></div>
            <div className="absolute top-6 bottom-6 left-0 w-1 border-l-4 border-black"></div>
            <div className="absolute bottom-0 left-0 w-full h-6 border-l-4 border-b-4 border-black"></div>
          </div>
        )}
        <div className={cx('flex-col flex', !isRootNode && 'mx-4')}>
          {requirement.data.children.map((childNode, indexChild) => (
            <div key={`${id}-${String(indexChild)}`}>
              {indexChild > 0 && (
                <div className="flex justify-start items-center gap-2 my-3 ml-4">
                  <button
                    type="button"
                    onClick={switchToAnd}
                    disabled={requirement.data.operator === 'and'}
                    className={`px-3 py-1 rounded font-medium transition-all text-sm ${requirement.data.operator === 'and' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:text-blue-600'}`}
                  >
                    and
                  </button>
                  <button
                    type="button"
                    onClick={switchToOr}
                    disabled={requirement.data.operator === 'or'}
                    className={`px-3 py-1 rounded font-medium transition-all text-sm ${requirement.data.operator === 'or' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:text-blue-600'}`}
                  >
                    or
                  </button>
                </div>
              )}
              <Requirement
                grandParentNode={parentNode}
                id={`${id}-${String(indexChild)}`}
                index={indexChild}
                key={`${id}-${String(indexChild)}`}
                parentNode={requirement}
                requirement={childNode}
                setAudience={setAudience}
                trackEvents={trackEvents}
              />
            </div>
          ))}
          <button type="button" className="w-fit px-4 py-2 mt-5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" onClick={addNewRequirement}>
            {translation.audience.newRequirement}
          </button>
        </div>
        {/* Corchete derecho */}
        {!isRootNode && (
          <div className="absolute right-0 top-0 bottom-0 w-6">
            <div className="absolute top-0 right-0 w-full h-6 border-r-4 border-t-4 border-black"></div>
            <div className="absolute top-6 bottom-6 right-0 w-1 border-r-4 border-black"></div>
            <div className="absolute bottom-0 right-0 w-full h-6 border-r-4 border-b-4 border-black"></div>
          </div>
        )}
      </div>
    );
  }

  if (parentNode === null) return null;

  const siblings = parentNode.data.children.filter((_child, indexChild) => indexChild !== index);
  const hasSiblings = siblings.length > 0;

  const addNewNode = () => {
    const newNode = {
      data: {
        children: [requirement, newRequirement],
        operator: 'and' as const,
      },
      type: 'node' as const,
    };

    parentNode.data.children[index] = newNode;

    setAudience((audience) => {
      return structuredClone(audience);
    });
  };

  const handleOnChangeType = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value as Exclude<TypeRequirement['type'], 'node'>;

    const childrenByType = {
      any: {
        data: {
          eventCount: 1,
          quantityOperator: 'atLeast' as const,
          timeAmount: 1,
          timeUnit: 'days' as const,
          trackEventId: trackEvents[0].id,
        },
        type: 'any',
      },
      boolean: {
        data: {
          comparator: 'equal' as const,
          eventCount: 1,
          quantityOperator: 'atLeast' as const,
          timeAmount: 1,
          timeUnit: 'days' as const,
          trackEventId: trackEvents[0].id,
          value: true,
        },
        type: 'boolean',
      },
      number: {
        data: {
          comparator: 'atLeast' as const,
          eventCount: 1,
          quantityOperator: 'atLeast' as const,
          timeAmount: 1,
          timeUnit: 'days' as const,
          trackEventId: trackEvents[0].id,
          value: 1000,
        },
        type: 'number',
      },
      string: {
        data: {
          comparator: 'equal' as const,
          eventCount: 1,
          quantityOperator: 'atLeast' as const,
          timeAmount: 1,
          timeUnit: 'days' as const,
          trackEventId: trackEvents[0].id,
          value: '',
        },
        type: 'string',
      },
    } satisfies Record<
      typeof newType,
      {
        data: unknown;
        type: typeof newType;
      }
    >;
    const child = childrenByType[newType];
    parentNode.data.children[index] = child;
    setAudience((audience) => {
      return structuredClone(audience);
    });
  };

  const removeRequirement = () => {
    const newRequirements = parentNode.data.children.filter((_child, indexChild) => indexChild !== index);

    parentNode.data.children = newRequirements;

    if (newRequirements.length === 1) {
      const uniqueSibling = newRequirements[0];
      if (uniqueSibling.type === 'node') {
        parentNode.data = uniqueSibling.data;
      } else if (grandParentNode !== null) {
        const indexOfParentNode = grandParentNode.data.children.findIndex((child) => child.type === 'node' && child.data.children.length === 1);
        grandParentNode.data.children[indexOfParentNode] = uniqueSibling;
      }
    }

    setAudience((audience) => {
      return structuredClone(audience);
    });
  };

  const audienceQuantityOperators = [
    commonConstants.audienceQuantityOperator.equal,
    commonConstants.audienceQuantityOperator.moreThan,
    commonConstants.audienceQuantityOperator.atLeast,
    commonConstants.audienceQuantityOperator.lessThan,
    commonConstants.audienceQuantityOperator.atMost,
  ];

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col gap-3">
        <div className="flex-1 flex items-center gap-3">
          <div className="min-w-10">{translation.audience.trackEvent}</div>
          <div className="w-100 relative">
            <select
              className="w-full flex-1 px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer transition-all hover:border-blue-400"
              onChange={(event) => {
                const trackEventId = Number(event.target.value);
                requirement.data.trackEventId = trackEventId;
                setAudience((audience) => {
                  return structuredClone(audience);
                });
              }}
              value={requirement.data.trackEventId}
            >
              {trackEvents.map((trackEvent) => (
                <option key={trackEvent.id} value={trackEvent.id}>
                  (ID: {trackEvent.id}) -{'>'} {trackEvent.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600">
              <ChevronDown />
            </div>
          </div>
          <div>{translation.audience.is}</div>
          <div className="w-32 relative">
            <select
              className="w-full flex-1 px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer transition-all hover:border-blue-400"
              onChange={handleOnChangeType}
              value={requirement.type}
            >
              {commonConstants.audienceRequirementsArray.map((type) => (
                <option key={type} value={type}>
                  {translation.audience[type]}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600">
              <ChevronDown />
            </div>
          </div>
          <RequirementSpecific setAudience={setAudience} requirement={requirement} />
        </div>
        <div className="flex-1 flex items-center gap-3">
          <div className="min-w-10">{translation.audience.is}</div>
          <div className="w-24 relative">
            <select
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer transition-all hover:border-blue-400"
              onChange={(event) => {
                const newValue = event.target.value as (typeof audienceQuantityOperators)[number];
                requirement.data.quantityOperator = newValue;
                setAudience((audience) => {
                  return structuredClone(audience);
                });
              }}
              value={requirement.data.quantityOperator}
            >
              {audienceQuantityOperators.map((value) => (
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
            className="w-32 px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all hover:border-blue-400"
            max={999999}
            min={0}
            onChange={(event) => {
              const valueAsNumber = Math.round(event.target.valueAsNumber);
              let newSeconds = Number.isNaN(valueAsNumber) ? 0 : valueAsNumber;
              newSeconds = Math.trunc(newSeconds);
              if (newSeconds < 0) newSeconds = 0;
              else if (newSeconds > 60000) newSeconds = 60000;
              event.target.value = String(newSeconds);
              requirement.data.eventCount = newSeconds;
              setAudience((audience) => {
                return structuredClone(audience);
              });
            }}
            step={1}
            type="number"
            value={requirement.data.eventCount}
          />
          <div className="min-w-10">{translation.audience.in}</div>
          <input
            className="w-32 px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all hover:border-blue-400"
            max={999999}
            min={0}
            onChange={(event) => {
              const valueAsNumber = Math.round(event.target.valueAsNumber);
              let newSeconds = Number.isNaN(valueAsNumber) ? 0 : valueAsNumber;
              newSeconds = Math.trunc(newSeconds);
              if (newSeconds < 0) newSeconds = 0;
              else if (newSeconds > 60000) newSeconds = 60000;
              event.target.value = String(newSeconds);
              requirement.data.timeAmount = newSeconds;
              setAudience((audience) => {
                return structuredClone(audience);
              });
            }}
            step={1}
            type="number"
            value={requirement.data.timeAmount}
          />
          <div className="w-32 relative">
            <select
              className="w-full flex-1 px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer transition-all hover:border-blue-400"
              onChange={(event) => {
                const value = event.target.value as (typeof commonConstants.audienceTimeUnits)[keyof typeof commonConstants.audienceTimeUnits];
                requirement.data.timeUnit = value;
                setAudience((audience) => {
                  return structuredClone(audience);
                });
              }}
              value={requirement.data.timeUnit}
            >
              {Object.values(commonConstants.audienceTimeUnits).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600">
              <ChevronDown />
            </div>
          </div>
        </div>
      </div>
      <button type="button" onClick={removeRequirement} className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        <Trash2 size={20} />
      </button>
      {hasSiblings && (
        <button type="button" onClick={addNewNode} className="p-3 text-black hover:bg-gray-200 rounded-lg transition-colors">
          <Brackets size={20} />
        </button>
      )}
    </div>
  );
};

export default Requirement;
