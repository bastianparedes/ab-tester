'use client';

import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import { Boxes, Building2, ChevronDown, Code, Database, Eye, FlaskConical, Shield, Tags, Users, Workflow } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import constants, { getStringPermission } from '@/config/constants';
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
                  {user.permissions.includes(getStringPermission({ action: 'read', feature: 'track-event', tenantId: tenant.id })) && (
                    <a
                      href={constants.pages.trackEvents({ tenantId: tenant.id })}
                      className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 text-gray-300 hover:bg-gray-800"
                    >
                      <Database className="w-5 h-5" />
                      <span className="text-sm font-medium">{translation.common.trackEvents}</span>
                    </a>
                  )}

                  {user.permissions.includes(getStringPermission({ action: 'read', feature: 'audience', tenantId: tenant.id })) && (
                    <a
                      href={constants.pages.audiences({ tenantId: tenant.id })}
                      className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 text-gray-300 hover:bg-gray-800"
                    >
                      <Tags className="w-5 h-5" />
                      <span className="text-sm font-medium">{translation.common.audiences}</span>
                    </a>
                  )}

                  {user.permissions.includes(getStringPermission({ action: 'read', feature: 'campaign', tenantId: tenant.id })) && (
                    <a
                      href={constants.pages.campaigns({ tenantId: tenant.id })}
                      className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 text-gray-300 hover:bg-gray-800"
                    >
                      <FlaskConical className="w-5 h-5" />
                      <span className="text-sm font-medium">{translation.common.campaigns}</span>
                    </a>
                  )}

                  {user.permissions.includes(getStringPermission({ action: 'read', feature: 'execution-group', tenantId: tenant.id })) && (
                    <a
                      href={constants.pages.executionGroups({ tenantId: tenant.id })}
                      className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 text-gray-300 hover:bg-gray-800"
                    >
                      <Boxes className="w-5 h-5" />
                      <span className="text-sm font-medium">{translation.common.executionGroups}</span>
                    </a>
                  )}

                  <a
                    href={constants.pages.lifecycleHooks({ tenantId: tenant.id })}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 text-gray-300 hover:bg-gray-800"
                  >
                    <Workflow className="w-5 h-5" />
                    <span className="text-sm font-medium">{translation.common.lifecycleHooks}</span>
                  </a>

                  <a
                    href={constants.pages.script({ tenantId: tenant.id })}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 text-gray-300 hover:bg-gray-800"
                  >
                    <Code className="w-5 h-5" />
                    <span className="text-sm font-medium">{translation.common.scriptAndUrl}</span>
                  </a>

                  <a
                    href={constants.pages.playground({ tenantId: tenant.id })}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 text-gray-300 hover:bg-gray-800"
                  >
                    <Eye className="w-5 h-5" />
                    <span className="text-sm font-medium">{translation.common.playground}</span>
                  </a>
                </div>
              </div>
            )}

            {/* Administration Section */}
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
                <a href={constants.pages.tenants()} className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 text-gray-300 hover:bg-gray-800">
                  <Building2 className="w-5 h-5" />
                  <span className="text-sm font-medium">{translation.common.tenants}</span>
                </a>
                {user.permissions.includes(getStringPermission({ action: 'read', feature: 'role' })) && (
                  <a href={constants.pages.roles()} className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 text-gray-300 hover:bg-gray-800">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm font-medium">{translation.common.roles}</span>
                  </a>
                )}
                {user.permissions.includes(getStringPermission({ action: 'read', feature: 'user' })) && (
                  <a href={constants.pages.users()} className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 text-gray-300 hover:bg-gray-800">
                    <Users className="w-5 h-5" />
                    <span className="text-sm font-medium">{translation.common.users}</span>
                  </a>
                )}
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 bg-gray-100">{children}</div>
    </div>
  );
}
