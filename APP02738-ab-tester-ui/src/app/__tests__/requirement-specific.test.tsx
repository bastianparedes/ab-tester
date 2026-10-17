// @vitest-environment jsdom

import type { TypeAudienceWithOptionalId } from '@ab-tester/constants/types/audience';
import type { TypeCampaignWithOptionalId, TypeCustomRequirement } from '@ab-tester/constants/types/campaign';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import AudienceRequirements from '../tenants/[tenantId]/audiences/[audienceId]/components/Requirements';
import BooleanAudienceRequirement from '../tenants/[tenantId]/audiences/[audienceId]/components/Requirements/Requirement/RequirementSpecific/BooleanComponent';
import NumberAudienceRequirement from '../tenants/[tenantId]/audiences/[audienceId]/components/Requirements/Requirement/RequirementSpecific/NumberComponent';
import StringAudienceRequirement from '../tenants/[tenantId]/audiences/[audienceId]/components/Requirements/Requirement/RequirementSpecific/StringComponent';
import AudienceRequirement from '../tenants/[tenantId]/campaigns/[campaignId]/components/Requirements/Requirement/RequirementSpecific/Audience';
import CustomRequirement from '../tenants/[tenantId]/campaigns/[campaignId]/components/Requirements/Requirement/RequirementSpecific/Custom';
import CustomRequirementEditor from '../tenants/[tenantId]/campaigns/[campaignId]/components/Requirements/Requirement/RequirementSpecific/Custom/Editor';
import DeviceRequirement from '../tenants/[tenantId]/campaigns/[campaignId]/components/Requirements/Requirement/RequirementSpecific/Device';
import StorageRequirement from '../tenants/[tenantId]/campaigns/[campaignId]/components/Requirements/Requirement/RequirementSpecific/Storage';
import UrlRequirement from '../tenants/[tenantId]/campaigns/[campaignId]/components/Requirements/Requirement/RequirementSpecific/Url';

vi.mock('@monaco-editor/react', () => ({
  default: ({ onChange, value }: { onChange?: (value: string) => void; value: string }) => (
    <textarea aria-label="JavaScript editor" onChange={(event) => onChange?.(event.target.value)} value={value} />
  ),
}));

afterEach(cleanup);

const renderWithTranslations = (content: React.ReactNode) => render(<TranslationProvider language="english">{content}</TranslationProvider>);

const campaign: TypeCampaignWithOptionalId = {
  executionGroupId: null,
  name: 'Campaign',
  requirements: { data: { children: [], operator: 'and' }, type: 'node' },
  status: 'active',
  tenantId: 12,
  triggers: [],
  variations: [],
};

const audience: TypeAudienceWithOptionalId = {
  name: 'Audience',
  requirements: { data: { children: [], operator: 'and' }, type: 'node' },
  tenantId: 12,
};

