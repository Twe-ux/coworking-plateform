"use client";

import { useMemo, useState } from "react";

export type TurnoverData = {
  _id: string;
  date: string;
  HT: number;
  TTC: number;
  TVA?: number;
  "ca-ttc"?: { [key: string]: number };
  "ca-ht"?: { [key: string]: number };
  "ca-tva"?: { [key: string]: number };
};

interface ApiResponse {
  success: boolean;
  data: TurnoverData[];
}

interface ChartCacheState {
  data: TurnoverData[] | null;
  isLoading: boolean;
  error: string | null;
}

class ChartCacheManager {
  private static instance: ChartCacheManager;
  private state: ChartCacheState = {
    data: null,
    isLoading: false,
    error: null,
  };
  private promise: Promise<any> | null = null;
  private listeners: Set<() => void> = new Set();

  private readonly CACHE_KEY = "chart-turnover-cache-data";
  private readonly CACHE_TIMEOUT =
    process.env.NODE_ENV === "development"
      ? 5 * 60 * 1000 // 5 minutes en dev
      : 24 * 60 * 60 * 1000; // 24 heures en prod

  static getInstance(): ChartCacheManager {
    if (!ChartCacheManager.instance) {
      ChartCacheManager.instance = new ChartCacheManager();
    }
    return ChartCacheManager.instance;
  }

  addListener(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  getState(): ChartCacheState {
    return { ...this.state };
  }

  private getCachedData(): TurnoverData[] | null {
    try {
      if (typeof window === "undefined") return null;

      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const currentTime = Date.now();

        if (currentTime - parsedCache.timestamp < this.CACHE_TIMEOUT) {
          return parsedCache.data;
        } else {
          localStorage.removeItem(this.CACHE_KEY);
        }
      }

      const preloadedCache = localStorage.getItem("chart-data-cache");
      if (preloadedCache) {
        const parsedPreloadCache = JSON.parse(preloadedCache);
        const currentTime = Date.now();

        if (currentTime - parsedPreloadCache.timestamp < this.CACHE_TIMEOUT) {
          this.setCachedData(parsedPreloadCache.data);
          return parsedPreloadCache.data;
        } else {
          localStorage.removeItem("chart-data-cache");
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private setCachedData(data: TurnoverData[]) {
    try {
      if (typeof window === "undefined") return;

      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      // Silently handle cache errors
    }
  }

  async getChartData(): Promise<ChartCacheState> {
    if (this.state.data && !this.state.error) {
      return this.getState();
    }

    const cachedData = this.getCachedData();
    if (cachedData) {
      this.state = { data: cachedData, isLoading: false, error: null };
      this.notifyListeners();
      return this.getState();
    }

    if (this.promise) {
      return this.promise;
    }

    this.state.isLoading = true;
    this.notifyListeners();

    this.promise = this.fetchFromApi()
      .then((data) => {
        this.state = { data, isLoading: false, error: null };
        this.setCachedData(data);
        this.notifyListeners();
        return this.getState();
      })
      .catch((error) => {
        this.state = { data: null, isLoading: false, error: error.message };
        this.notifyListeners();
        return this.getState();
      })
      .finally(() => {
        this.promise = null;
      });

    return this.promise;
  }

  private async fetchFromApi(): Promise<TurnoverData[]> {
    const baseUrl =
      typeof window !== "undefined" ? "" : "http://localhost:3001";
    const url = `${baseUrl}/api/turnover`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`API turnover returned ${response.status}, using empty data`);
        return [];
      }

      const result: ApiResponse = await response.json();

      if (!result.success || !Array.isArray(result.data)) {
        console.warn('Invalid turnover API response format, using empty data');
        return [];
      }

      return result.data;
    } catch (error) {
      console.warn('Failed to fetch turnover data:', error);
      return [];
    }
  }

  async forceRefresh(): Promise<ChartCacheState> {
    this.state = { data: null, isLoading: false, error: null };
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.CACHE_KEY);
    }
    return this.getChartData();
  }
}

export function useChartData() {
  const [, forceUpdate] = useState({});
  const manager = ChartCacheManager.getInstance();

  useMemo(() => {
    const unsubscribe = manager.addListener(() => {
      forceUpdate({});
    });

    const currentState = manager.getState();
    if (!currentState.data && !currentState.isLoading) {
      manager.getChartData();
    }

    return unsubscribe;
  }, [manager]);

  const state = manager.getState();

  return state;
}

export const chartCacheManager = ChartCacheManager.getInstance();