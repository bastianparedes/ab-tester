// @vitest-environment jsdom

import type { TypeCampaignForExecutionGroup, TypeCampaignWithOptionalId, TypeTriggerData, TypeVariationData } from '@ab-tester/constants/types/campaign';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import Triggers from '../tenants/[tenantId]/campaigns/[campaignId]/components/Triggers';
import Variations from '../tenants/[tenantId]/campaigns/[campaignId]/components/Variations';
import { Campaigns } from '../tenants/[tenantId]/execution-groups/[executionGroupId]/components/Campaigns';

vi.mock('@monaco-editor/react', () => ({
  default: ({ onChange, value }: { onChange?: (value: string | undefined) => void; value: string }) => (
    <>
      <textarea aria-label="JavaScript editor" onChange={(event) => onChange?.(event.target.value)} value={value} />
      <button type="button" aria-label="Clear editor" onClick={() => onChange?.(undefined)} />
    </>
  ),
}));

afterEach(cleanup);

const createCampaign = (triggers: TypeTriggerData[] = [], variations: TypeVariationData[] = []): TypeCampaignWithOptionalId => ({
  executionGroupId: null,
  name: 'Campaign',
  requirements: { data: { children: [], operator: 'and' }, type: 'node' },
  status: 'active',
  tenantId: 12,
  triggers,
  variations,
});

const firstVariation: TypeVariationData = { css: '', html: '', id: 1, javascript: '', name: 'Control', traffic: 100 };