const setCampaign = (update: (value: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => update(campaign);
const setAudience = (update: (value: TypeAudienceWithOptionalId) => TypeAudienceWithOptionalId) => update(audience);

describe('campaign requirement-specific controls', () => {
  it('updates the selected audience id', () => {
    const requirement: TypeCampaignWithOptionalId['requirements']['data']['children'][number] = { data: { id: 1 }, type: 'audience' };
    const { container } = renderWithTranslations(
      <AudienceRequirement
        audiences={[
          { id: 1, name: 'Visitors' },
          { id: 2, name: 'Customers' },
        ]}
        requirement={requirement}
        setCampaign={setCampaign}
      />,
    );
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: '2' } });

    expect(requirement.data.id).toBe(2);
  });

  it('updates the name of a custom requirement', () => {
    const requirement: TypeCampaignWithOptionalId['requirements']['data']['children'][number] = {
      data: { javascript: 'async () => { return true; }', name: '' },
      type: 'custom',
    };
    renderWithTranslations(<CustomRequirement requirement={requirement} setCampaign={setCampaign} />);
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Custom rule' } });

    expect(requirement.data.name).toBe('Custom rule');
  });

  it('updates a device condition', () => {
    const requirement: TypeCampaignWithOptionalId['requirements']['data']['children'][number] = { data: { comparator: 'equal', device: 'desktop' }, type: 'device' };
    const { container } = renderWithTranslations(<DeviceRequirement requirement={requirement} setCampaign={setCampaign} />);
    fireEvent.change(container.querySelectorAll('select')[0], { target: { value: 'isNot' } });
    fireEvent.change(container.querySelectorAll('select')[1], { target: { value: 'mobile' } });

    expect(requirement.data).toEqual({ comparator: 'isNot', device: 'mobile' });
  });

  it('rejects a non-device requirement', () => {
    const requirement = { data: { comparator: 'contains', value: '/' }, type: 'url' } as unknown as TypeCampaignWithOptionalId['requirements']['data']['children'][number];

    expect(() => renderWithTranslations(<DeviceRequirement requirement={requirement} setCampaign={setCampaign} />)).toThrow('Type device expected in requirement');
  });

  it.each(['exists', 'doesNotExist'] as const)('hides storage values for the %s comparator', (comparator) => {
    const requirement: TypeCampaignWithOptionalId['requirements']['data']['children'][number] = {
      data: { comparator: 'equal', name: 'experiment', value: 'A' },
      type: 'localStorage',
    };
    const storageView = () => renderWithTranslations(<StorageRequirement requirement={requirement} setCampaign={setCampaign} />);
    const { container, rerender } = storageView();
    const nameInput = container.querySelectorAll('input[type="text"]')[0];
    const valueInput = container.querySelectorAll('input[type="text"]')[1];
    fireEvent.change(nameInput, { target: { value: 'session' } });
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: comparator } });
    fireEvent.change(valueInput, { target: { value: 'ignored' } });
    rerender(
      <TranslationProvider language="english">
        <StorageRequirement requirement={requirement} setCampaign={setCampaign} />
      </TranslationProvider>,
    );

    expect(requirement.data).toEqual({ comparator, name: 'session' });
    expect(container.querySelectorAll('input[type="text"]')).toHaveLength(1);
  });

  it.each(['cookie', 'sessionStorage', 'queryParam'] as const)('accepts the %s storage requirement type and changes its name', (type) => {
    const requirement = {
      data: { comparator: 'equal', name: 'experiment', value: 'A' },
      type,
    } as TypeCampaignWithOptionalId['requirements']['data']['children'][number];
    const { container } = renderWithTranslations(<StorageRequirement requirement={requirement} setCampaign={setCampaign} />);
    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'session' } });

    expect(requirement).toMatchObject({ data: { name: 'session' }, type });
  });

  it('rejects requirements that are not storage types', () => {
    const requirement = { data: { comparator: 'equal', value: '/shop' }, type: 'url' } as unknown as TypeCampaignWithOptionalId['requirements']['data']['children'][number];

    expect(() => renderWithTranslations(<StorageRequirement requirement={requirement} setCampaign={setCampaign} />)).toThrow(
      'Type cookie or localStorage or sessionStorage or queryParam expected in requirement',
    );
  });

  it.each(['contains', 'doesNotContain', 'equal', 'isNot'] as const)('updates storage values with the %s comparator', (comparator) => {
    const requirement: TypeCampaignWithOptionalId['requirements']['data']['children'][number] = {
      data: { comparator: 'equal', name: 'experiment', value: 'A' },
      type: 'localStorage',
    };
    const view = renderWithTranslations(<StorageRequirement requirement={requirement} setCampaign={setCampaign} />);
    fireEvent.change(view.container.querySelector('select') as HTMLSelectElement, { target: { value: comparator } });
    view.rerender(
      <TranslationProvider language="english">
        <StorageRequirement requirement={requirement} setCampaign={setCampaign} />
      </TranslationProvider>,
    );
    fireEvent.change(view.container.querySelectorAll('input[type="text"]')[1], { target: { value: 'B' } });

    expect(requirement.data).toEqual({ comparator, name: 'experiment', value: 'B' });
  });

  it('updates URL comparison values', () => {
    const requirement: TypeCampaignWithOptionalId['requirements']['data']['children'][number] = { data: { comparator: 'contains', value: '/shop' }, type: 'url' };
    const { container } = renderWithTranslations(<UrlRequirement requirement={requirement} setCampaign={setCampaign} />);
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: 'doesNotContain' } });
    fireEvent.change(screen.getByPlaceholderText('Value'), { target: { value: '/sale' } });

    expect(requirement.data).toEqual({ comparator: 'doesNotContain', value: '/sale' });
  });

  it('rejects a non-URL requirement', () => {
    const requirement = {
      data: { comparator: 'equal', device: 'desktop' },
      type: 'device',
    } as unknown as TypeCampaignWithOptionalId['requirements']['data']['children'][number];

    expect(() => renderWithTranslations(<UrlRequirement requirement={requirement} setCampaign={setCampaign} />)).toThrow('Type url expected in requirement');
  });

  it('rejects a non-audience requirement', () => {
    const requirement = { data: { comparator: 'equal', value: '/' }, type: 'url' } as unknown as TypeCampaignWithOptionalId['requirements']['data']['children'][number];

    expect(() => renderWithTranslations(<AudienceRequirement audiences={[]} requirement={requirement} setCampaign={setCampaign} />)).toThrow(
      'Type audience expected in requirement',
    );
  });

  it('rejects a non-custom requirement', () => {
    const requirement = { data: { comparator: 'equal', value: '/' }, type: 'url' } as unknown as TypeCampaignWithOptionalId['requirements']['data']['children'][number];

    expect(() => renderWithTranslations(<CustomRequirement requirement={requirement} setCampaign={setCampaign} />)).toThrow('Type custom expected in requirement');
  });
});

