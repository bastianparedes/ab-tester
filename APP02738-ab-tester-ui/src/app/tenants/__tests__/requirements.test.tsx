// @vitest-environment jsdom

import type { TypeAudienceWithOptionalId } from '@ab-tester/constants/types/audience';
import type { TypeCampaignWithOptionalId } from '@ab-tester/constants/types/campaign';
import type { TypeTrackEventForAudience } from '@ab-tester/constants/types/trackEvents';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import AudienceRequirement from '../[tenantId]/audiences/[audienceId]/components/Requirements/Requirement';
import CampaignRequirement from '../[tenantId]/campaigns/[campaignId]/components/Requirements/Requirement';

afterEach(cleanup);

const createAudienceTree = (): TypeAudienceWithOptionalId['requirements'] => ({
  data: {
    children: [
      {
        data: { comparator: 'equal', eventCount: 1, quantityOperator: 'atLeast', timeAmount: 1, timeUnit: 'days', trackEventId: 1, value: 'checkout' },
        type: 'string',
      },
      {
        data: { comparator: 'equal', eventCount: 1, quantityOperator: 'atLeast', timeAmount: 1, timeUnit: 'days', trackEventId: 1, value: 'purchase' },
        type: 'string',
      },
    ],
    operator: 'and',
  },
  type: 'node',
});

const createCampaignTree = (): TypeCampaignWithOptionalId['requirements'] => ({
  data: {
    children: [
      { data: { comparator: 'contains', value: '/sale' }, type: 'url' },
      { data: { comparator: 'equal', device: 'desktop' }, type: 'device' },
    ],
    operator: 'and',
  },
  type: 'node',
});

const trackEvents: TypeTrackEventForAudience[] = [{ id: 1, name: 'Checkout' }];
const audienceSetter = (tree: TypeAudienceWithOptionalId['requirements']) =>
  vi.fn((update: (value: TypeAudienceWithOptionalId) => TypeAudienceWithOptionalId) => update({ name: 'Visitors', requirements: tree, tenantId: 12 }));
