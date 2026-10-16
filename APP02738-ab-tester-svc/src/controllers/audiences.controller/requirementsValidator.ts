import { TypeNodeRequirement } from '@ab-tester/constants/types/audience';
import { z } from 'zod';
import constants from '../../libs/sharedConstants';

// Base
const baseComparatorSchema = z.object({
  eventCount: z.number(),
  quantityOperator: z.enum([
    constants.audienceQuantityOperator.equal,
    constants.audienceQuantityOperator.moreThan,
    constants.audienceQuantityOperator.atLeast,
    constants.audienceQuantityOperator.lessThan,
    constants.audienceQuantityOperator.atMost,
  ]),
  timeAmount: z.number(),
  timeUnit: z.enum([constants.audienceTimeUnits.days, constants.audienceTimeUnits.hours, constants.audienceTimeUnits.minutes]),
  trackEventId: z.number(),
});

// Comparators
const stringComparatorSchema = z.object({
  data: baseComparatorSchema.extend({
    comparator: z.enum([
      constants.audienceStringComparators.contains,
      constants.audienceStringComparators.doesNotContain,
      constants.audienceStringComparators.equal,
      constants.audienceStringComparators.isNot,
    ]),
    value: z.string(),
  }),
  type: z.literal(constants.audienceRestrictionTypes.string),
});

const numberComparatorSchema = z.object({
  data: baseComparatorSchema.extend({
    comparator: z.enum([
      constants.audienceNumberComparators.equal,
      constants.audienceNumberComparators.moreThan,
      constants.audienceNumberComparators.atLeast,
      constants.audienceNumberComparators.lessThan,
      constants.audienceNumberComparators.atMost,
    ]),
    value: z.number(),
  }),
  type: z.literal(constants.audienceRestrictionTypes.number),
});

const booleanComparatorSchema = z.object({
  data: baseComparatorSchema.extend({
    comparator: z.enum([constants.audienceBooleanComparators.equal]),
    value: z.boolean(),
  }),
  type: z.literal(constants.audienceRestrictionTypes.boolean),
});

const anyComparatorSchema = z.object({
  data: baseComparatorSchema,
  type: z.literal(constants.audienceRestrictionTypes.any),
});

const requirementLeafSchema = z.union([stringComparatorSchema, numberComparatorSchema, booleanComparatorSchema, anyComparatorSchema]);

export const NodeRequirementSchema: z.ZodType<TypeNodeRequirement> = z.lazy(() =>
  z.object({
    data: z.object({
      children: z.array(z.union([NodeRequirementSchema, requirementLeafSchema])),
      operator: z.enum([constants.booleanOperators.and, constants.booleanOperators.or]),
    }),
    type: z.literal(constants.audienceRestrictionTypes.node),
  }),
);
