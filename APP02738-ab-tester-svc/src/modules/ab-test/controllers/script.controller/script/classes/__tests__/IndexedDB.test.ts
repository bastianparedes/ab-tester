import { IDBFactory } from 'fake-indexeddb';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { indexedDBCrud } from '../IndexedDB';

type MockRequest = {
  error: DOMException;
  onerror: ((event: Event) => void) | null;
  onsuccess: ((event: Event) => void) | null;
  onupgradeneeded: ((event: IDBVersionChangeEvent) => void) | null;
  result: unknown;
};

const createMockRequest = (): MockRequest => ({
  error: new DOMException('IndexedDB request failed', 'UnknownError'),
  onerror: null,
  onsuccess: null,
  onupgradeneeded: null,
  result: undefined,
});

const flushAsyncWork = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const importMockedDatabase = async () => {
  const openRequests: MockRequest[] = [];
  const countRequests: MockRequest[] = [];
  const addRequests: MockRequest[] = [];
  const cursorRequests: MockRequest[] = [];
  const deleteRequests: MockRequest[] = [];
  const getAllRequests: MockRequest[] = [];
  let count = 0;
  const store = {
    add: vi.fn(() => {
      const request = createMockRequest();
      addRequests.push(request);
      return request;
    }),
    count: vi.fn(() => {
      const request = createMockRequest();
      request.result = count;
      countRequests.push(request);
      return request;
    }),
    delete: vi.fn(() => {
      const request = createMockRequest();
      deleteRequests.push(request);
      return request;
    }),
    getAll: vi.fn(() => {
      const request = createMockRequest();
      getAllRequests.push(request);
      return request;
    }),
    index: vi.fn(() => ({
      openCursor: () => {
        const request = createMockRequest();
        cursorRequests.push(request);
        return request;
      },
    })),
  };
  const database = {
    close: vi.fn(),
    objectStoreNames: { contains: () => true },
    transaction: vi.fn(() => ({ objectStore: () => store })),
    version: 1,
  };
  vi.stubGlobal('indexedDB', {
    open: vi.fn(() => {
      const request = createMockRequest();
      openRequests.push(request);
      return request as never;
    }),
  });
  vi.resetModules();
  const { indexedDBCrud } = await import('../IndexedDB.js');

  const initialize = async () => {
    openRequests[0].result = database;
    openRequests[0].onsuccess?.(new Event('success'));
    await flushAsyncWork();
    openRequests[1].result = database;
    openRequests[1].onsuccess?.(new Event('success'));
    await flushAsyncWork();
  };

  return {
    addRequests,
    countRequests,
    cursorRequests,
    deleteRequests,
    getAllRequests,
    indexedDBCrud,
    initialize,
    openRequests,
    setCount: (value: number) => {
      count = value;
    },
  };
};

