import { TypeTenant } from '@ab-tester/constants/types/tenant';

type TypeAction = 'create' | 'delete' | 'read' | 'update';
type Props = {
  tenantId?: null | TypeTenant['id'];
  feature: 'role' | 'user' | 'audience' | 'campaign' | 'execution-group' | 'track-event' | 'tenant';
  action: TypeAction;
};

export const getStringPermission = ({ tenantId = null, feature, action }: Props) => {
  if (tenantId === null) return `feature.${feature}.action.${action}`;
  return `tenant.${tenantId}.feature.${feature}.action.${action}`;
};
