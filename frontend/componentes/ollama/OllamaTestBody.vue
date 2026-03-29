<template>
  <div style="min-width: 480px; max-width: 680px;">
    <div class="mb-3">
      <label class="form-label fw-semibold">Instrucción / Prompt</label>
      <textarea
        v-model="prompt"
        class="form-control"
        rows="4"
        placeholder="Escribe tu instrucción aquí..."
        :disabled="cargando"
      ></textarea>
    </div>

    <div class="d-flex gap-2 mb-3">
      <button
        class="btn btn-sm btn-primary"
        :disabled="cargando || !prompt.trim()"
        @click="enviar"
      >
        {{ cargando ? 'Generando...' : 'Enviar' }}
      </button>
      <button
        v-if="respuesta"
        class="btn btn-sm btn-outline-secondary"
        :disabled="cargando"
        @click="limpiar"
      >
        Limpiar
      </button>
    </div>

    <div v-if="mensajeError" class="alert alert-danger py-1 mb-2">{{ mensajeError }}</div>

    <div v-if="respuesta || cargando" class="border rounded p-2 bg-light" style="min-height: 80px; max-height: 340px; overflow-y: auto; white-space: pre-wrap; font-family: monospace; font-size: 0.875rem;">
      <span>{{ respuesta }}</span><span v-if="cargando" class="cursor-blink">▌</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const props = defineProps(['modelName']);

const socket = io(import.meta.env.VITE_API_URL);

const prompt = ref('');
const respuesta = ref('');
const cargando = ref(false);
const mensajeError = ref('');

let currentRequestId = null;

socket.on('ollama:generate:chunk', (data) => {
  if (data.requestId !== currentRequestId) return;
  if (!data.done) {
    respuesta.value += data.token;
  } else {
    cargando.value = false;
  }
});

function enviar() {
  if (!prompt.value.trim()) return;
  mensajeError.value = '';
  respuesta.value = '';
  cargando.value = true;
  currentRequestId = `${Date.now()}-${Math.random()}`;

  socket.emit(
    'ollama:generate',
    { model: props.modelName, prompt: prompt.value.trim(), requestId: currentRequestId },
    (resp) => {
      cargando.value = false;
      if (!resp.ok) {
        mensajeError.value = resp.error || 'Error generando respuesta';
      }
    }
  );
}

function limpiar() {
  prompt.value = '';
  respuesta.value = '';
  mensajeError.value = '';
}

onUnmounted(() => {
  socket.off('ollama:generate:chunk');
  socket.disconnect();
});
</script>

<style scoped>
.cursor-blink {
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
