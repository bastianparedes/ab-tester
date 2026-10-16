import { useLoaderStore } from '@/app/_common/contexts/Loader/state';

export function withLoader<Args extends unknown[], R>(fn: (...args: Args) => R | Promise<R>): (...args: Args) => ReturnType<typeof fn> {
  const { showLoader, hideLoader } = useLoaderStore.getState();

  return (...args: Args): ReturnType<typeof fn> => {
    showLoader();

    try {
      const result = fn(...args);

      if (result instanceof Promise) {
        return result.finally(() => hideLoader());
      }

      hideLoader();
      return result;
    } catch (error) {
      hideLoader();
      throw error;
    }
  };
}

export function withLog<Args extends unknown[], R>(fn: (...args: Args) => R | Promise<R>): (...args: Args) => ReturnType<typeof fn> {
  return (...args: Args): ReturnType<typeof fn> => {
    const result = fn(...args);

    if (result instanceof Promise) {
      return result.then((awaitedResult) => {
        console.log(`Result promised ${fn.name}() => `, awaitedResult);
        return awaitedResult;
      });
    }

    console.log(`Result ${fn.name}() => `, result);
    return result;
  };
}
