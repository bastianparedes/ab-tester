import { redirect } from 'next/navigation';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import { ClientPage } from './clientPage';

export default async function Page() {
  const [usersResponse, rolesResponse] = await Promise.all([apiCaller.users.getAll(), apiCaller.roles.getAll()]);
  if (!usersResponse.ok) redirect(constants.pages.logIn());
  if (!rolesResponse.ok) redirect(constants.pages.logIn());

  const [users, roles] = await Promise.all([usersResponse.json(), rolesResponse.json()]);

  return (
    <Navigation breadcrumb={[{ name: 'Users' }]}>
      <ClientPage initialUsers={users} roles={roles} />
    </Navigation>
  );
}
