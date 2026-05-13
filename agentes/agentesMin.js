class Agente {
  constructor(modelo, ollamaUrl = 'http://localhost:11434') {
    if (typeof modelo !== 'string' || modelo.trim() === '') {
      throw new Error('El parametro modelo debe ser un string no vacío');
    }

    this.modelo = modelo.trim();
    this.entrada = '';
    this.promptSistema = '';
    this.ollamaUrl = ollamaUrl;
  }

  setEntrada(texto) {
    this.entrada = texto == null ? '' : String(texto);
    return this;
  }

  setPromptSistema(prompt) {
    this.promptSistema = prompt == null ? '' : String(prompt);
    return this;
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
