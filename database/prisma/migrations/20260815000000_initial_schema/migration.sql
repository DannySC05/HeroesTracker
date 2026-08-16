-- Enumeraciones permitidas por el contrato
CREATE TYPE "rol_usuario" AS ENUM ('ADMIN', 'CONSULTA');
CREATE TYPE "estado_heroe" AS ENUM ('ACTIVO', 'INACTIVO');
CREATE TYPE "nivel_peligro" AS ENUM ('BAJO', 'MEDIO', 'ALTO');
CREATE TYPE "estado_mision" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA');

-- Usuarios
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "rol_usuario" NOT NULL DEFAULT 'CONSULTA',
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "usuarios_nombre_no_vacio" CHECK (btrim("nombre") <> ''),
    CONSTRAINT "usuarios_email_lowercase" CHECK ("email" = lower("email"))
);

-- Héroes
CREATE TABLE "heroes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(100) NOT NULL,
    "nombre_real" VARCHAR(120) NOT NULL,
    "poder_principal" VARCHAR(160) NOT NULL,
    "nivel_poder" SMALLINT NOT NULL,
    "imagen_url" TEXT NOT NULL,
    "estado" "estado_heroe" NOT NULL,
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL,

    CONSTRAINT "heroes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "heroes_nombre_no_vacio" CHECK (btrim("nombre") <> ''),
    CONSTRAINT "heroes_nombre_real_no_vacio" CHECK (btrim("nombre_real") <> ''),
    CONSTRAINT "heroes_poder_principal_no_vacio" CHECK (btrim("poder_principal") <> ''),
    CONSTRAINT "heroes_nivel_poder_range" CHECK ("nivel_poder" BETWEEN 1 AND 100),
    CONSTRAINT "heroes_imagen_url_http" CHECK ("imagen_url" ~* '^https?://')
);

-- Misiones
CREATE TABLE "misiones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titulo" VARCHAR(160) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "ubicacion" VARCHAR(160) NOT NULL,
    "fecha" DATE NOT NULL,
    "nivel_peligro" "nivel_peligro" NOT NULL,
    "estado" "estado_mision" NOT NULL,
    "superheroe_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL,

    CONSTRAINT "misiones_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "misiones_titulo_no_vacio" CHECK (btrim("titulo") <> ''),
    CONSTRAINT "misiones_descripcion_no_vacia" CHECK (btrim("descripcion") <> ''),
    CONSTRAINT "misiones_ubicacion_no_vacia" CHECK (btrim("ubicacion") <> '')
);

-- Revocación de JWT
CREATE TABLE "tokens_revocados" (
    "jti" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "expira_en" TIMESTAMP(3) WITH TIME ZONE NOT NULL,
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_revocados_pkey" PRIMARY KEY ("jti")
);

-- Unicidad e índices
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
CREATE UNIQUE INDEX "heroes_nombre_key" ON "heroes"("nombre");
CREATE UNIQUE INDEX "heroes_nombre_lower_key" ON "heroes"(lower("nombre"));
CREATE INDEX "misiones_superheroe_id_idx" ON "misiones"("superheroe_id");
CREATE INDEX "misiones_fecha_idx" ON "misiones"("fecha");
CREATE INDEX "tokens_revocados_expira_en_idx" ON "tokens_revocados"("expira_en");

-- Relaciones
ALTER TABLE "misiones"
ADD CONSTRAINT "misiones_superheroe_id_fkey"
FOREIGN KEY ("superheroe_id") REFERENCES "heroes"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tokens_revocados"
ADD CONSTRAINT "tokens_revocados_usuario_id_fkey"
FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
