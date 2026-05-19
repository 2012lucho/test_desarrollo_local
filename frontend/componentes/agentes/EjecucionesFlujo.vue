<template>
  <div>
    <div class="d-flex align-items-start justify-content-between mb-3 gap-3">
      <div>
        <h4 class="mb-1">Ejecuciones del flujo</h4>
        <div class="text-muted small">Flujo ID: {{ idFlujo }}</div>
      </div>
      <button class="btn btn-sm btn-outline-secondary" type="button" @click="closeModal">Cerrar</button>
    </div>

    <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border" role="status"></div>
      <div class="mt-2 text-muted">Cargando ejecuciones...</div>
    </div>

    <div v-else>
      <div v-if="ejecuciones.length === 0" class="alert alert-secondary">
        No hay ejecuciones registradas para este flujo.
      </div>

      <div v-else class="table-responsive">
        <table class="table table-sm table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ejecucion in ejecuciones" :key="ejecucion.id">
              <td>{{ ejecucion.id }}</td>
              <td>{{ formatDate(ejecucion.fecha_hora_inicio) }}</td>
              <td>{{ ejecucion.fecha_hora_fin ? formatDate(ejecucion.fecha_hora_fin) : 'En curso' }}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary" type="button" @click="openDetalle(ejecucion)">Detalles</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useModal } from '../../composables/useModal.js';
import DetalleEjecucionFlujo from './DetalleEjecucionFlujo.vue';

const props = defineProps({
  socket: { type: Object, required: true },
  idFlujo: { type: Number, required: true },
});

const { cerrarModal: cerrarModalFn, mostrarModal } = useModal();
const ejecuciones = ref([]);
const loading = ref(true);
const errorMessage = ref('');

function formatDate(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
}

function closeModal() {
  cerrarModalFn();
}

function loadEjecuciones() {
  errorMessage.value = '';
  loading.value = true;
  props.socket.emit('agentes_flujo_ejecuciones:list', { id_flujo: props.idFlujo }, (resp) => {
    loading.value = false;
    if (resp.ok) {
      ejecuciones.value = resp.data ?? [];
    } else {
      ejecuciones.value = [];
      errorMessage.value = resp.error || 'Error cargando ejecuciones del flujo';
    }
  });
}

function openDetalle(ejecucion) {
  mostrarModal({
    body: DetalleEjecucionFlujo,
    bodyProps: { socket: props.socket, ejecucion },
    fullscreen: false,
  });
}

onMounted(() => {
  loadEjecuciones();
});
</script>
