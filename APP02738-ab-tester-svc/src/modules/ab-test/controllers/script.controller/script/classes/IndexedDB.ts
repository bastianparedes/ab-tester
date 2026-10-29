type TypeData<T = unknown> = {
  id?: number;
  date: Date;
  value: T;
};
const LIMIT_ROWS = 5000;

class IndexedDBCrud {
  private dbName = 'ab_tester_v1';
  private db!: IDBDatabase;
  private stores: number[];
  private initPromise: Promise<void>;
  private cache = new Map<string, unknown[]>();

  constructor(stores: number[]) {
    this.stores = stores;
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    await this.openDatabase(currentVersion);
  }

  private async ready() {
    await this.initPromise;
  }

  private getCurrentVersion(): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName);

      request.onsuccess = () => {
        const db = request.result;
        const version = db.version;
        db.close();
        resolve(version);
      };

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = () => {
        const db = request.result;
        const version = db.version;
        db.close();
        resolve(version);
      };
    });
  }

  private openDatabase(currentVersion: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, currentVersion + 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        this.stores.forEach((store) => {
          const name = String(store);

          if (!db.objectStoreNames.contains(name)) {
            const objectStore = db.createObjectStore(name, {
              autoIncrement: true,
              keyPath: 'id',
            });

            objectStore.createIndex('date', 'date', { unique: false });
          }
        });
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  async add<T = unknown>(storeName: string, data: TypeData<T>): Promise<void> {
    await this.ready();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      const countRequest = store.count();

      countRequest.onsuccess = () => {
        const count = countRequest.result;

        const insert = () => {
          const addRequest = store.add(data);

          addRequest.onsuccess = () => {
            resolve();
          };

          addRequest.onerror = () => reject(addRequest.error);
        };

        if (count >= LIMIT_ROWS) {
          const index = store.index('date');
          const cursorRequest = index.openCursor();

          cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result;

            if (cursor) {
              const deleteRequest = store.delete(cursor.primaryKey);

              deleteRequest.onsuccess = () => insert();
              deleteRequest.onerror = () => reject(deleteRequest.error);
            } else {
              insert();
            }
          };

          cursorRequest.onerror = () => reject(cursorRequest.error);
        } else {
          insert();
        }
      };

      countRequest.onerror = () => reject(countRequest.error);
    });
  }

  async getAll<T = unknown>(storeId: number): Promise<TypeData<T>[]> {
    await this.ready();

    const key = String(storeId);

    if (this.cache.has(key)) {
      return this.cache.get(key) as TypeData<T>[];
    }

    return new Promise((resolve, reject) => {
      const store = this.getStore(key);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result as TypeData<T>[];
        this.cache.set(key, result);

        resolve(result);
      };

      request.onerror = () => reject(request.error);
    });
  }
}

const events = window.ab_tester.trackEventsData;
const storeNames = events.map((event) => event.id);

export const indexedDBCrud = new IndexedDBCrud(storeNames);
