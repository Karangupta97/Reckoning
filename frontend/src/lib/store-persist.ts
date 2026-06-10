import { createJSONStorage, type PersistOptions } from "zustand/middleware";

/** Shared localStorage persistence options for admin workflow stores */
export function adminPersistOptions<T, P extends Partial<T>>(
  key: string,
  partialize: (state: T) => P
): PersistOptions<T, P> {
  return {
    name: `reckoning-${key}`,
    storage: createJSONStorage(() => localStorage),
    partialize,
    version: 1,
  };
}
