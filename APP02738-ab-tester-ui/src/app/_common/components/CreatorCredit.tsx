'use client';

import { useTranslationContext } from '@/app/_common/contexts/Translation';

export function CreatorCredit() {
  const { translation } = useTranslationContext();

  return <div className="flex items-center justify-center py-2 bg-black text-white">{translation.footer.createdBy.replace('{name}', translation.footer.creatorName)}</div>;
}
