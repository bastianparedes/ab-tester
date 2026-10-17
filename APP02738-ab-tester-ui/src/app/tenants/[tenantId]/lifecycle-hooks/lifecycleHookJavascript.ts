import type { TypeLifecycleHookOption } from '@ab-tester/constants/types/constants';

const initialJavascriptByTrigger: Record<TypeLifecycleHookOption, string> = {
  campaignEnd: `
/* ############ WRITE NEW CODE ONLY INSIDE OF THIS async arrow function ############ */

/**
  * @param {{
  *   campaign?: { id: number, name: string }
  * }} props
  */
async (props) => {
  /* write your code here */
}
`.trim(),
  campaignStart: `
/* ############ WRITE NEW CODE ONLY INSIDE OF THIS async arrow function ############ */

/**
  * @param {{
  *   executionGroup?: { id: number, name: string },
  *   campaign?: { id: number, name: string }
  * }} props
  */
async (props) => {
  /* write your code here */
}
`.trim(),
  executionGroupEnd: `
/* ############ WRITE NEW CODE ONLY INSIDE OF THIS async arrow function ############ */

/**
  * @param {{
  *   executionGroup?: { id: number, name: string }
  * }} props
  */
async (props) => {
  /* write your code here */
}
`.trim(),
  executionGroupStart: `
/* ############ WRITE NEW CODE ONLY INSIDE OF THIS async arrow function ############ */

/**
  * @param {{
  *   executionGroup?: { id: number, name: string }
  * }} props
  */
async (props) => {
  /* write your code here */
}
`.trim(),
  scriptEnd: `
/* ############ WRITE NEW CODE ONLY INSIDE OF THIS async arrow function ############ */

/**
  * @param {{}} props
  */
async (props) => {
  /* write your code here */
}
`.trim(),
  scriptStart: `
/* ############ WRITE NEW CODE ONLY INSIDE OF THIS async arrow function ############ */

/**
  * @param {{}} props
  */
async (props) => {
  /* write your code here */
}
`.trim(),
  trackEventEnd: `
/* ############ WRITE NEW CODE ONLY INSIDE OF THIS async arrow function ############ */

/**
  * @param {{
  *   trackEvent?: { id: number, name: string }
  * }} props
  */
async (props) => {
  /* write your code here */
}
`.trim(),
  trackEventStart: `
/* ############ WRITE NEW CODE ONLY INSIDE OF THIS async arrow function ############ */

/**
  * @param {{
  *   trackEvent?: { id: number, name: string }
  * }} props
  */
async (props) => {
  /* write your code here */
}
`.trim(),
  variantCampaignEnd: `
/* ############ WRITE NEW CODE ONLY INSIDE OF THIS async arrow function ############ */

/**
  * @param {{
  *   campaign?: { id: number, name: string },
  *   variation?: { id: number, name: string }
  * }} props
  */
async (props) => {
  /* write your code here */
}
`.trim(),
  variantCampaignStart: `
/* ############ WRITE NEW CODE ONLY INSIDE OF THIS async arrow function ############ */

/**
  * @param {{
  *   campaign?: { id: number, name: string },
  *   variation?: { id: number, name: string }
  * }} props
  */
async (props) => {
  /* write your code here */
}
`.trim(),
};

export const createInitialLifecycleHookJavascript = (trigger: TypeLifecycleHookOption) => initialJavascriptByTrigger[trigger];
