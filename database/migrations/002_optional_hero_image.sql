BEGIN;

ALTER TABLE heroes
  DROP CONSTRAINT IF EXISTS heroes_imagen_url_http;

ALTER TABLE heroes
  ALTER COLUMN imagen_url DROP NOT NULL;

ALTER TABLE heroes
  ADD CONSTRAINT heroes_imagen_url_http
  CHECK (imagen_url IS NULL OR imagen_url ~* '^https?://');

COMMIT;
