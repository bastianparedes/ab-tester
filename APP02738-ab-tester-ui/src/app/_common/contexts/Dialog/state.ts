import { create } from 'zustand';
import type { TypeArgs, TypeResponse } from './Component/DynamicForm';

type DialogStore = {
  isOpen: boolean;
  title: string | null;
  description: string | null;
  resolver: (arg: unknown) => void;
  data:
    | null
    | {
        type: 'dynamicDialog';
        args: TypeArgs;
      }
    | {
        type: 'confirmDialog';
      };

  getDataFromForm: <T extends TypeArgs>(formData: { title?: string; description?: string }, args: T) => Promise<TypeResponse<T> | null>;
  confirm: (formData: { title?: string; description?: string }) => Promise<boolean | null>;
  completeResolver: (arg: unknown) => void;
};

export const useDialogStore = create<DialogStore>((set, get) => ({
  completeResolver: (arg: unknown): void => {
    set({
      data: null,
      description: null,
      isOpen: false,
      title: null,
    });
    get().resolver(arg);
  },
  confirm: (formData: { title?: string; description?: string }): Promise<null | boolean> => {
    if (formData.title) set({ title: formData.title });
    if (formData.description) set({ description: formData.description });
    set({ data: { type: 'confirmDialog' } });
    const promise = new Promise<boolean>((resolve) => {
      set({ resolver: resolve as (arg: unknown) => void });
    });
    set({ isOpen: true });
    return promise;
  },
  data: null,
  description: null,
  getDataFromForm: <T extends TypeArgs>(formData: { title?: string; description?: string }, args: T): Promise<null | TypeResponse<T>> => {
    if (formData.title) set({ title: formData.title });
    if (formData.description) set({ description: formData.description });
    set({ data: { args, type: 'dynamicDialog' } });
    const promise = new Promise<TypeResponse<T>>((resolve) => {
      set({ resolver: resolve as (arg: unknown) => void });
    });
    set({ isOpen: true });
    return promise;
  },
  isOpen: false,
  resolver: () => {},
  title: null,
}));
