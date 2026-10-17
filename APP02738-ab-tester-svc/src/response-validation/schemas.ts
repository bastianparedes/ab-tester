import { z } from 'zod';
import commonConstants from '../libs/sharedConstants';

const idSchema = z.number().int();
const statusSchema = z.enum(commonConstants.arrayStatusArray);
const dateSchema = z.date();

export const emptyResponseSchema = z.object({});

const campaignStorageComparisonSchema = z.union([
  z.object({
    comparator: z.enum([
      commonConstants.comparisons.equal,
      commonConstants.comparisons.isNot,
      commonConstants.comparisons.contains,
      commonConstants.comparisons.doesNotContain,
    ]),
    name: z.string(),
    value: z.string(),
  }),
  z.object({
    comparator: z.enum([commonConstants.comparisons.exists, commonConstants.comparisons.doesNotExist]),
    name: z.string(),
  }),
]);

const campaignRequirementLeafSchema = z.discriminatedUnion('type', [
  z.object({ data: campaignStorageComparisonSchema, type: z.literal(commonConstants.requirementTypes.cookie) }),
  z.object({ data: campaignStorageComparisonSchema, type: z.literal(commonConstants.requirementTypes.localStorage) }),
  z.object({ data: campaignStorageComparisonSchema, type: z.literal(commonConstants.requirementTypes.sessionStorage) }),
  z.object({ data: campaignStorageComparisonSchema, type: z.literal(commonConstants.requirementTypes.queryParam) }),
  z.object({ data: z.object({ javascript: z.string(), name: z.string() }), type: z.literal(commonConstants.requirementTypes.custom) }),
  z.object({
    data: z.object({
      comparator: z.enum([commonConstants.comparisons.equal, commonConstants.comparisons.isNot]),
      device: z.enum([commonConstants.devices.desktop, commonConstants.devices.mobile]),
    }),
    type: z.literal(commonConstants.requirementTypes.device),
  }),
  z.object({
    data: z.object({
      comparator: z.enum([
        commonConstants.comparisons.equal,
        commonConstants.comparisons.isNot,
        commonConstants.comparisons.contains,
        commonConstants.comparisons.doesNotContain,
      ]),
      value: z.string(),
    }),
    type: z.literal(commonConstants.requirementTypes.url),
  }),
  z.object({ data: z.object({ id: idSchema }), type: z.literal(commonConstants.requirementTypes.audience) }),
]);

const campaignNodeRequirementSchema: z.ZodType = z.lazy(() =>
  z.object({
    data: z.object({
      children: z.array(z.union([campaignNodeRequirementSchema, campaignRequirementLeafSchema])),
      operator: z.enum([commonConstants.booleanOperators.and, commonConstants.booleanOperators.or]),
    }),
    type: z.literal(commonConstants.requirementTypes.node),
  }),
);

const audienceComparatorBaseSchema = z.object({
  eventCount: z.number(),
  quantityOperator: z.enum([
    commonConstants.audienceQuantityOperator.equal,
    commonConstants.audienceQuantityOperator.moreThan,
    commonConstants.audienceQuantityOperator.atLeast,
    commonConstants.audienceQuantityOperator.lessThan,
    commonConstants.audienceQuantityOperator.atMost,
  ]),
  timeAmount: z.number(),
  timeUnit: z.enum([commonConstants.audienceTimeUnits.days, commonConstants.audienceTimeUnits.hours, commonConstants.audienceTimeUnits.minutes]),
  trackEventId: idSchema,
});

const audienceRequirementLeafSchema = z.discriminatedUnion('type', [
  z.object({
    data: audienceComparatorBaseSchema.extend({
      comparator: z.enum([
        commonConstants.audienceStringComparators.equal,
        commonConstants.audienceStringComparators.isNot,
        commonConstants.audienceStringComparators.contains,
        commonConstants.audienceStringComparators.doesNotContain,
      ]),
      value: z.string(),
    }),
    type: z.literal(commonConstants.audienceRestrictionTypes.string),
  }),
  z.object({
    data: audienceComparatorBaseSchema.extend({
      comparator: z.enum([
        commonConstants.audienceNumberComparators.equal,
        commonConstants.audienceNumberComparators.moreThan,
        commonConstants.audienceNumberComparators.lessThan,
        commonConstants.audienceNumberComparators.atLeast,
        commonConstants.audienceNumberComparators.atMost,
      ]),
      value: z.number(),
    }),
    type: z.literal(commonConstants.audienceRestrictionTypes.number),
  }),
  z.object({
    data: audienceComparatorBaseSchema.extend({
      comparator: z.literal(commonConstants.audienceBooleanComparators.equal),
      value: z.boolean(),
    }),
    type: z.literal(commonConstants.audienceRestrictionTypes.boolean),
  }),
  z.object({ data: audienceComparatorBaseSchema, type: z.literal(commonConstants.audienceRestrictionTypes.any) }),
]);

