import type { ProjectState } from '../types';

const DB_NAME = 'jurissuite-dashboard';
const DB_VERSION = 1;
const STORE_NAME = 'project';
const RECORD_KEY = 'state';
const LOCAL_FALLBACK_KEY = 'jurissuite-dashboard:state';

let dbPromise: Promise<IDBDatabase> | null = null;

function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined' && indexedDB !== null;
}

function openDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Falha ao abrir IndexedDB'));
      request.onblocked = () =>
        reject(new Error('IndexedDB bloqueado. Feche outras abas da aplicação.'));
    });
  }
  return dbPromise;
}

function writeLocalFallback(state: ProjectState) {
  try {
    localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(state));
  } catch {
    /* quota ou modo privado — ignorado */
  }
}

function readLocalFallback(): ProjectState | null {
  try {
    const raw = localStorage.getItem(LOCAL_FALLBACK_KEY);
    return raw ? (JSON.parse(raw) as ProjectState) : null;
  } catch {
    return null;
  }
}

/**
 * Carrega o estado persistido. Ordem: IndexedDB → localStorage (fallback).
 * Retorna `null` quando não existe nada salvo ainda.
 */
export async function loadState(): Promise<{ state: ProjectState | null; source: 'indexeddb' | 'localstorage' | 'empty' }> {
  if (hasIndexedDB()) {
    try {
      const db = await openDB();
      const value = await new Promise<ProjectState | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(RECORD_KEY);
        req.onsuccess = () => resolve(req.result as ProjectState | undefined);
        req.onerror = () => reject(req.error);
      });
      if (value) return { state: value, source: 'indexeddb' };
    } catch (error) {
      console.error('[storage] Erro ao ler IndexedDB:', error);
    }
  }

  const fallback = readLocalFallback();
  if (fallback) return { state: fallback, source: 'localstorage' };

  return { state: null, source: 'empty' };
}

/** Grava o estado. IndexedDB é a fonte principal; localStorage serve de espelho. */
export async function saveState(state: ProjectState): Promise<void> {
  let persisted = false;

  if (hasIndexedDB()) {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(state, RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Erro ao gravar no IndexedDB'));
      tx.onabort = () => reject(tx.error ?? new Error('Gravação abortada'));
    });
    persisted = true;
  }

  writeLocalFallback(state);

  if (!persisted && !hasIndexedDB()) {
    // Sem IndexedDB, o localStorage já cumpriu o papel de persistência.
    return;
  }
}

export async function clearState(): Promise<void> {
  if (hasIndexedDB()) {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(RECORD_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error('[storage] Erro ao limpar IndexedDB:', error);
    }
  }
  try {
    localStorage.removeItem(LOCAL_FALLBACK_KEY);
  } catch {
    /* ignorado */
  }
}

export interface StorageEstimate {
  usage: number | null;
  quota: number | null;
}

export async function estimateStorage(): Promise<StorageEstimate> {
  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    try {
      const { usage, quota } = await navigator.storage.estimate();
      return { usage: usage ?? null, quota: quota ?? null };
    } catch {
      return { usage: null, quota: null };
    }
  }
  return { usage: null, quota: null };
}

export function storageEngineLabel(): string {
  return hasIndexedDB() ? 'IndexedDB (com espelho em localStorage)' : 'localStorage';
}