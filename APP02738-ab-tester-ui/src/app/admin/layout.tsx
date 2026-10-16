import type React from 'react';
import { getUserFromCookies } from '@/utils/user';
import { UserProvider } from '../_common/contexts/User';

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getUserFromCookies();

  return <UserProvider user={user}>{children}</UserProvider>;
};

export default Layout;
