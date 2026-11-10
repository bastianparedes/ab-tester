'use client';

import { Building2, ChevronDown, Shield, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import constants from '@/config/constants';

export function AdministrationSection() {
  const { translation } = useTranslationContext();
  const user = useUser();
  const [isExpanded, setIsExpanded] = useState(true);
  const administrationItems = [
    { feature: 'tenant', href: constants.pages.tenants(), icon: Building2, label: translation.common.tenants },
    { feature: 'role', href: constants.pages.roles(), icon: Shield, label: translation.common.roles },
    { feature: 'user', href: constants.pages.users(), icon: Users, label: translation.common.users },
  ] as const;
  const visibleAdministrationItems = administrationItems.filter(({ feature }) => user.hasPermission({ action: 'read', feature }));

  if (visibleAdministrationItems.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls="administration-navigation"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        className="w-full flex items-center justify-between text-left text-md font-semibold text-gray-400 uppercase mb-2 px-2"
      >
        {translation.common.administration}
        <ChevronDown aria-hidden="true" className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
      </button>
      <div id="administration-navigation" hidden={!isExpanded}>
        {visibleAdministrationItems.map(({ feature, href, icon: Icon, label }) => (
          <a key={feature} href={href} className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 text-gray-300 hover:bg-gray-800">
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium">{label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
