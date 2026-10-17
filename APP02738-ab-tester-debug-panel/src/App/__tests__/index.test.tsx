// @vitest-environment jsdom

import { abTesterCallDebugPanel, abTesterCampaignId, abTesterIgnoreRequirements, abTesterVariationId } from '@ab-tester/constants/debuggerPanel';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const campaignsData = [
  {
    id: 1,
    name: 'Campaign A',
    variations: [
      { id: 11, name: 'Control' },
      { id: 12, name: 'Variant' },
    ],
  },
  {
    id: 2,
    name: 'Campaign B',
    variations: [{ id: 21, name: 'Treatment' }],
  },
];

beforeEach(async () => {
  window.ab_tester = { campaignsData };
  window.sessionStorage.clear();
  vi.resetModules();
  const { default: FloatingWidget } = await import('../index');
  render(<FloatingWidget />);
});

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('FloatingWidget', () => {
  it('shows campaign choices and keeps actions disabled until a variation is selected', () => {
    expect(screen.getByRole('option', { name: 'Campaign A' })).toBeTruthy();
    expect(screen.queryByLabelText('Variation')).toBeNull();
    expect((screen.getByRole('button', { name: 'Apply' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows variations and clears the selected variation when the campaign changes', () => {
    fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Variation'), { target: { value: '12' } });
    expect((screen.getByRole('button', { name: 'Apply' }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: '2' } });

    expect((screen.getByLabelText('Variation') as HTMLSelectElement).value).toBe('null');
    expect(screen.getByRole('option', { name: 'Treatment' })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Apply' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('copies the selected debug URL with the current settings', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Variation'), { target: { value: '12' } });
    fireEvent.click(screen.getByLabelText('Ignore requirements'));

    const header = screen.getByText('AB Tester Settings').parentElement;
    const copyButton = within(header as HTMLElement).getAllByRole('button')[0];
    fireEvent.click(copyButton);

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    const copiedUrl = new URL(writeText.mock.calls[0][0]);
    expect(copiedUrl.searchParams.get(abTesterCampaignId)).toBe('1');
    expect(copiedUrl.searchParams.get(abTesterVariationId)).toBe('12');
    expect(copiedUrl.searchParams.get(abTesterIgnoreRequirements)).toBe('true');
    expect(copiedUrl.searchParams.has(abTesterCallDebugPanel)).toBe(false);
  });

  it('applies the selected configuration when the current URL already matches', () => {
    const targetUrl = new URL(window.location.href);
    targetUrl.searchParams.set(abTesterCampaignId, '1');
    targetUrl.searchParams.set(abTesterVariationId, '12');
    targetUrl.searchParams.set(abTesterIgnoreRequirements, 'false');
    targetUrl.searchParams.set(abTesterCallDebugPanel, 'true');
    window.history.replaceState(null, '', targetUrl.toString());

    fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Variation'), { target: { value: '12' } });

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(window.location.href).toBe(targetUrl.toString());
  });

  it('minimizes the widget and expands it again', () => {
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Minimize' }));
    act(() => vi.advanceTimersByTime(250));

    const expandButton = screen.getByRole('button', { name: 'Expand widget' });
    expect(expandButton.className).toContain('opacity-100');

    fireEvent.click(expandButton);

    const widget = screen.getByText('AB Tester Settings').parentElement?.parentElement;
    expect(widget?.className).toContain('opacity-100');
  });
});
