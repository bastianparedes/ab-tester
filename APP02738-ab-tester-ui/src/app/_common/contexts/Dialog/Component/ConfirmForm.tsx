'use client';

import { Button } from '@/app/_common/components/button';
import { useTranslationContext } from '@/app/_common/contexts/Translation';

export const ConfirmForm = ({ resolver }: { resolver: (arg: boolean) => void }) => {
  const { translation } = useTranslationContext();
  const onReject = () => resolver(false);
  const onAccept = () => resolver(true);

  return (
    <div className="px-8 pb-6 flex justify-end gap-4">
      <Button onClick={onReject} variant="destructive">
        {translation.common.cancel}
      </Button>
      <Button onClick={onAccept} variant="default">
        {translation.common.accept}
      </Button>
    </div>
  );
};
