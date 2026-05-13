<template>
  <div class="py-3">
    <div class="mb-3">
      <div class="alert alert-secondary mb-0">
        Chat con agente integrado en la vista inicial. La conversación se muestra en pantalla sin persistencia en la base de datos.
      </div>
    </div>

    <div class="row g-3">
      <div class="col-12 col-lg-6">
        <div class="card h-100">
          <div class="card-header">Conversación</div>
          <div class="card-body chat-history p-3">
            <div v-if="messages.length === 0" class="text-muted">
              No hay mensajes aún. Envía un mensaje en el panel derecho para comenzar.
            </div>
            <div
              v-for="(message, index) in messages"
              :key="index"
              class="mb-3"
            >
              <div
                :class="[
                  'p-3 rounded',
                  message.role === 'user' ? 'bg-primary text-white ms-auto' : 'bg-light text-dark',
                  message.role === 'user' ? 'text-end' : 'text-start',
                ]"
                style="max-width: 100%;"
              >
                <div class="small text-muted">
                  {{ message.role === 'user' ? 'Usuario' : 'Agente' }}
                </div>
                <div class="mt-1" style="white-space: pre-wrap;">{{ message.text }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-6">
        <div class="card h-100">
          <div class="card-header">Enviar a Ollama</div>
          <div class="card-body d-flex flex-column">
            <div class="mb-3">
              <label class="form-label fw-semibold">Modelo</label>
              <select
                class="form-select"
                v-model="selectedModel"
                :disabled="loading || !serverRunning || models.length === 0"
              >
                <option value="" disabled>
                  {{ models.length ? 'Selecciona un modelo' : 'No hay modelos instalados' }}
                </option>
                <option
                  v-for="model in models"
                  :key="model.name ?? model"
                  :value="model.name ?? model"
                >
                  {{ model.name ?? model }}
                </option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label fw-semibold">Proyecto</label>
              <select
                class="form-select"
                v-model="selectedProject"
                :disabled="loading || projects.length === 0"
              >
                <option value="" disabled>
                  {{ projects.length ? 'Selecciona un proyecto' : 'No hay proyectos disponibles' }}
                </option>
                <option
                  v-for="project in projects"
                  :key="project.id ?? project"
                  :value="project.id ?? project"
                >
                  {{ project.nombre ?? project }}
                </option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label fw-semibold">Mensaje</label>
              <textarea
                class="form-control"
                rows="6"
                v-model="prompt"
                placeholder="Escribe tu mensaje para el agente..."
                :disabled="loading || !serverRunning"
              ></textarea>
            </div>

            <div class="d-flex gap-2 mb-3">
              <button
                class="btn btn-primary"
                :disabled="loading || !prompt.trim() || !selectedModel || !serverRunning"
                @click="send"
              >
                {{ loading ? 'Enviando...' : 'Enviar' }}
              </button>
              <button
                class="btn btn-outline-secondary"
                :disabled="loading || messages.length === 0"
                @click="clearConversation"
              >
                Limpiar
              </button>
            </div>

            <div v-if="!serverRunning" class="alert alert-warning py-2 mb-2">
              El servidor Ollama no está disponible. Inicia el backend para usar el chat.
            </div>
            <div v-if="errorMessage" class="alert alert-danger py-2 mb-2">
              {{ errorMessage }}
            </div>

            <div class="flex-grow-1 overflow-auto border rounded p-3 bg-light" style="min-height: 160px; white-space: pre-wrap; font-family: monospace; font-size: 0.92rem;">
              <div v-if="assistantTyping || currentAssistantText">
                <div class="fw-semibold mb-2">Respuesta del agente</div>
                <div>{{ currentAssistantText }}<span v-if="assistantTyping" class="cursor-blink">▌</span></div>
              </div>
              <div v-else class="text-muted">
                Aquí verá la respuesta de Ollama en tiempo real mientras genera.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL);

const models = ref([]);
const selectedModel = ref('');
const projects = ref([]);
const selectedProject = ref('');
const prompt = ref('');
const messages = ref([]);
const loading = ref(false);
const errorMessage = ref('');
const serverRunning = ref(false);
const currentAssistantText = ref('');
const assistantTyping = ref(false);

let currentRequestId = null;
let currentAssistantMessage = null;

function loadModels() {
  socket.emit('ollama:list', null, (resp) => {
    if (resp.ok) {
      models.value = resp.data ?? [];
      if (models.value.length && !selectedModel.value) {
        selectedModel.value = models.value[0].name ?? models.value[0];
      }
      errorMessage.value = '';
    } else {
      models.value = [];
      errorMessage.value = resp.error || 'No se pudieron obtener los modelos disponibles.';
    }
  });
}

function loadProjects() {
  socket.emit('proyectos:list', null, (resp) => {
    if (resp.ok) {
      projects.value = resp.data ?? [];
      if (projects.value.length && !selectedProject.value) {
        selectedProject.value = projects.value[0].id ?? projects.value[0];
      }
      errorMessage.value = '';
    } else {
      projects.value = [];
      errorMessage.value = resp.error || 'No se pudieron obtener los proyectos disponibles.';
    }
  });
}

function loadStatus() {
  socket.emit('ollama:status', null, (resp) => {
    if (resp.ok) {
      serverRunning.value = !!resp.data?.running;
      if (serverRunning.value) {
        loadModels();
      } else {
        models.value = [];
      }
    } else {
      serverRunning.value = false;
      models.value = [];
      errorMessage.value = resp.error || 'No se pudo contactar con el servidor Ollama.';
    }
  });
}

socket.on('ollama:generate:chunk', (data) => {
  if (data.requestId !== currentRequestId) return;
  if (!data.done) {
    if (currentAssistantMessage) {
      currentAssistantMessage.text += data.token;
      currentAssistantText.value = currentAssistantMessage.text;
    }
  } else {
    assistantTyping.value = false;
    loading.value = false;
    currentRequestId = null;
    currentAssistantMessage = null;
  }
});

function send() {
  if (!prompt.value.trim() || !selectedModel.value || !serverRunning.value) return;

  errorMessage.value = '';
  const userText = prompt.value.trim();
  messages.value.push({ role: 'user', text: userText });

  currentAssistantText.value = '';
  assistantTyping.value = true;
  loading.value = true;
  currentRequestId = `${Date.now()}-${Math.random()}`;
  currentAssistantMessage = { role: 'assistant', text: '' };
  messages.value.push(currentAssistantMessage);

  socket.emit(
    'ollama:generate',
    { model: selectedModel.value, prompt: userText, requestId: currentRequestId },
    (resp) => {
      assistantTyping.value = false;
      loading.value = false;
      if (!resp.ok) {
        errorMessage.value = resp.error || 'Error generando respuesta';
      }
      currentRequestId = null;
      currentAssistantMessage = null;
    }
  );

  prompt.value = '';
}

function clearConversation() {
  messages.value = [];
  currentAssistantText.value = '';
  errorMessage.value = '';
}

onMounted(() => {
  loadStatus();
  loadProjects();
});

onUnmounted(() => {
  socket.off('ollama:generate:chunk');
  socket.disconnect();
});
</script>

<style scoped>
.chat-history {
  min-height: 480px;
  max-height: 78vh;
  overflow-y: auto;
}

.cursor-blink {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
