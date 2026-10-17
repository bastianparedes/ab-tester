// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Loader } from '../Component';
import { useLoaderStore } from '../state';

describe('Loader', () => {
  beforeEach(() => useLoaderStore.setState({ counter: 1 }));
  afterEach(() => {
    cleanup();
    useLoaderStore.setState({ counter: 1 });
  });

  it('shows the overlay while there are outstanding operations', () => {
    useLoaderStore.setState({ counter: 2 });
    const { container } = render(<Loader />);

    expect(container.querySelector('.fixed')).not.toBeNull();
    expect(useLoaderStore.getState().counter).toBe(1);
  });

  it('hides the overlay after the final operation is cleared', () => {
    const { container } = render(<Loader />);

    expect(container.querySelector('.fixed')).toBeNull();
    expect(useLoaderStore.getState().counter).toBe(0);
  });
});
