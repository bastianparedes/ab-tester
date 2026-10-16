import { TypeAudienceForCampaign } from '@ab-tester/constants/types/audience';
import type { TypeCampaignWithOptionalId, TypeRequirement } from '@ab-tester/constants/types/campaign';
import { cx } from 'class-variance-authority';
import { Brackets, ChevronDown, Trash2 } from 'lucide-react';
import type React from 'react';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import commonConstants from '@/config/sharedConstants';
import RequirementSpecific from './RequirementSpecific';

interface Props {
  grandParentNode: TypeCampaignWithOptionalId['requirements'] | null;
  id: string;
  index: number;
  parentNode: TypeCampaignWithOptionalId['requirements'] | null;
  requirement: TypeCampaignWithOptionalId['requirements']['data']['children'][number];
  setCampaign: (campaign: (TypeCampaign: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => void;
  audiences: TypeAudienceForCampaign[];
}

const Requirement = ({ grandParentNode, id, index, parentNode, requirement, setCampaign, audiences }: Props) => {
  const { translation } = useTranslationContext();

  const newRequirement = {
    data: {
      comparator: 'contains' as const,
      value: '',
    },
    type: 'url' as const,
  };

  if (requirement.type === 'node') {
    const isRootNode = id === '0';
    const addNewRequirement = () => {
      requirement.data.children.push(newRequirement);

      setCampaign((campaign) => {
        return structuredClone(campaign);
      });
    };

    const switchToAnd = () => {
      requirement.data.operator = 'and';
      setCampaign((campaign) => structuredClone(campaign));
    };

    const switchToOr = () => {
      requirement.data.operator = 'or';
      setCampaign((campaign) => structuredClone(campaign));
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
                setCampaign={setCampaign}
                audiences={audiences}
              />
            </div>
          ))}
          <button type="button" className="w-fit px-4 py-2 mt-5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" onClick={addNewRequirement}>
            {translation.campaign.newRequirement}
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

    setCampaign((campaign) => {
      return structuredClone(campaign);
    });
  };

  const handleOnChangeType = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value as Exclude<TypeRequirement['type'], 'node'>;

    const childrenByType = {
      audience: {
        data: {
          id: audiences[0]?.id,
        },
        type: 'audience' as const,
      },
      cookie: {
        data: {
          comparator: 'equal' as const,
          name: '',
          value: '',
        },
        type: 'cookie',
      },
      custom: {
        data: {
          javascript: 'return true;\nreturn await new Promise((r) => r(true));',
          name: '',
        },
        type: 'custom',
      },
      device: {
        data: {
          comparator: 'equal' as const,
          device: 'desktop' as const,
        },
        type: 'device',
      },
      localStorage: {
        data: {
          comparator: 'equal' as const,
          name: '',
          value: '',
        },
        type: 'localStorage',
      },
      queryParam: {
        data: {
          comparator: 'equal' as const,
          name: '',
          value: '',
        },
        type: 'queryParam',
      },
      sessionStorage: {
        data: {
          comparator: 'equal' as const,
          name: '',
          value: '',
        },
        type: 'sessionStorage',
      },
      url: {
        data: {
          comparator: 'equal' as const,
          value: '',
        },
        type: 'url',
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
    setCampaign((campaign) => {
      return structuredClone(campaign);
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

    setCampaign((campaign) => {
      return structuredClone(campaign);
    });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 relative">
        <select
          className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer transition-all hover:border-blue-400"
          onChange={handleOnChangeType}
          value={requirement.type}
        >
          {audiences.length && <option value="audience">{translation.campaign.audience}</option>}
          {commonConstants.campaignRequirementsArray
            .filter((r) => r !== 'audience')
            .map((type) => (
              <option key={type} value={type}>
                {translation.campaign[type]}
              </option>
            ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600">
          <ChevronDown />
        </div>
      </div>
      <RequirementSpecific setCampaign={setCampaign} requirement={requirement} audiences={audiences} />
      <button type="button" onClick={removeRequirement} className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        <Trash2 size={20} />
      </button>
      {/* <button className="p-3 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
        <Copy size={20} />
      </button> */}
      {hasSiblings && (
        <button type="button" onClick={addNewNode} className="p-3 text-black hover:bg-gray-200 rounded-lg transition-colors">
          <Brackets size={20} />
        </button>
      )}
    </div>
  );
};

export default Requirement;