describe('IndexedDBCrud', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('evicts the oldest row at the limit and caches loaded values', async () => {
    const storeId = 20;
    await indexedDBCrud.add(String(storeId), { date: new Date(0), value: 'oldest' });

    const openRequest = indexedDB.open('ab_tester_v1');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      openRequest.onsuccess = () => resolve(openRequest.result);
      openRequest.onerror = () => reject(openRequest.error);
    });
    const transaction = db.transaction(String(storeId), 'readwrite');
    const store = transaction.objectStore(String(storeId));
    for (let index = 1; index < 5000; index++) {
      store.add({ date: new Date(index), value: index });
    }
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    db.close();

    await indexedDBCrud.add(String(storeId), { date: new Date(5000), value: 'newest' });

    const firstRead = await indexedDBCrud.getAll(storeId);
    const secondRead = await indexedDBCrud.getAll(storeId);

    expect(firstRead).toHaveLength(5000);
    expect(firstRead).toContainEqual(expect.objectContaining({ value: 'newest' }));
    expect(secondRead).toBe(firstRead);
  });

  it('reopens an existing database without recreating its stores', async () => {
    const factory = new IDBFactory();
    vi.stubGlobal('indexedDB', factory);
    const request = factory.open('ab_tester_v1', 1);
    await new Promise<void>((resolve, reject) => {
      request.onupgradeneeded = () => {
        for (let storeId = 1; storeId <= 20; storeId++) request.result.createObjectStore(String(storeId));
      };
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
    vi.resetModules();
    const { indexedDBCrud: reopenedDatabase } = await import('../IndexedDB.js');

    await expect(reopenedDatabase.getAll(20)).resolves.toEqual([]);
  }, 15_000);

  it('rejects when database initialization fails', async () => {
    const state = await importMockedDatabase();
    state.openRequests[0].onerror?.(new Event('error'));
    const assertion = expect(state.indexedDBCrud.getAll(1)).rejects.toBe(state.openRequests[0].error);

    await assertion;
  });

  it('rejects when opening the upgraded database fails', async () => {
    const state = await importMockedDatabase();
    state.openRequests[0].result = { close: vi.fn(), version: 1 };
    state.openRequests[0].onsuccess?.(new Event('success'));
    await flushAsyncWork();
    state.openRequests[1].onerror?.(new Event('error'));
    const assertion = expect(state.indexedDBCrud.getAll(1)).rejects.toBe(state.openRequests[1].error);

    await assertion;
  });

  it('propagates request failures and inserts when a full store has no cursor row', async () => {
    const state = await importMockedDatabase();
    await state.initialize();
    const item = { date: new Date(), value: 'new' };

    const countFailure = state.indexedDBCrud.add('1', item);
    await flushAsyncWork();
    const countAssertion = expect(countFailure).rejects.toBe(state.countRequests.at(-1)!.error);
    state.countRequests.at(-1)!.onerror?.(new Event('error'));
    await countAssertion;

    state.setCount(0);
    const addFailure = state.indexedDBCrud.add('1', item);
    await flushAsyncWork();
    const addCount = state.countRequests.at(-1)!;
    addCount.onsuccess?.(new Event('success'));
    const addRequest = state.addRequests.at(-1)!;
    const addAssertion = expect(addFailure).rejects.toBe(addRequest.error);
    addRequest.onerror?.(new Event('error'));
    await addAssertion;

    state.setCount(5000);
    const cursorFailure = state.indexedDBCrud.add('1', item);
    await flushAsyncWork();
    state.countRequests.at(-1)!.onsuccess?.(new Event('success'));
    await flushAsyncWork();
    const cursorAssertion = expect(cursorFailure).rejects.toBe(state.cursorRequests.at(-1)!.error);
    state.cursorRequests.at(-1)!.onerror?.(new Event('error'));
    await cursorAssertion;

    const deleteFailure = state.indexedDBCrud.add('1', item);
    await flushAsyncWork();
    state.countRequests.at(-1)!.onsuccess?.(new Event('success'));
    await flushAsyncWork();
    const cursorWithRow = state.cursorRequests.at(-1)!;
    cursorWithRow.result = { primaryKey: 1 };
    cursorWithRow.onsuccess?.(new Event('success'));
    const deleteRequest = state.deleteRequests.at(-1)!;
    const deleteAssertion = expect(deleteFailure).rejects.toBe(deleteRequest.error);
    deleteRequest.onerror?.(new Event('error'));
    await deleteAssertion;

    const insertWithoutCursor = state.indexedDBCrud.add('1', item);
    await flushAsyncWork();
    state.countRequests.at(-1)!.onsuccess?.(new Event('success'));
    await flushAsyncWork();
    const cursor = state.cursorRequests.at(-1)!;
    const insertAssertion = expect(insertWithoutCursor).resolves.toBeUndefined();
    cursor.result = null;
    cursor.onsuccess?.(new Event('success'));
    await flushAsyncWork();
    state.addRequests.at(-1)!.onsuccess?.(new Event('success'));
    await insertAssertion;

    const readFailure = state.indexedDBCrud.getAll(1);
    await flushAsyncWork();
    const readAssertion = expect(readFailure).rejects.toBe(state.getAllRequests.at(-1)!.error);
    state.getAllRequests.at(-1)!.onerror?.(new Event('error'));
    await readAssertion;
  });
});
