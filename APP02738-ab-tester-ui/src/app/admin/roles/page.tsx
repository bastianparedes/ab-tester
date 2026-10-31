import { redirect } from 'next/navigation';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import { ClientPage } from './clientPage';

export default async function Page() {
  const [tenantsResponse, response] = await Promise.all([apiCaller.tenants.getAll(), apiCaller.roles.getAll()]);
  if (!tenantsResponse.ok) redirect(constants.pages.logIn());
  if (!response.ok) redirect(constants.pages.logIn());

  const [tenants, roles] = await Promise.all([tenantsResponse.json(), response.json()]);
  return (
    <Navigation breadcrumb={[{ name: 'Roles' }]}>
      <ClientPage initialRoles={roles} tenants={tenants} />
    </Navigation>
  );
}
