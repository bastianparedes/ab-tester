import { useEffect, useState } from 'react';

type SetValue<T> = React.Dispatch<React.SetStateAction<T>>;

export function useSessionStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const readValue = (): T => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.error('Error leyendo sessionStorage:', error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);

  useEffect(() => {
    try {
      if (storedValue === null) {
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.error('Error escribiendo en sessionStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
