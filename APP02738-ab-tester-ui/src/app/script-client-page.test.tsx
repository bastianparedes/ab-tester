// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import { ClientPage } from './tenants/[tenantId]/script/clientPage';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const script = 'const answer = 42;';
const renderPage = (scriptText = script) =>
  render(
    <TranslationProvider language="english">
      <ClientPage script={scriptText} url="https://api.example.test/script.js" />
    </TranslationProvider>,
  );

describe('script client page', () => {
  it('formats the script, reports byte metrics, and collapses the preview', async () => {
    renderPage();

    expect(await screen.findByText(script)).toBeTruthy();
    expect(screen.getAllByText(String(script.length))).toHaveLength(2);
    expect(screen.getAllByText(String(new TextEncoder().encode(script).length))).toHaveLength(2);

    const preview = document.getElementById('script-preview');
    expect(preview?.className).not.toContain('max-h-64');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show less' }));
    expect(preview?.className).toContain('max-h-64');
    expect(screen.getByRole('checkbox', { name: 'Show more' })).toBeTruthy();
  });

  it('copies the URL and displayed script to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderPage();

    fireEvent.click(screen.getByTitle('Copy URL'));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://api.example.test/script.js'));

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(script));
    expect(await screen.findByText('Copied')).toBeTruthy();
  });

  it('logs clipboard failures without breaking the page', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('permission denied'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderPage();

    fireEvent.click(screen.getByTitle('Copy URL'));
    await waitFor(() => expect(error).toHaveBeenCalledWith('Copy error:', expect.any(Error)));
    expect(screen.getByText('https://api.example.test/script.js')).toBeTruthy();
  });

  it('falls back to the original script when formatting fails and can disable formatting', async () => {
    const invalidScript = 'function {';
    renderPage(invalidScript);

    expect(await screen.findByText(invalidScript)).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Format code' }));
    expect(screen.getByText(invalidScript)).toBeTruthy();
  });

  it('does not update formatted state after unmount while minify resolves or rejects', async () => {
    const validView = renderPage('function answer(){return 42;}');
    validView.unmount();
    const invalidView = renderPage('function {');
    invalidView.unmount();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it('resets URL and code copy indicators after their timeout', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    vi.useFakeTimers();
    renderPage();

    await act(async () => {
      fireEvent.click(screen.getByTitle('Copy URL'));
      await Promise.resolve();
    });
    expect(screen.getByTitle('Copy URL').querySelector('svg.lucide-check')).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.getByTitle('Copy URL').querySelector('svg.lucide-copy')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
      await Promise.resolve();
    });
    expect(screen.getByText('Copied')).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
  });
});
