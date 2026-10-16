// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DynamicForm, type TypeArgs } from '@/app/_common/contexts/Dialog/Component/DynamicForm';
import { TranslationProvider } from '@/app/_common/contexts/Translation';

afterEach(cleanup);

const renderForm = (args: TypeArgs, resolver = vi.fn()) =>
  render(
    <TranslationProvider language="english">
      <DynamicForm args={args} resolver={resolver} />
    </TranslationProvider>,
  );

describe('DynamicForm field variants', () => {
  it('renders every supported field type and resolves cancellation', () => {
    const resolver = vi.fn();
    const args = {
      email: { label: 'Email', type: 'email', value: 'person@example.test' },
      multiselect: { label: 'Multi', options: [{ label: 'First', value: 'first' }], type: 'multiselect', value: ['first'] },
      number: { label: 'Number', type: 'number', value: 42 },
      password: { label: 'Password', type: 'password', value: 'secret' },
      select: { label: 'Select', options: [{ label: 'First', value: 'first' }], type: 'select', value: 'first' },
      switch: { label: 'Switch', type: 'switch', value: true },
      text: { label: 'Text', type: 'text', value: 'value' },
      textarea: { label: 'Textarea', type: 'textarea', value: 'long value' },
      time: { label: 'Time', type: 'time', value: '12:30' },
    } satisfies TypeArgs;
    const { container } = renderForm(args, resolver);

    expect(container.querySelector('input[type="text"]')).not.toBeNull();
    expect(container.querySelector('textarea')).not.toBeNull();
    expect(container.querySelector('input[type="email"]')).not.toBeNull();
    expect(container.querySelector('input[type="password"]')).not.toBeNull();
    expect(container.querySelector('input[type="time"]')).not.toBeNull();
    expect(container.querySelector('input[type="number"]')).not.toBeNull();
    expect(container.querySelector('input[type="checkbox"]')).not.toBeNull();
    expect(container.querySelector('select')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'First' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(resolver).toHaveBeenCalledWith(null);
  });

  it('renders the empty-state message and submits an empty response', async () => {
    const resolver = vi.fn();
    renderForm({}, resolver);

    expect(screen.getByText('No fields to display')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(resolver).toHaveBeenCalledWith({}));
  });

  it('converts number, switch, select and multiselect values in the response', async () => {
    const resolver = vi.fn();
    renderForm(
      {
        count: { label: 'Count', type: 'number', value: 3 },
        enabled: { label: 'Enabled', type: 'switch', value: true },
        mode: { label: 'Mode', options: [{ label: 'Fast', value: 'fast' }], type: 'select', value: 'fast' },
        roles: { label: 'Roles', options: [{ label: 'Reader', value: 'reader' }], type: 'multiselect', value: ['reader'] },
      },
      resolver,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(resolver).toHaveBeenCalledWith({ count: 3, enabled: true, mode: 'fast', roles: ['reader'] }));
  });

  it('shows validation errors for forbidden values, invalid email and invalid time', async () => {
    const resolver = vi.fn();
    renderForm(
      {
        email: { label: 'Email', type: 'email', value: 'invalid-email' },
        forbidden: { forbiddenValues: ['reserved'], label: 'Forbidden', type: 'text', value: 'reserved' },
        forbiddenEmail: { forbiddenValues: ['blocked@example.test'], label: 'Blocked email', type: 'email', value: 'blocked@example.test' },
        forbiddenPassword: { forbiddenValues: ['reserved'], label: 'Blocked password', type: 'password', value: 'reserved' },
        forbiddenTextarea: { forbiddenValues: ['reserved'], label: 'Blocked notes', type: 'textarea', value: 'reserved' },
        time: { label: 'Time', required: true, type: 'time', value: '' },
      },
      resolver,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(await screen.findAllByText('This value is not allowed')).toHaveLength(4);
    expect(screen.getByText('Invalid email format')).toBeTruthy();
    expect(screen.getByText('This field is required')).toBeTruthy();
    expect(resolver).not.toHaveBeenCalled();
  });

  it('enforces required values for email, password and multiselect fields', async () => {
    const resolver = vi.fn();
    renderForm(
      {
        email: { label: 'Email', required: true, type: 'email', value: '' },
        password: { label: 'Password', required: true, type: 'password', value: '' },
        roles: { label: 'Roles', options: [{ label: 'Reader', value: 'reader' }], required: true, type: 'multiselect', value: [] },
      },
      resolver,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(await screen.findAllByText('This field is required')).toHaveLength(3);
    expect(resolver).not.toHaveBeenCalled();
  });

  it('submits allowed optional text, textarea, email and password values', async () => {
    const resolver = vi.fn();
    renderForm(
      {
        email: { forbiddenValues: ['blocked@example.test'], label: 'Email', type: 'email', value: 'person@example.test' },
        password: { forbiddenValues: ['blocked'], label: 'Password', type: 'password', value: 'secret' },
        text: { forbiddenValues: ['blocked'], label: 'Text', type: 'text', value: 'allowed' },
        textarea: { forbiddenValues: ['blocked'], label: 'Notes', type: 'textarea', value: 'allowed notes' },
        time: { label: 'Time', type: 'time', value: '12:30' },
      },
      resolver,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() =>
      expect(resolver).toHaveBeenCalledWith({
        email: 'person@example.test',
        password: 'secret',
        text: 'allowed',
        textarea: 'allowed notes',
        time: '12:30',
      }),
    );
  });

  it('rejects unsupported field types supplied at runtime', () => {
    const unsupportedArgs = { unknown: { label: 'Unknown', type: 'unknown', value: 'value' } } as unknown as TypeArgs;

    expect(() => renderForm(unsupportedArgs)).toThrow('Unsupported field type');
  });

  it('requires values for number, switch and select fields', async () => {
    const resolver = vi.fn();
    const { container } = renderForm(
      {
        count: { label: 'Count', required: true, type: 'number', value: 1 },
        enabled: { label: 'Enabled', required: true, type: 'switch', value: false },
        mode: { label: 'Mode', options: [{ label: 'Fast', value: 'fast' }], required: true, type: 'select', value: '' },
      },
      resolver,
    );
    fireEvent.change(container.querySelector('input[type="number"]') as HTMLInputElement, { target: { value: '' } });
    fireEvent.click(container.querySelector('input[type="checkbox"]') as HTMLInputElement);
    fireEvent.click(container.querySelector('input[type="checkbox"]') as HTMLInputElement);
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(await screen.findAllByText('This field is required')).toHaveLength(3);
    expect(resolver).not.toHaveBeenCalled();
  });
});
