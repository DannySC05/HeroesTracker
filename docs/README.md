# Hito 0 - Contrato técnico

Estado: **aprobado para implementación**.

Este directorio define el contrato que deberán respetar el backend, la aplicación
web, la aplicación móvil y la colección de Postman. En este hito no se crea código
ejecutable ni se despliega infraestructura.

## Documentos

- [Arquitectura y decisiones](./architecture.md)
- [Modelo de datos](./data-model.md)
- [Contrato de la API REST](./api-contract.md)
- [Seguridad, configuración y despliegue](./security-and-operations.md)
- [Matriz de trazabilidad](./traceability.md)

## Criterio de cierre

El Hito 0 se considera terminado cuando:

1. Las entidades, relaciones, enumeraciones y restricciones están definidas.
2. Cada endpoint requerido tiene permisos, entradas, salidas y errores definidos.
3. La autenticación, autorización y revocación de tokens están especificadas.
4. Las variables de entorno y los destinos de despliegue están identificados.
5. Cada requisito de la evaluación aparece en la matriz de trazabilidad.

Las decisiones de estos documentos son la línea base. Cualquier cambio posterior
debe actualizar primero el contrato y luego sus consumidores.
