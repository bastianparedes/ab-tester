import { redirect } from 'next/navigation';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import { ClientPage } from './clientPage';

export default async function Page() {
  const tenantsResponse = await apiCaller.tenants.getAll();
  if (!tenantsResponse.ok) redirect(constants.pages.logIn());

  const tenants = await tenantsResponse.json();

  const response = await apiCaller.roles.getAll();
  if (!response.ok) redirect(constants.pages.logIn());

  const roles = await response.json();
  return (
    <Navigation breadcrumb={[{ name: 'Roles' }]}>
      <ClientPage initialRoles={roles} tenants={tenants} />
    </Navigation>
  );
}
