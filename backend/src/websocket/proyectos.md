# Manejador WebSocket para `proyectos`

Implementado en `backend/src/websocket/proyectos.js`.
Inyectado en `backend/src/index.js` dentro de `io.on('connection')`.

## Eventos entrantes (cliente → servidor)

| Evento | Payload | Descripción |
|---|---|---|
| `proyectos:list` | (sin payload) | Devuelve todos los proyectos ordenados por id asc |
| `proyectos:get` | `{ id }` | Devuelve un proyecto por id |
| `proyectos:create` | `{ nombre, descripcion }` | Crea un nuevo proyecto |
| `proyectos:update` | `{ id, nombre?, descripcion? }` | Actualiza campos de un proyecto existente |
| `proyectos:delete` | `{ id }` | Elimina un proyecto |

## Respuestas (callback ack)

Todos los eventos responden mediante callback de acknowledgement:

```json
{ "ok": true, "data": { ... } }
{ "ok": false, "error": "mensaje" }
```

## Eventos emitidos a todos los clientes (servidor → clientes)

- `proyectos:changed` `{ action: "created"|"updated"|"deleted", proyecto }` — emitido tras toda operación de escritura exitosa.

## Base de datos

Tabla `proyectos` via Knex (ver `backend/migrations/20260328_create_proyectos_table.js`):
- `id` integer pk autoincremental
- `nombre` varchar(50) notnull
- `descripcion` varchar(255) notnull
- `creado_el` datetime notnull default now
- `actualizado_el` datetime notnull default now
