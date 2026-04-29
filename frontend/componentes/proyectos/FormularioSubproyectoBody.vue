<template>
  <div style="min-width: 320px;">
    <div class="row g-3 mb-3">
      <div class="col-12 col-lg-6">
        <div class="mb-3">
          <label class="form-label">Nombre</label>
          <input v-model="nombre" type="text" class="form-control" maxlength="100" />
        </div>
      </div>

      <div class="col-12 col-lg-6">
        <div class="mb-3">
          <label class="form-label">Tecnologías relacionadas</label>
          <div class="border rounded p-2 mb-2" style="min-height: 140px;">
            <div v-if="!tecnologiasSeleccionadas.length" class="text-muted">Sin tecnologías seleccionadas.</div>
            <ul v-else class="list-unstyled mb-0">
              <li
                v-for="tecnologia in tecnologiasSeleccionadas"
                :key="tecnologia.id"
                class="d-flex justify-content-between align-items-center mb-2"
              >
                <span>
                  <span class="badge text-white" :style="{ backgroundColor: tecnologia.color || '#6c757d' }">
                    {{ tecnologia.nombre }}
                  </span>
                </span>
                <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarTecnologia(tecnologia.id)">Eliminar</button>
              </li>
            </ul>
          </div>

          <div class="d-flex gap-2 mb-2">
            <button type="button" class="btn btn-sm btn-outline-primary" @click="mostrarSeleccion = !mostrarSeleccion">
              {{ mostrarSeleccion ? 'Ocultar' : 'Seleccionar' }} tecnologías
            </button>
            <button
              v-if="selectedTecnologias.length"
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="limpiarTecnologias"
            >
              Limpiar selección
            </button>
          </div>

          <div v-if="mostrarSeleccion" class="border rounded p-2">
            <div v-if="cargandoTecnologias" class="text-muted">Cargando tecnologías...</div>
            <div v-else>
              <div v-if="!tecnologias.length" class="text-muted">No hay tecnologías disponibles.</div>
              <div v-else class="list-group">
                <label
                  v-for="tecnologia in tecnologias"
                  :key="tecnologia.id"
                  class="list-group-item d-flex align-items-center"
                >
                  <input
                    type="checkbox"
                    class="form-check-input me-2"
                    :value="tecnologia.id"
                    v-model="selectedTecnologias"
                  />
                  <span :style="{ color: tecnologia.color || '#000' }">{{ tecnologia.nombre }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label">Componentes relacionados</label>
          <div class="border rounded p-2 mb-2" style="min-height: 140px;">
            <div v-if="!componentesSeleccionados.length" class="text-muted">Sin componentes seleccionados.</div>
            <ul v-else class="list-unstyled mb-0">
              <li
                v-for="componente in componentesSeleccionados"
                :key="componente.id"
                class="d-flex justify-content-between align-items-center mb-2"
              >
                <span>{{ componente.nombre || 'Componente sin nombre' }}</span>
                <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarComponente(componente.id)">Eliminar</button>
              </li>
            </ul>
          </div>

          <div class="d-flex gap-2 mb-2">
            <button type="button" class="btn btn-sm btn-outline-primary" @click="mostrarSeleccionComponentes = !mostrarSeleccionComponentes">
              {{ mostrarSeleccionComponentes ? 'Ocultar' : 'Seleccionar' }} componentes
            </button>
            <button
              v-if="selectedComponentes.length"
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="limpiarComponentes"
            >
              Limpiar selección
            </button>
          </div>

          <div v-if="mostrarSeleccionComponentes" class="border rounded p-2">
            <div v-if="!componentes.length" class="text-muted">No hay componentes disponibles.</div>
            <div v-else class="list-group">
              <label
                v-for="componente in componentes"
                :key="componente.id"
                class="list-group-item d-flex align-items-center"
              >
                <input
                  type="checkbox"
                  class="form-check-input me-2"
                  :value="componente.id"
                  v-model="selectedComponentes"
                />
                <span>{{ componente.nombre || 'Componente sin nombre' }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="props.mensajeError?.value" class="alert alert-danger py-1 mb-0">
      {{ props.mensajeError.value }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const props = defineProps(['subproyecto', 'mensajeError', 'componentes']);

const socket = io(import.meta.env.VITE_API_URL);
const tecnologias = ref([]);
const cargandoTecnologias = ref(false);
const mostrarSeleccion = ref(false);
const mostrarSeleccionComponentes = ref(false);

const componentes = computed(() => {
  const value = props.componentes?.value ?? props.componentes;
  return Array.isArray(value) ? value : [];
});

const selectedTecnologias = computed({
  get: () => {
    if (!props.subproyecto?.value) return [];
    if (!Array.isArray(props.subproyecto.value.tecnologias)) {
      props.subproyecto.value.tecnologias = [];
    }
    return props.subproyecto.value.tecnologias;
  },
  set: (val) => {
    if (props.subproyecto?.value) {
      props.subproyecto.value.tecnologias = Array.isArray(val)
        ? Array.from(new Set(val.map((id) => Number(id)).filter((id) => id > 0)))
        : [];
    }
  },
});

const tecnologiasSeleccionadas = computed(() => {
  return tecnologias.value.filter((item) => selectedTecnologias.value.includes(item.id));
});

const nombre = computed({
  get: () => props.subproyecto?.value?.nombre ?? '',
  set: (val) => { if (props.subproyecto?.value) props.subproyecto.value.nombre = val; },
});

const selectedComponentes = computed({
  get: () => {
    if (!props.subproyecto?.value) return [];
    if (!Array.isArray(props.subproyecto.value.componentes)) {
      props.subproyecto.value.componentes = [];
    }
    return props.subproyecto.value.componentes;
  },
  set: (val) => {
    if (props.subproyecto?.value) {
      props.subproyecto.value.componentes = Array.isArray(val)
        ? Array.from(new Set(val.map((id) => Number(id)).filter((id) => id !== 0 && !Number.isNaN(id))))
        : [];
    }
  },
});

const componentesSeleccionados = computed(() => {
  return componentes.value.filter((item) => selectedComponentes.value.includes(item.id));
});

function cargarTecnologias() {
  cargandoTecnologias.value = true;
  socket.emit('tecnologias:list', null, (resp) => {
    cargandoTecnologias.value = false;
    if (resp.ok) {
      tecnologias.value = Array.isArray(resp.data) ? resp.data : [];
    } else {
      tecnologias.value = [];
    }
  });
}

function quitarTecnologia(id) {
  selectedTecnologias.value = selectedTecnologias.value.filter((item) => item !== id);
}

function limpiarTecnologias() {
  selectedTecnologias.value = [];
}

function quitarComponente(id) {
  selectedComponentes.value = selectedComponentes.value.filter((item) => item !== id);
}

function limpiarComponentes() {
  selectedComponentes.value = [];
}

onMounted(() => {
  cargarTecnologias();
});

onUnmounted(() => {
  socket.disconnect();
});
</script>
