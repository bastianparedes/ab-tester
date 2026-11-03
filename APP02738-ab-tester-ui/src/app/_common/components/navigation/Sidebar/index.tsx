'use client';

import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import { Boxes, Building2, ChevronDown, Code, Database, Eye, FlaskConical, Shield, Tags, Users, Workflow } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import constants from '@/config/constants';
import { ComponentLanguage } from './Language';

type Props = {
  children: React.ReactNode;
  tenant?: TypeTenant;
};

export function Sidebar({ children, tenant }: Props) {
  const { translation } = useTranslationContext();
  const user = useUser();
  const [isTestingExpanded, setIsTestingExpanded] = useState(true);
  const [isAdministrationExpanded, setIsAdministrationExpanded] = useState(true);
  const administrationItems = [
    { feature: 'tenant', href: constants.pages.tenants(), icon: Building2, label: translation.common.tenants },
    { feature: 'role', href: constants.pages.roles(), icon: Shield, label: translation.common.roles },
    { feature: 'user', href: constants.pages.users(), icon: Users, label: translation.common.users },
  ] as const;
  const visibleAdministrationItems = administrationItems.filter(({ feature }) => user.hasPermission({ action: 'read', feature }));
  const testingItems = tenant
    ? [
        { feature: 'track-event' as const, href: constants.pages.trackEvents({ tenantId: tenant.id }), icon: Database, label: translation.common.trackEvents },
        { feature: 'audience' as const, href: constants.pages.audiences({ tenantId: tenant.id }), icon: Tags, label: translation.common.audiences },
        { feature: 'campaign' as const, href: constants.pages.campaigns({ tenantId: tenant.id }), icon: FlaskConical, label: translation.common.campaigns },
        {
          feature: 'execution-group' as const,
          href: constants.pages.executionGroups({ tenantId: tenant.id }),
          icon: Boxes,
          label: translation.common.executionGroups,
        },
        {
          feature: 'lifecycle-hook' as const,
          href: constants.pages.lifecycleHooks({ tenantId: tenant.id }),
          icon: Workflow,
          label: translation.common.lifecycleHooks,
        },
        { feature: null, href: constants.pages.script({ tenantId: tenant.id }), icon: Code, label: translation.common.scriptAndUrl },
        { feature: null, href: constants.pages.playground({ tenantId: tenant.id }), icon: Eye, label: translation.common.playground },
      ]
    : [];
  const visibleTestingItems = tenant ? testingItems.filter(({ feature }) => feature === null || user.hasPermission({ action: 'read', feature, tenantId: tenant.id })) : [];

  return (
    <div className="flex min-h-[calc(100svh-40px)] bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 p-4">
            {/* Language Section */}

            <div className="mb-6">
              <div className="text-md font-semibold text-gray-400 uppercase mb-2 px-2">{translation.common.language}</div>
              <ComponentLanguage />
            </div>

            {/* AB Tests Section */}

            {tenant && (
              <div className="mb-6">
                <button
                  type="button"
                  aria-expanded={isTestingExpanded}
                  aria-controls="testing-navigation"
                  onClick={() => setIsTestingExpanded((expanded) => !expanded)}
                  className="w-full flex items-center justify-between text-left text-md font-semibold text-gray-400 uppercase mb-2 px-2"
                >
                  {translation.common.testing}
                  <ChevronDown aria-hidden="true" className={`w-4 h-4 transition-transform ${isTestingExpanded ? '' : '-rotate-90'}`} />
                </button>
                <div id="testing-navigation" hidden={!isTestingExpanded}>
                  {visibleTestingItems.map(({ feature, href, icon: Icon, label }) => (
                    <a key={feature ?? href} href={href} className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 text-gray-300 hover:bg-gray-800">
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{label}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Administration Section */}
            {visibleAdministrationItems.length > 0 && (
              <div className="mb-6">
                <button
                  type="button"
                  aria-expanded={isAdministrationExpanded}
                  aria-controls="administration-navigation"
                  onClick={() => setIsAdministrationExpanded((expanded) => !expanded)}
                  className="w-full flex items-center justify-between text-left text-md font-semibold text-gray-400 uppercase mb-2 px-2"
                >
                  {translation.common.administration}
                  <ChevronDown aria-hidden="true" className={`w-4 h-4 transition-transform ${isAdministrationExpanded ? '' : '-rotate-90'}`} />
                </button>
                <div id="administration-navigation" hidden={!isAdministrationExpanded}>
                  {visibleAdministrationItems.map(({ feature, href, icon: Icon, label }) => (
                    <a key={feature} href={href} className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 text-gray-300 hover:bg-gray-800">
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{label}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 bg-gray-100">{children}</div>
    </div>
  );
}
