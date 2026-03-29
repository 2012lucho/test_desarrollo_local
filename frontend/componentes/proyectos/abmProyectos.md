# abmProyectos.vue

ABM de proyectos con CRUD completo vía WebSocket (Socket.IO).

## Rutas centrales

Documentación centralizada en `frontend/router/router.md`.

- `#/proyectos` → `abmProyectos.vue`

## Ruta

`#/proyectos` (hash history)

## Funcionalidades

- **Listar**: carga la lista al montar el componente vía `proyectos:list`
- **Crear**: abre modal con formulario (`proyectos:create`)
- **Editar**: abre modal con formulario pre-cargado (`proyectos:update`)
- **Eliminar**: confirmación nativa y llamada a `proyectos:delete`
- **Reactivo**: escucha `proyectos:changed` para refrescar la lista automáticamente

## Formulario (modal)

El formulario de alta/edición se presenta usando `GestorModals` a través de `useModal`.  
Ver [GestorModals.md](../layout/GestorModals.md).

Al abrir el modal se crean refs locales por instancia (`form`, `editandoId`, `cargandoForm`, `mensajeErrorForm`) que se comparten con los sub-componentes vía `bodyProps` / `footerProps` / `headerProps`.

### Sub-componentes del formulario

| Archivo | Slot modal | Descripción |
|---|---|---|
| `FormularioProyectoHeader.vue` | `header` | Título "Nuevo Proyecto" / "Editar Proyecto" |
| `FormularioProyectoBody.vue` | `body` | Campos nombre y descripción, mensaje de error |
| `FormularioProyectoFooter.vue` | `footer` | Botones Guardar y Cancelar |

### Props compartidos con los sub-componentes (refs)

| Prop | Tipo | Destino |
|---|---|---|
| `editandoId` | `ref(Number\|null)` | Header |
| `form` | `ref({ nombre, descripcion })` | Body |
| `mensajeError` | `ref(String)` | Body |
| `cargando` | `ref(Boolean)` | Footer |
| `onGuardar` | `Function` | Footer |
| `onCerrar` | `Function` | Footer |

## Comunicación

Conecta directamente a `VITE_API_URL` con `socket.io-client`.
El socket se desconecta al desmontar el componente (`onUnmounted`).

## API utilizada

Ver [proyectos.md](../../../backend/src/websocket/proyectos.md)