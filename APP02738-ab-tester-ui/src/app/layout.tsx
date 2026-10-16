import type React from 'react';
import './styles/global.css';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import constants from '../config/constants';
import { CreatorCredit } from './_common/components/CreatorCredit';
import { DynamicDialog } from './_common/contexts/Dialog/Component';
import { Loader } from './_common/contexts/Loader/Component';
import { ToastProvider } from './_common/contexts/ToastEmitter';
import { TranslationProvider } from './_common/contexts/Translation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'AB Tester',
};

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();
  const languageInCookie = cookieStore.get(constants.cookieNames.lang)?.value || 'english';

  return (
    <html lang="es-ES">
      <body>
        <TranslationProvider language={languageInCookie}>
          <Loader />
          <ToastProvider>
            <DynamicDialog />
            {children}
          </ToastProvider>
          <CreatorCredit />
        </TranslationProvider>
      </body>
    </html>
  );
};

export default Layout;
