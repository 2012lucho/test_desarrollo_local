const path = require('path');
const { Agent, fetch: undiciFetch } = require('undici');
const db = require('../db');
const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';
const Agente = require(path.resolve(__dirname, '../../../agentes/agentesMin.js'));
const OLLAMA_DISPATCHER = new Agent({ connectTimeout: 0, headersTimeout: 0, bodyTimeout: 0 });

async function getPromptSistemaDefault() {
  try {
    await db.ready;
    const agente = await db('agentes').where({ id: 'test_modelo' }).first();
    return agente?.promt_sistema?.trim() || '';
  } catch (err) {
    console.error('No se pudo cargar prompt de sistema desde DB:', err.message);
    return '';
  }
}

/**
 * Manejador de eventos WebSocket para interacción con Ollama.
 *
 * Eventos entrantes (cliente -> servidor):
 * - ollama:status
 * - ollama:list
 * - ollama:pull      { model }
 * - ollama:delete    { model }
 * - ollama:generate  { model?, prompt, requestId, agentId?, sessionId?, id_proyecto?, originado_por? }
 * - ollama:stop      { requestId? }
 *
 * Respuestas por callback de ack o emisión al socket:
 * - ollama:pull:progress   { model, status, completed?, total?, ... }
 * - ollama:generate:chunk  { requestId, token, done, fullResponse? }
 */
