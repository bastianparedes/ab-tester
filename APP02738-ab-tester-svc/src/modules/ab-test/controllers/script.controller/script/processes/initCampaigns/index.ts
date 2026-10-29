import { abTesterCallDebugPanel, abTesterCampaignId, abTesterIgnoreRequirements, abTesterVariationId } from '@ab-tester/constants/debuggerPanel';
import queryParam from '../../utils/queryParam';
import { extendPathURL } from '../../utils/url';
import { initSpecificCampaign } from './forced';
import { initExecutionGroups } from './normal';

export const initCampaigns = () => {
  const forcedCampaignIdFromQueryParam = queryParam.get(abTesterCampaignId);
  const forcedVariationIdFromQueryParam = queryParam.get(abTesterVariationId);
  const forcedIgnoreRequirementsFromQueryParam = queryParam.get(abTesterIgnoreRequirements);
  const abTesterCallDebugPanelFromQueryParam = queryParam.get(abTesterCallDebugPanel);

  if (forcedCampaignIdFromQueryParam && forcedVariationIdFromQueryParam) {
    sessionStorage.setItem(abTesterCampaignId, forcedCampaignIdFromQueryParam);
    sessionStorage.setItem(abTesterVariationId, forcedVariationIdFromQueryParam);
    if (forcedIgnoreRequirementsFromQueryParam !== null) sessionStorage.setItem(abTesterIgnoreRequirements, forcedIgnoreRequirementsFromQueryParam);
  }
  if (abTesterCallDebugPanelFromQueryParam !== null) sessionStorage.setItem(abTesterCallDebugPanel, abTesterCallDebugPanelFromQueryParam);

  const forcedCampaignIdFromSessionStorage = parseInt(sessionStorage.getItem(abTesterCampaignId) ?? '', 10);
  const forcedVariationIdFromSessionStorage = parseInt(sessionStorage.getItem(abTesterVariationId) ?? '', 10);
  const forcedIgnoreRequirementsFromSessionStorage = JSON.parse(sessionStorage.getItem(abTesterIgnoreRequirements) || 'false') as boolean;
  const callDebugPanelFromSessionStorage = JSON.parse(sessionStorage.getItem(abTesterCallDebugPanel) || 'false') as boolean;

  if (callDebugPanelFromSessionStorage) {
    const baseUrl = new URL(window.ab_tester.serviceBaseUrl);
    const url = extendPathURL(baseUrl, '/debug-panel');
    import(url.toString());
  }

  if (!Number.isNaN(forcedCampaignIdFromSessionStorage) && !Number.isNaN(forcedVariationIdFromSessionStorage)) {
    initSpecificCampaign({
      campaignId: forcedCampaignIdFromSessionStorage,
      ignoreRequirements: forcedIgnoreRequirementsFromSessionStorage,
      variationId: forcedVariationIdFromSessionStorage,
    });
    return;
  }

  initExecutionGroups();
};
