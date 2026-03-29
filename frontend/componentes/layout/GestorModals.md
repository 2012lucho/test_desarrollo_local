# GestorModals.vue

Componente de gestión de modals genéricos apilables. Se registra una única vez en `App.vue` y escucha el estado global del composable `useModal`.

## Archivos

| Archivo | Descripción |
|---|---|
| `frontend/componentes/layout/GestorModals.vue` | Componente de renderizado |
| `frontend/composables/useModal.js` | Composable con estado global y funciones |

## Funcionamiento

- Mantiene un arreglo reactivo de modals activos. Cada nuevo modal se apila sobre el anterior con z-index creciente (base 1050, incremento de 2 por nivel).
- Cada modal se renderiza mediante `<Teleport to="body">`, evitando conflictos con el stacking context del layout.
- El diálogo usa flexbox columnar: `header` y `footer` tienen `flex-shrink: 0` (siempre visibles); el `body` tiene `flex: 1; min-height: 0; overflow-y: auto` (scroll interno si el contenido supera el espacio disponible).
- El diálogo nunca supera las dimensiones del viewport: `max-height: calc(100dvh - 2rem)` y `max-width: calc(100dvw - 2rem)`.
- Clic en el backdrop cierra el modal superior.
- Botón `×` siempre visible en la barra del encabezado del modal.

## API — `useModal()`

Importar desde cualquier componente:

```js
import { useModal } from '../../composables/useModal.js';
const { mostrarModal, cerrarModal } = useModal();
```

### `mostrarModal(config)` → `Function`

Abre un modal y retorna una función `cerrar()` para cerrarlo programáticamente.

**Parámetro `config`:**

| Propiedad | Tipo | Descripción |
|---|---|---|
| `header` | `ShallowRef<Component>` \| `Component` | Componente para el encabezado (opcional) |
| `body` | `ShallowRef<Component>` \| `Component` | Componente para el cuerpo (opcional) |
| `footer` | `ShallowRef<Component>` \| `Component` | Componente para el pie (opcional) |
| `headerProps` | `Object` | Props a pasar al componente header |
| `bodyProps` | `Object` | Props a pasar al componente body |
| `footerProps` | `Object` | Props a pasar al componente footer |

Los props pueden contener `ref()` de Vue para compartir estado reactivo con los subcomponentes del modal. El subcomponente los recibirá como ref object y deberá acceder vía `.value`.

### `cerrarModal(id)`

Cierra el modal con el id indicado. Para uso interno o desde el retorno de `mostrarModal`.

## Ejemplo de uso

```js
import { shallowRef, ref } from 'vue';
import { useModal } from '../composables/useModal.js';
import MiFormulario from '../componentes/MiFormulario.vue';
import MiFooter from '../componentes/MiFooter.vue';

const { mostrarModal } = useModal();

const datos = ref({ nombre: '' });

const cerrar = mostrarModal({
  body: shallowRef(MiFormulario),
  footer: shallowRef(MiFooter),
  bodyProps: { modelo: datos },
  footerProps: { onConfirmar: () => { console.log(datos.value); cerrar(); } },
});
```

## Integración en App.vue

`GestorModals` debe estar registrado una única vez en `App.vue`:

```vue
<GestorModals />
import GestorModals from './componentes/layout/GestorModals.vue';
```
