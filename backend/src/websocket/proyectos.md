# Manejador WebSocket para `proyectos`

Implementado en `backend/src/websocket/proyectos.js`.
Inyectado en `backend/src/index.js` dentro de `io.on('connection')`.

## Eventos entrantes (cliente → servidor)

| Evento | Payload | Descripción |
|---|---|---|
| `proyectos:list` | (sin payload) | Devuelve todos los proyectos ordenados por id asc |
| `proyectos:get` | `{ id }` | Devuelve un proyecto por id, incluyendo sus subproyectos y sus componentes |
| `proyectos:create` | `{ nombre, descripcion, subproyectos?: Array<{ id?: number, nombre: string, tecnologias?: number[] }>, componentes?: Array<{ nombre: string, descripcion?: string, config?: object | string, subproyectos?: number[] }>, tablas?: Array<{ nombre: string, campos?: Array<{ nombre: string, descripcion?: string }> }> }` | Crea un nuevo proyecto con subproyectos, tecnologías relacionadas, componentes, tablas y campos de tabla |
| `proyectos:update` | `{ id, nombre?, descripcion?, subproyectos?: Array<{ id?: number, nombre: string, tecnologias?: number[] }>, componentes?: Array<{ nombre: string, descripcion?: string, config?: object | string, subproyectos?: number[] }>, tablas?: Array<{ nombre: string, campos?: Array<{ nombre: string, descripcion?: string }> }> }` | Actualiza un proyecto y reemplaza sus subproyectos, las tecnologías relacionadas, sus componentes, tablas y campos de tabla |
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

Tabla `subproyecto_tecnologias` via Knex (ver `backend/migrations/20260428_create_subproyecto_tecnologias_table.js`):
- `id` integer pk autoincremental
- `subproyecto_id` integer fk referencias `subproyectos.id` notnull
- `tecnologia_id` integer fk referencias `tecnologias.id` notnull
- `creado_el` datetime notnull default now

Tabla `componentes` via Knex (ver `backend/migrations/20260416_create_componentes_table.js`):
- `id` integer pk autoincremental
- `proyecto_id` integer fk referencias `proyectos.id` notnull
- `nombre` varchar(100) notnull
- `descripcion` varchar(255) notnull
- `config` json notnull
- `creado_el` datetime notnull default now
- `actualizado_el` datetime notnull default now

Tabla `tablas_db_proyectos` via Knex (ver `backend/migrations/20260501_create_tablas_db_proyectos_table.js`):
- `id` integer pk autoincremental
- `nombre` varchar(100) notnull
- `proyecto_id` integer fk referencias `proyectos.id` notnull

Tabla `campos_tabla` via Knex (ver `backend/migrations/20260502_create_campos_tabla_table.js`):
- `id` integer pk autoincremental
- `nombre` varchar(100) notnull
- `descripcion` text null
- `proyecto_id` integer fk referencias `proyectos.id` notnull
- `id_tabla` integer fk referencias `tablas_db_proyectos.id` notnull

Tabla `subproyecto_componentes` via Knex (ver `backend/migrations/20260428_create_subproyecto_componentes_table.js`):
- `id` integer pk autoincremental
- `componente_id` integer fk referencias `componentes.id` notnull
- `subproyecto_id` integer fk referencias `subproyectos.id` notnull
- `creado_el` datetime notnull default now
- `unique (componente_id, subproyecto_id)`
