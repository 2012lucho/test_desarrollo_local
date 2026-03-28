A partir de definicion de tabla (ver [db.md](db.md)) se debe definir nuevos metodos para CRUD de proyectos.

## api de eventos para `proyectos`

Eventos cliente -> servidor (Socket.IO):

- `proyectos:list` (sin payload)
- `proyectos:get` { id }
- `proyectos:create` { nombre, descripcion }
- `proyectos:update` { id, nombre?, descripcion? }
- `proyectos:delete` { id }

Respuestas con callback ack:

- `ok: true` / `ok: false` y `data` o `error`

Eventos de notificación global (servidor -> cliente):

- `proyectos:changed` { action: 'created'|'updated'|'deleted', proyecto }

## implementación

- `backend/src/websocket/proyectos.js` (manejador de eventos)
- `backend/src/index.js` (inyección en `io.on('connection')`)

## base de datos

Tabla `proyectos` (ver `backend/migrations/20260328_create_proyectos_table.js`):
- id integer pk autoincremental
- nombre varchar(50) notnull
- descripcion varchar(255) notnull
- creado_el datetime notnull default now
- actualizado_el datetime notnull default now
