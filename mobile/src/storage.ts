import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@heroes-tracker/session-token';
const FAVORITES_PREFIX = '@heroes-tracker/favorites';

let memoryToken: string | null = null;

export function getMemoryToken(): string | null {
  return memoryToken;
}

export async function hydrateToken(): Promise<string | null> {
  memoryToken = await AsyncStorage.getItem(TOKEN_KEY);
  return memoryToken;
}

export async function saveToken(token: string): Promise<void> {
  memoryToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  memoryToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}

function favoritesKey(userId: string): string {
  return `${FAVORITES_PREFIX}:${userId}`;
}

export async function readFavorites(userId: string): Promise<string[]> {
  const stored = await AsyncStorage.getItem(favoritesKey(userId));
  if (!stored) return [];

  try {
    const value: unknown = JSON.parse(stored);
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

export async function writeFavorites(userId: string, ids: string[]): Promise<void> {
  await AsyncStorage.setItem(favoritesKey(userId), JSON.stringify(ids));
}
