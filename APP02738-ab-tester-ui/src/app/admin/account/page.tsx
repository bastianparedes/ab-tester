import { Navigation } from '@/app/_common/components/navigation';
import ClientPage from './clientPage';

export default async function Page() {
  return (
    <Navigation breadcrumb={[{ name: 'Users' }]}>
      <ClientPage />
    </Navigation>
  );
}
