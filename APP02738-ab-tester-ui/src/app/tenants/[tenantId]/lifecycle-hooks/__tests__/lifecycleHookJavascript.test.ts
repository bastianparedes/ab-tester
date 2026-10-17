import { describe, expect, it } from 'vitest';
import type { TypeLifecycleHookOption } from '@ab-tester/constants/types/constants';
import { createInitialLifecycleHookJavascript } from '../lifecycleHookJavascript';

describe('lifecycle hook JavaScript templates', () => {
  it.each([
    ['scriptStart', '@param {{}} props'],
    ['scriptEnd', '@param {{}} props'],
    ['trackEventStart', 'trackEvent?: { id: number, name: string }'],
    ['trackEventEnd', 'trackEvent?: { id: number, name: string }'],
    ['executionGroupStart', 'executionGroup?: { id: number, name: string }'],
    ['executionGroupEnd', 'executionGroup?: { id: number, name: string }'],
    ['campaignStart', 'campaign?: { id: number, name: string }'],
    ['campaignStart', 'executionGroup?: { id: number, name: string }'],
    ['campaignEnd', 'campaign?: { id: number, name: string }'],
    ['variantCampaignStart', 'campaign?: { id: number, name: string }'],
    ['variantCampaignStart', 'variation?: { id: number, name: string }'],
    ['variantCampaignEnd', 'campaign?: { id: number, name: string }'],
    ['variantCampaignEnd', 'variation?: { id: number, name: string }'],
  ] as const)('provides the %s parameter type', (trigger, expectedType) => {
    expect(createInitialLifecycleHookJavascript(trigger)).toContain(expectedType);
  });

  it('provides the complete same JavaScript scaffold for every trigger', () => {
    const triggers = [
      'scriptStart',
      'trackEventStart',
      'trackEventEnd',
      'executionGroupStart',
      'executionGroupEnd',
      'campaignStart',
      'campaignEnd',
      'variantCampaignStart',
      'variantCampaignEnd',
      'scriptEnd',
    ] as const satisfies readonly TypeLifecycleHookOption[];
    const templates = triggers.map(createInitialLifecycleHookJavascript);
    const templateWithoutPropsType = (javascript: string) => javascript.replace(/@param \{\{[\s\S]*?\}\} props/, '@param {PROPS_TYPE} props');

    expect(new Set(templates.map(templateWithoutPropsType)).size).toBe(1);
    for (const javascript of templates) {
      expect(javascript).toContain('/* ############ WRITE NEW CODE ONLY INSIDE OF THIS async arrow function ############ */');
      expect(javascript).toContain('async (props) => {');
      expect(javascript).toContain('/* write your code here */');
    }
  });
});
