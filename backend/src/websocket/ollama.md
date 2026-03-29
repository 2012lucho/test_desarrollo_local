# Manejador WebSocket para `ollama`

Implementado en `backend/src/websocket/ollama.js`.
Inyectado en `backend/src/index.js` dentro de `io.on('connection')`.

Requiere que el servidor Ollama esté corriendo localmente (por defecto en `http://localhost:11434`).
La URL base puede configurarse con la variable de entorno `OLLAMA_URL`.

---

## Eventos entrantes (cliente → servidor)

| Evento | Payload | Descripción |
|---|---|---|
| `ollama:status` | (sin payload) | Verifica si el servidor Ollama está disponible |
| `ollama:list` | (sin payload) | Devuelve los modelos actualmente instalados |
| `ollama:pull` | `{ model }` | Instala un nuevo modelo; transmite progreso en tiempo real |
| `ollama:delete` | `{ model }` | Elimina un modelo instalado |
| `ollama:generate` | `{ model, prompt, requestId }` | Genera texto con streaming token a token |

---

## Respuestas (callback ack)

Todos los eventos responden mediante callback de acknowledgement:

```json
{ "ok": true, "data": { ... } }
{ "ok": false, "error": "mensaje de error" }
```

### `ollama:status` → `data`

```json
{ "running": true, "message": "Ollama is running" }
```

### `ollama:list` → `data`

Array de modelos según la API de Ollama:

```json
[
  {
    "name": "llama3.2:latest",
    "modified_at": "2025-01-01T00:00:00Z",
    "size": 2019393189,
    "digest": "...",
    "details": { "format": "gguf", "family": "llama", ... }
  }
]
```

### `ollama:pull` → `data`

```json
{ "model": "llama3.2:latest" }
```

### `ollama:delete` → `data`

```json
{ "model": "llama3.2:latest" }
```

### `ollama:generate` → `data`

```json
{ "fullResponse": "Texto completo generado por el modelo" }
```

---

## Eventos emitidos al socket durante operaciones de streaming

### `ollama:pull:progress`

Emitido durante la instalación de un modelo por cada chunk de progreso de la API:

```json
{
  "model": "llama3.2:latest",
  "status": "pulling manifest",
  "completed": 1048576,
  "total": 2019393189
}
```

Posibles valores de `status`: `"pulling manifest"`, `"downloading"`, `"verifying sha256 digest"`, `"writing manifest"`, `"removing any unused layers"`, `"success"`.

### `ollama:generate:chunk`

Emitido durante la generación de texto por cada token recibido:

```json
{ "requestId": "uuid-o-string-arbitrario", "token": "Hola", "done": false }
```

Cuando finaliza, `done` es `true` y se incluye `fullResponse`:

```json
{ "requestId": "...", "token": "", "done": true, "fullResponse": "Hola, ¿cómo estás?" }
```

El campo `requestId` es definido por el cliente al emitir `ollama:generate` y permite correlacionar
los chunks con la solicitud correspondiente cuando hay múltiples sockets.

---

## Variables de entorno

| Variable | Defecto | Descripción |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | URL base del servidor Ollama |