const campaignSetter = (tree: TypeCampaignWithOptionalId['requirements']) =>
  vi.fn((update: (value: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) =>
    update({ executionGroupId: null, name: 'Campaign', requirements: tree, status: 'active', tenantId: 12, triggers: [], variations: [] }),
  );

describe('audience requirement tree', () => {
  it('adds a requirement and notifies the parent', () => {
    const tree = createAudienceTree();
    const setAudience = audienceSetter(tree);

    render(
      <TranslationProvider language="english">
        <AudienceRequirement grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setAudience={setAudience} trackEvents={trackEvents} />
      </TranslationProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'New restriction' }));

    expect(tree.data.children).toHaveLength(3);
    expect(setAudience).toHaveBeenCalledOnce();
  });

  it('keeps a group intact when removing one of three audience requirements', () => {
    const tree = createAudienceTree();
    const setAudience = audienceSetter(tree);
    const renderTree = () => (
      <TranslationProvider language="english">
        <AudienceRequirement grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setAudience={setAudience} trackEvents={trackEvents} />
      </TranslationProvider>
    );
    const { container, rerender } = render(renderTree());
    fireEvent.click(screen.getByRole('button', { name: 'New restriction' }));
    rerender(renderTree());
    const removeButtons = Array.from(container.querySelectorAll('button')).filter((button) => button.querySelector('svg.lucide-trash-2'));
    fireEvent.click(removeButtons[0]);

    expect(tree.data.children).toHaveLength(2);
    expect(tree.data.children.every((child) => child.type !== 'node')).toBe(true);
    expect(setAudience).toHaveBeenCalledTimes(2);
  });

  it('switches the group operator and converts a child requirement type', () => {
    const tree = createAudienceTree();
    const setAudience: (update: (value: TypeAudienceWithOptionalId) => TypeAudienceWithOptionalId) => void = vi.fn();
    const { container } = render(
      <TranslationProvider language="english">
        <AudienceRequirement grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setAudience={setAudience} trackEvents={trackEvents} />
      </TranslationProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'or' }));
    expect(tree.data.operator).toBe('or');

    const selects = container.querySelectorAll('select');
    fireEvent.change(selects[1], { target: { value: 'number' } });
    expect(tree.data.children[0]).toMatchObject({ data: { value: 1000 }, type: 'number' });
    expect(setAudience).toHaveBeenCalledTimes(2);
  });

  it('renders no editor for an any requirement and for a leaf without a parent', () => {
    const tree = createAudienceTree();
    const setAudience = audienceSetter(tree);
    const { container, rerender } = render(
      <TranslationProvider language="english">
        <AudienceRequirement grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setAudience={setAudience} trackEvents={trackEvents} />
      </TranslationProvider>,
    );
    fireEvent.change(container.querySelectorAll('select')[1], { target: { value: 'any' } });
    rerender(
      <TranslationProvider language="english">
        <AudienceRequirement grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setAudience={setAudience} trackEvents={trackEvents} />
      </TranslationProvider>,
    );
    expect(container.querySelectorAll('input[type="text"]')).toHaveLength(1);

    const leaf = createAudienceTree().data.children[0];
    const leafView = render(
      <TranslationProvider language="english">
        <AudienceRequirement grandParentNode={null} id="0-0" index={0} parentNode={null} requirement={leaf} setAudience={setAudience} trackEvents={trackEvents} />
      </TranslationProvider>,
    );
    expect(leafView.container.firstElementChild).toBeNull();
  });

  it('groups sibling audience rules, toggles both operators, and flattens the group', () => {
    const tree = createAudienceTree();
    const setAudience = audienceSetter(tree);
    const renderTree = () => (
      <TranslationProvider language="english">
        <AudienceRequirement grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setAudience={setAudience} trackEvents={trackEvents} />
      </TranslationProvider>
    );
    const { container, rerender } = render(renderTree());

    const bracketButton = Array.from(container.querySelectorAll('button')).find((button) => button.querySelector('svg.lucide-brackets'));
    fireEvent.click(bracketButton as HTMLButtonElement);
    rerender(renderTree());
    const nestedNode = tree.data.children[0];
    expect(nestedNode.type).toBe('node');

    fireEvent.click(screen.getAllByRole('button', { name: 'or' })[0]);
    rerender(renderTree());
    fireEvent.click(screen.getAllByRole('button', { name: 'and' })[0]);
    rerender(renderTree());
    expect((nestedNode as Extract<typeof nestedNode, { type: 'node' }>).data.operator).toBe('and');

    const removeButtons = Array.from(container.querySelectorAll('button')).filter((button) => button.querySelector('svg.lucide-trash-2'));
    fireEvent.click(removeButtons.at(-1) as HTMLButtonElement);
    expect(tree.data.children.map((child) => child.type)).toEqual(['string', 'string']);
  });

  it('normalizes negative numeric requirements and clamps event counts', () => {
    const tree = createAudienceTree();
    const setAudience = audienceSetter(tree);
    const renderTree = () => (
      <TranslationProvider language="english">
        <AudienceRequirement grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setAudience={setAudience} trackEvents={trackEvents} />
      </TranslationProvider>
    );
    const { container, rerender } = render(renderTree());

    fireEvent.change(container.querySelectorAll('select')[1], { target: { value: 'number' } });
    rerender(renderTree());
    const numberInputs = container.querySelectorAll('input[type="number"]');
    fireEvent.change(numberInputs[0], { target: { value: '-12' } });
    fireEvent.change(numberInputs[1], { target: { value: '70000' } });
    expect(tree.data.children[0]).toMatchObject({ data: { eventCount: 60000 }, type: 'number' });
    fireEvent.change(numberInputs[1], { target: { value: '' } });
    fireEvent.change(numberInputs[1], { target: { value: '5' } });
    fireEvent.change(numberInputs[2], { target: { value: '' } });

    expect(tree.data.children[0]).toMatchObject({ data: { eventCount: 5, timeAmount: 0, value: 12 }, type: 'number' });
    expect(setAudience).toHaveBeenCalledTimes(6);
  });

  it('updates event, comparator, quantity and time unit while clamping lower bounds', () => {
    const tree = createAudienceTree();
    tree.data.children[0] = {
      data: { comparator: 'atLeast', eventCount: 2, quantityOperator: 'atLeast', timeAmount: 3, timeUnit: 'days', trackEventId: 1, value: 10 },
      type: 'number',
    };
    const setAudience = audienceSetter(tree);
    const extraTrackEvents = [...trackEvents, { id: 2, name: 'Purchase' }];
    const renderTree = () => (
      <TranslationProvider language="english">
        <AudienceRequirement grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setAudience={setAudience} trackEvents={extraTrackEvents} />
      </TranslationProvider>
    );
    const { container } = render(renderTree());
    const selects = container.querySelectorAll('select');
    fireEvent.change(selects[0], { target: { value: '2' } });
    fireEvent.change(selects[2], { target: { value: 'lessThan' } });
    fireEvent.change(selects[3], { target: { value: 'moreThan' } });
    fireEvent.change(selects[4], { target: { value: 'hours' } });

    const numberInputs = container.querySelectorAll('input[type="number"]');
    fireEvent.change(numberInputs[1], { target: { value: '-1' } });
    fireEvent.change(numberInputs[2], { target: { value: '-5' } });
    fireEvent.change(numberInputs[2], { target: { value: '70000' } });

    expect(tree.data.children[0]).toMatchObject({
      data: { comparator: 'lessThan', eventCount: 0, quantityOperator: 'moreThan', timeAmount: 60000, timeUnit: 'hours', trackEventId: 2 },
      type: 'number',
    });
    expect(setAudience).toHaveBeenCalledTimes(7);
  });

  it('converts boolean requirement values from the select control', () => {
    const tree = createAudienceTree();
    const setAudience = audienceSetter(tree);
    const renderTree = () => (
      <TranslationProvider language="english">
        <AudienceRequirement grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setAudience={setAudience} trackEvents={trackEvents} />
      </TranslationProvider>
    );
    const { container, rerender } = render(renderTree());

    fireEvent.change(container.querySelectorAll('select')[1], { target: { value: 'boolean' } });
    rerender(renderTree());
    fireEvent.change(container.querySelectorAll('select')[3], { target: { value: '0' } });

    expect(tree.data.children[0]).toMatchObject({ data: { value: false }, type: 'boolean' });
    expect(setAudience).toHaveBeenCalledTimes(2);
  });

  it('removes a child requirement and keeps the remaining sibling', () => {
    const tree = createAudienceTree();
    const setAudience: (update: (value: TypeAudienceWithOptionalId) => TypeAudienceWithOptionalId) => void = vi.fn();
    const { container } = render(
      <TranslationProvider language="english">
        <AudienceRequirement grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setAudience={setAudience} trackEvents={trackEvents} />
      </TranslationProvider>,
    );

    fireEvent.click(container.querySelectorAll('button')[0]);

    expect(tree.data.children).toEqual([
      { data: { comparator: 'equal', eventCount: 1, quantityOperator: 'atLeast', timeAmount: 1, timeUnit: 'days', trackEventId: 1, value: 'purchase' }, type: 'string' },
    ]);
    expect(setAudience).toHaveBeenCalledOnce();
  });

  it('wraps sibling requirements in a node and flattens it when the other sibling is removed', () => {
    const tree = createAudienceTree();
    const setAudience = audienceSetter(tree);
    const renderTree = () => (
      <TranslationProvider language="english">
        <AudienceRequirement grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setAudience={setAudience} trackEvents={trackEvents} />
      </TranslationProvider>
    );
    const { container, rerender } = render(renderTree());

    const groupButton = Array.from(container.querySelectorAll('button')).find((button) => button.querySelector('svg.lucide-brackets'));
    expect(groupButton).toBeTruthy();
    fireEvent.click(groupButton as HTMLButtonElement);
    rerender(renderTree());
    expect(tree.data.children[0].type).toBe('node');

    const removeButtons = Array.from(container.querySelectorAll('button')).filter((button) => button.querySelector('svg.lucide-trash-2'));
    fireEvent.click(removeButtons.at(-1) as HTMLButtonElement);

    expect(tree.data.children).toHaveLength(2);
    expect(tree.data.children.every((child) => child.type !== 'node')).toBe(true);
    expect(tree.data.operator).toBe('and');
  });

  it('replaces a one-child inner node with its remaining leaf in the grandparent', () => {
    const sourceTree = createAudienceTree();
    const firstLeaf = sourceTree.data.children[0];
    const innerSibling = structuredClone(sourceTree.data.children[1]);
    const outerSibling = structuredClone(sourceTree.data.children[1]);
    const tree: TypeAudienceWithOptionalId['requirements'] = {
      data: {
        children: [{ data: { children: [firstLeaf, innerSibling], operator: 'and' }, type: 'node' }, outerSibling],
        operator: 'or',
      },
      type: 'node',
    };
    const setAudience = audienceSetter(tree);
    const { container } = render(
      <TranslationProvider language="english">
        <AudienceRequirement grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setAudience={setAudience} trackEvents={trackEvents} />
      </TranslationProvider>,
    );
    const removeButtons = Array.from(container.querySelectorAll('button')).filter((button) => button.querySelector('svg.lucide-trash-2'));
    fireEvent.click(removeButtons[0]);

    expect(tree.data.children).toHaveLength(2);
    expect(tree.data.children[0]).toMatchObject({ data: { value: 'purchase' }, type: 'string' });
    expect(tree.data.children.every((child) => child.type !== 'node')).toBe(true);
    expect(setAudience).toHaveBeenCalledOnce();
  });
});

