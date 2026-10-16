import { create } from 'zustand';

type LoaderStore = {
  counter: number;
  showLoader: () => void;
  hideLoader: () => void;
};

export const useLoaderStore = create<LoaderStore>((set) => ({
  counter: 1,
  hideLoader: () => set((state) => ({ counter: Math.max(state.counter - 1, 0) })),
  showLoader: () => set((state) => ({ counter: state.counter + 1 })),
}));
