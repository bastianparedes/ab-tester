import { beforeEach, describe, expect, it } from 'vitest';
import { useDialogStore } from '../state';

const initialResolver = useDialogStore.getState().resolver;

describe('useDialogStore', () => {
  beforeEach(() => {
    useDialogStore.setState({
      data: null,
      description: null,
      isOpen: false,
      resolver: initialResolver,
      title: null,
    });
  });

  it('resolves a confirmation and clears dialog state', async () => {
    const confirmation = useDialogStore.getState().confirm({ description: 'Proceed with the change?', title: 'Confirm' });

    expect(useDialogStore.getState()).toMatchObject({
      data: { type: 'confirmDialog' },
      description: 'Proceed with the change?',
      isOpen: true,
      title: 'Confirm',
    });

    useDialogStore.getState().completeResolver(true);

    await expect(confirmation).resolves.toBe(true);
    expect(useDialogStore.getState()).toMatchObject({ data: null, description: null, isOpen: false, title: null });
  });

  it('returns dynamic form data through its resolver', async () => {
    const args = {
      name: { label: 'Name', type: 'text', value: 'Ana' },
    } as const;
    const formResult = useDialogStore.getState().getDataFromForm({ title: 'Edit user' }, args);

    expect(useDialogStore.getState()).toMatchObject({
      data: { args, type: 'dynamicDialog' },
      isOpen: true,
      title: 'Edit user',
    });

    useDialogStore.getState().completeResolver({ name: 'Bea' });

    await expect(formResult).resolves.toEqual({ name: 'Bea' });
    expect(useDialogStore.getState()).toMatchObject({ data: null, isOpen: false, title: null });
  });

  it('sets optional title and description only when supplied', async () => {
    const args = { name: { label: 'Name', type: 'text', value: 'Ana' } } as const;
    const formResult = useDialogStore.getState().getDataFromForm({ description: 'Edit a name', title: 'Edit' }, args);

    expect(useDialogStore.getState()).toMatchObject({ description: 'Edit a name', title: 'Edit' });
    useDialogStore.getState().completeResolver({ name: 'Bea' });
    await expect(formResult).resolves.toEqual({ name: 'Bea' });

    const formWithoutDetails = useDialogStore.getState().getDataFromForm({}, args);
    expect(useDialogStore.getState()).toMatchObject({ description: null, title: null });
    useDialogStore.getState().completeResolver(null);
    await expect(formWithoutDetails).resolves.toBeNull();

    const confirmationWithoutDetails = useDialogStore.getState().confirm({});
    expect(useDialogStore.getState()).toMatchObject({ description: null, title: null });
    useDialogStore.getState().completeResolver(false);
    await expect(confirmationWithoutDetails).resolves.toBe(false);
  });

  it('safely completes a dialog before a resolver has been registered', () => {
    expect(() => useDialogStore.getState().completeResolver(null)).not.toThrow();
    expect(useDialogStore.getState()).toMatchObject({ data: null, isOpen: false, title: null });
  });
});
