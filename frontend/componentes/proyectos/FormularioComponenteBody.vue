<template>
  <div style="min-width: 320px;">
    <div class="mb-3">
      <label class="form-label">Nombre</label>
      <input v-model="nombre" type="text" class="form-control" maxlength="100" />
    </div>
    <div class="mb-3">
      <label class="form-label">Descripción</label>
      <input v-model="descripcion" type="text" class="form-control" maxlength="255" />
    </div>
    <div class="mb-3">
      <label class="form-label">Config JSON</label>
      <textarea v-model="configText" class="form-control" rows="6" placeholder='{"clave": "valor"}'></textarea>
    </div>

    <div class="mb-3">
      <label class="form-label">Subproyectos relacionados</label>
      <div class="border rounded p-2 mb-2" style="min-height: 140px;">
        <div v-if="!subproyectosSeleccionados.length" class="text-muted">Sin subproyectos seleccionados.</div>
        <ul v-else class="list-unstyled mb-0">
          <li
            v-for="sub in subproyectosSeleccionados"
            :key="sub.id"
            class="d-flex justify-content-between align-items-center mb-2"
          >
            <span>{{ sub.nombre || 'Subproyecto sin nombre' }}</span>
            <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarSubproyecto(sub.id)">Eliminar</button>
          </li>
        </ul>
      </div>

      <div class="d-flex gap-2 mb-2">
        <button type="button" class="btn btn-sm btn-outline-primary" @click="mostrarSeleccionSubproyectos = !mostrarSeleccionSubproyectos">
          {{ mostrarSeleccionSubproyectos ? 'Ocultar' : 'Seleccionar' }} subproyectos
        </button>
        <button
          v-if="selectedSubproyectos.length"
          type="button"
          class="btn btn-sm btn-outline-secondary"
          @click="limpiarSubproyectos"
        >
          Limpiar selección
        </button>
      </div>

      <div v-if="mostrarSeleccionSubproyectos" class="border rounded p-2">
        <div v-if="!subproyectosDisponibles.length" class="text-muted">No hay subproyectos disponibles.</div>
        <div v-else class="list-group">
          <label
            v-for="sub in subproyectosDisponibles"
            :key="sub.id"
            class="list-group-item d-flex align-items-center"
          >
            <input
              type="checkbox"
              class="form-check-input me-2"
              :value="sub.id"
              v-model="selectedSubproyectos"
            />
            <span>{{ sub.nombre || 'Subproyecto sin nombre' }}</span>
          </label>
        </div>
      </div>
    </div>

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

    <div v-if="props.mensajeError?.value" class="alert alert-danger py-1 mb-0">
      {{ props.mensajeError.value }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps(['componente', 'mensajeError', 'subproyectos', 'tablas']);

const nombre = computed({
  get: () => props.componente?.value?.nombre ?? '',
  set: (val) => { if (props.componente?.value) props.componente.value.nombre = val; },
});

const descripcion = computed({
  get: () => props.componente?.value?.descripcion ?? '',
  set: (val) => { if (props.componente?.value) props.componente.value.descripcion = val; },
});

const configText = computed({
  get: () => props.componente?.value?.configText ?? '{}',
  set: (val) => { if (props.componente?.value) props.componente.value.configText = val; },
});

const mostrarSeleccionSubproyectos = ref(false);
const mostrarSeleccionTablas = ref(false);

const selectedSubproyectos = computed({
  get: () => {
    if (!props.componente?.value) return [];
    if (!Array.isArray(props.componente.value.subproyectos)) {
      props.componente.value.subproyectos = [];
    }
    return props.componente.value.subproyectos;
  },
  set: (val) => {
    if (props.componente?.value) {
      props.componente.value.subproyectos = Array.isArray(val)
        ? Array.from(new Set(val.map((id) => Number(id)).filter((id) => id !== 0 && !Number.isNaN(id))))
        : [];
    }
  },
});

const selectedTablas = computed({
  get: () => {
    if (!props.componente?.value) return [];
    if (!Array.isArray(props.componente.value.tablas)) {
      props.componente.value.tablas = [];
    }
    return props.componente.value.tablas;
  },
  set: (val) => {
    if (props.componente?.value) {
      props.componente.value.tablas = Array.isArray(val)
        ? Array.from(new Set(val.map((id) => Number(id)).filter((id) => id !== 0 && !Number.isNaN(id))))
        : [];
    }
  },
});

const subproyectosDisponibles = computed(() => {
  const value = props.subproyectos?.value ?? props.subproyectos;
  return Array.isArray(value) ? value : [];
});

const tablasDisponibles = computed(() => {
  const value = props.tablas?.value ?? props.tablas;
  return Array.isArray(value) ? value : [];
});

const subproyectosSeleccionados = computed(() => {
  const seleccionados = selectedSubproyectos.value;
  return subproyectosDisponibles.value.filter((sub) => seleccionados.includes(sub.id));
});

const tablasSeleccionadas = computed(() => {
  const seleccionados = selectedTablas.value;
  return tablasDisponibles.value.filter((tabla) => seleccionados.includes(tabla.id));
});

function quitarSubproyecto(id) {
  selectedSubproyectos.value = selectedSubproyectos.value.filter((item) => item !== id);
}

function limpiarSubproyectos() {
  selectedSubproyectos.value = [];
}

function quitarTabla(id) {
  selectedTablas.value = selectedTablas.value.filter((item) => item !== id);
}

function limpiarTablas() {
  selectedTablas.value = [];
}
</script>
