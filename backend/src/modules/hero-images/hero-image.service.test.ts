import { describe, expect, it, vi } from 'vitest';

import { HeroImageService } from './hero-image.service.js';
import type { HeroImageCandidate, HeroImageProvider } from './hero-image.types.js';

const spiderMan: HeroImageCandidate = {
  id: '620',
  name: 'Spider-Man',
  fullName: 'Peter Parker',
  publisher: 'Marvel Comics',
  imageUrl: 'https://example.com/spider-man.jpg',
};

function providerWith(results: HeroImageCandidate[]): HeroImageProvider {
  return { search: vi.fn().mockResolvedValue(results) };
}

describe('HeroImageService', () => {
  it('selecciona automáticamente una única coincidencia exacta normalizada', async () => {
    const service = new HeroImageService(
      providerWith([
        spiderMan,
        {
          ...spiderMan,
          id: '621',
          name: 'Spider-Woman',
          imageUrl: 'https://example.com/woman.jpg',
        },
      ]),
    );

    const result = await service.search('spiderman');

    expect(result.automaticSelectionId).toBe(spiderMan.id);
    expect(result.candidates[0]).toEqual(spiderMan);
  });

  it('no elige automáticamente cuando existen varias coincidencias exactas', async () => {
    const service = new HeroImageService(
      providerWith([
        spiderMan,
        { ...spiderMan, id: '999', imageUrl: 'https://example.com/variant.jpg' },
      ]),
    );

    await expect(service.search('Spider-Man')).resolves.toMatchObject({
      automaticSelectionId: null,
      candidates: expect.arrayContaining([spiderMan]),
    });
  });

  it('devuelve un resultado vacío cuando el nombre no existe', async () => {
    await expect(new HeroImageService(providerWith([])).search('Original Hero')).resolves.toEqual({
      candidates: [],
      automaticSelectionId: null,
    });
  });

  it('informa que la integración no está configurada sin exponer secretos', async () => {
    await expect(new HeroImageService().search('Spider-Man')).rejects.toMatchObject({
      statusCode: 503,
      code: 'HERO_IMAGE_SEARCH_UNAVAILABLE',
    });
  });

  it('reutiliza temporalmente el resultado para evitar llamadas repetidas', async () => {
    const provider = providerWith([spiderMan]);
    const service = new HeroImageService(provider);

    await service.search('Spider-Man');
    await service.search('spider man');

    expect(provider.search).toHaveBeenCalledTimes(1);
  });
});
