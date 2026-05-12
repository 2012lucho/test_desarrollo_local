<template>
  <div style="min-width: 320px;">
    <div class="row g-3">
      <div class="col-12 col-lg-6">
        <div class="mb-3">
          <label class="form-label">Nombre</label>
          <input v-model="nombre" type="text" class="form-control" maxlength="100" />
        </div>
        <div class="mb-3">
          <label class="form-label">Descripción</label>
          <textarea v-model="descripcion" class="form-control" rows="3" maxlength="1024"></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label">Config JSON</label>
          <textarea v-model="configText" class="form-control" rows="9" placeholder='{"clave": "valor"}'></textarea>
        </div>
      </div>

      <div class="col-12 col-lg-6">
        <div class="mb-3">
          <label class="form-label">Tablas relacionadas</label>
          <div class="border rounded p-2 mb-2" style="min-height: 140px;">
            <div v-if="!tablasSeleccionadas.length" class="text-muted">Sin tablas seleccionadas.</div>
            <ul v-else class="list-unstyled mb-0">
              <li
                v-for="tabla in tablasSeleccionadas"
                :key="tabla.id"
                class="d-flex justify-content-between align-items-center mb-2"
              >
                <span>{{ tabla.nombre || 'Tabla sin nombre' }}</span>
                <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarTabla(tabla.id)">Eliminar</button>
              </li>
            </ul>
          </div>

          <div class="d-flex gap-2 mb-2">
            <button type="button" class="btn btn-sm btn-outline-primary" @click="mostrarSeleccionTablas = !mostrarSeleccionTablas">
              {{ mostrarSeleccionTablas ? 'Ocultar' : 'Seleccionar' }} tablas
            </button>
            <button
              v-if="selectedTablas.length"
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="limpiarTablas"
            >
              Limpiar selección
            </button>
          </div>

          <div v-if="mostrarSeleccionTablas" class="border rounded p-2">
            <div v-if="!tablasDisponibles.length" class="text-muted">No hay tablas disponibles.</div>
            <div v-else class="list-group">
              <label
                v-for="tabla in tablasDisponibles"
                :key="tabla.id"
                class="list-group-item d-flex align-items-center"
              >
                <input
                  type="checkbox"
                  class="form-check-input me-2"
                  :value="tabla.id"
                  v-model="selectedTablas"
                />
                <span>{{ tabla.nombre || 'Tabla sin nombre' }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="props.mensajeError?.value" class="alert alert-danger py-1 mb-0 mt-2">
      {{ props.mensajeError.value }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps(['componente', 'mensajeError', 'subproyectos', 'tablas']);

const componente = computed({
  get: () => props.componente?.value ?? props.componente ?? {},
  set: (val) => {
    if (props.componente?.value) {
      props.componente.value = val;
    } else if (props.componente && typeof props.componente === 'object') {
      Object.assign(props.componente, val);
    }
  },
});

const nombre = computed({
  get: () => componente.value?.nombre ?? '',
  set: (val) => { if (componente.value) componente.value.nombre = val; },
});

const descripcion = computed({
  get: () => componente.value?.descripcion ?? '',
  set: (val) => { if (componente.value) componente.value.descripcion = val; },
});

const configText = computed({
  get: () => componente.value?.configText ?? '{}',
  set: (val) => { if (componente.value) componente.value.configText = val; },
});

const mostrarSeleccionTablas = ref(false);

const selectedTablas = computed({
  get: () => {
    if (!componente.value) return [];
    if (!Array.isArray(componente.value.tablas)) {
      componente.value.tablas = [];
    }
    return componente.value.tablas;
  },
  set: (val) => {
    if (componente.value) {
      componente.value.tablas = Array.isArray(val)
        ? Array.from(new Set(val.map((id) => Number(id)).filter((id) => id !== 0 && !Number.isNaN(id))))
        : [];
    }
  },
});

const tablasDisponibles = computed(() => {
  const value = props.tablas?.value ?? props.tablas;
  return Array.isArray(value) ? value : [];
});

const tablasSeleccionadas = computed(() => {
  const seleccionados = selectedTablas.value;
  return tablasDisponibles.value.filter((tabla) => seleccionados.includes(tabla.id));
});


function quitarTabla(id) {
  selectedTablas.value = selectedTablas.value.filter((item) => item !== id);
}

function limpiarTablas() {
  selectedTablas.value = [];
}
</script>
