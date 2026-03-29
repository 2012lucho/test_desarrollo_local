# abmProyectos.vue

ABM de proyectos con CRUD completo vía WebSocket (Socket.IO).

## Rutas centrales

Documentación centralizada en `frontend/router/router.md`.

- `#/proyectos` → `abmProyectos.vue`

## Ruta

`#/proyectos` (hash history)

## Funcionalidades

- **Listar**: carga la lista al montar el componente vía `proyectos:list`
- **Crear**: formulario inline con campos `nombre` y `descripcion` (`proyectos:create`)
- **Editar**: mismo formulario pre-cargado con datos del proyecto (`proyectos:update`)
- **Eliminar**: confirmación nativa y llamada a `proyectos:delete`
- **Reactivo**: escucha `proyectos:changed` para refrescar la lista automáticamente

## Comunicación

Conecta directamente a `VITE_API_URL` con `socket.io-client`.
El socket se desconecta al desmontar el componente (`onUnmounted`).

## API utilizada

Ver [proyectos.md](../../../backend/src/websocket/proyectos.md)