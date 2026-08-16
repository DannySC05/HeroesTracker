import { describe, expect, it, vi } from 'vitest';

import { ComicVineApiClient } from './comic-vine-api.client.js';

describe('ComicVineApiClient', () => {
  it('busca personajes y mapea únicamente imágenes HTTPS de Comic Vine', async () => {
    const request = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: 'OK',
          status_code: 1,
          results: [
            {
              id: 1443,
              name: 'Spider-Man',
              real_name: 'Peter Parker',
              resource_type: 'character',
              publisher: { name: 'Marvel' },
              image: {
                medium_url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/spider-man.jpg',
              },
            },
            {
              id: 2,
              name: 'Untrusted',
              resource_type: 'character',
              image: { medium_url: 'https://example.com/untrusted.jpg' },
            },
            {
              id: 3,
              name: 'Not a character',
              resource_type: 'volume',
              image: { medium_url: 'https://comicvine.gamespot.com/a/uploads/volume.jpg' },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const results = await new ComicVineApiClient('secret-key', request).search('Spider-Man');

    expect(results).toEqual([
      {
        id: '1443',
        name: 'Spider-Man',
        fullName: 'Peter Parker',
        publisher: 'Marvel',
        imageUrl: 'https://comicvine.gamespot.com/a/uploads/scale_medium/spider-man.jpg',
      },
    ]);

    const requestedUrl = new URL(String(request.mock.calls[0]?.[0]));
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(
      'https://comicvine.gamespot.com/api/search/',
    );
    expect(Object.fromEntries(requestedUrl.searchParams)).toMatchObject({
      api_key: 'secret-key',
      format: 'json',
      resources: 'character',
      query: 'Spider-Man',
      limit: '8',
    });
    expect(request).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('HeroesTracker'),
        }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('convierte una búsqueda sin coincidencias en una lista vacía', async () => {
    const request = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: 'OK', status_code: 1, results: [] }), { status: 200 }),
      );

    await expect(new ComicVineApiClient('key', request).search('Unknown')).resolves.toEqual([]);
  });

  it('rechaza respuestas de error aunque Comic Vine responda HTTP 200', async () => {
    const request = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: 'Invalid API Key', status_code: 100 }), {
          status: 200,
        }),
      );

    await expect(new ComicVineApiClient('invalid-key', request).search('Nova')).rejects.toThrow(
      'Comic Vine rechazó la solicitud',
    );
  });
});