describe('campaign triggers', () => {
  it('adds a page-load trigger with a new id', () => {
    let campaign = createCampaign([{ data: {}, id: 3, type: 'pageLoad' }]);
    const setCampaign = vi.fn((update: (value: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => {
      campaign = update(campaign);
    });
    render(
      <TranslationProvider language="english">
        <Triggers setCampaign={setCampaign} triggers={campaign.triggers} />
      </TranslationProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'New trigger' }));

    expect(campaign.triggers).toEqual([
      { data: {}, id: 3, type: 'pageLoad' },
      { data: {}, id: 4, type: 'pageLoad' },
    ]);
  });

  it('creates a time-on-page trigger and clamps its duration', () => {
    let campaign = createCampaign([{ data: {}, id: 1, type: 'pageLoad' }]);
    const setCampaign = (update: (value: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => {
      campaign = update(campaign);
    };
    const { container, rerender } = render(
      <TranslationProvider language="english">
        <Triggers setCampaign={setCampaign} triggers={campaign.triggers} />
      </TranslationProvider>,
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'timeOnPage' } });
    rerender(
      <TranslationProvider language="english">
        <Triggers setCampaign={setCampaign} triggers={campaign.triggers} />
      </TranslationProvider>,
    );
    fireEvent.change(container.querySelector('input[type="number"]') as HTMLInputElement, { target: { value: '90000' } });

    expect(campaign.triggers[0]).toEqual({ data: { milliseconds: 60000 }, id: 1, type: 'timeOnPage' });
  });

  it('switches trigger types and clamps negative or invalid durations to zero', () => {
    let campaign = createCampaign([
      { data: {}, id: 1, type: 'pageLoad' },
      { data: { milliseconds: 1000 }, id: 2, type: 'timeOnPage' },
    ]);
    const setCampaign = (update: (value: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => {
      campaign = update(campaign);
    };
    const renderTree = () => (
      <TranslationProvider language="english">
        <Triggers setCampaign={setCampaign} triggers={campaign.triggers} />
      </TranslationProvider>
    );
    const { container, rerender } = render(renderTree());
    const triggerTypes = container.querySelectorAll('select');

    fireEvent.change(triggerTypes[0], { target: { value: 'clickOnElement' } });
    rerender(renderTree());
    const selectorInput = screen.getByPlaceholderText('CSS selector') as HTMLInputElement;
    fireEvent.change(selectorInput, { target: { value: '.checkout' } });
    expect(campaign.triggers[0]).toMatchObject({ data: { selector: '.checkout' }, type: 'clickOnElement' });

    fireEvent.change(container.querySelectorAll('select')[0], { target: { value: 'pageLoad' } });
    rerender(renderTree());
    expect(campaign.triggers[0]).toEqual({ data: {}, id: 1, type: 'pageLoad' });

    const durationInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(durationInput, { target: { value: '-5' } });
    expect(campaign.triggers[1]).toEqual({ data: { milliseconds: 0 }, id: 2, type: 'timeOnPage' });
    fireEvent.change(durationInput, { target: { value: '' } });
    expect(campaign.triggers[1]).toEqual({ data: { milliseconds: 0 }, id: 2, type: 'timeOnPage' });
    expect(screen.getAllByText('OR')).toHaveLength(1);
  });

  it('deletes a trigger from the campaign', () => {
    let campaign = createCampaign([{ data: {}, id: 1, type: 'pageLoad' }]);
    const setCampaign = (update: (value: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => {
      campaign = update(campaign);
    };
    render(
      <TranslationProvider language="english">
        <Triggers setCampaign={setCampaign} triggers={campaign.triggers} />
      </TranslationProvider>,
    );
    fireEvent.click(screen.getAllByRole('button')[1]);

    expect(campaign.triggers).toEqual([]);
  });

  it('validates, discards and saves a custom trigger script', () => {
    let campaign = createCampaign([{ data: { milliseconds: 1000 }, id: 1, type: 'timeOnPage' }]);
    const setCampaign = (update: (value: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => {
      campaign = update(campaign);
    };
    const renderTree = () => (
      <TranslationProvider language="english">
        <Triggers setCampaign={setCampaign} triggers={campaign.triggers} />
      </TranslationProvider>
    );
    const { container, rerender } = render(renderTree());
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: 'custom' } });
    rerender(renderTree());
    expect(campaign.triggers[0]).toMatchObject({ data: { javascript: 'return await new Promise((r) => { r() });', name: '' }, type: 'custom' });

    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[1]);
    fireEvent.change(screen.getByRole('textbox', { name: 'JavaScript editor' }), { target: { value: 'invalid (' } });
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByTestId('data-testid-button-closer-modal'));

    fireEvent.click(container.querySelectorAll('button')[1]);
    fireEvent.change(screen.getByRole('textbox', { name: 'JavaScript editor' }), { target: { value: 'return true;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(campaign.triggers[0]).toMatchObject({ data: { javascript: 'return true;' }, type: 'custom' });
  });
});

describe('campaign variations', () => {
  it('adds a variation and redistributes traffic evenly', () => {
    let campaign = createCampaign([], [firstVariation]);
    const setCampaign = (update: (value: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => {
      campaign = update(campaign);
    };
    render(
      <TranslationProvider language="english">
        <Variations setCampaign={setCampaign} variations={campaign.variations} />
      </TranslationProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'New variation' }));

    expect(campaign.variations.map(({ name, traffic }) => ({ name, traffic }))).toEqual([
      { name: 'Control', traffic: 50 },
      { name: 'Variation 2', traffic: 50 },
    ]);
  });

  it('clamps traffic percentages and redistributes after removal', () => {
    let campaign = createCampaign([], [firstVariation, { ...firstVariation, id: 2, name: 'Variant', traffic: 0 }]);
    const setCampaign = (update: (value: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => {
      campaign = update(campaign);
    };
    const { container } = render(
      <TranslationProvider language="english">
        <Variations setCampaign={setCampaign} variations={campaign.variations} />
      </TranslationProvider>,
    );
    fireEvent.change(container.querySelector('input[type="number"]') as HTMLInputElement, { target: { value: '140' } });
    expect(campaign.variations[0].traffic).toBe(100);

    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[buttons.length - 1]);
    expect(campaign.variations).toHaveLength(1);
    expect(campaign.variations[0].traffic).toBe(100);
  });

  it('updates variation names and normalizes negative or empty traffic', () => {
    let campaign = createCampaign([], [firstVariation]);
    const setCampaign = (update: (value: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => {
      campaign = update(campaign);
    };
    const renderTree = () => (
      <TranslationProvider language="english">
        <Variations setCampaign={setCampaign} variations={campaign.variations} />
      </TranslationProvider>
    );
    const { container, rerender } = render(renderTree());
    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'Treatment' } });
    rerender(renderTree());
    fireEvent.change(container.querySelector('input[type="number"]') as HTMLInputElement, { target: { value: '-15' } });
    rerender(renderTree());
    expect(campaign.variations[0]).toMatchObject({ name: 'Treatment', traffic: 0 });
    fireEvent.change(container.querySelector('input[type="number"]') as HTMLInputElement, { target: { value: '' } });
    rerender(renderTree());
    expect(campaign.variations[0].traffic).toBe(0);

    fireEvent.click(Array.from(container.querySelectorAll('button')).at(-1) as HTMLButtonElement);
    expect(campaign.variations).toEqual([]);
  });

  it('adds a first variation to an empty campaign', () => {
    let campaign = createCampaign();
    const setCampaign = (update: (value: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => {
      campaign = update(campaign);
    };
    render(
      <TranslationProvider language="english">
        <Variations setCampaign={setCampaign} variations={campaign.variations} />
      </TranslationProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'New variation' }));

    expect(campaign.variations).toEqual([{ css: '', html: '', id: 1, javascript: '', name: 'Variation 1', traffic: 100 }]);
  });

  it('saves variation HTML, CSS and valid JavaScript from its editor', () => {
    let campaign = createCampaign([], [{ ...firstVariation, javascript: 'return true;' }]);
    const setCampaign = (update: (value: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => {
      campaign = update(campaign);
    };
    const { container } = render(
      <TranslationProvider language="english">
        <Variations setCampaign={setCampaign} variations={campaign.variations} />
      </TranslationProvider>,
    );
    fireEvent.click(container.querySelectorAll('button')[1]);
    fireEvent.change(screen.getByRole('textbox', { name: 'JavaScript editor' }), { target: { value: 'return false;' } });
    fireEvent.click(screen.getByRole('tab', { name: 'CSS' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'JavaScript editor' }), { target: { value: '.variant { color: red; }' } });
    fireEvent.click(screen.getByRole('tab', { name: 'HTML' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'JavaScript editor' }), { target: { value: '<div>Variant</div>' } });
    fireEvent.click(screen.getByRole('tab', { name: 'JavaScript' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'JavaScript editor' }), { target: { value: 'return false;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(campaign.variations[0]).toMatchObject({ css: '.variant { color: red; }', html: '<div>Variant</div>', javascript: 'return false;' });
  });

  it('normalizes cleared editor values and restores originals when cancelled', () => {
    let campaign = createCampaign([], [{ ...firstVariation, css: '.original {}', html: '<main>Original</main>', javascript: 'return true;' }]);
    const setCampaign = (update: (value: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => {
      campaign = update(campaign);
    };
    const { container } = render(
      <TranslationProvider language="english">
        <Variations setCampaign={setCampaign} variations={campaign.variations} />
      </TranslationProvider>,
    );
    const openEditor = () => fireEvent.click(container.querySelectorAll('button')[1]);
    openEditor();
    fireEvent.click(screen.getByRole('tab', { name: 'HTML' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear editor' }));
    fireEvent.click(screen.getByRole('tab', { name: 'CSS' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear editor' }));
    fireEvent.click(screen.getByRole('tab', { name: 'JavaScript' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear editor' }));
    fireEvent.click(screen.getByTestId('data-testid-button-closer-modal'));

    openEditor();
    fireEvent.click(screen.getByRole('tab', { name: 'HTML' }));
    expect((screen.getByRole('textbox', { name: 'JavaScript editor' }) as HTMLTextAreaElement).value).toBe('<main>Original</main>');
    fireEvent.click(screen.getByRole('tab', { name: 'CSS' }));
    expect((screen.getByRole('textbox', { name: 'JavaScript editor' }) as HTMLTextAreaElement).value).toBe('.original {}');
    fireEvent.click(screen.getByRole('tab', { name: 'JavaScript' }));
    expect((screen.getByRole('textbox', { name: 'JavaScript editor' }) as HTMLTextAreaElement).value).toBe('return true;');
    expect(campaign.variations[0]).toMatchObject({ css: '.original {}', html: '<main>Original</main>', javascript: 'return true;' });
  });
});

describe('execution group campaign selection', () => {
  const allCampaigns: TypeCampaignForExecutionGroup[] = [
    { executionGroupId: null, id: 1, name: 'Alpha', status: 'active', tenantId: 12 },
    { executionGroupId: null, id: 2, name: 'Beta', status: 'inactive', tenantId: 12 },
  ];

  const CampaignPicker = () => {
    const [selected, setSelected] = useState([allCampaigns[0]]);
    return <Campaigns allCampaigns={allCampaigns} selectedCampaigns={selected} setSelectedCampaigns={setSelected} />;
  };

  it('searches, selects and removes campaigns from the group', () => {
    render(
      <TranslationProvider language="english">
        <CampaignPicker />
      </TranslationProvider>,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Beta' } });
    fireEvent.mouseDown(screen.getByRole('button', { name: '(id=2): Beta' }));
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.getByText('Alpha')).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.queryByText('Alpha')).toBeNull();
    expect(screen.getByText('Beta')).toBeTruthy();
  });

  it('shows no matches and closes the campaign dropdown after an outside click', () => {
    const setSelectedCampaigns = vi.fn();
    const { container } = render(
      <TranslationProvider language="english">
        <Campaigns allCampaigns={allCampaigns} selectedCampaigns={[]} setSelectedCampaigns={setSelectedCampaigns} />
      </TranslationProvider>,
    );
    const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    fireEvent.focus(searchInput);
    expect(screen.getByRole('button', { name: '(id=1): Alpha' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '(id=2): Beta' })).toBeTruthy();
    fireEvent.change(searchInput, { target: { value: 'not found' } });

    expect(screen.getByText('No data found')).toBeTruthy();
    fireEvent.mouseDown(document.body);

    expect(screen.queryByText('No data found')).toBeNull();
    expect(setSelectedCampaigns).not.toHaveBeenCalled();
  });
});
