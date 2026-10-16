'use client';

import { cx } from 'class-variance-authority';
import { ChevronDown, ChevronRight, CircleUser, LogOut, User } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import constants from '@/config/constants';
import { apiCaller } from '@/libs/restClient';

type Props = {
  children: React.ReactNode;
  breadcrumb: {
    name: string;
    path?: string;
  }[];
};

export function Navbar({ children, breadcrumb }: Props) {
  const { translation } = useTranslationContext();
  const user = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const breadcrumbTranslations: Record<string, string> = {
    Audiences: translation.common.audiences,
    Campaigns: translation.common.campaigns,
    'Execution Groups': translation.common.executionGroups,
    'Execution groups': translation.common.executionGroups,
    'Lifecycle hooks': translation.common.lifecycleHooks,
    Playground: translation.common.playground,
    Roles: translation.common.roles,
    'Script and URL': translation.common.scriptAndUrl,
    Tenants: translation.common.tenants,
    'Track events': translation.common.trackEvents,
    Users: translation.common.users,
  };

  const onLogout = async () => {
    const apiResponse = await apiCaller.sessions.logOut();
    if (apiResponse.ok) {
      location.href = constants.pages.home();
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-base text-slate-500">
            {breadcrumb.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight />}
                <a
                  href={crumb.path}
                  className={cx({
                    'hover:text-blue-600': !!crumb.path,
                    'text-slate-900 font-medium': index === breadcrumb.length - 1,
                    'transition-colors duration-200': index < breadcrumb.length - 1,
                  })}
                >
                  {breadcrumbTranslations[crumb.name] ?? crumb.name}
                </a>
              </React.Fragment>
            ))}
          </div>

          {/* Right side: User info */}
          {user.isLogedIn && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 border border-gray-200 hover:border-gray-300"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">{user.data.name}</div>
                  <div className="text-xs text-gray-500">{user.data.email}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <a
                    href={constants.pages.account()}
                    onClick={() => {
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                  >
                    <CircleUser className="w-4 h-4" />
                    {translation.common.account}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                  >
                    <LogOut className="w-4 h-4" />
                    {translation.common.logOut}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
