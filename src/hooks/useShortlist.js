import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'deal-engine-shortlist';

export function useShortlist() {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((item) => {
    if (!item?.id) return;
    setItems(prev => prev.some(i => i.id === item.id) ? prev : [...prev, item]);
  }, []);

  const remove = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const has = useCallback((id) => items.some(i => i.id === id), [items]);

  return { items, add, remove, has };
}
