import { redirect } from 'next/navigation';
import type React from 'react';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import { getUserFromCookies } from '@/utils/user';
import { UserProvider } from '../_common/contexts/User';

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getUserFromCookies();

  if (!user.isLogedIn) redirect(constants.pages.logIn());

  return (
    <UserProvider user={user}>
      <Navigation breadcrumb={[{ name: 'Dashboard' }]}>{children}</Navigation>
    </UserProvider>
  );
};

export default Layout;
