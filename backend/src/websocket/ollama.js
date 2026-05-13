const path = require('path');
const db = require('../db');
const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';
const Agente = require(path.resolve(__dirname, '../../../agentes/agentesMin.js'));

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
 * - ollama:generate  { model?, prompt, requestId, agentId? }
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

  // ── Verifica si el servidor Ollama está disponible ────────────────────────
  socket.on('ollama:status', async (_payload, callback) => {
    try {
      const resp = await fetch(`${OLLAMA_BASE}/`);
      const text = await resp.text();
      safeCallback(callback, { ok: true, data: { running: true, message: text.trim() } });
    } catch {
      safeCallback(callback, { ok: false, error: 'Ollama no disponible', data: { running: false } });
    }
  });

  // ── Lista los modelos instalados ──────────────────────────────────────────
  socket.on('ollama:list', async (_payload, callback) => {
    try {
      const resp = await fetch(`${OLLAMA_BASE}/api/tags`);
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
      const resp = await fetch(`${OLLAMA_BASE}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model, stream: true }),
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
      const resp = await fetch(`${OLLAMA_BASE}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model }),
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
    const { model, prompt, requestId, agentId } = payload || {};
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

      const resultado = await agente.ejecutar({
        onPartial: (token) => {
          socket.emit('ollama:generate:chunk', {
            requestId,
            token,
            done: false,
          });
        },
        onComplete: (resultadoFinal) => {
          socket.emit('ollama:generate:chunk', {
            requestId,
            token: '',
            done: true,
            fullResponse: resultadoFinal.respuesta,
          });
        },
        signal: controller.signal,
      });

      safeCallback(callback, { ok: true, data: { fullResponse: resultado.respuesta } });
    } catch (err) {
      if (err.name === 'AbortError') {
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
