'use client';

import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import { Boxes, Code, Database, Eye, FlaskConical, Tags, Workflow } from 'lucide-react';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import constants, { getStringPermission } from '@/config/constants';

type Props = {
  tenant: TypeTenant;
};

export function ClientPage({ tenant }: Props) {
  const { translation } = useTranslationContext();
  const user = useUser();
  const { id: tenantId } = tenant;

  const links = [
    {
      href: constants.pages.trackEvents({ tenantId }),
      icon: Database,
      label: translation.common.trackEvents,
      permission: getStringPermission({ action: 'read', feature: 'track-event', tenantId }),
    },
    {
      href: constants.pages.audiences({ tenantId }),
      icon: Tags,
      label: translation.common.audiences,
      permission: getStringPermission({ action: 'read', feature: 'audience', tenantId }),
    },
    {
      href: constants.pages.campaigns({ tenantId }),
      icon: FlaskConical,
      label: translation.common.campaigns,
      permission: getStringPermission({ action: 'read', feature: 'campaign', tenantId }),
    },
    {
      href: constants.pages.executionGroups({ tenantId }),
      icon: Boxes,
      label: translation.common.executionGroups,
      permission: getStringPermission({ action: 'read', feature: 'execution-group', tenantId }),
    },
    {
      href: constants.pages.lifecycleHooks({ tenantId }),
      icon: Workflow,
      label: translation.common.lifecycleHooks,
    },
    {
      href: constants.pages.script({ tenantId }),
      icon: Code,
      label: translation.common.scriptAndUrl,
    },
    {
      href: constants.pages.playground({ tenantId }),
      icon: Eye,
      label: translation.common.playground,
    },
  ];

  const visibleLinks = links.filter((link) => !link.permission || user.permissions.includes(link.permission));

  return (
    <main className="bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
          <p className="mt-2 text-gray-600">{tenant.description}</p>
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
}
