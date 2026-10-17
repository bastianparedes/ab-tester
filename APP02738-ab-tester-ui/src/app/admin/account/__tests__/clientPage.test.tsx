// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import { UserProvider } from '@/app/_common/contexts/User';
import { apiCaller } from '@/libs/restClient';
import type { TypeFullUser } from '@/utils/user/helper';
import SettingsPage from '../clientPage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const renderSettings = () => {
  const user: TypeFullUser = {
    data: { email: 'ada@example.test', id: 1, name: 'Ada', roles: [] },
    isLogedIn: true,
    permissions: [],
  };

  return render(
    <TranslationProvider language="english">
      <UserProvider user={user}>
        <SettingsPage />
      </UserProvider>
    </TranslationProvider>,
  );
};

describe('account settings page', () => {
  it('submits profile changes to the account API', async () => {
    const updateAccount = vi.spyOn(apiCaller.users, 'updateAccount').mockResolvedValue(new Response('{}', { status: 500 }));
    renderSettings();
    fireEvent.change(screen.getByPlaceholderText('e.g. Jane Smith'), { target: { value: 'Bea' } });
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'bea@example.test' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save changes' })[0]);

    await waitFor(() => expect(updateAccount).toHaveBeenCalledWith({ body: { email: 'bea@example.test', name: 'Bea' } }));
  });

  it('blocks mismatched passwords and resets fields after a valid save', async () => {
    const updatePassword = vi.spyOn(apiCaller.users, 'updatePassword').mockResolvedValue(new Response('{}', { status: 500 }));
    const { container } = renderSettings();
    const saveButtons = screen.getAllByRole('button', { name: 'Save changes' });
    const passwordInputs = container.querySelectorAll('input[type="password"]');

    fireEvent.change(passwordInputs[1], { target: { value: '' } });
    fireEvent.change(passwordInputs[2], { target: { value: '' } });
    expect((saveButtons[1] as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(passwordInputs[0], { target: { value: 'old-secret' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'new-secret' } });
    fireEvent.change(passwordInputs[2], { target: { value: 'different-secret' } });
    expect((saveButtons[1] as HTMLButtonElement).disabled).toBe(true);
    expect(updatePassword).not.toHaveBeenCalled();

    fireEvent.change(passwordInputs[2], { target: { value: 'new-secret' } });
    expect((saveButtons[1] as HTMLButtonElement).disabled).toBe(false);
    const visibilityToggle = passwordInputs[0].parentElement?.querySelector('button') as HTMLButtonElement;
    fireEvent.click(visibilityToggle);
    expect((passwordInputs[0] as HTMLInputElement).type).toBe('text');
    fireEvent.click(visibilityToggle);
    expect((passwordInputs[0] as HTMLInputElement).type).toBe('password');
    fireEvent.click(saveButtons[1]);

    await waitFor(() => expect(updatePassword).toHaveBeenCalledWith({ body: { newPassword: 'new-secret', oldPassword: 'old-secret' } }));
    await waitFor(() => expect((container.querySelector('input[type="password"]') as HTMLInputElement).value).toBe(''));
  });
});
