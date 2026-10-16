'use client';

import { useEffect } from 'react';
import { useLoaderStore } from './state';

export const Loader = () => {
  const counter = useLoaderStore((state) => state.counter);
  const hideLoader = useLoaderStore((state) => state.hideLoader);

  useEffect(() => {
    hideLoader();
  }, []);

  if (counter === 0) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/75 z-9999">
      <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
    </div>
  );
};
