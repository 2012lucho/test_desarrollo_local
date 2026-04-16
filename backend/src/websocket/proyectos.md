# Manejador WebSocket para `proyectos`

Implementado en `backend/src/websocket/proyectos.js`.
Inyectado en `backend/src/index.js` dentro de `io.on('connection')`.

## Eventos entrantes (cliente → servidor)

| Evento | Payload | Descripción |
|---|---|---|
| `proyectos:list` | (sin payload) | Devuelve todos los proyectos ordenados por id asc |
| `proyectos:get` | `{ id }` | Devuelve un proyecto por id, incluyendo sus subproyectos |
| `proyectos:create` | `{ nombre, descripcion, subproyectos?: string[] }` | Crea un nuevo proyecto y sus subproyectos |
| `proyectos:update` | `{ id, nombre?, descripcion?, subproyectos?: string[] }` | Actualiza un proyecto y reemplaza sus subproyectos |
| `proyectos:delete` | `{ id }` | Elimina un proyecto junto a sus subproyectos |

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

Tabla `subproyectos` via Knex (ver `backend/migrations/20260415_create_subproyectos_table.js`):
- `id` integer pk autoincremental
- `proyecto_id` integer fk referencias `proyectos.id` notnull
- `nombre` varchar(100) notnull
- `creado_el` datetime notnull default now
- `actualizado_el` datetime notnull default now
