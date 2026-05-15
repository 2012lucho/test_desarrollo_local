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
        v-if="pensamiento || respuesta"
        class="btn btn-sm btn-outline-secondary"
        :disabled="cargando"
        @click="limpiar"
      >
        Limpiar
      </button>
    </div>

    <div v-if="mensajeError" class="alert alert-danger py-1 mb-2">{{ mensajeError }}</div>

    <div v-if="pensamiento || (cargando && !respuesta)" class="border rounded p-2 mb-3" style="background: #fff9e6; min-height: 60px; max-height: 220px; overflow-y: auto; white-space: pre-wrap; font-family: monospace; font-size: 0.85rem;">
      <div class="fw-semibold mb-1" style="color: #856404;">Razonamiento interno</div>
      <div>{{ pensamiento }}<span v-if="cargando && !respuesta" class="cursor-blink">▌</span></div>
    </div>

    <div v-if="respuesta || (cargando && pensamiento)" class="border rounded p-2 bg-light" style="min-height: 60px; max-height: 280px; overflow-y: auto; white-space: pre-wrap; font-family: monospace; font-size: 0.875rem;">
      <div class="fw-semibold mb-1">Respuesta</div>
      <div>{{ respuesta }}<span v-if="cargando && pensamiento" class="cursor-blink">▌</span></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const props = defineProps(['modelName']);

const socket = io(import.meta.env.VITE_API_URL);

const prompt = ref('');
const pensamiento = ref('');
const respuesta = ref('');
const cargando = ref(false);
const mensajeError = ref('');

let currentRequestId = null;

socket.on('ollama:generate:chunk', (data) => {
  if (data.requestId !== currentRequestId) return;
  if (!data.done) {
    if (data.isThinking) {
      pensamiento.value += data.token;
    } else {
      respuesta.value += data.token;
    }
  } else {
    cargando.value = false;
  }
});

function enviar() {
  if (!prompt.value.trim()) return;
  mensajeError.value = '';
  pensamiento.value = '';
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
  pensamiento.value = '';
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
