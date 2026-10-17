import { TypeNodeRequirement } from '@ab-tester/constants/types/campaign';
import { z } from 'zod';
import { jsCodeIsSingleAsyncArrowFunction } from '../../libs/jsCode';
import constants from '../../libs/sharedConstants';

const StorageComparatorWithValue = z.enum([constants.comparisons.equal, constants.comparisons.isNot, constants.comparisons.contains, constants.comparisons.doesNotContain]);

const StorageComparatorWithoutValue = z.enum([constants.comparisons.exists, constants.comparisons.doesNotExist]);

const TypeStorageComparisonDataSchema = z.union([
  z.object({
    comparator: StorageComparatorWithValue,
    name: z.string(),
    value: z.string(),
  }),
  z.object({
    comparator: StorageComparatorWithoutValue,
    name: z.string(),
  }),
]);

const CookieRequirementSchema = z.object({
  data: TypeStorageComparisonDataSchema,
  type: z.literal(constants.requirementTypes.cookie),
});

const LocalStorageRequirementSchema = z.object({
  data: TypeStorageComparisonDataSchema,
  type: z.literal(constants.requirementTypes.localStorage),
});

const SessionStorageRequirementSchema = z.object({
  data: TypeStorageComparisonDataSchema,
  type: z.literal(constants.requirementTypes.sessionStorage),
});

const QueryParamRequirementSchema = z.object({
  data: TypeStorageComparisonDataSchema,
  type: z.literal(constants.requirementTypes.queryParam),
});

const CustomRequirementSchema = z.object({
  data: z.object({
    javascript: z.string().refine(jsCodeIsSingleAsyncArrowFunction, {
      message: 'Invalid JavaScript code',
    }),
    name: z.string(),
  }),
  type: z.literal(constants.requirementTypes.custom),
});

const DeviceRequirementSchema = z.object({
  data: z.object({
    comparator: z.enum([constants.comparisons.equal, constants.comparisons.isNot]),
    device: z.enum([constants.devices.desktop, constants.devices.mobile]),
  }),
  type: z.literal(constants.requirementTypes.device),
});

const UrlRequirementSchema = z.object({
  data: z.object({
    comparator: z.enum([constants.comparisons.equal, constants.comparisons.isNot, constants.comparisons.contains, constants.comparisons.doesNotContain]),
    value: z.string(),
  }),
  type: z.literal(constants.requirementTypes.url),
});

const AudienceRequirementSchema = z.object({
  data: z.object({
    id: z.number(),
  }),
  type: z.literal(constants.requirementTypes.audience),
});

export const nodeRequirementSchema: z.ZodType<TypeNodeRequirement> = z.lazy(() =>
  z.object({
    data: z.object({
      children: z.array(
        z.union([
          nodeRequirementSchema,
          CookieRequirementSchema,
          LocalStorageRequirementSchema,
          SessionStorageRequirementSchema,
          QueryParamRequirementSchema,
          CustomRequirementSchema,
          DeviceRequirementSchema,
          UrlRequirementSchema,
          AudienceRequirementSchema,
        ]),
      ),
      operator: z.enum([constants.booleanOperators.and, constants.booleanOperators.or]),
    }),
    type: z.literal(constants.requirementTypes.node),
  }),
);
