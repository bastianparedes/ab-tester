'use client';

import type { TypeCampaignForExecutionGroup } from '@ab-tester/constants/types/campaign';
import type { TypeExecutionGroupWithOptionalId } from '@ab-tester/constants/types/executionGroup';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/app/_common/components/button';
import { FormSection } from '@/app/_common/components/FormSection';
import { Switch } from '@/app/_common/components/switch';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import constants from '@/config/constants';
import commonConstants from '@/config/sharedConstants';
import { apiCaller } from '@/libs/restClient';
import { Campaigns } from './components/Campaigns';

type Props = {
  initialExecutionGroup: TypeExecutionGroupWithOptionalId;
  initialCampaigns: TypeCampaignForExecutionGroup[];
  tenantId: number;
  executionGroupId: number | undefined;
  allCampaigns: TypeCampaignForExecutionGroup[];
};

const ClientPage = (props: Props) => {
  const { initialExecutionGroup, initialCampaigns, tenantId, allCampaigns } = props;
  const { translation } = useTranslationContext();
  const [executionGroup, setExecutionGroup] = useState(initialExecutionGroup);
  const [selectedCampaigns, setSelectedCampaigns] = useState(initialCampaigns);

  const user = useUser();
  const isNewExecutionGroup = executionGroup.id === undefined;

  const returnToExecutionGroups = () => {
    location.href = constants.pages.executionGroups({
      tenantId: executionGroup.tenantId,
    });
  };

  const handleOnSave = async () => {
    const campaignIds = selectedCampaigns.map((campaign) => campaign.id);

    if (executionGroup.id === undefined) {
      await apiCaller.executionGroups.create({
        body: { ...executionGroup, campaignIds },
        pathParams: { tenantId: executionGroup.tenantId },
      });
    } else {
      await apiCaller.executionGroups.update({
        body: { ...executionGroup, campaignIds },
        pathParams: {
          executionGroupId: executionGroup.id,
          tenantId: executionGroup.tenantId,
        },
      });
    }

    returnToExecutionGroups();
  };

  return (
    <div className="w-9/10 mx-auto my-8 relative flex flex-col gap-8">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 mb-2">{translation.executionGroup.title}</h1>
            <p className="text-blue-600">{translation.executionGroup.description}</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select
                value={executionGroup.status}
                onChange={(e) =>
                  setExecutionGroup({
                    ...executionGroup,
                    status: e.target.value as typeof executionGroup.status,
                  })
                }
                className={`outline-none px-6 py-2 rounded-lg font-semibold transition-all shadow-md appearance-none cursor-pointer pr-10 ${
                  executionGroup.status === 'active'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : executionGroup.status === 'inactive'
                      ? 'bg-gray-400 text-white hover:bg-gray-500'
                      : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {commonConstants.arrayStatusArray.map((status) => (
                  <option key={status} value={status}>
                    {translation.common[status]}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
                <ChevronDown />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NAME */}
      <FormSection>
        <h2 className="text-xl font-semibold text-blue-900 mb-4">{translation.executionGroup.name}</h2>
        <input
          type="text"
          value={executionGroup.name}
          onChange={(e) => setExecutionGroup({ ...executionGroup, name: e.target.value })}
          className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
        />
      </FormSection>

      {/* CONFIG */}
      <FormSection>
        <h2 className="text-xl font-semibold text-blue-900 mb-4">{translation.executionGroup.config}</h2>

        <div className="flex flex-col gap-3">
          {/* WAIT CONDITIONS */}
          <div className="flex gap-2">
            <div className="flex min-w-16 max-w-16 py-1">
              <Switch
                checked={executionGroup.waitForEveryCampaignToBeEvaluated}
                onChange={() =>
                  setExecutionGroup((state) => ({
                    ...state,
                    waitForEveryCampaignToBeEvaluated: !executionGroup.waitForEveryCampaignToBeEvaluated,
                  }))
                }
              />
            </div>
            <div>
              <h3 className="text-xl font-bold">{translation.executionGroup.waitConditionsTitle}</h3>
              <p>
                <span className="text-green-600">{translation.executionGroup.waitConditionsEnabledLabel}</span> {translation.executionGroup.waitConditionsEnabledDescription}
              </p>
              <p>
                <span className="text-red-600">{translation.executionGroup.waitConditionsDisabledLabel}</span> {translation.executionGroup.waitConditionsDisabledDescription}
              </p>
            </div>
          </div>

          {/* ONLY ONE */}
          <div className="flex gap-2">
            <div className="flex min-w-16 max-w-16 py-1">
              <Switch
                checked={executionGroup.onlyOneCampaignPerPageLoad}
                onChange={() =>
                  setExecutionGroup((state) => ({
                    ...state,
                    onlyOneCampaignPerPageLoad: !executionGroup.onlyOneCampaignPerPageLoad,
                  }))
                }
              />
            </div>
            <div>
              <h3 className="text-xl font-bold">{translation.executionGroup.onlyOneTitle}</h3>
              <p>
                <span className="text-green-600">{translation.executionGroup.onlyOneEnabledLabel}</span> {translation.executionGroup.onlyOneEnabledDescription}
              </p>
              <p>
                <span className="text-red-600">{translation.executionGroup.onlyOneDisabledLabel}</span> {translation.executionGroup.onlyOneDisabledDescription}
              </p>
            </div>
          </div>

          {/* REMEMBER CAMPAIGNS */}
          <div className="flex gap-2">
            <div className="flex min-w-16 max-w-16 py-1">
              <Switch
                checked={executionGroup.onlyCampaignsPreviouslyExecuted}
                onChange={() =>
                  setExecutionGroup((state) => ({
                    ...state,
                    onlyCampaignsPreviouslyExecuted: !executionGroup.onlyCampaignsPreviouslyExecuted,
                  }))
                }
              />
            </div>
            <div>
              <h3 className="text-xl font-bold">{translation.executionGroup.rememberCampaignsTitle}</h3>
              <p>
                <span className="text-green-600">{translation.executionGroup.rememberCampaignsEnabledLabel}</span>{' '}
                {translation.executionGroup.rememberCampaignsEnabledDescription}
              </p>
              <p>
                <span className="text-red-600">{translation.executionGroup.rememberCampaignsDisabledLabel}</span>{' '}
                {translation.executionGroup.rememberCampaignsDisabledDescription}
              </p>
            </div>
          </div>
        </div>
      </FormSection>

      {/* CAMPAIGNS */}
      <FormSection>
        <h2 className="text-xl font-semibold text-blue-900 mb-4">{translation.executionGroup.campaigns}</h2>
        <Campaigns allCampaigns={allCampaigns} selectedCampaigns={selectedCampaigns} setSelectedCampaigns={setSelectedCampaigns} />
      </FormSection>

      {/* BUTTONS */}
      <div className="mt-8 flex justify-end gap-4">
        <Button onClick={returnToExecutionGroups} variant="destructive">
          {translation.executionGroup.cancel}
        </Button>
        {((isNewExecutionGroup && user.hasPermission({ action: 'create', feature: 'execution-group', tenantId })) ||
          (!isNewExecutionGroup && user.hasPermission({ action: 'update', feature: 'execution-group', tenantId }))) && (
          <Button onClick={handleOnSave} variant="default">
            {translation.executionGroup.save}
          </Button>
        )}
      </div>
    </div>
  );
};

export { ClientPage };
