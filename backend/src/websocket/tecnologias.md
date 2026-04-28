# Manejador WebSocket para `tecnologias`

Implementado en `backend/src/websocket/tecnologias.js`.

Eventos soportados:

- `tecnologias:list` — devuelve todas las tecnologías ordenadas por id asc
- `tecnologias:get` `{ id }` — devuelve una sola tecnología
- `tecnologias:create` `{ nombre, color? }` — crea una tecnología nueva
- `tecnologias:update` `{ id, nombre, color? }` — actualiza una tecnología existente
- `tecnologias:delete` `{ id }` — elimina una tecnología
- `tecnologias:changed` — emitido tras crear, actualizar o eliminar tecnología
