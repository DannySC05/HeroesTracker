import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { useAuth } from './AuthContext';
import { readFavorites, writeFavorites } from './storage';

interface FavoritesContextValue {
  favoriteIds: Set<string>;
  ready: boolean;
  toggle(id: string): Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState(new Set<string>());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    setReady(false);

    if (!user) {
      setFavoriteIds(new Set());
      setReady(true);
      return () => {
        active = false;
      };
    }

    readFavorites(user.id).then((ids) => {
      if (active) {
        setFavoriteIds(new Set(ids));
        setReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, [user]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds,
      ready,
      async toggle(id) {
        if (!user) return;
        const next = new Set(favoriteIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setFavoriteIds(next);
        await writeFavorites(user.id, [...next]);
      },
    }),
    [favoriteIds, ready, user],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error('useFavorites debe usarse dentro de FavoritesProvider.');
  return value;
}
