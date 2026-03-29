# Componentes Ollama

Directorio: `frontend/componentes/ollama/`

Implementan la vista de gestión e interacción con modelos Ollama a través del backend WebSocket.

---

## Archivos

| Archivo | Tipo | Descripción |
|---|---|---|
| `abmOllama.vue` | Vista principal | Lista modelos instalados, instala y elimina modelos |
| `OllamaTestHeader.vue` | Modal — header | Título del modal de prueba con el nombre del modelo |
| `OllamaTestBody.vue` | Modal — body | Envío de prompt y visualización de respuesta en streaming |

---

## abmOllama.vue

Componente raíz de la ruta `/ollama`.

### Funcionalidades
- Verifica el estado del servidor Ollama al montar (`ollama:status`).
- Lista los modelos instalados (`ollama:list`).
- Muestra badge de estado del servidor (activo / inactivo).
- Permite instalar un nuevo modelo ingresando su nombre; muestra el progreso de descarga en tiempo real vía el evento `ollama:pull:progress`.
- Permite eliminar un modelo instalado (`ollama:delete`).
- Abre el modal de prueba para cualquier modelo listado.

### Eventos WebSocket utilizados
| Evento emitido | Descripción |
|---|---|
| `ollama:status` | Verifica disponibilidad del servidor |
| `ollama:list` | Obtiene modelos instalados |
| `ollama:pull` | Inicia instalación de modelo |
| `ollama:delete` | Elimina un modelo |

| Evento escuchado | Descripción |
|---|---|
| `ollama:pull:progress` | Progreso en tiempo real durante instalación |

---

## OllamaTestHeader.vue

Componente header del modal de prueba.

### Props
| Prop | Tipo | Descripción |
|---|---|---|
| `modelName` | String | Nombre del modelo que se está probando |

---

## OllamaTestBody.vue

Componente cuerpo del modal de prueba. Gestiona su propia conexión WebSocket independiente para no interferir con la del componente padre.

### Props
| Prop | Tipo | Descripción |
|---|---|---|
| `modelName` | String | Nombre del modelo contra el que se ejecuta la generación |

### Funcionalidades
- Campo de texto (textarea) para ingresar el prompt.
- Botón "Enviar" que emite `ollama:generate` con el modelo, el prompt y un `requestId` único.
- Visualización del texto generado token a token a medida que llegan los eventos `ollama:generate:chunk`.
- Cursor parpadeante mientras el modelo está generando.
- Botón "Limpiar" para reiniciar el área de respuesta.
- Indicador de errores.

### Eventos WebSocket utilizados
| Evento emitido | Descripción |
|---|---|
| `ollama:generate` | Inicia generación de texto con streaming |

| Evento escuchado | Descripción |
|---|---|
| `ollama:generate:chunk` | Token individual recibido durante la generación |

---

## Integración con el router

Ruta registrada en `frontend/router/index.js`:

```js
{ path: '/ollama', name: 'Ollama', component: AbmOllama }
```

Accesible desde la barra lateral izquierda mediante el enlace "Ollama".
