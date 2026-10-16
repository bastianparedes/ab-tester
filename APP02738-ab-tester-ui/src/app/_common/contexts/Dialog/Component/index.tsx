'use client';

import { useShallow } from 'zustand/react/shallow';
import { Dialog } from '@/app/_common/components/dialog';
import { useDialogStore } from '../state';
import { ConfirmForm } from './ConfirmForm';
import type { TypeArgs } from './DynamicForm';
import { DynamicForm } from './DynamicForm';

export const DynamicDialog = () => {
  const { isOpen, title, description, data, completeResolver } = useDialogStore(
    useShallow(({ isOpen, title, description, data, completeResolver }) => ({
      completeResolver,
      data,
      description,
      isOpen,
      title,
    })),
  );

  const dialogComponentsStrategies = {
    confirmDialog: {
      content: () => undefined,
      footer: () => <ConfirmForm resolver={completeResolver} />,
    },
    dynamicDialog: {
      content: () => (
        <DynamicForm
          resolver={completeResolver}
          args={
            (
              data as {
                type: 'dynamicDialog';
                args: TypeArgs;
              }
            ).args
          }
        />
      ),
      footer: undefined,
    },
  };
  const dialogComponentsDefault = {
    content: undefined,
    footer: undefined,
  };

  const DialogComponents = data ? dialogComponentsStrategies[data.type] : dialogComponentsDefault;
  const Content = DialogComponents.content ? <DialogComponents.content /> : null;
  const Footer = DialogComponents.footer ? <DialogComponents.footer /> : null;

  if (!isOpen) return null;
  return <Dialog onClose={() => completeResolver(null)} title={title} description={description} content={Content} footer={Footer} />;
};
