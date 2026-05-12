<template>
  <div style="min-width: 320px;">
    <div class="row g-3 mb-3">
      <div class="col-12 col-lg-6">
        <div class="mb-3">
          <label class="form-label">Nombre</label>
          <input v-model="nombre" type="text" class="form-control" maxlength="100" />
        </div>
        <div class="mb-3">
          <label class="form-label">Descripción</label>
          <textarea v-model="descripcion" class="form-control" rows="3" maxlength="512"></textarea>
        </div>
      </div>

      <div class="col-12 col-lg-6">
        <div class="mb-3">
          <label class="form-label">Tipo de subproyecto</label>
          <select v-model="tipoSubproyecto" class="form-select">
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="backend_y_frontend">Backend y Frontend</option>
            <option value="base_datos">Base de datos</option>
          </select>
        </div>
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
                  v-for="tecnologia in tecnologiasFiltradas"
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
          <div class="d-flex justify-content-between align-items-center mb-2">
            <label class="form-label mb-0">Componentes</label>
            <button type="button" class="btn btn-sm btn-outline-primary" @click="agregarComponente()">Agregar componente</button>
          </div>
          <div v-if="!componentesAsignados.length" class="text-muted mb-2">Sin componentes en este subproyecto.</div>
          <div v-for="(componente, index) in componentesAsignados" :key="componente.id ?? index" class="card mb-2">
            <div class="card-header d-flex justify-content-between align-items-center p-2">
              <div>
                <button type="button" class="btn btn-link p-0 text-start" style="text-decoration: none;" @click="toggleComponente(componente)">
                  <strong>{{ componente.nombre || 'Componente sin nombre' }}</strong>
                </button>
              </div>
              <div class="btn-group">
                <button type="button" class="btn btn-sm btn-outline-secondary" @click="toggleComponente(componente)">
                  {{ isComponenteExpanded(componente.id) ? 'Ocultar' : 'Mostrar' }}
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarComponente(componente.id)">Eliminar</button>
              </div>
            </div>
            <div v-show="isComponenteExpanded(componente.id)" class="card-body">
              <FormularioComponenteBody
                :componente="componente"
                :mensajeError="getComponenteError(componente)"
                :tablas="props.tablas"
              />
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
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import FormularioComponenteBody from './FormularioComponenteBody.vue';

const props = defineProps(['subproyecto', 'mensajeError', 'componentes', 'tablas']);

const socket = io(import.meta.env.VITE_API_URL);
const tecnologias = ref([]);
const cargandoTecnologias = ref(false);
const mostrarSeleccion = ref(false);

const subproyectoData = props.subproyecto?.value ?? props.subproyecto ?? {};

const componentes = computed(() => {
  const value = props.componentes?.value ?? props.componentes;
  return Array.isArray(value) ? value : [];
});

const expandedComponentes = ref([]);
const _componenteErrores = new Map();

const generarIdTemporal = () => -(Date.now() + Math.floor(Math.random() * 1000));

const subproyectoId = computed(() => subproyectoData?.id ?? null);

const componentesAsignados = computed(() => {
  if (subproyectoId.value == null) return [];
  return componentes.value.filter((item) => String(item.id_subproyecto ?? '') === String(subproyectoId.value));
});

const selectedTecnologias = computed({
  get: () => {
    const tecnologiasValue = subproyectoData?.tecnologias;
    return Array.isArray(tecnologiasValue) ? tecnologiasValue : [];
  },
  set: (val) => {
    if (subproyectoData) {
      subproyectoData.tecnologias = Array.isArray(val)
        ? Array.from(new Set(val.map((id) => Number(id)).filter((id) => id > 0)))
        : [];
    }
  },
});

const tecnologiasSeleccionadas = computed(() => {
  return tecnologias.value.filter((item) => selectedTecnologias.value.includes(item.id));
});

const nombre = computed({
  get: () => subproyectoData?.nombre ?? '',
  set: (val) => { if (subproyectoData) subproyectoData.nombre = val; },
});

const tipoSubproyecto = computed({
  get: () => subproyectoData?.tipo ?? 'backend',
  set: (value) => {
    if (subproyectoData) {
      subproyectoData.tipo = value;
    }
  },
});

const descripcion = computed({
  get: () => subproyectoData?.descripcion ?? '',
  set: (value) => {
    if (subproyectoData) {
      subproyectoData.descripcion = value;
    }
  },
});

const tecnologiasFiltradas = computed(() => {
  return tecnologias.value.filter((item) => item.tipo_aplicacion === tipoSubproyecto.value);
});

function sanearTecnologiasSeleccionadas() {
  selectedTecnologias.value = selectedTecnologias.value.filter((id) => {
    const tecnologia = tecnologias.value.find((item) => item.id === id);
    return tecnologia && tecnologia.tipo_aplicacion === tipoSubproyecto.value;
  });
}

watch(tipoSubproyecto, () => {
  sanearTecnologiasSeleccionadas();
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
    sanearTecnologiasSeleccionadas();
  });
}

function quitarTecnologia(id) {
  selectedTecnologias.value = selectedTecnologias.value.filter((item) => item !== id);
}

function limpiarTecnologias() {
  selectedTecnologias.value = [];
}

function quitarComponente(id) {
  const lista = props.componentes?.value ?? props.componentes;
  if (!Array.isArray(lista)) return;
  const nueva = lista.filter((item) => item.id !== id);
  if (props.componentes?.value) {
    props.componentes.value = nueva;
  } else {
    lista.splice(0, lista.length, ...nueva);
  }
}

function isComponenteExpanded(id) {
  return id != null && expandedComponentes.value.includes(id);
}

function toggleComponente(componente) {
  if (!componente || componente.id == null) {
    return;
  }
  const id = componente.id;
  const index = expandedComponentes.value.indexOf(id);
  if (index === -1) {
    expandedComponentes.value.push(id);
  } else {
    expandedComponentes.value.splice(index, 1);
  }
}

function getComponenteError(componente) {
  if (!componente || componente.id == null) {
    return ref('');
  }
  if (!_componenteErrores.has(componente.id)) {
    _componenteErrores.set(componente.id, ref(''));
  }
  return _componenteErrores.get(componente.id);
}

function agregarComponente() {
  const nueva = {
    id: generarIdTemporal(),
    id_subproyecto: subproyectoId.value,
    nombre: '',
    descripcion: '',
    configText: '{}',
    tablas: [],
  };
  if (Array.isArray(props.componentes?.value)) {
    props.componentes.value.push(nueva);
  } else if (Array.isArray(props.componentes)) {
    props.componentes.push(nueva);
  }
  _componenteErrores.set(nueva.id, ref(''));
  if (!isComponenteExpanded(nueva.id)) {
    expandedComponentes.value.push(nueva.id);
  }
}

onMounted(() => {
  cargarTecnologias();
});

onUnmounted(() => {
  socket.disconnect();
});
</script>
