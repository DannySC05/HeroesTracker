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
import type { AuthUser } from './types';

interface FavoritesContextValue {
  favoriteIds: Set<string>;
  ready: boolean;
  toggle(id: string): Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const providerKey = user?.id ?? 'anonymous';

  return (
    <FavoritesStateProvider key={providerKey} user={user}>
      {children}
    </FavoritesStateProvider>
  );
}

interface FavoritesStateProviderProps extends PropsWithChildren {
  user: AuthUser | null;
}

function FavoritesStateProvider({ children, user }: FavoritesStateProviderProps) {
  const [favoriteIds, setFavoriteIds] = useState(new Set<string>());
  const [ready, setReady] = useState(!user);

  useEffect(() => {
    if (!user) return;

    let active = true;

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
