import { Injectable } from '@angular/core';
import { TreeState } from '../state/component-tree.types';

export interface ProjectRecord {
  id: string;
  name: string;
  tree: TreeState;
  updatedAt: number;
}
export interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: number;
}

export class PersistenceError extends Error {
  override readonly name = 'PersistenceError';
}

const DB_NAME = 'webmcp-studio';
const STORE = 'projects';

/** Persistencia de proyectos en IndexedDB (sin dependencias externas). */
@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  readonly available = typeof indexedDB !== 'undefined';

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      if (!this.available) {
        reject(new PersistenceError('IndexedDB no disponible en este entorno'));
        return;
      }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new PersistenceError('No se pudo abrir IndexedDB'));
    });
    return this.dbPromise;
  }

  private run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest, label: string): Promise<T> {
    return this.open().then(
      (db) =>
        new Promise<T>((resolve, reject) => {
          const tx = db.transaction(STORE, mode);
          const request = op(tx.objectStore(STORE));
          request.onsuccess = () => resolve(request.result as T);
          request.onerror = () => reject(new PersistenceError(`Error al ${label}`));
          tx.onerror = () => reject(new PersistenceError(`Transacción fallida al ${label}`));
        }),
    );
  }

  private runVoid(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest, label: string): Promise<void> {
    return this.run<IDBValidKey>(mode, op, label).then(() => undefined);
  }

  async save(record: ProjectRecord): Promise<void> {
    await this.runVoid('readwrite', (s) => s.put(record), 'guardar proyecto');
  }

  async get(id: string): Promise<ProjectRecord | null> {
    return this.run<ProjectRecord | undefined>('readonly', (s) => s.get(id), 'leer proyecto').then(
      (r) => r ?? null,
    );
  }

  async delete(id: string): Promise<void> {
    await this.runVoid('readwrite', (s) => s.delete(id), 'borrar proyecto');
  }

  async list(): Promise<ProjectMeta[]> {
    const all = await this.run<ProjectRecord[]>('readonly', (s) => s.getAll(), 'listar proyectos');
    return all
      .map((r) => ({ id: r.id, name: r.name, updatedAt: r.updatedAt }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
