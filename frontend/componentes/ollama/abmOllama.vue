<template>
  <div class="card mt-3">
    <div class="card-header d-flex justify-content-between align-items-center">
      <span>Ollama — Modelos instalados</span>
      <div class="d-flex align-items-center gap-2">
        <span
          class="badge"
          :class="serverRunning ? 'bg-success' : 'bg-danger'"
          :title="serverRunning ? 'Servidor disponible' : 'Servidor no disponible'"
        >
          {{ serverRunning ? 'Servidor activo' : 'Servidor inactivo' }}
        </span>
        <button class="btn btn-sm btn-outline-secondary" @click="verificarServidor">
          ↺ Estado
        </button>
        <button class="btn btn-sm btn-primary" @click="abrirInstalar">
          Instalar modelo
        </button>
      </div>
    </div>

    <div class="card-body">
      <div v-if="mensajeError" class="alert alert-danger py-1 mb-2">{{ mensajeError }}</div>
      <div v-if="mensajePull" class="alert alert-info py-1 mb-2" style="font-family: monospace; font-size: 0.85rem;">
        {{ mensajePull }}
      </div>

      <!-- Formulario instalar modelo -->
      <div v-if="mostrandoInstalar" class="input-group input-group-sm mb-3" style="max-width: 420px;">
        <input
          v-model="nuevoModelo"
          type="text"
          class="form-control"
          placeholder="ej: llama3.2, mistral, gemma2:2b"
          :disabled="instalando"
          @keydown.enter="instalar"
        />
        <button class="btn btn-success" :disabled="instalando || !nuevoModelo.trim()" @click="instalar">
          {{ instalando ? 'Instalando...' : 'Instalar' }}
        </button>
        <button class="btn btn-outline-secondary" :disabled="instalando" @click="mostrandoInstalar = false; nuevoModelo = ''">
          Cancelar
        </button>
      </div>

      <!-- Lista de modelos -->
      <table class="table table-sm table-hover mb-0">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Familia</th>
            <th>Tamaño</th>
            <th>Modificado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!modelos.length">
            <td colspan="5" class="text-muted">
              {{ serverRunning ? 'No hay modelos instalados.' : 'Inicia el servidor Ollama para ver los modelos.' }}
            </td>
          </tr>
          <tr v-for="m in modelos" :key="m.name">
            <td>{{ m.name }}</td>
            <td>{{ m.details?.family ?? '-' }}</td>
            <td>{{ formatBytes(m.size) }}</td>
            <td>{{ formatFecha(m.modified_at) }}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-primary me-1" @click="abrirTest(m.name)">
                Probar
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="eliminar(m.name)">
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { useModal } from '../../composables/useModal.js';
import OllamaTestHeader from './OllamaTestHeader.vue';
import OllamaTestBody from './OllamaTestBody.vue';

const socket = io(import.meta.env.VITE_API_URL);
const { mostrarModal } = useModal();

const modelos = ref([]);
const serverRunning = ref(false);
const mensajeError = ref('');
const mensajePull = ref('');
const mostrandoInstalar = ref(false);
const nuevoModelo = ref('');
const instalando = ref(false);

function verificarServidor() {
  socket.emit('ollama:status', null, (resp) => {
    serverRunning.value = resp.ok && resp.data?.running;
    if (serverRunning.value) {
      cargarLista();
    }
  });
}

function cargarLista() {
  socket.emit('ollama:list', null, (resp) => {
    if (resp.ok) {
      modelos.value = resp.data;
      mensajeError.value = '';
    } else {
      mensajeError.value = resp.error || 'Error al obtener modelos';
    }
  });
}

function abrirInstalar() {
  mostrandoInstalar.value = true;
  nuevoModelo.value = '';
  mensajePull.value = '';
}

function instalar() {
  if (!nuevoModelo.value.trim()) return;
  instalando.value = true;
  mensajePull.value = `Iniciando descarga de "${nuevoModelo.value}"...`;
  mensajeError.value = '';

  socket.emit('ollama:pull', { model: nuevoModelo.value.trim() }, (resp) => {
    instalando.value = false;
    mostrandoInstalar.value = false;
    nuevoModelo.value = '';
    if (resp.ok) {
      mensajePull.value = '';
      cargarLista();
    } else {
      mensajePull.value = '';
      mensajeError.value = resp.error || 'Error al instalar modelo';
    }
  });
}

function eliminar(nombre) {
  if (!confirm(`¿Eliminar el modelo "${nombre}"?`)) return;
  socket.emit('ollama:delete', { model: nombre }, (resp) => {
    if (resp.ok) {
      cargarLista();
    } else {
      mensajeError.value = resp.error || 'Error al eliminar modelo';
    }
  });
}

function abrirTest(nombre) {
  mostrarModal({
    header: OllamaTestHeader,
    body: OllamaTestBody,
    headerProps: { modelName: nombre },
    bodyProps: { modelName: nombre },
  });
}

socket.on('ollama:pull:progress', (data) => {
  const parts = [`[${data.model}] ${data.status}`];
  if (data.total) {
    const pct = Math.round((data.completed / data.total) * 100);
    parts.push(`${pct}% (${formatBytes(data.completed)} / ${formatBytes(data.total)})`);
  }
  mensajePull.value = parts.join(' — ');
});

function formatBytes(bytes) {
  if (!bytes) return '-';
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString();
}

onMounted(() => {
  verificarServidor();
});

onUnmounted(() => {
  socket.off('ollama:pull:progress');
  socket.disconnect();
});
</script>

<style scoped>
.card {
  border: 1px solid #ced4da;
}
</style>