module.exports = (socket) => {
  const activeRequests = new Map();
  const safeCallback = (callback, payload) => {
    if (typeof callback === 'function') callback(payload);
  };

  socket.on('sessionAgente:list', async (_payload, callback) => {
    try {
      const sessions = await db('session_agente').select('*').orderBy('fecha_hora_ini', 'desc');
      safeCallback(callback, { ok: true, data: sessions });
    } catch (error) {
      console.error('sessionAgente:list error', error);
      safeCallback(callback, { ok: false, error: 'Error listando sesiones de agente' });
    }
  });

  socket.on('sessionAgente:messages', async (payload, callback) => {
    const id_session = payload?.id_session;
    if (!id_session) {
      return safeCallback(callback, { ok: false, error: 'id_session es requerido' });
    }

    try {
      const messages = await db('mensajes_sesion')
        .where({ id_session })
        .orderBy('fecha_hora', 'asc');
      safeCallback(callback, { ok: true, data: messages });
    } catch (error) {
      console.error('sessionAgente:messages error', error);
      safeCallback(callback, { ok: false, error: 'Error listando mensajes de sesión' });
    }
  });

  socket.on('sessionAgente:delete', async (payload, callback) => {
    const id = payload?.id;
    if (!id) {
      return safeCallback(callback, { ok: false, error: 'Id de sesión es requerido' });
    }

    try {
      await db('mensajes_sesion').where({ id_session: id }).delete();
      const deleted = await db('session_agente').where({ id }).delete();
      if (!deleted) {
        return safeCallback(callback, { ok: false, error: 'Sesión no encontrada', status: 404 });
      }
      safeCallback(callback, { ok: true, data: { id } });
    } catch (error) {
      console.error('sessionAgente:delete error', error);
      safeCallback(callback, { ok: false, error: 'Error eliminando sesión de agente' });
    }
  });

  // ── Verifica si el servidor Ollama está disponible ────────────────────────
  socket.on('ollama:status', async (_payload, callback) => {
    try {
      const resp = await undiciFetch(`${OLLAMA_BASE}/`, { dispatcher: OLLAMA_DISPATCHER });
      const text = await resp.text();
      safeCallback(callback, { ok: true, data: { running: true, message: text.trim() } });
    } catch (err) {
      console.error('ollama:status error', err);
      safeCallback(callback, { ok: false, error: 'Ollama no disponible', data: { running: false } });
    }
  });

  // ── Lista los modelos instalados ──────────────────────────────────────────
  socket.on('ollama:list', async (_payload, callback) => {
    try {
      const resp = await undiciFetch(`${OLLAMA_BASE}/api/tags`, { dispatcher: OLLAMA_DISPATCHER });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      safeCallback(callback, { ok: true, data: data.models || [] });
    } catch (err) {
      console.error('ollama:list error', err);
      safeCallback(callback, { ok: false, error: 'Error listando modelos de Ollama' });
    }
  });

  // ── Instala (pull) un modelo nuevo, transmite el progreso ─────────────────
  socket.on('ollama:pull', async (payload, callback) => {
    const { model } = payload || {};
    if (!model) {
      return safeCallback(callback, { ok: false, error: 'Se requiere el nombre del modelo' });
    }

    try {
      const resp = await undiciFetch(`${OLLAMA_BASE}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model, stream: true }),
        dispatcher: OLLAMA_DISPATCHER,
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);
            socket.emit('ollama:pull:progress', { model, ...chunk });
            if (chunk.status === 'success') {
              safeCallback(callback, { ok: true, data: { model } });
              return;
            }
          } catch { /* línea incompleta, ignorar */ }
        }
      }
      safeCallback(callback, { ok: true, data: { model } });
    } catch (err) {
      console.error('ollama:pull error', err);
      safeCallback(callback, { ok: false, error: `Error instalando modelo: ${err.message}` });
    }
  });

  // ── Elimina un modelo instalado ───────────────────────────────────────────
  socket.on('ollama:delete', async (payload, callback) => {
    const { model } = payload || {};
    if (!model) {
      return safeCallback(callback, { ok: false, error: 'Se requiere el nombre del modelo' });
    }

    try {
      const resp = await undiciFetch(`${OLLAMA_BASE}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model }),
        dispatcher: OLLAMA_DISPATCHER,
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      safeCallback(callback, { ok: true, data: { model } });
    } catch (err) {
      console.error('ollama:delete error', err);
      safeCallback(callback, { ok: false, error: `Error eliminando modelo: ${err.message}` });
    }
  });

  // ── Detiene una ejecución en curso ───────────────────────────────────────
  socket.on('ollama:stop', (payload, callback) => {
    const { requestId } = payload || {};
    if (requestId) {
      const controller = activeRequests.get(requestId);
      if (controller) {
        controller.abort();
        activeRequests.delete(requestId);
      }
    } else {
      for (const controller of activeRequests.values()) {
        controller.abort();
      }
      activeRequests.clear();
    }
    safeCallback(callback, { ok: true });
  });

  // ── Genera texto con streaming token a token ──────────────────────────────
  socket.on('ollama:generate', async (payload, callback) => {
    const { model, prompt, requestId, agentId, sessionId, id_proyecto, originado_por } = payload || {};
    if (!prompt) {
      return safeCallback(callback, { ok: false, error: 'Se requiere prompt' });
    }

    let selectedModel = model;
    let systemPrompt = await getPromptSistemaDefault();

    if (agentId) {
      try {
        const agenteDb = await db('agentes').where({ id: String(agentId).trim() }).first();
        if (agenteDb) {
          if (agenteDb.modelo && agenteDb.modelo.trim()) {
            selectedModel = agenteDb.modelo.trim();
          }
          if (agenteDb.promt_sistema && agenteDb.promt_sistema.trim()) {
            systemPrompt = agenteDb.promt_sistema.trim();
          }
        }
      } catch (err) {
        console.error('ollama:generate cargar agente error', err);
      }
    }

    if (!selectedModel) {
      return safeCallback(callback, { ok: false, error: 'Se requiere model' });
    }

    const controller = new AbortController();
    if (requestId) {
      activeRequests.set(requestId, controller);
    }

    try {
      const agente = new Agente(selectedModel)
        .setPromptSistema(systemPrompt)
        .setEntrada(prompt);

      const shouldLogSession = Boolean(agentId);
      if (shouldLogSession) {
        agente.setSessionContext({
          id_agente: agentId,
          id_proyecto: id_proyecto == null || id_proyecto === '' ? null : id_proyecto,
          originado_por: originado_por || 'HUMANO',
        });

        if (sessionId) {
          agente.setSessionId(sessionId);
        }

        await agente.logMessage({ origen: 'HUMANO', mensaje: prompt });
      }

      const resultado = await agente.ejecutar({
        onPartial: (token) => {
          socket.emit('ollama:generate:chunk', {
            requestId,
            token,
            done: false,
          });
        },
        onComplete: async (resultadoFinal) => {
          socket.emit('ollama:generate:chunk', {
            requestId,
            token: '',
            done: true,
            fullResponse: resultadoFinal.respuesta,
          });
          if (shouldLogSession) {
            await agente.logMessage({ origen: 'AUTOMATICO', mensaje: resultadoFinal.respuesta });
          }
        },
        signal: controller.signal,
      });

      const responsePayload = { fullResponse: resultado.respuesta };
      if (shouldLogSession) {
        responsePayload.sessionId = agente.session.id;
      }
      safeCallback(callback, { ok: true, data: responsePayload });
    } catch (err) {
      const terminatedByAbort =
        err?.name === 'AbortError' ||
        (err?.name === 'TypeError' && err?.message === 'terminated') ||
        err?.code === 'UND_ERR_SOCKET' ||
        controller.signal?.aborted;

      if (terminatedByAbort) {
        socket.emit('ollama:generate:chunk', {
          requestId,
          token: '',
          done: true,
          aborted: true,
        });
        safeCallback(callback, { ok: false, error: 'Ejecución detenida', aborted: true });
      } else {
        console.error('ollama:generate error', err);
        safeCallback(callback, { ok: false, error: `Error generando respuesta: ${err.message}` });
      }
    } finally {
      if (requestId) {
        activeRequests.delete(requestId);
      }
    }
  });
};
