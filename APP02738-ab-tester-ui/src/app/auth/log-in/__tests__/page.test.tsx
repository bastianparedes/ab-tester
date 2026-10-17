// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import { apiCaller } from '@/libs/restClient';
import Page from '../page';

describe('login page', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const renderPage = () =>
    render(
      <TranslationProvider language="english">
        <Page />
      </TranslationProvider>,
    );

  it('shows required-field validation without making an API request', async () => {
    const logIn = vi.spyOn(apiCaller.sessions, 'logIn');
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Email is required')).toBeTruthy();
    expect(screen.getByText('Password is required')).toBeTruthy();
    expect(logIn).not.toHaveBeenCalled();
  });

  it('shows invalid credentials after a rejected login response', async () => {
    const logIn = vi.spyOn(apiCaller.sessions, 'logIn').mockResolvedValue({ ok: false });
    renderPage();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'incorrect' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Incorrect username or password. Please try again.')).toBeTruthy();
    expect(logIn).toHaveBeenCalledWith({ body: { email: 'ana@example.test', password: 'incorrect' } });
  });

  it('redirects to tenants after a successful login', async () => {
    vi.spyOn(apiCaller.sessions, 'logIn').mockResolvedValue(new Response(null, { status: 200 }) as Awaited<ReturnType<typeof apiCaller.sessions.logIn>>);
    vi.stubGlobal('location', { href: '' });
    renderPage();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await vi.waitFor(() => expect(location.href).toBe('/tenants'));
  });
});
