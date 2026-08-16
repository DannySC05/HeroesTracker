import type { HeroImageCandidate, HeroImageProvider } from './hero-image.types.js';

interface ComicVineImage {
  medium_url?: string;
  small_url?: string;
  thumb_url?: string;
  original_url?: string;
}

interface ComicVineCharacter {
  id?: number | string;
  name?: string;
  real_name?: string;
  resource_type?: string;
  publisher?: { name?: string } | null;
  image?: ComicVineImage | null;
}

interface ComicVineResponse {
  error?: string;
  status_code?: number;
  results?: ComicVineCharacter[];
}

const COMIC_VINE_IMAGE_HOSTS = new Set(['comicvine.gamespot.com', 'comicvine1.cbsistatic.com']);

function isAllowedImageUrl(value: string | undefined): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && COMIC_VINE_IMAGE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function selectImageUrl(image: ComicVineImage | null | undefined): string | null {
  const candidates = [image?.medium_url, image?.small_url, image?.thumb_url, image?.original_url];

  return candidates.find(isAllowedImageUrl) ?? null;
}

export class ComicVineApiClient implements HeroImageProvider {
  constructor(
    private readonly apiKey: string,
    private readonly request: typeof fetch = fetch,
  ) {}

  async search(name: string): Promise<HeroImageCandidate[]> {
    const url = new URL('https://comicvine.gamespot.com/api/search/');
    url.search = new URLSearchParams({
      api_key: this.apiKey,
      format: 'json',
      resources: 'character',
      query: name,
      field_list: 'id,name,real_name,publisher,image,resource_type',
      limit: '8',
    }).toString();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6_000);

    try {
      const response = await this.request(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'HeroesTracker/0.1 (academic non-commercial project)',
        },
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Comic Vine respondió ${response.status}.`);

      const body = (await response.json()) as ComicVineResponse;
      if (body.status_code !== 1) {
        throw new Error(`Comic Vine rechazó la solicitud: ${body.error ?? 'error desconocido'}.`);
      }

      return (body.results ?? []).flatMap((character) => {
        const imageUrl = selectImageUrl(character.image);
        if (
          character.id === undefined ||
          !character.name ||
          !imageUrl ||
          (character.resource_type && character.resource_type !== 'character')
        ) {
          return [];
        }

        return [
          {
            id: String(character.id),
            name: character.name,
            fullName: character.real_name?.trim() || null,
            publisher: character.publisher?.name?.trim() || null,
            imageUrl,
          },
        ];
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