describe('audience requirement-specific controls', () => {
  it('updates string value and comparator', () => {
    const requirement: TypeAudienceWithOptionalId['requirements']['data']['children'][number] = {
      data: { comparator: 'equal', eventCount: 1, quantityOperator: 'atLeast', timeAmount: 1, timeUnit: 'days', trackEventId: 1, value: '' },
      type: 'string',
    };
    const { container } = renderWithTranslations(<StringAudienceRequirement requirement={requirement} setAudience={setAudience} />);
    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'checkout' } });
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: 'contains' } });

    expect(requirement.data).toMatchObject({ comparator: 'contains', value: 'checkout' });
  });

  it('normalizes negative number constraints to positive integers', () => {
    const requirement: TypeAudienceWithOptionalId['requirements']['data']['children'][number] = {
      data: { comparator: 'equal', eventCount: 1, quantityOperator: 'atLeast', timeAmount: 1, timeUnit: 'days', trackEventId: 1, value: 10 },
      type: 'number',
    };
    const { container } = renderWithTranslations(<NumberAudienceRequirement requirement={requirement} setAudience={setAudience} />);
    fireEvent.change(container.querySelector('input[type="number"]') as HTMLInputElement, { target: { value: '-23.8' } });

    expect(requirement.data.value).toBe(24);
  });

  it('normalizes an empty number constraint to zero', () => {
    const requirement: TypeAudienceWithOptionalId['requirements']['data']['children'][number] = {
      data: { comparator: 'equal', eventCount: 1, quantityOperator: 'atLeast', timeAmount: 1, timeUnit: 'days', trackEventId: 1, value: 10 },
      type: 'number',
    };
    const { container } = renderWithTranslations(<NumberAudienceRequirement requirement={requirement} setAudience={setAudience} />);
    fireEvent.change(container.querySelector('input[type="number"]') as HTMLInputElement, { target: { value: '' } });

    expect(requirement.data.value).toBe(0);
  });

  it('converts boolean selector values to booleans', () => {
    const requirement: TypeAudienceWithOptionalId['requirements']['data']['children'][number] = {
      data: { comparator: 'equal', eventCount: 1, quantityOperator: 'atLeast', timeAmount: 1, timeUnit: 'days', trackEventId: 1, value: true },
      type: 'boolean',
    };
    const { container } = renderWithTranslations(<BooleanAudienceRequirement requirement={requirement} setAudience={setAudience} />);
    fireEvent.change(container.querySelectorAll('select')[0], { target: { value: 'equal' } });
    fireEvent.change(container.querySelectorAll('select')[1], { target: { value: '0' } });

    expect(requirement.data.value).toBe(false);
  });

  it('rejects requirements with mismatched audience-specific types', () => {
    const stringRequirement = {
      data: { comparator: 'equal', eventCount: 1, quantityOperator: 'atLeast', timeAmount: 1, timeUnit: 'days', trackEventId: 1, value: '' },
      type: 'string',
    };
    const booleanRequirement = {
      data: { comparator: 'equal', eventCount: 1, quantityOperator: 'atLeast', timeAmount: 1, timeUnit: 'days', trackEventId: 1, value: true },
      type: 'boolean',
    };

    expect(() =>
      renderWithTranslations(
        <BooleanAudienceRequirement
          requirement={stringRequirement as unknown as TypeAudienceWithOptionalId['requirements']['data']['children'][number]}
          setAudience={setAudience}
        />,
      ),
    ).toThrow('Type boolean expected in requirement');
    expect(() =>
      renderWithTranslations(
        <NumberAudienceRequirement
          requirement={stringRequirement as unknown as TypeAudienceWithOptionalId['requirements']['data']['children'][number]}
          setAudience={setAudience}
        />,
      ),
    ).toThrow('Type number expected in requirement');
    expect(() =>
      renderWithTranslations(
        <StringAudienceRequirement
          requirement={booleanRequirement as unknown as TypeAudienceWithOptionalId['requirements']['data']['children'][number]}
          setAudience={setAudience}
        />,
      ),
    ).toThrow('Type string expected in requirement');
  });

  it('renders the audience restrictions section and hides controls for an any requirement', () => {
    const anyRequirement: TypeAudienceWithOptionalId['requirements']['data']['children'][number] = {
      data: { eventCount: 1, quantityOperator: 'atLeast', timeAmount: 1, timeUnit: 'days', trackEventId: 1 },
      type: 'any',
    };
    renderWithTranslations(
      <AudienceRequirements
        requirements={{ data: { children: [anyRequirement], operator: 'and' }, type: 'node' }}
        setAudience={setAudience}
        trackEvents={[{ id: 1, name: 'Checkout' }]}
      />,
    );
    expect(screen.getByText('Restrictions')).toBeTruthy();
    expect(screen.getByText('Restrictions')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Value')).toBeNull();
  });
});

describe('custom requirement code editor', () => {
  it('validates code, discards edits on close and saves valid changes', () => {
    const requirement: TypeCustomRequirement = { data: { javascript: 'async () => { return true; }', name: 'Custom' }, type: 'custom' };
    renderWithTranslations(<CustomRequirementEditor requirement={requirement} setCampaign={setCampaign} />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByRole('textbox', { name: 'JavaScript editor' }), { target: { value: 'invalid (' } });
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByTestId('data-testid-button-closer-modal'));

    fireEvent.click(screen.getByRole('button'));
    expect((screen.getByRole('textbox', { name: 'JavaScript editor' }) as HTMLTextAreaElement).value).toBe('async () => { return true; }');
    fireEvent.change(screen.getByRole('textbox', { name: 'JavaScript editor' }), { target: { value: 'async () => { return false; }' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(requirement.data.javascript).toBe('async () => { return false; }');
  });
});
