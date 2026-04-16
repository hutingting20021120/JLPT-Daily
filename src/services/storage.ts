/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserSettings, FavoriteItem, DailyContent } from "../types";

const STORAGE_KEYS = {
  SETTINGS: 'jlpt_settings',
  FAVORITES: 'jlpt_favorites',
  DAILY_CACHE: 'jlpt_daily_cache',
};

export const storage = {
  getSettings: (): UserSettings => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) return JSON.parse(saved);
    return {
      jlptLevel: 'N3',
      reminderTime: '09:00',
      preferredExerciseTypes: ['vocabulary', 'grammar', 'reading'],
    };
  },

  saveSettings: (settings: UserSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getFavorites: (): FavoriteItem[] => {
    const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return saved ? JSON.parse(saved) : [];
  },

  addFavorite: (item: FavoriteItem) => {
    const favorites = storage.getFavorites();
    if (!favorites.some(f => f.id === item.id)) {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([...favorites, item]));
    }
  },

  removeFavorite: (id: string) => {
    const favorites = storage.getFavorites();
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites.filter(f => f.id !== id)));
  },

  getDailyCache: (date: string, level: string): DailyContent | null => {
    const saved = localStorage.getItem(STORAGE_KEYS.DAILY_CACHE);
    if (!saved) return null;
    const cache = JSON.parse(saved);
    if (cache.date === date && cache.level === level) return cache;
    return null;
  },

  setDailyCache: (content: DailyContent) => {
    localStorage.setItem(STORAGE_KEYS.DAILY_CACHE, JSON.stringify(content));
  },
};
