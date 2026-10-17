// @vitest-environment jsdom

import type { TypeCampaignWithOptionalId } from '@ab-tester/constants/types/campaign';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import Requirement from '../tenants/[tenantId]/campaigns/[campaignId]/components/Requirements/Requirement';

afterEach(cleanup);

type Child = TypeCampaignWithOptionalId['requirements']['data']['children'][number];
type Node = TypeCampaignWithOptionalId['requirements'];

const urlRequirement = (): Child => ({ data: { comparator: 'contains', value: '/' }, type: 'url' });
const node = (children: Child[] = [], operator: 'and' | 'or' = 'and'): Node => ({
  data: { children, operator },
  type: 'node',
});

const renderRequirement = (requirement: Child | Node, parentNode: Node | null, id = '0', index = 0, audiences: { id: number; name: string }[] = []) => {
  const campaign: TypeCampaignWithOptionalId = {
    executionGroupId: null,
    name: 'Campaign',
    requirements: node(),
    status: 'active',
    tenantId: 12,
    triggers: [],
    variations: [],
  };
  return render(
    <TranslationProvider language="english">
      <Requirement
        audiences={audiences}
        grandParentNode={null}
        id={id}
        index={index}
        parentNode={parentNode}
        requirement={requirement}
        setCampaign={(update) => update(campaign)}
      />
    </TranslationProvider>,
  );
};

describe('campaign requirement editor', () => {
  it('adds a URL restriction to the root group', () => {
    const root = node();
    renderRequirement(root, null);

    fireEvent.click(screen.getByRole('button', { name: 'New restriction' }));

    expect(root.data.children).toEqual([{ data: { comparator: 'contains', value: '' }, type: 'url' }]);
  });

  it.each([
    ['and', 'or'],
    ['or', 'and'],
  ] as const)('switches a nested group from %s to %s', (currentOperator, nextOperator) => {
    const nested = node([urlRequirement(), urlRequirement()], currentOperator);
    renderRequirement(nested, null, '0-0');

    fireEvent.click(screen.getByRole('button', { name: nextOperator }));
    expect(nested.data.operator).toBe(nextOperator);
  });

  it.each([
    ['audience', { data: { id: 4 }, type: 'audience' }],
    ['cookie', { data: { comparator: 'equal', name: '', value: '' }, type: 'cookie' }],
    ['custom', { data: { javascript: expect.any(String), name: '' }, type: 'custom' }],
    ['device', { data: { comparator: 'equal', device: 'desktop' }, type: 'device' }],
    ['localStorage', { data: { comparator: 'equal', name: '', value: '' }, type: 'localStorage' }],
    ['queryParam', { data: { comparator: 'equal', name: '', value: '' }, type: 'queryParam' }],
    ['sessionStorage', { data: { comparator: 'equal', name: '', value: '' }, type: 'sessionStorage' }],
    ['url', { data: { comparator: 'equal', value: '' }, type: 'url' }],
  ])('creates the correct default fields for a %s restriction', (type, expected) => {
    const leaf = urlRequirement();
    const root = node([leaf]);
    const { container } = renderRequirement(leaf, root, '0-0', 0, [{ id: 4, name: 'Visitors' }]);

    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: type } });

    expect(root.data.children[0]).toMatchObject(expected);
  });

  it('hides the audience restriction option when no audiences are available', () => {
    const leaf = urlRequirement();
    const root = node([leaf]);
    const { container } = renderRequirement(leaf, root, '0-0');

    expect(Array.from(container.querySelector('select')?.options ?? []).map((option) => option.value)).not.toContain('audience');
  });

  it('wraps a restriction and its sibling in a nested group', () => {
    const first = urlRequirement();
    const second = urlRequirement();
    const root = node([first, second]);
    const { container } = renderRequirement(root, null);
    const groupButtons = Array.from(container.querySelectorAll('button')).filter((button) => button.className.includes('p-3 text-black'));

    fireEvent.click(groupButtons[0]);

    expect(root.data.children[0]).toMatchObject({
      data: { children: [first, expect.objectContaining({ type: 'url' })], operator: 'and' },
      type: 'node',
    });
  });

  it('removes a restriction and flattens its one remaining sibling from a nested group', () => {
    const first = urlRequirement();
    const remaining = urlRequirement();
    const nested = node([first, remaining]);
    const root = node([nested]);
    const { container } = renderRequirement(root, null);
    const removeButtons = Array.from(container.querySelectorAll('button')).filter((button) => button.className.includes('text-red-500'));

    fireEvent.click(removeButtons[0]);

    expect(root.data.children).toEqual([remaining]);
  });

  it('flattens a remaining nested group when deleting its sibling', () => {
    const first = urlRequirement();
    const remainingNode = node([urlRequirement(), urlRequirement()], 'or');
    const nested = node([first, remainingNode]);
    const root = node([nested]);
    const { container } = renderRequirement(root, null);
    const removeButtons = Array.from(container.querySelectorAll('button')).filter((button) => button.className.includes('text-red-500'));

    fireEvent.click(removeButtons[0]);

    expect(nested.data).toEqual(remainingNode.data);
  });

  it('renders nothing when a leaf restriction has no parent group', () => {
    const { container } = renderRequirement(urlRequirement(), null);

    expect(container.childElementCount).toBe(0);
  });
});