describe('campaign requirement tree', () => {
  it('adds a requirement and switches the group operator', () => {
    const tree = createCampaignTree();
    const setCampaign = campaignSetter(tree);

    const { rerender } = render(
      <TranslationProvider language="english">
        <CampaignRequirement audiences={[]} grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setCampaign={setCampaign} />
      </TranslationProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'New restriction' }));
    expect(tree.data.children).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: 'or' }));
    expect(tree.data.operator).toBe('or');
    rerender(
      <TranslationProvider language="english">
        <CampaignRequirement audiences={[]} grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setCampaign={setCampaign} />
      </TranslationProvider>,
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'and' })[0]);
    expect(tree.data.operator).toBe('and');
    expect(setCampaign).toHaveBeenCalledTimes(3);
  });

  it('does not render a campaign leaf without a parent node', () => {
    const leaf: TypeCampaignWithOptionalId['requirements']['data']['children'][number] = { data: { comparator: 'contains', value: '/sale' }, type: 'url' };
    const { container } = render(
      <TranslationProvider language="english">
        <CampaignRequirement audiences={[]} grandParentNode={null} id="0-0" index={0} parentNode={null} requirement={leaf} setCampaign={vi.fn()} />
      </TranslationProvider>,
    );

    expect(container.firstElementChild).toBeNull();
  });

  it('keeps a campaign group intact when removing one of three rules', () => {
    const tree = createCampaignTree();
    tree.data.children.push({ data: { comparator: 'equal', device: 'mobile' }, type: 'device' });
    const setCampaign = campaignSetter(tree);
    const { container } = render(
      <TranslationProvider language="english">
        <CampaignRequirement audiences={[]} grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setCampaign={setCampaign} />
      </TranslationProvider>,
    );
    const removeButtons = Array.from(container.querySelectorAll('button')).filter((button) => button.querySelector('svg.lucide-trash-2'));
    fireEvent.click(removeButtons[0]);

    expect(tree.data.children).toHaveLength(2);
    expect(tree.data.children.every((child) => child.type !== 'node')).toBe(true);
    expect(setCampaign).toHaveBeenCalledOnce();
  });

  it('changes a requirement to a device rule', () => {
    const tree = createCampaignTree();
    const setCampaign = campaignSetter(tree);
    const { container } = render(
      <TranslationProvider language="english">
        <CampaignRequirement audiences={[]} grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setCampaign={setCampaign} />
      </TranslationProvider>,
    );

    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: '/product' } });
    expect(tree.data.children[0]).toMatchObject({ data: { value: '/product' }, type: 'url' });

    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: 'device' } });

    expect(tree.data.children[0]).toEqual({ data: { comparator: 'equal', device: 'desktop' }, type: 'device' });
    expect(setCampaign).toHaveBeenCalledTimes(2);
  });

  it.each(['audience', 'cookie', 'custom', 'device', 'localStorage', 'queryParam', 'sessionStorage', 'url'] as const)(
    'creates the correct default data when switching to %s',
    (type) => {
      const tree = createCampaignTree();
      const setCampaign = campaignSetter(tree);
      const { container } = render(
        <TranslationProvider language="english">
          <CampaignRequirement
            audiences={[{ id: 5, name: 'Visitors' }]}
            grandParentNode={null}
            id="0"
            index={0}
            parentNode={null}
            requirement={tree}
            setCampaign={setCampaign}
          />
        </TranslationProvider>,
      );

      fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: type } });

      expect(tree.data.children[0].type).toBe(type);
      expect(setCampaign).toHaveBeenCalledOnce();
    },
  );

  it('removes storage values when its comparator only checks existence', () => {
    const tree = createCampaignTree();
    const setCampaign = campaignSetter(tree);
    const renderTree = () => (
      <TranslationProvider language="english">
        <CampaignRequirement audiences={[]} grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setCampaign={setCampaign} />
      </TranslationProvider>
    );
    const { container, rerender } = render(renderTree());

    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: 'localStorage' } });
    rerender(renderTree());
    fireEvent.change(container.querySelectorAll('select')[1], { target: { value: 'exists' } });

    expect(tree.data.children[0]).toEqual({ data: { comparator: 'exists', name: '' }, type: 'localStorage' });
    expect(setCampaign).toHaveBeenCalledTimes(2);
  });

  it('converts a rule to an audience, groups it with its sibling, then flattens the group', () => {
    const tree = createCampaignTree();
    const setCampaign = campaignSetter(tree);
    const audiences = [{ id: 4, name: 'Visitors' }];
    const renderTree = () => (
      <TranslationProvider language="english">
        <CampaignRequirement audiences={audiences} grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setCampaign={setCampaign} />
      </TranslationProvider>
    );
    const { container, rerender } = render(renderTree());

    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: 'audience' } });
    expect(tree.data.children[0]).toEqual({ data: { id: 4 }, type: 'audience' });
    rerender(renderTree());

    const addNodeButton = Array.from(container.querySelectorAll('button')).find((button) => button.querySelector('svg.lucide-brackets'));
    fireEvent.click(addNodeButton as HTMLButtonElement);
    rerender(renderTree());
    expect(tree.data.children[0].type).toBe('node');

    const removeButtons = Array.from(container.querySelectorAll('button')).filter((button) => button.querySelector('svg.lucide-trash-2'));
    fireEvent.click(removeButtons.at(-1) as HTMLButtonElement);

    expect(tree.data.children).toHaveLength(2);
    expect(tree.data.children.map((child) => child.type)).toEqual(['audience', 'url']);
    expect(setCampaign).toHaveBeenCalledTimes(3);
  });

  it('leaves the root intact when removing down to a single leaf', () => {
    const tree = createCampaignTree();
    const setCampaign = campaignSetter(tree);
    const { container } = render(
      <TranslationProvider language="english">
        <CampaignRequirement audiences={[]} grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setCampaign={setCampaign} />
      </TranslationProvider>,
    );

    const removeButtons = Array.from(container.querySelectorAll('button')).filter((button) => button.querySelector('svg.lucide-trash-2'));
    fireEvent.click(removeButtons[1]);

    expect(tree.data.children).toHaveLength(1);
    expect(tree.data.children[0].type).toBe('url');
  });

  it('replaces a one-child nested campaign node in its grandparent', () => {
    const sourceTree = createCampaignTree();
    const firstLeaf = sourceTree.data.children[0];
    const innerSibling = structuredClone(sourceTree.data.children[1]);
    const outerSibling = structuredClone(sourceTree.data.children[1]);
    const tree: TypeCampaignWithOptionalId['requirements'] = {
      data: {
        children: [{ data: { children: [firstLeaf, innerSibling], operator: 'and' }, type: 'node' }, outerSibling],
        operator: 'or',
      },
      type: 'node',
    };
    const setCampaign = campaignSetter(tree);
    const { container } = render(
      <TranslationProvider language="english">
        <CampaignRequirement audiences={[]} grandParentNode={null} id="0" index={0} parentNode={null} requirement={tree} setCampaign={setCampaign} />
      </TranslationProvider>,
    );
    const removeButtons = Array.from(container.querySelectorAll('button')).filter((button) => button.querySelector('svg.lucide-trash-2'));
    fireEvent.click(removeButtons[0]);

    expect(tree.data.children).toHaveLength(2);
    expect(tree.data.children[0]).toMatchObject({ data: { device: 'desktop' }, type: 'device' });
    expect(tree.data.children.every((child) => child.type !== 'node')).toBe(true);
    expect(setCampaign).toHaveBeenCalledOnce();
  });
});
