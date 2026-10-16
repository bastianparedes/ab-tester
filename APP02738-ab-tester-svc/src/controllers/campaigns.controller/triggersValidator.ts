import { z } from 'zod';
import { jsCodeHasCorrectSyntax } from '../../libs/jsCode';
import constants from '../../libs/sharedConstants';

const clickOnElementDataSchema = z.object({
  selector: z.string(),
});

const customTriggerDataSchema = z.object({
  javascript: z.string().refine((val) => jsCodeHasCorrectSyntax(val), {
    message: 'Invalid JavaScript code',
  }),
  name: z.string(),
});

const pageLoadDataSchema = z.object({});

const timeOnPageDataSchema = z.object({
  milliseconds: z.number().int(),
});

export const triggerSchema = z.array(
  z.discriminatedUnion('type', [
    z.object({
      data: clickOnElementDataSchema,
      id: z.number().int(),
      type: z.literal(constants.triggerTypes.clickOnElement),
    }),

    z.object({
      data: customTriggerDataSchema,
      id: z.number().int(),
      type: z.literal(constants.triggerTypes.custom),
    }),

    z.object({
      data: pageLoadDataSchema,
      id: z.number().int(),
      type: z.literal(constants.triggerTypes.pageLoad),
    }),

    z.object({
      data: timeOnPageDataSchema,
      id: z.number().int(),
      type: z.literal(constants.triggerTypes.timeOnPage),
    }),
  ]),
);
