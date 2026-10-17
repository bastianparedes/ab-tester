// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from '../../index';
import type { Position, Severity } from '../../types/types';
import Toast from '../index';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const positions: Position[] = ['top', 'right-top', 'right', 'right-bottom', 'bottom', 'left-bottom', 'left', 'left-top'];
const severities: Severity[] = ['success', 'information', 'warning', 'error', 'neutral'];
const positionClasses: Record<Position, [string, string]> = {
  bottom: ['bottom-2.5', 'left-1/2'],
  left: ['top-1/2', 'left-2.5'],
  'left-bottom': ['bottom-2.5', 'left-2.5'],
  'left-top': ['top-2.5', 'left-2.5'],
  right: ['top-1/2', 'right-2.5'],
  'right-bottom': ['bottom-2.5', 'right-2.5'],
  'right-top': ['top-2.5', 'right-2.5'],
  top: ['top-2.5', 'left-1/2'],
};

const ToastTrigger = ({ closable = false, position, deletePrevious = false }: { closable?: boolean; position: Position; deletePrevious?: boolean }) => {
  const { emit } = useToast();
  return (
    <button type="button" onClick={() => emit({ closable, deletePrevious, duration: Infinity, position, text: `Toast ${position}` })}>
      Emit {position}
    </button>
  );
};

describe('ToastProvider', () => {
  it.each(positions)('places a toast in the %s position', (position) => {
    render(
      <ToastProvider>
        <ToastTrigger position={position} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: `Emit ${position}` }));

    const toast = screen.getByText(`Toast ${position}`);
    const classes = toast.closest('.fixed')?.className ?? '';
    for (const positionClass of positionClasses[position]) expect(classes).toContain(positionClass);
  });

  it.each(positions)('removes closable toasts from the %s position', (position) => {
    render(
      <ToastProvider>
        <ToastTrigger closable position={position} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: `Emit ${position}` }));
    fireEvent.click(screen.getByTestId('close-button'));

    expect(screen.queryByText(`Toast ${position}`)).toBeNull();
  });

  it('replaces previous toasts and removes closable toasts', () => {
    const Trigger = () => {
      const { emit } = useToast();
      return (
        <>
          <button type="button" onClick={() => emit({ duration: Infinity, text: 'First toast' })}>
            First
          </button>
          <button type="button" onClick={() => emit({ closable: true, deletePrevious: true, duration: Infinity, text: 'Replacement toast' })}>
            Replace
          </button>
        </>
      );
    };

    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'First' }));
    fireEvent.click(screen.getByRole('button', { name: 'Replace' }));

    expect(screen.queryByText('First toast')).toBeNull();
    fireEvent.click(screen.getByTestId('close-button'));
    expect(screen.queryByText('Replacement toast')).toBeNull();
  });

  it('automatically removes a toast after its duration', () => {
    vi.useFakeTimers();
    const Trigger = () => {
      const { emit } = useToast();
      return (
        <button type="button" onClick={() => emit({ duration: 1000, text: 'Temporary toast' })}>
          Emit temporary
        </button>
      );
    };

    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Emit temporary' }));
    expect(screen.getByText('Temporary toast')).toBeTruthy();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByText('Temporary toast')).toBeNull();
  });
});

describe('Toast', () => {
  it.each(severities)('renders the %s severity', (severity) => {
    const { container } = render(<Toast severity={severity} text="Status" />);
    expect(container.firstElementChild?.className).toContain(
      `text-${severity === 'information' ? 'blue' : severity === 'neutral' ? 'gray' : severity === 'error' ? 'red' : severity === 'warning' ? 'yellow' : 'green'}-`,
    );
    expect(screen.queryByTestId('close-button')).toBeNull();
  });

  it('throws a clear error when useToast is called outside its provider', () => {
    const Consumer = () => {
      useToast();
      return null;
    };

    expect(() => render(<Consumer />)).toThrow('useToast must be used inside ToastProvider');
  });
});
