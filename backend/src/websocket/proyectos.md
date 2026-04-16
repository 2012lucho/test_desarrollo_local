# Manejador WebSocket para `proyectos`

Implementado en `backend/src/websocket/proyectos.js`.
Inyectado en `backend/src/index.js` dentro de `io.on('connection')`.

## Eventos entrantes (cliente → servidor)

| Evento | Payload | Descripción |
|---|---|---|
| `proyectos:list` | (sin payload) | Devuelve todos los proyectos ordenados por id asc |
| `proyectos:get` | `{ id }` | Devuelve un proyecto por id, incluyendo sus subproyectos y sus componentes |
| `proyectos:create` | `{ nombre, descripcion, subproyectos?: string[], componentes?: Array<{ nombre, descripcion?, config?: object | string }> }` | Crea un nuevo proyecto con subproyectos y componentes |
| `proyectos:update` | `{ id, nombre?, descripcion?, subproyectos?: string[], componentes?: Array<{ nombre, descripcion?, config?: object | string }> }` | Actualiza un proyecto y reemplaza sus subproyectos y componentes |
| `proyectos:delete` | `{ id }` | Elimina un proyecto junto a sus subproyectos y componentes |

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

Tabla `componentes` via Knex (ver `backend/migrations/20260416_create_componentes_table.js`):
- `id` integer pk autoincremental
- `proyecto_id` integer fk referencias `proyectos.id` notnull
- `nombre` varchar(100) notnull
- `descripcion` varchar(255) notnull
- `config` json notnull
- `creado_el` datetime notnull default now
- `actualizado_el` datetime notnull default now
