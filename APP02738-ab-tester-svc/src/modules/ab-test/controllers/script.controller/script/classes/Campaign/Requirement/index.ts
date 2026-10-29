// External imports

// Types
import type { TypeCampaignRequirementScript } from '@ab-tester/constants/types/script';
import commonConstants from '../../../../../../../../libs/sharedConstants';
// Internal imports
import { comparatorResolver } from '../../../utils/comparatorResolver';
import cookie from '../../../utils/cookie';
import queryParam from '../../../utils/queryParam';
import { Audience } from '../../Audience';

// ------------------------------
// Requirement evaluation functions
// ------------------------------

// Evaluate cookie requirement
const requirementCookie = async (requirement: Extract<TypeCampaignRequirementScript, { type: 'cookie' }>) => {
  const cookieValue = cookie.get({ name: requirement.data.name });
  return comparatorResolver({
    comparator: requirement.data.comparator,
    expectedValue: requirement.data.value,
    obtainedValue: cookieValue,
  });
};

// Evaluate custom JavaScript requirement
const requirementCustom = async (requirement: Extract<TypeCampaignRequirementScript, { type: 'custom' }>) => {
  return new Promise((resolveRequirement) => {
    const customCodeResult = requirement.data.javascript();
    resolveRequirement(customCodeResult);
    setTimeout(() => resolveRequirement(false), 5000); // Fallback to false after 5s
  })
    .then((result) => Boolean(result))
    .catch(() => false);
};

// Evaluate device type requirement
const requirementDevice = async (requirement: Extract<TypeCampaignRequirementScript, { type: 'device' }>) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent);
  const device = isMobile ? commonConstants.devices.mobile : commonConstants.devices.desktop;

  return comparatorResolver({
    comparator: requirement.data.comparator,
    expectedValue: requirement.data.device,
    obtainedValue: device,
  });
};

// Evaluate localStorage requirement
const requirementLocalStorage = async (requirement: Extract<TypeCampaignRequirementScript, { type: 'localStorage' }>) => {
  const keyValue = localStorage.getItem(requirement.data.name);
  return comparatorResolver({
    comparator: requirement.data.comparator,
    expectedValue: requirement.data.value,
    obtainedValue: keyValue,
  });
};

// Evaluate sessionStorage requirement
const requirementSessionStorage = async (requirement: Extract<TypeCampaignRequirementScript, { type: 'sessionStorage' }>) => {
  const keyValue = sessionStorage.getItem(requirement.data.name);
  return comparatorResolver({
    comparator: requirement.data.comparator,
    expectedValue: requirement.data.value,
    obtainedValue: keyValue,
  });
};

// Evaluate query parameter requirement
const requirementQueryParam = async (requirement: Extract<TypeCampaignRequirementScript, { type: 'queryParam' }>) => {
  const queryParamValue = queryParam.get(requirement.data.name);
  return comparatorResolver({
    comparator: requirement.data.comparator,
    expectedValue: requirement.data.value,
    obtainedValue: queryParamValue,
  });
};

// Evaluate URL requirement
const requirementUrl = async (requirement: Extract<TypeCampaignRequirementScript, { type: 'url' }>) => {
  return comparatorResolver({
    comparator: requirement.data.comparator,
    expectedValue: requirement.data.value,
    obtainedValue: location.href,
  });
};

const requirementAudience = async (requirement: Extract<TypeCampaignRequirementScript, { type: 'audience' }>, audiences: Audience[]) => {
  const audience = audiences.find((audience) => audience.id === requirement.data.id);
  if (!audience) return false;
  return audience.evaluate();
};

// Evaluate node requirement (combines multiple child requirements)
const requirementNode = async (requirement: Extract<TypeCampaignRequirementScript, { type: 'node' }>, audiences: Audience[]): Promise<boolean> => {
  const booleanPromises = requirement.data.children.map((childData) => {
    const requirementStrategies = {
      audience: () => requirementAudience(childData as Extract<TypeCampaignRequirementScript, { type: 'audience' }>, audiences),
      cookie: () => requirementCookie(childData as Extract<TypeCampaignRequirementScript, { type: 'cookie' }>),
      custom: () => requirementCustom(childData as Extract<TypeCampaignRequirementScript, { type: 'custom' }>),
      device: () => requirementDevice(childData as Extract<TypeCampaignRequirementScript, { type: 'device' }>),
      localStorage: () => requirementLocalStorage(childData as Extract<TypeCampaignRequirementScript, { type: 'localStorage' }>),
      node: () => requirementNode(childData as Extract<TypeCampaignRequirementScript, { type: 'node' }>, audiences),
      queryParam: () => requirementQueryParam(childData as Extract<TypeCampaignRequirementScript, { type: 'queryParam' }>),
      sessionStorage: () => requirementSessionStorage(childData as Extract<TypeCampaignRequirementScript, { type: 'sessionstorage' }>),
      url: () => requirementUrl(childData as Extract<TypeCampaignRequirementScript, { type: 'url' }>),
    };
    const strategy = requirementStrategies[childData.type];
    return strategy();
  });

  const booleans = await Promise.all(booleanPromises);

  // Evaluate combined result based on operator
  const operator = requirement.data.operator;
  if (operator === 'and') return booleans.every(Boolean);
  if (operator === 'or') return booleans.some(Boolean);
  return false;
};

// ------------------------------
// Main Requirement class
// ------------------------------
class Requirement {
  readonly requirementData: Extract<TypeCampaignRequirementScript, { type: 'node' }>;
  private audiences: Audience[];

  constructor(requirementData: Extract<TypeCampaignRequirementScript, { type: 'node' }>, audiences: Audience[]) {
    this.requirementData = requirementData;
    this.audiences = audiences;
  }

  // Evaluate the root requirement node
  async evaluate() {
    return requirementNode(this.requirementData, this.audiences).catch(() => false);
  }
}

export default Requirement;
