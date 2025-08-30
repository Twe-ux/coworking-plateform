import { useCallback, useEffect, useState } from "react";

export interface CashEntry {
  _id: string;
  date: string;
  prestaB2B?: { label: string; value: number }[];
  depenses?: { label: string; value: number }[];
  virement?: number;
  especes?: number;
  cbClassique?: number;
  cbSansContact?: number;
}

interface CashEntryResponse {
  success: boolean;
  data: CashEntry[];
}

interface CashEntryCacheData {
  data: CashEntryResponse;
  timestamp: number;
}

type CashEntryListener = (
  data: CashEntry[] | null,
  isLoading: boolean,
  error: string | null,
) => void;

class CashEntryCacheManager {
  private static instance: CashEntryCacheManager;
  private cache: CashEntry[] | null = null;
  private isLoading = false;
  private error: string | null = null;
  private listeners: Set<CashEntryListener> = new Set();
  private lastFetch = 0;
  private readonly CACHE_DURATION =
    process.env.NODE_ENV === "development"
      ? 5 * 60 * 1000
      : 24 * 60 * 60 * 1000; // 5min dev, 24h prod
  private readonly STORAGE_KEY = "cash-entry-cache-data";

  static getInstance(): CashEntryCacheManager {
    if (!CashEntryCacheManager.instance) {
      CashEntryCacheManager.instance = new CashEntryCacheManager();
    }
    return CashEntryCacheManager.instance;
  }

  private constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const cachedData: CashEntryCacheData = JSON.parse(stored);
        const now = Date.now();

        if (now - cachedData.timestamp < this.CACHE_DURATION) {
          this.cache = cachedData.data.data;
          this.lastFetch = cachedData.timestamp;
          console.log(
            "✅ Cache cash entries chargé depuis localStorage:",
            cachedData.data.data.length,
            "entries",
          );
        } else {
          localStorage.removeItem(this.STORAGE_KEY);
          console.log("🕐 Cache cash entries expiré, supprimé du localStorage");
        }
      }
    } catch (error) {
      console.warn(
        "⚠️ Erreur lors du chargement du cache cash entries:",
        error,
      );
      if (typeof window !== "undefined") {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined" || !this.cache) return;

    try {
      const cacheData: CashEntryCacheData = {
        data: { success: true, data: this.cache },
        timestamp: this.lastFetch,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
      console.log("💾 Cache cash entries sauvé dans localStorage");
    } catch (error) {
      console.warn(
        "⚠️ Erreur lors de la sauvegarde du cache cash entries:",
        error,
      );
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      listener(this.cache, this.isLoading, this.error);
    });
  }

  addListener(listener: CashEntryListener) {
    this.listeners.add(listener);
    listener(this.cache, this.isLoading, this.error);
  }

  removeListener(listener: CashEntryListener) {
    this.listeners.delete(listener);
  }

  private shouldFetch(): boolean {
    const now = Date.now();
    return !this.cache || now - this.lastFetch > this.CACHE_DURATION;
  }

  async fetchCashEntries(force = false): Promise<void> {
    if (!force && (!this.shouldFetch() || this.isLoading)) {
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.notifyListeners();

    try {
      console.log("🔄 Récupération des données cash entries...");
      const response = await fetch("/api/cash-entry");

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: CashEntryResponse = await response.json();

      if (!data.success || !Array.isArray(data.data)) {
        throw new Error("Format de réponse invalide");
      }

      this.cache = data.data;
      this.lastFetch = Date.now();
      this.isLoading = false;
      this.error = null;

      this.saveToStorage();

      console.log(
        "✅ Données cash entries mises en cache:",
        data.data.length,
        "entries",
      );
      this.notifyListeners();
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des cash entries:",
        error,
      );
      this.isLoading = false;
      this.error = error instanceof Error ? error.message : "Erreur inconnue";
      this.notifyListeners();
    }
  }

  invalidateCache() {
    this.cache = null;
    this.lastFetch = 0;
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    console.log("🗑️ Cache cash entries invalidé");
  }

  refreshCache() {
    return this.fetchCashEntries(true);
  }

  static invalidateCache() {
    const instance = CashEntryCacheManager.getInstance();
    instance.invalidateCache();
    instance.fetchCashEntries(true);
  }

  getCache(): CashEntry[] | null {
    return this.cache;
  }

  isStale(): boolean {
    const now = Date.now();
    return now - this.lastFetch > this.CACHE_DURATION;
  }
}

export function useCashEntryData() {
  const [data, setData] = useState<CashEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheManager = CashEntryCacheManager.getInstance();

  const handleCacheUpdate = useCallback(
    (
      newData: CashEntry[] | null,
      loading: boolean,
      newError: string | null,
    ) => {
      setData(newData);
      setIsLoading(loading);
      setError(newError);
    },
    [],
  );

  useEffect(() => {
    cacheManager.addListener(handleCacheUpdate);

    if (!cacheManager.getCache() || cacheManager.isStale()) {
      cacheManager.fetchCashEntries();
    }

    return () => {
      cacheManager.removeListener(handleCacheUpdate);
    };
  }, [cacheManager, handleCacheUpdate]);

  const refetch = useCallback(() => {
    return cacheManager.refreshCache();
  }, [cacheManager]);

  const invalidate = useCallback(() => {
    cacheManager.invalidateCache();
  }, [cacheManager]);

  return {
    data,
    dataCash: data || [],
    isLoading,
    error,
    refetch,
    invalidate,
  };
}