// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmForm } from '@/app/_common/contexts/Dialog/Component/ConfirmForm';
import { DynamicForm } from '@/app/_common/contexts/Dialog/Component/DynamicForm';
import { TranslationProvider } from '@/app/_common/contexts/Translation';
import { Button } from './button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { FormSection } from './FormSection';
import { Input } from './input';
import Modal from './Modal';
import MultiSelect from './Multiselect';
import { Pagination } from './Pagination';
import Shadow from './Shadow';
import { Switch } from './switch';
import { Textarea } from './textarea';

afterEach(cleanup);

describe('Button', () => {
  it('forwards native props and click events to a button', () => {
    const onClick = vi.fn();
    render(
      <Button className="test-class" onClick={onClick} size="sm" type="submit" variant="destructive">
        Save
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.getAttribute('type')).toBe('submit');
    expect(button.className).toContain('bg-red-500');
    expect(button.className).toContain('test-class');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders an anchor when href is provided', () => {
    render(<Button href="/campaigns">Campaigns</Button>);

    expect(screen.getByRole('link', { name: 'Campaigns' }).getAttribute('href')).toBe('/campaigns');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('does not invoke click handlers while disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Submit
      </Button>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Pagination', () => {
  it('disables previous on the first page and reports a selected page', () => {
    const onChange = vi.fn();
    render(<Pagination onChange={onChange} page={0} totalPages={10} />);

    const buttons = screen.getAllByRole('button') as HTMLButtonElement[];
    expect(buttons[0].disabled).toBe(true);
    expect(buttons.at(-1)?.disabled).toBe(false);
    fireEvent.click(buttons[2]);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('disables next on the last page and marks skipped page ranges', () => {
    render(<Pagination onChange={() => {}} page={9} totalPages={10} />);

    const buttons = screen.getAllByRole('button') as HTMLButtonElement[];
    expect(buttons.at(-1)?.disabled).toBe(true);
    expect(screen.getAllByText('...')).toHaveLength(1);
  });

  it('disables both directions when there is only one page', () => {
    render(<Pagination onChange={() => {}} page={0} totalPages={1} />);

    const buttons = screen.getAllByRole('button') as HTMLButtonElement[];
    expect(buttons[0].disabled).toBe(true);
    expect(buttons.at(-1)?.disabled).toBe(true);
  });

  it('navigates backward and forward with the arrow buttons', () => {
    const onChange = vi.fn();
    render(<Pagination onChange={onChange} page={1} totalPages={3} />);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onChange).toHaveBeenLastCalledWith(0);
    fireEvent.click(buttons[buttons.length - 1]);
    expect(onChange).toHaveBeenLastCalledWith(2);
  });
});

describe('form controls', () => {
  it('forwards labels and validation attributes to inputs', () => {
    render(
      <label htmlFor="email">
        Email
        <Input id="email" required type="email" />
      </label>,
    );

    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input.getAttribute('type')).toBe('email');
    expect((input as HTMLInputElement).required).toBe(true);
  });

  it('renders a controlled switch as a checkbox and forwards changes', () => {
    const onChange = vi.fn();
    render(<Switch aria-label="Enabled" checked={false} onChange={onChange} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Enabled' });
    expect((checkbox as HTMLInputElement).checked).toBe(false);
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('preserves textarea values and wraps content in a semantic section', () => {
    const { container } = render(
      <FormSection>
        <label htmlFor="notes">Notes</label>
        <Textarea id="notes" defaultValue="Initial notes" />
      </FormSection>,
    );

    expect(container.querySelector('section')).not.toBeNull();
    expect((screen.getByRole('textbox', { name: 'Notes' }) as HTMLTextAreaElement).value).toBe('Initial notes');
  });
});

describe('Card', () => {
  it('renders nested card sections with stable slots', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Campaign</CardTitle>
          <CardDescription>Experiment summary</CardDescription>
          <CardAction>Actions</CardAction>
        </CardHeader>
        <CardContent>Draft</CardContent>
        <CardFooter>Updated just now</CardFooter>
      </Card>,
    );

    expect(screen.getByText('Campaign').getAttribute('data-slot')).toBe('card-title');
    expect(screen.getByText('Experiment summary').getAttribute('data-slot')).toBe('card-description');
    expect(screen.getByText('Actions').getAttribute('data-slot')).toBe('card-action');
    expect(screen.getByText('Draft').getAttribute('data-slot')).toBe('card-content');
    expect(screen.getByText('Updated just now').getAttribute('data-slot')).toBe('card-footer');
  });
});

describe('Modal', () => {
  it('closes through its close button and backdrop, but not from inner content', () => {
    const setModalVisible = vi.fn();
    render(
      <Modal setModalVisible={setModalVisible}>
        <span>Modal content</span>
      </Modal>,
    );

    fireEvent.click(screen.getByText('Modal content'));
    expect(setModalVisible).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('data-testid-shadow'));
    expect(setModalVisible).toHaveBeenCalledWith(false);

    setModalVisible.mockClear();
    fireEvent.click(screen.getByTestId('data-testid-button-closer-modal'));
    expect(setModalVisible).toHaveBeenCalledWith(false);
  });
});

describe('Shadow', () => {
  it('closes through the backdrop and supports optional blur and callback props', () => {
    const setVisible = vi.fn();
    const { rerender } = render(
      <Shadow blur setVisible={setVisible}>
        <span>Overlay content</span>
      </Shadow>,
    );
    const backdrop = screen.getByTestId('data-testid-shadow');
    expect(backdrop.className).toContain('backdrop-blur');
    fireEvent.click(backdrop);
    expect(setVisible).toHaveBeenCalledWith(false);

    rerender(
      <Shadow setVisible={setVisible}>
        <span>Overlay content</span>
      </Shadow>,
    );
    expect(screen.getByTestId('data-testid-shadow').className).not.toContain('backdrop-blur');
    fireEvent.click(screen.getByTestId('data-testid-shadow'));
    expect(setVisible).toHaveBeenCalledTimes(2);

    rerender(
      <Shadow>
        <span>Overlay content</span>
      </Shadow>,
    );
    fireEvent.click(screen.getByTestId('data-testid-shadow'));
    expect(setVisible).toHaveBeenCalledTimes(2);
  });
});

describe('MultiSelect', () => {
  const options = [
    { label: 'Alpha', value: 'alpha' },
    { label: 'Beta', value: 'beta' },
  ];

  const renderMultiSelect = (value: string[], onChange = vi.fn()) => {
    render(
      <TranslationProvider language="english">
        <MultiSelect onChange={onChange} options={options} placeholder="Choose options" value={value} />
      </TranslationProvider>,
    );
    return onChange;
  };

  it('filters options by label and returns the added selection', () => {
    const onChange = renderMultiSelect(['alpha']);
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'be' } });

    expect(screen.queryByRole('checkbox', { name: 'Alpha' })).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith(['alpha', 'beta']);
  });

  it('returns the remaining values when removing a selection', () => {
    const onChange = renderMultiSelect(['alpha', 'beta']);
    fireEvent.click(screen.getByRole('button', { name: 'Alpha, Beta' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Alpha' }));

    expect(onChange).toHaveBeenCalledWith(['beta']);
  });

  it('closes the options when the user clicks outside', () => {
    renderMultiSelect([]);
    fireEvent.click(screen.getByRole('button', { name: 'Choose options' }));
    expect(screen.getByRole('checkbox', { name: 'Alpha' })).toBeTruthy();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('checkbox', { name: 'Alpha' })).toBeNull();
  });
});

describe('ConfirmForm', () => {
  const renderConfirmForm = (resolver: (confirmed: boolean) => void) =>
    render(
      <TranslationProvider language="english">
        <ConfirmForm resolver={resolver} />
      </TranslationProvider>,
    );

  it('resolves accepted confirmations as true', () => {
    const resolver = vi.fn();
    renderConfirmForm(resolver);
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(resolver).toHaveBeenCalledWith(true);
  });

  it('resolves cancelled confirmations as false', () => {
    const resolver = vi.fn();
    renderConfirmForm(resolver);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(resolver).toHaveBeenCalledWith(false);
  });
});

describe('DynamicForm', () => {
  const renderForm = (args: Parameters<typeof DynamicForm>[0]['args'], resolver: (result: unknown) => void) =>
    render(
      <TranslationProvider language="english">
        <DynamicForm args={args} resolver={resolver} />
      </TranslationProvider>,
    );

  it('blocks submission of an empty required field and displays its validation message', async () => {
    const resolver = vi.fn();
    renderForm({ name: { label: 'Name', required: true, type: 'text', value: '' } }, resolver);
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(await screen.findByText('This field is required')).toBeTruthy();
    expect(resolver).not.toHaveBeenCalled();
  });

  it('submits updated text and select values as a response object', async () => {
    const resolver = vi.fn();
    const { container } = renderForm(
      {
        name: { label: 'Name', type: 'text', value: 'Ada' },
        role: {
          label: 'Role',
          options: [
            { label: 'Reader', value: 'reader' },
            { label: 'Admin', value: 'admin' },
          ],
          type: 'select',
          value: 'reader',
        },
      },
      resolver,
    );

    fireEvent.change(container.querySelector('input[type="text"]') as HTMLInputElement, { target: { value: 'Bea' } });
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(resolver).toHaveBeenCalledWith({ name: 'Bea', role: 'admin' }));
  });

  it('resolves cancellation with null', () => {
    const resolver = vi.fn();
    renderForm({ name: { label: 'Name', type: 'text', value: 'Ada' } }, resolver);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(resolver).toHaveBeenCalledWith(null);
  });
});
