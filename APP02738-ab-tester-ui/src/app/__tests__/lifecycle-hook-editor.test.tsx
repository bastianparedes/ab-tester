// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import { apiCaller } from '@/libs/restClient';
import { ClientPage } from '../tenants/[tenantId]/lifecycle-hooks/[lifecycleHookId]/clientPage';
import { createInitialLifecycleHookJavascript } from '../tenants/[tenantId]/lifecycle-hooks/lifecycleHookJavascript';

const validJavaScript = 'async () => { return true; }';

vi.mock('@monaco-editor/react', () => ({
  default: ({ onChange, value }: { onChange?: (value: string | undefined) => void; value: string }) => (
    <>
      <textarea aria-label="Lifecycle JavaScript editor" onChange={(event) => onChange?.(event.target.value)} value={value} />
      <button type="button" aria-label="Clear lifecycle JavaScript" onClick={() => onChange?.(undefined)} />
    </>
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const renderHookEditor = (initialLifecycleHook: Parameters<typeof ClientPage>[0]['initialLifecycleHook']) =>
  render(
    <TranslationProvider language="english">
      <ClientPage initialLifecycleHook={initialLifecycleHook} tenantId={12} />
    </TranslationProvider>,
  );

describe('lifecycle hook editor', () => {
  it('keeps save disabled until both name and async-arrow code are valid', () => {
    renderHookEditor({ javascript: 'invalid (', name: '', status: 'inactive', tenantId: 12, trigger: 'scriptStart' });

    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Lifecycle hook name'), { target: { value: 'Initialize' } });
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByRole('textbox', { name: 'Lifecycle JavaScript editor' }), { target: { value: validJavaScript } });
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows a syntax alert for malformed JavaScript', () => {
    renderHookEditor({ javascript: 'invalid (', name: 'Hook', status: 'inactive', tenantId: 12, trigger: 'scriptStart' });

    expect(screen.getByRole('alert').textContent).toContain('syntax errors');
  });

  it('normalizes an undefined Monaco change to empty JavaScript', () => {
    renderHookEditor({ javascript: validJavaScript, name: 'Hook', status: 'inactive', tenantId: 12, trigger: 'scriptStart' });
    fireEvent.click(screen.getByRole('button', { name: 'Clear lifecycle JavaScript' }));

    expect((screen.getByRole('textbox', { name: 'Lifecycle JavaScript editor' }) as HTMLTextAreaElement).value).toBe('');
    expect(screen.getByRole('alert').textContent).toContain('syntax errors');
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('trims the hook name, sends the selected trigger and reports API failures', async () => {
    const create = vi.spyOn(apiCaller.lifecycleHooks, 'create').mockResolvedValue(new Response('{}', { status: 500 }));
    renderHookEditor({ javascript: validJavaScript, name: '  Initialize  ', status: 'inactive', tenantId: 12, trigger: 'scriptStart' });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        body: { javascript: validJavaScript, name: 'Initialize', option: 'scriptStart', status: 'inactive' },
        pathParams: { tenantId: 12 },
      }),
    );
    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('updates an existing hook with its selected status and trigger', async () => {
    const update = vi.spyOn(apiCaller.lifecycleHooks, 'update').mockResolvedValue(new Response('{}', { status: 500 }));
    renderHookEditor({ id: 7, javascript: validJavaScript, name: 'Hook', status: 'inactive', tenantId: 12, trigger: 'scriptStart' });
    fireEvent.change(screen.getByLabelText('Lifecycle hook status'), { target: { value: 'active' } });
    fireEvent.click(screen.getByLabelText('Run at the start of each campaign'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        body: { javascript: createInitialLifecycleHookJavascript('campaignStart'), name: 'Hook', option: 'campaignStart', status: 'active' },
        pathParams: { lifecycleHookId: 7, tenantId: 12 },
      }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain('Could not save the lifecycle hook.');
  });

  it('shows the unexpected-error message when the API throws', async () => {
    vi.spyOn(apiCaller.lifecycleHooks, 'create').mockRejectedValue(new Error('offline'));
    renderHookEditor({ javascript: validJavaScript, name: 'Hook', status: 'inactive', tenantId: 12, trigger: 'scriptStart' });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect((await screen.findByRole('alert')).textContent).toContain('An error occurred while saving the lifecycle hook.');
  });

  it('redirects to the hook list after a successful update', async () => {
    const update = vi.spyOn(apiCaller.lifecycleHooks, 'update').mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('location', { href: '' });
    renderHookEditor({ id: 7, javascript: validJavaScript, name: 'Hook', status: 'active', tenantId: 12, trigger: 'campaignStart' });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(update).toHaveBeenCalledOnce());
    await waitFor(() => expect(location.href).toBe('/tenants/12/lifecycle-hooks'));
  });

  it('creates a hook successfully and accepts an inactive status selection', async () => {
    const response = new Response('{}', { status: 200 });
    const responseOk = vi.spyOn(response, 'ok', 'get').mockReturnValue(true);
    const create = vi.spyOn(apiCaller.lifecycleHooks, 'create').mockResolvedValue(response);
    vi.stubGlobal('location', { href: '' });
    renderHookEditor({ javascript: validJavaScript, name: 'Hook', status: 'active', tenantId: 12, trigger: 'scriptStart' });
    fireEvent.change(screen.getByLabelText('Lifecycle hook status'), { target: { value: 'inactive' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        body: { javascript: validJavaScript, name: 'Hook', option: 'scriptStart', status: 'inactive' },
        pathParams: { tenantId: 12 },
      }),
    );
    expect(responseOk).toHaveBeenCalled();
    await waitFor(() => expect(location.href).toBe('/tenants/12/lifecycle-hooks'));
  });

  it('redirects to the hook list when exiting without saving', () => {
    vi.stubGlobal('location', { href: '' });
    renderHookEditor({ javascript: validJavaScript, name: 'Hook', status: 'active', tenantId: 12, trigger: 'scriptStart' });
    fireEvent.click(screen.getByRole('button', { name: 'Exit' }));

    expect(location.href).toBe('/tenants/12/lifecycle-hooks');
  });
});
