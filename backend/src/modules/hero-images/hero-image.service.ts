import { AppError } from '../../shared/errors/app-error.js';
import type {
  HeroImageCandidate,
  HeroImageProvider,
  HeroImageSearchResult,
} from './hero-image.types.js';

const CACHE_TTL_MS = 15 * 60 * 1000;

interface CacheEntry {
  expiresAt: number;
  result: HeroImageSearchResult;
}

function normalizeHeroName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function uniqueCandidates(candidates: HeroImageCandidate[]): HeroImageCandidate[] {
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const key = `${candidate.id}:${candidate.imageUrl}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export class HeroImageService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly provider?: HeroImageProvider) {}

  async search(name: string): Promise<HeroImageSearchResult> {
    if (!this.provider) {
      throw new AppError(
        503,
        'HERO_IMAGE_SEARCH_UNAVAILABLE',
        'La búsqueda automática de imágenes no está configurada.',
      );
    }

    const normalizedName = normalizeHeroName(name);
    const cached = this.cache.get(normalizedName);
    if (cached && cached.expiresAt > Date.now()) return cached.result;

    let candidates: HeroImageCandidate[];
    try {
      candidates = uniqueCandidates(await this.provider.search(name)).slice(0, 8);
    } catch {
      throw new AppError(
        502,
        'HERO_IMAGE_PROVIDER_ERROR',
        'No fue posible consultar el proveedor de imágenes.',
      );
    }

    const exactMatches = candidates.filter(
      (candidate) => normalizeHeroName(candidate.name) === normalizedName,
    );
    const result = {
      candidates: [
        ...exactMatches,
        ...candidates.filter((candidate) => !exactMatches.includes(candidate)),
      ],
      automaticSelectionId: exactMatches.length === 1 ? exactMatches[0]!.id : null,
    };

    this.cache.set(normalizedName, { expiresAt: Date.now() + CACHE_TTL_MS, result });
    return result;
  }
}
