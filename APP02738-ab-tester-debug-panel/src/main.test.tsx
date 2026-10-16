// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

it('initializes campaign data and mounts the debug widget', async () => {
  vi.resetModules();

  await import('./main');

  expect(window.ab_tester.campaignsData).toHaveLength(3);
  expect(await screen.findByText('AB Tester Settings')).toBeTruthy();
  expect(document.head.querySelector('style')).toBeTruthy();
});
