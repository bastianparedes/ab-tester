'use client';

import { TypeTenant } from '@ab-tester/constants/types/tenant';
import { createContext, type ReactNode, useContext } from 'react';
import type { TypeFullUser } from '@/utils/user/helper';

type TypeAction = 'create' | 'delete' | 'read' | 'update';
type Props = {
  tenantId?: null | TypeTenant['id'];
  feature: 'role' | 'user' | 'audience' | 'campaign' | 'execution-group' | 'track-event' | 'tenant' | 'lifecycle-hook';
  action: TypeAction;
};

export type TypeFullUserForContext = TypeFullUser & {
  getStringPermission: (props: Props) => string;
  hasPermission: (props: Props) => boolean;
};

type UserProviderProps = {
  children: ReactNode;
  user: TypeFullUser;
};

const UserContext = createContext<TypeFullUserForContext | undefined>(undefined);

const UserProvider = ({ children, user }: UserProviderProps) => {
  const getStringPermission = ({ tenantId = null, feature, action }: Props) => {
    if (tenantId === null) return `feature.${feature}.action.${action}`;
    return `tenant.${tenantId}.feature.${feature}.action.${action}`;
  };

  const hasPermission = (props: Props) => {
    if (user.isSuperUser) return true;
    const permission = getStringPermission(props);
    return user.permissions.includes(permission);
  };

  return <UserContext.Provider value={{ ...user, getStringPermission, hasPermission }}>{children}</UserContext.Provider>;
};

const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
};

export { UserProvider, useUser };
