// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { TypeFullUser } from '@/utils/user/helper';
import { UserProvider, useUser } from './index';

afterEach(cleanup);

const UserSummary = () => {
  const user = useUser();
  return <p>{user.isLogedIn ? `${user.data.name}: ${user.permissions.join(', ')}` : 'Signed out'}</p>;
};

describe('UserProvider', () => {
  it('provides authenticated user and permissions to descendants', () => {
    const user: TypeFullUser = {
      data: { email: 'ada@example.test', id: 1, name: 'Ada', roles: [] },
      isLogedIn: true,
      permissions: ['feature.user.action.read'],
    };

    render(
      <UserProvider user={user}>
        <UserSummary />
      </UserProvider>,
    );

    expect(screen.getByText('Ada: feature.user.action.read')).toBeTruthy();
  });

  it('provides logged-out state without user data', () => {
    const user: TypeFullUser = { data: null, isLogedIn: false, permissions: [] };

    render(
      <UserProvider user={user}>
        <UserSummary />
      </UserProvider>,
    );

    expect(screen.getByText('Signed out')).toBeTruthy();
  });
});
