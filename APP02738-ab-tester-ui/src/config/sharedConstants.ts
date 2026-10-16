import type {
  TypeAudienceBooleanComparator,
  TypeAudienceNumberComparator,
  TypeAudienceRestrictionType,
  TypeAudienceStringComparator,
  TypeAudienceTimeUnit,
  TypeBooleanOperator,
  TypeDeviceType,
  TypeDirection,
  TypeLimitType,
  TypeNodeType,
  TypeNumericComparator,
  TypeRequirementType,
  TypeStatus,
  TypeStringComparator,
  TypeTriggerType,
  TypeTriggerTypesArray,
} from '@ab-tester/constants/types/constants';

import { TypeAccessToken, TypeRefreshToken } from '@ab-tester/constants/types/cookies';

const constants = {
  arrayStatusArray: ['inactive', 'active'] as const satisfies TypeStatus[],

  audienceBooleanComparators: {
    equal: 'equal',
  } as const satisfies Record<TypeAudienceBooleanComparator, string>,

  audienceNumberComparators: {
    atLeast: 'atLeast',
    atMost: 'atMost',
    equal: 'equal',
    lessThan: 'lessThan',
    moreThan: 'moreThan',
  } as const satisfies Record<TypeAudienceNumberComparator, string>,

  audienceQuantityOperator: {
    atLeast: 'atLeast',
    atMost: 'atMost',
    equal: 'equal',
    lessThan: 'lessThan',
    moreThan: 'moreThan',
  } as const satisfies Record<TypeAudienceNumberComparator, string>,

  audienceRequirementsArray: ['boolean', 'number', 'string', 'any'] as const satisfies Exclude<TypeAudienceRestrictionType, 'node'>[],

  audienceRestrictionTypes: {
    any: 'any',
    boolean: 'boolean',
    node: 'node',
    number: 'number',
    string: 'string',
  } as const satisfies Record<TypeAudienceRestrictionType, string>,

  audienceStringComparators: {
    contains: 'contains',
    doesNotContain: 'doesNotContain',
    equal: 'equal',
    isNot: 'isNot',
  } as const satisfies Record<TypeAudienceStringComparator, string>,

  audienceTimeUnits: {
    days: 'days',
    hours: 'hours',
    minutes: 'minutes',
  } as const satisfies Record<TypeAudienceTimeUnit, string>,

  booleanOperators: {
    and: 'and',
    or: 'or',
  } as const satisfies Record<TypeBooleanOperator, string>,

  campaignRequirementsArray: ['audience', 'cookie', 'custom', 'device', 'localStorage', 'queryParam', 'sessionStorage', 'url'] as const satisfies Exclude<
    TypeRequirementType,
    'node'
  >[],

  comparisons: {
    contains: 'contains',
    doesNotContain: 'doesNotContain',
    doesNotExist: 'doesNotExist',
    equal: 'equal',
    exists: 'exists',
    isNot: 'isNot',
  } as const satisfies Record<TypeStringComparator, string>,

  cookieNames: {
    accessToken: 'accessToken' satisfies TypeAccessToken,
    refreshToken: 'refreshToken' satisfies TypeRefreshToken,
  },

  devices: {
    desktop: 'desktop',
    mobile: 'mobile',
  } as const satisfies Record<TypeDeviceType, string>,

  limitTypes: {
    oneDay: 'oneDay',
    oneMonth: 'oneMonth',
    oneWeek: 'oneWeek',
    session: 'session',
    threeMonths: 'threeMonths',
  } as const satisfies Record<TypeLimitType, string>,

  nodeTypes: {
    internal: 'internal',
    root: 'root',
  } as const satisfies Record<TypeNodeType, string>,

  orderDirectionArray: ['asc', 'desc'] as const satisfies TypeDirection[],

  orderDirections: {
    asc: 'asc',
    desc: 'desc',
  } as const satisfies Record<TypeDirection, string>,

  requirementTypes: {
    audience: 'audience',
    cookie: 'cookie',
    custom: 'custom',
    device: 'device',
    localStorage: 'localStorage',
    node: 'node',
    queryParam: 'queryParam',
    sessionStorage: 'sessionStorage',
    url: 'url',
  } as const satisfies Record<TypeRequirementType, string>,

  status: {
    active: 'active',
    inactive: 'inactive',
  } as const satisfies Record<TypeStatus, string>,

  triggerTypes: {
    clickOnElement: 'clickOnElement',
    custom: 'custom',
    pageLoad: 'pageLoad',
    timeOnPage: 'timeOnPage',
  } as const satisfies Record<TypeTriggerType, string>,

  triggerTypesArray: ['clickOnElement', 'custom', 'pageLoad', 'timeOnPage'] as const satisfies TypeTriggerTypesArray,

  typeRepetitions: {
    atLeast: 'atLeast',
    atMost: 'atMost',
    equal: 'equal',
    lessThan: 'lessThan',
    moreThan: 'moreThan',
  } as const satisfies Record<TypeNumericComparator, string>,
};

export default constants;
