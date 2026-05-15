const path = require('path');
const db = require(path.resolve(__dirname, '../backend/src/db.js'));

const SESSION_ORIGINS = ['HUMANO', 'AUTOMATICO'];

class Agente {
  constructor(modelo, ollamaUrl = 'http://localhost:11434') {
    if (typeof modelo !== 'string' || modelo.trim() === '') {
      throw new Error('El parametro modelo debe ser un string no vacío');
    }

    this.modelo = modelo.trim();
    this.entrada = '';
    this.promptSistema = '';
    this.ollamaUrl = ollamaUrl;
    this.session = {
      id: null,
      id_agente: null,
      id_proyecto: null,
      originado_por: 'HUMANO',
    };
  }

  setEntrada(texto) {
    this.entrada = texto == null ? '' : String(texto);
    return this;
  }

  setPromptSistema(prompt) {
    this.promptSistema = prompt == null ? '' : String(prompt);
    return this;
  }

  setSessionContext({ id_agente, id_proyecto = null, originado_por = 'HUMANO' } = {}) {
    const agenteId = String(id_agente || '').trim();
    if (!agenteId) {
      throw new Error('id_agente es requerido para el contexto de sesión');
    }

    const origen = String(originado_por || 'HUMANO').trim().toUpperCase();
    if (!SESSION_ORIGINS.includes(origen)) {
      throw new Error(`originado_por inválido: ${origen}`);
    }

    this.session.id_agente = agenteId;
    this.session.id_proyecto = id_proyecto == null || id_proyecto === '' ? null : id_proyecto;
    this.session.originado_por = origen;
    return this;
  }

  setSessionId(id) {
    if (id != null) {
      this.session.id = Number(id);
    }
    return this;
  }

  async createSession() {
    if (!this.session.id_agente) {
      throw new Error('id_agente no definido para crear sesión');
    }

    const [insertedId] = await db('session_agente').insert({
      fecha_hora_ini: db.fn.now(),
      fecha_hora_fin: db.fn.now(),
      id_agente: this.session.id_agente,
      id_proyecto: this.session.id_proyecto,
      originado_por: this.session.originado_por,
    });

    this.session.id = insertedId;
    return insertedId;
  }

  async logMessage({ origen, mensaje } = {}) {
    const source = String(origen || '').trim().toUpperCase();
    if (!SESSION_ORIGINS.includes(source)) {
      throw new Error(`Origen inválido para mensaje: ${source}`);
    }
    const text = mensaje == null ? '' : String(mensaje);

    await this.ensureSession();

    const [insertedId] = await db('mensajes_sesion').insert({
      id_session: this.session.id,
      origen: source,
      mensaje: text,
      fecha_hora: db.fn.now(),
    });

    await db('session_agente')
      .where({ id: this.session.id })
      .update({ fecha_hora_fin: db.fn.now() });

    return insertedId;
  }

  async touchSession() {
    if (!this.session.id) {
      throw new Error('session id no definido para actualizar');
    }

    const affected = await db('session_agente')
      .where({ id: this.session.id })
      .update({ fecha_hora_fin: db.fn.now() });

    if (!affected) {
      return this.createSession();
    }

    return this.session.id;
  }

  async ensureSession() {
    if (this.session.id) {
      const existing = await db('session_agente').where({ id: this.session.id }).first();
      if (existing) {
        return this.session.id;
      }
      this.session.id = null;
    }
    return this.createSession();
  }

  async ejecutar(partialCallback, finalCallback) {
    let onPartial = null;
    let onComplete = null;
    let signal = null;

    if (typeof partialCallback === 'object' && partialCallback !== null && !Array.isArray(partialCallback)) {
      onPartial = typeof partialCallback.onPartial === 'function' ? partialCallback.onPartial : null;
      onComplete = typeof partialCallback.onComplete === 'function' ? partialCallback.onComplete : null;
      signal = partialCallback.signal || null;
    } else {
      if (typeof partialCallback === 'function') {
        onPartial = partialCallback;
      }
      if (typeof finalCallback === 'function') {
        onComplete = finalCallback;
      }
    }

    const prompt = this._buildPrompt();
    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.modelo, prompt, stream: true }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama API error ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';
    const resultado = {
      modelo: this.modelo,
      entrada: this.entrada,
      promptSistema: this.promptSistema,
      respuesta: '',
      parcial: [],
      completo: false,
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;

        let chunk;
        try {
          chunk = JSON.parse(line);
        } catch {
          continue;
        }

        if (chunk.response != null) {
          fullResponse += chunk.response;
          resultado.respuesta = fullResponse;
          resultado.parcial.push(chunk.response);
          if (onPartial) {
            onPartial(chunk.response, resultado);
          }
        }

        if (chunk.done) {
          resultado.completo = true;
        }
      }
    }

    if (buffer.trim()) {
      try {
        const chunk = JSON.parse(buffer);
        if (chunk.response != null) {
          fullResponse += chunk.response;
          resultado.respuesta = fullResponse;
          resultado.parcial.push(chunk.response);
          if (onPartial) {
            onPartial(chunk.response, resultado);
          }
        }
        if (chunk.done) {
          resultado.completo = true;
        }
      } catch {
        // ignora contenido parcial sobrante no JSON
      }
    }

    resultado.completo = true;
    if (onComplete) {
      onComplete(resultado);
    }

    return resultado;
  }

  _buildPrompt() {
    const partes = [];
    if (this.promptSistema && this.promptSistema.trim()) {
      partes.push(this.promptSistema.trim());
    }
    if (this.entrada && this.entrada.trim()) {
      partes.push(this.entrada.trim());
    }
    return partes.join('\n\n');
  }
}

module.exports = Agente;
