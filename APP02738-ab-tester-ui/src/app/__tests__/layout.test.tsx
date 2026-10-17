// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const cookiesMock = vi.hoisted(() => vi.fn());
vi.mock('next/headers', () => ({ cookies: cookiesMock }));

import Layout from '../layout';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('root layout', () => {
  it.each([undefined, { value: 'english' }])('renders children and reads the language cookie (%s)', async (languageCookie) => {
    const getCookie = vi.fn().mockReturnValue(languageCookie);
    cookiesMock.mockResolvedValue({ get: getCookie });

    const layout = await Layout({ children: <main>Page content</main> });
    render(layout);

    expect(getCookie).toHaveBeenCalledOnce();
    expect(screen.getByText('Page content')).toBeTruthy();
    expect(screen.getByText(/Created by/)).toBeTruthy();
  });
});
