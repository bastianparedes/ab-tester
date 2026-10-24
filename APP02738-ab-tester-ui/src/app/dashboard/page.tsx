import { redirect } from 'next/navigation';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import { getUserFromCookies } from '@/utils/user';
import { UserProvider } from '../_common/contexts/User';
import { ClientPage } from './clientPage';

const Layout = async () => {
  const user = await getUserFromCookies();

  if (!user.isLogedIn) redirect(constants.pages.logIn());

  return (
    <UserProvider user={user}>
      <Navigation breadcrumb={[{ name: 'Dashboard' }]}>
        <ClientPage />
      </Navigation>
    </UserProvider>
  );
};

export default Layout;
