'use client';

import { createContext, type ReactNode, useContext } from 'react';
import type { TypeFullUser } from '@/utils/user/helper';

type UserProviderProps = {
  children: ReactNode;
  user: TypeFullUser;
};

const UserContext = createContext<TypeFullUser | undefined>(undefined);

const UserProvider = ({ children, user }: UserProviderProps) => {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
};

export { UserProvider, useUser };
