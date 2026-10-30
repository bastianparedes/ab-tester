'use client';

import { Building2, Shield, Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import constants from '@/config/constants';

export const ClientPage = () => {
  const user = useUser();

  if (!user.isLogedIn) redirect(constants.pages.logIn());

  const { translation } = useTranslationContext();

  const links = [
    {
      href: constants.pages.tenants(),
      icon: Building2,
      label: translation.common.tenants,
      permission: user.hasPermission({ action: 'read', feature: 'tenant' }),
    },
    {
      href: constants.pages.roles(),
      icon: Shield,
      label: translation.common.roles,
      permission: user.hasPermission({ action: 'read', feature: 'role' }),
    },
    {
      href: constants.pages.users(),
      icon: Users,
      label: translation.common.users,
      permission: user.hasPermission({ action: 'read', feature: 'user' }),
    },
  ];

  const visibleLinks = links.filter((link) => link.permission);

  return (
    <main className="bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleLinks.map(({ href, icon: Icon, label }) => (
            <a
              key={href}
              href={href}
              className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg bg-white p-4 text-center shadow transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Icon aria-hidden="true" className="h-8 w-8 text-blue-600" />
              <span className="text-base font-semibold text-gray-900">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
};
