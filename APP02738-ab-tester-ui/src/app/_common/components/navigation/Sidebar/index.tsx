'use client';

import type { TypeTenant } from '@ab-tester/constants/types/tenant';
import type React from 'react';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { AbTestSection } from './AbTest';
import { AdministrationSection } from './Administration';
import { ComponentLanguage } from './Language';

type Props = {
  children: React.ReactNode;
  tenant?: TypeTenant;
};

export function Sidebar({ children, tenant }: Props) {
  const { translation } = useTranslationContext();

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

            <AbTestSection tenant={tenant} />
            <AdministrationSection />
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 bg-gray-100">{children}</div>
    </div>
  );
}
