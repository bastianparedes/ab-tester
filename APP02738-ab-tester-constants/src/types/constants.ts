export type TypeDirection = 'asc' | 'desc';
export type TypeBooleanOperator = 'and' | 'or';
export type TypeStringComparator = 'contains' | 'doesNotContain' | 'doesNotExist' | 'exists' | 'equal' | 'isNot';
export type TypeRequirementType = 'audience' | 'cookie' | 'custom' | 'device' | 'localStorage' | 'node' | 'queryParam' | 'sessionStorage' | 'url';
export type TypeNumericComparator = 'atLeast' | 'atMost' | 'equal' | 'lessThan' | 'moreThan';
export type TypeRepetition = 'atLeast' | 'atMost' | 'equal' | 'lessThan' | 'moreThan';
export type TypeLimitType = 'oneDay' | 'oneMonth' | 'oneWeek' | 'session' | 'threeMonths';
export type TypeNodeType = 'internal' | 'root';
export type TypeTriggerType = 'clickOnElement' | 'custom' | 'pageLoad' | 'timeOnPage';
export type TypeDeviceType = 'desktop' | 'mobile';
export type TypeStatus = 'inactive' | 'active';
export type TypeLifecycleHookOption =
  | 'scriptStart'
  | 'scriptEnd'
  | 'trackEventStart'
  | 'trackEventEnd'
  | 'executionGroupStart'
  | 'executionGroupEnd'
  | 'campaignStart'
  | 'campaignEnd'
  | 'variantCampaignStart'
  | 'variantCampaignEnd';

export type TypeAudienceRestrictionType = 'string' | 'number' | 'boolean' | 'any' | 'node';
export type TypeAudienceStringComparator = 'equal' | 'isNot' | 'contains' | 'doesNotContain';
export type TypeAudienceNumberComparator = 'equal' | 'moreThan' | 'lessThan' | 'atLeast' | 'atMost';
export type TypeAudienceQuantityOperator = 'equal' | 'moreThan' | 'lessThan' | 'atLeast' | 'atMost';
export type TypeAudienceBooleanComparator = 'equal';
export type TypeAudienceTimeUnit = 'days' | 'hours' | 'minutes';

// type TypeOrderDirectionArray = TypeDirection[];
// type arrayStatusArray = TypeStatus[];
export type TypeTriggerTypesArray = TypeTriggerType[];
// type campaignRequirementsArray = Exclude<TypeRequirementType, 'node'>[];
// type audienceRequirementsArray = Exclude<TypeAudienceRestrictionType, 'node'>[];
