import { useEffect, useState } from "react";

export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return initial;
      const parsed: unknown = JSON.parse(saved);
      return Array.isArray(parsed) ? (parsed as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage may be disabled or full; the app remains usable in memory.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
