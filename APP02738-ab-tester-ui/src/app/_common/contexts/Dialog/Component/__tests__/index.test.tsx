// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import { useDialogStore } from '../../state';
import { DynamicDialog } from '../index';

describe('DynamicDialog', () => {
  beforeEach(() => {
    useDialogStore.setState({
      data: null,
      description: null,
      isOpen: false,
      resolver: () => {},
      title: null,
    });
  });

  afterEach(() => {
    cleanup();
    useDialogStore.setState({ data: null, description: null, isOpen: false, resolver: () => {}, title: null });
  });

  const renderDialog = () =>
    render(
      <TranslationProvider language="english">
        <DynamicDialog />
      </TranslationProvider>,
    );

  it('opens a confirmation, resolves it, and removes the dialog', async () => {
    renderDialog();
    expect(screen.queryByText('Delete campaign?')).toBeNull();

    let confirmation!: Promise<boolean | null>;
    act(() => {
      confirmation = useDialogStore.getState().confirm({ title: 'Delete campaign?' });
    });

    expect(screen.getByText('Delete campaign?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await expect(confirmation).resolves.toBe(true);
    await waitFor(() => expect(screen.queryByText('Delete campaign?')).toBeNull());
  });

  it('renders a dynamic form and resolves cancellation', async () => {
    const result = useDialogStore.getState().getDataFromForm({ title: 'Edit user' }, { name: { label: 'Name', type: 'text', value: 'Ada' } } as const);
    renderDialog();

    expect(screen.getByText('Name')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await expect(result).resolves.toBeNull();
  });
});