const audienceNodeRequirementSchema: z.ZodType = z.lazy(() =>
  z.object({
    data: z.object({
      children: z.array(z.union([audienceNodeRequirementSchema, audienceRequirementLeafSchema])),
      operator: z.enum([commonConstants.booleanOperators.and, commonConstants.booleanOperators.or]),
    }),
    type: z.literal(commonConstants.audienceRestrictionTypes.node),
  }),
);

const triggerSchema = z.array(
  z.discriminatedUnion('type', [
    z.object({
      data: z.object({ selector: z.string() }),
      id: idSchema,
      type: z.literal(commonConstants.triggerTypes.clickOnElement),
    }),
    z.object({
      data: z.object({ javascript: z.string(), name: z.string() }),
      id: idSchema,
      type: z.literal(commonConstants.triggerTypes.custom),
    }),
    z.object({
      data: z.object({}),
      id: idSchema,
      type: z.literal(commonConstants.triggerTypes.pageLoad),
    }),
    z.object({
      data: z.object({ milliseconds: z.number().int() }),
      id: idSchema,
      type: z.literal(commonConstants.triggerTypes.timeOnPage),
    }),
  ]),
);

const variationSchema = z.array(
  z.object({
    css: z.string(),
    html: z.string(),
    id: idSchema,
    javascript: z.string(),
    name: z.string(),
    traffic: z.number().int().min(0).max(100),
  }),
);

export const roleResponseSchema = z.object({
  description: z.string(),
  id: idSchema,
  name: z.string(),
  permissions: z.array(z.string()),
});

export const userResponseSchema = z.object({
  email: z.string(),
  id: idSchema,
  name: z.string(),
  roles: z.array(roleResponseSchema),
});

export const tenantResponseSchema = z.object({
  description: z.string(),
  domain: z.string(),
  id: idSchema,
  name: z.string(),
});

export const audienceResponseSchema = z.object({
  createdAt: dateSchema,
  id: idSchema,
  name: z.string(),
  requirements: audienceNodeRequirementSchema,
  tenantId: idSchema,
  updatedAt: dateSchema,
});

export const audienceForMenuResponseSchema = z.object({
  createdAt: dateSchema,
  id: idSchema,
  name: z.string(),
  updatedAt: dateSchema,
});

export const audienceForCampaignResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
});

export const campaignForExecutionGroupResponseSchema = z.object({
  executionGroupId: idSchema.nullable(),
  id: idSchema,
  name: z.string(),
  status: statusSchema,
  tenantId: idSchema,
});

export const campaignForMenuResponseSchema = z.object({
  createdAt: dateSchema,
  executionGroupId: idSchema.nullable(),
  id: idSchema,
  name: z.string(),
  status: statusSchema,
  tenantId: idSchema,
  updatedAt: dateSchema,
});

export const executionGroupResponseSchema = z.object({
  createdAt: dateSchema,
  id: idSchema,
  name: z.string(),
  onlyCampaignsPreviouslyExecuted: z.boolean(),
  onlyOneCampaignPerPageLoad: z.boolean(),
  status: statusSchema,
  tenantId: idSchema,
  updatedAt: dateSchema,
  waitForEveryCampaignToBeEvaluated: z.boolean(),
});

export const executionGroupForMenuResponseSchema = z.object({
  campaignsCount: z.number().int(),
  createdAt: dateSchema,
  id: idSchema,
  name: z.string(),
  status: statusSchema,
  updatedAt: dateSchema,
});

export const campaignResponseSchema = z.object({
  createdAt: dateSchema,
  executionGroupId: idSchema.nullable(),
  id: idSchema,
  name: z.string(),
  requirements: campaignNodeRequirementSchema,
  status: statusSchema,
  tenantId: idSchema,
  triggers: triggerSchema,
  updatedAt: dateSchema,
  variations: variationSchema,
});

export const trackEventResponseSchema = z.object({
  createdAt: dateSchema,
  javascript: z.string(),
  id: idSchema,
  multipleTimes: z.boolean(),
  name: z.string(),
  status: statusSchema,
  tenantId: idSchema,
  updatedAt: dateSchema,
});

export const trackEventForMenuResponseSchema = z.object({
  createdAt: dateSchema,
  id: idSchema,
  name: z.string(),
  status: statusSchema,
  updatedAt: dateSchema,
});

export const trackEventForAudienceResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
});

export const lifecycleHookResponseSchema = z.object({
  createdAt: dateSchema,
  id: idSchema,
  javascript: z.string(),
  name: z.string(),
  option: z.enum(commonConstants.lifecycleHookOptionsArray),
  status: statusSchema,
  tenantId: idSchema,
  updatedAt: dateSchema,
});

export const lifecycleHookForMenuResponseSchema = z.object({
  createdAt: dateSchema,
  id: idSchema,
  name: z.string(),
  option: z.enum(commonConstants.lifecycleHookOptionsArray),
  status: statusSchema,
  updatedAt: dateSchema,
});
