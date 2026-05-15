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
          <div class="card-body chat-history p-3" ref="chatHistory">
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
                  message.role === 'user'
                    ? 'bg-primary text-white ms-auto'
                    : 'bg-light text-dark',
                  message.role === 'user' ? 'text-end' : 'text-start',
                ]"
                style="max-width: 100%;"
              >
                <div class="small fw-semibold mb-1">
                  {{ message.role === 'user' ? 'Usuario' : 'Agente' }}
                </div>
                <div
                  v-if="message.thinkingText"
                  class="p-2 rounded mb-2 bg-warning text-dark"
                  style="font-size: 0.85rem; white-space: pre-wrap; font-family: monospace;"
                >
                  <div class="small fw-semibold mb-1">Razonamiento interno</div>
                  <div>{{ message.thinkingText }}<span v-if="message.pending && !message.text" class="cursor-blink">▌</span></div>
                </div>
                <div v-if="message.text || (!message.thinkingText && message.pending)" class="mt-1" style="white-space: pre-wrap;">{{ message.text }}<span v-if="message.pending && (message.text || !message.thinkingText)" class="cursor-blink">▌</span></div>
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
              <label class="form-label fw-semibold">Agente</label>
              <select
                class="form-select"
                v-model="selectedAgent"
                :disabled="loading || !serverRunning || agents.length === 0"
              >
                <option value="" disabled>
                  {{ agents.length ? 'Selecciona un agente' : 'No hay agentes disponibles' }}
                </option>
                <option
                  v-for="agent in agents"
                  :key="agent.id"
                  :value="agent.id"
                >
                  {{ agent.nombre || agent.id }}
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
                :disabled="loading || !prompt.trim() || !selectedAgent || !serverRunning"
                @click="send"
              >
                {{ loading ? 'Enviando...' : 'Enviar' }}
              </button>
              <button
                class="btn btn-outline-danger"
                v-if="loading"
                @click="stopExecution"
              >
                Detener
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
import { ref, reactive, nextTick, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { useProyectos, loadProjects } from '../../composables/useProyectos';

const socket = io(import.meta.env.VITE_API_URL);

const agents = ref([]);
const selectedAgent = ref('');
const { selectedProject } = useProyectos();
const prompt = ref('');
const messages = ref([]);
const loading = ref(false);
const errorMessage = ref('');
const serverRunning = ref(false);
const currentAssistantText = ref('');
const assistantTyping = ref(false);
const currentSessionId = ref(null);

let currentRequestId = null;
let currentAssistantMessage = null;
let statusInterval = null;

const chatHistory = ref(null);

function scrollToBottom() {
  const el = chatHistory.value;
  if (el) el.scrollTop = el.scrollHeight;
}

function loadAgents() {
  socket.emit('agentes:list', null, (resp) => {
    if (resp.ok) {
      agents.value = resp.data ?? [];
      if (agents.value.length && !selectedAgent.value) {
        selectedAgent.value = agents.value[0].id;
      }
      errorMessage.value = '';
    } else {
      agents.value = [];
      errorMessage.value = resp.error || 'No se pudieron obtener los agentes disponibles.';
    }
  });
}

function loadStatus() {
  socket.emit('ollama:status', null, (resp) => {
    if (resp.ok) {
      serverRunning.value = !!resp.data?.running;
      if (serverRunning.value && statusInterval) {
        clearInterval(statusInterval);
        statusInterval = null;
      }
    } else {
      serverRunning.value = false;
      errorMessage.value = resp.error || 'No se pudo contactar con el servidor Ollama.';
      if (!statusInterval) {
        statusInterval = setInterval(loadStatus, 5000);
      }
    }
  });
}

socket.on('ollama:generate:chunk', (data) => {
  if (data.requestId !== currentRequestId) return;
  if (!data.done) {
    if (currentAssistantMessage) {
      if (data.isThinking) {
        currentAssistantMessage.thinkingText += data.token;
      } else {
        currentAssistantMessage.text += data.token;
      }
      currentAssistantText.value = currentAssistantMessage.thinkingText + currentAssistantMessage.text;
      nextTick(scrollToBottom);
    }
  } else {
    assistantTyping.value = false;
    loading.value = false;
    currentRequestId = null;
    if (currentAssistantMessage) {
      currentAssistantMessage.pending = false;
    }
    currentAssistantMessage = null;
    nextTick(scrollToBottom);
  }
});

async function send() {
  if (!prompt.value.trim() || !selectedAgent.value || !serverRunning.value) return;

  errorMessage.value = '';

  const userText = prompt.value.trim();
  messages.value.push({ role: 'user', text: userText });

  currentAssistantText.value = '';
  assistantTyping.value = true;
  loading.value = true;
  currentRequestId = `${Date.now()}-${Math.random()}`;
  currentAssistantMessage = reactive({ role: 'assistant', text: '', thinkingText: '', pending: true });
  messages.value.push(currentAssistantMessage);
  nextTick(scrollToBottom);

  socket.emit(
    'ollama:generate',
    {
      agentId: selectedAgent.value,
      prompt: userText,
      requestId: currentRequestId,
      sessionId: currentSessionId.value,
      id_proyecto: selectedProject.value || null,
      originado_por: 'HUMANO',
    },
    (resp) => {
      assistantTyping.value = false;
      loading.value = false;
      if (resp.ok) {
        if (resp.data?.sessionId) {
          currentSessionId.value = resp.data.sessionId;
        }
      } else if (!resp.aborted) {
        errorMessage.value = resp.error || 'Error generando respuesta';
      }
      currentRequestId = null;
      currentAssistantMessage = null;
    }
  );

  prompt.value = '';
}

function stopExecution() {
  if (!currentRequestId) return;
  socket.emit('ollama:stop', { requestId: currentRequestId }, () => {});
  loading.value = false;
  assistantTyping.value = false;
  currentRequestId = null;
  currentAssistantMessage = null;
}

function clearConversation() {
  messages.value = [];
  currentAssistantText.value = '';
  errorMessage.value = '';
  currentSessionId.value = null;
}

onMounted(() => {
  loadStatus();
  loadProjects();
  loadAgents();

  socket.on('connect', () => {
    loadStatus();
    loadAgents();
  });
});

onUnmounted(() => {
  socket.off('ollama:generate:chunk');
  socket.off('connect');
  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }
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
