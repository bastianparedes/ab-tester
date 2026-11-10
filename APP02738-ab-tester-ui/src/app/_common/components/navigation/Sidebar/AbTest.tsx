'use client';

import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import { Boxes, ChevronDown, Code, Database, Eye, FlaskConical, Tags, Workflow } from 'lucide-react';
import { useState } from 'react';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import constants from '@/config/constants';

type Props = {
  tenant?: TypeTenant;
};

export function AbTestSection({ tenant }: Props) {
  const { translation } = useTranslationContext();
  const user = useUser();
  const [isExpanded, setIsExpanded] = useState(true);

  const abTestItems = tenant
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
  const visibleAbTestItems = tenant ? abTestItems.filter(({ feature }) => feature === null || user.hasPermission({ action: 'read', feature, tenantId: tenant.id })) : [];

  if (!tenant) {
    return null;
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls="ab-test-navigation"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        className="w-full flex items-center justify-between text-left text-md font-semibold text-gray-400 uppercase mb-2 px-2"
      >
        {translation.common.abTest}
        <ChevronDown aria-hidden="true" className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
      </button>
      <div id="ab-test-navigation" hidden={!isExpanded}>
        {visibleAbTestItems.map(({ feature, href, icon: Icon, label }) => (
          <a key={feature ?? href} href={href} className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 text-gray-300 hover:bg-gray-800">
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium">{label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
