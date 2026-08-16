-- Permite desactivar cuentas sin perder su historial ni borrar relaciones.
ALTER TABLE "usuarios"
ADD COLUMN IF NOT EXISTS "activo" BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS "usuarios_rol_activo_idx"
ON "usuarios"("rol", "activo");
