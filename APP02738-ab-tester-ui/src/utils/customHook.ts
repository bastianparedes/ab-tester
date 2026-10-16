'use client';

import { useEffect, useState } from 'react';

const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [localState, setLocalState] = useState<T>(() => {
    try {
      const storedString = window.localStorage.getItem(key);
      return storedString !== null ? window.JSON.parse(storedString) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(localState));
  }, [key, localState]);

  return [localState, setLocalState] as const;
};

export { useLocalStorage };
