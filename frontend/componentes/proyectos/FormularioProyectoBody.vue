<template>
  <div style="min-width: 320px;">
    <div class="row g-3">
      <div class="col-12 col-lg-2">
        <div class="card mb-3">
          <div class="card-body p-2">
            <div class="list-group">
              <button
                type="button"
                class="list-group-item list-group-item-action"
                :class="{ active: seccionActiva === 'general' }"
                @click="seccionActiva = 'general'"
              >
                General
              </button>
              <button
                type="button"
                class="list-group-item list-group-item-action"
                :class="{ active: seccionActiva === 'subproyectos' }"
                @click="seccionActiva = 'subproyectos'"
              >
                Subproyectos
              </button>
              <button
                type="button"
                class="list-group-item list-group-item-action"
                :class="{ active: seccionActiva === 'tablas' }"
                @click="seccionActiva = 'tablas'"
              >
                Tablas Base de Datos
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-10">
        <div class="card">
          <div class="card-body">
            <div v-if="seccionActiva === 'general'">
              <div class="row g-3 mb-3">
                <div class="col-12 col-lg-6">
                  <label class="form-label">Nombre</label>
                  <input v-model="nombre" type="text" class="form-control" maxlength="50" />
                </div>
                <div class="col-12 col-lg-6">
                  <label class="form-label">Descripción</label>
                  <input v-model="descripcion" type="text" class="form-control" maxlength="255" />
                </div>
                <div class="col-12 col-lg-6">
                  <label class="form-label">Repositorio</label>
                  <input v-model="repositorio" type="text" class="form-control" maxlength="255" placeholder="https://github.com/usuario/repositorio" />
                </div>
                <div class="col-12 col-lg-6">
                  <label class="form-label">Directorio base</label>
                  <input v-model="directorioBase" type="text" class="form-control" maxlength="512" placeholder="Ruta completa del directorio base" />
                </div>
              </div>
            </div>

            <div v-if="seccionActiva === 'subproyectos'">
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <label class="form-label mb-0">Subproyectos</label>
                  <button type="button" class="btn btn-sm btn-outline-primary" @click="agregarSubproyecto()">Agregar subproyecto</button>
                </div>
                <div v-if="!subproyectos.length" class="text-muted mb-2">Sin subproyectos aún.</div>
                <div v-for="(sub, index) in subproyectos" :key="sub.id ?? index" class="card mb-2">
                  <div class="card-header d-flex justify-content-between align-items-center p-2">
                    <div>
                      <button type="button" class="btn btn-link p-0 text-start" style="text-decoration: none;" @click="toggleSubproyecto(sub)">
                        <strong>{{ sub.nombre || 'Subproyecto sin nombre' }}</strong>
                        <small class="text-muted">({{ sub.tipo || 'backend' }})</small>
                      </button>
                    </div>
                    <div class="btn-group">
                      <button type="button" class="btn btn-sm btn-outline-secondary" @click="toggleSubproyecto(sub)">
                        {{ isSubproyectoExpanded(sub.id) ? 'Ocultar' : 'Mostrar' }}
                      </button>
                      <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarSubproyecto(index)">Eliminar</button>
                    </div>
                  </div>
                  <div v-show="isSubproyectoExpanded(sub.id)" class="card-body">
                    <FormularioSubproyectoBody
                      :subproyecto="sub"
                      :mensajeError="getSubproyectoError(sub)"
                      :componentes="componentes"
                      :tablas="tablas"
                    />
                  </div>
                </div>
              </div>
            </div>


            <div v-if="seccionActiva === 'tablas'">
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <label class="form-label mb-0">Tablas de base de datos</label>
                  <button type="button" class="btn btn-sm btn-outline-primary" @click="agregarTabla()">Agregar tabla</button>
                </div>
                <div v-if="!tablas.length" class="text-muted mb-2">Sin tablas aún.</div>
                <div v-for="(tabla, index) in tablas" :key="tabla.id ?? index" class="card mb-2">
                  <div class="card-header d-flex justify-content-between align-items-center p-2">
                    <div>
                      <button type="button" class="btn btn-link p-0 text-start" style="text-decoration: none;" @click="toggleTabla(tabla)">
                        <strong>{{ tabla.nombre || 'Tabla sin nombre' }}</strong>
                      </button>
                    </div>
                    <div class="btn-group">
                      <button type="button" class="btn btn-sm btn-outline-secondary" @click="toggleTabla(tabla)">
                        {{ isTablaExpanded(tabla.id) ? 'Ocultar' : 'Mostrar' }}
                      </button>
                      <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarTabla(index)">Eliminar</button>
                    </div>
                  </div>
                  <div v-show="isTablaExpanded(tabla.id)" class="card-body">
                    <FormularioTablaBody :tabla="tabla" :tablas="tablas" :mensajeError="getTablaError(tabla)" />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="props.mensajeError?.value" class="alert alert-danger py-1 mt-3 mb-0">
              {{ props.mensajeError.value }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import FormularioSubproyectoBody from './FormularioSubproyectoBody.vue';
import FormularioTablaBody from './FormularioTablaBody.vue';

const props = defineProps(['form', 'mensajeError']);
const seccionActiva = ref('general');
const expandedSubproyectos = ref([]);
const _subproyectoErrores = new Map();
const expandedTablas = ref([]);
const _tablaErrores = new Map();

const generarIdTemporal = () => -(Date.now() + Math.floor(Math.random() * 1000));

const formData = computed(() => props.form?.value ?? props.form ?? null);

const ensureFormArrays = () => {
  const form = formData.value;
  if (!form) return;
  if (!Array.isArray(form.subproyectos)) form.subproyectos = [];
  if (!Array.isArray(form.componentes)) form.componentes = [];
  if (!Array.isArray(form.tablas)) form.tablas = [];
};

watch(formData, ensureFormArrays, { immediate: true });

const nombre = computed({
  get: () => props.form?.value?.nombre ?? '',
  set: (val) => { if (props.form?.value) props.form.value.nombre = val; },
});

const descripcion = computed({
  get: () => props.form?.value?.descripcion ?? '',
  set: (val) => { if (props.form?.value) props.form.value.descripcion = val; },
});

const repositorio = computed({
  get: () => props.form?.value?.repositorio ?? '',
  set: (val) => { if (props.form?.value) props.form.value.repositorio = val; },
});

const directorioBase = computed({
  get: () => props.form?.value?.directorio_base ?? '',
  set: (val) => { if (props.form?.value) props.form.value.directorio_base = val; },
});

const subproyectos = computed({
  get: () => formData.value?.subproyectos ?? [],
  set: (val) => {
    if (formData.value) {
      formData.value.subproyectos = val;
    }
  },
});

const componentes = computed({
  get: () => formData.value?.componentes ?? [],
  set: (val) => {
    if (formData.value) {
      formData.value.componentes = val;
    }
  },
});

const tablas = computed({
  get: () => formData.value?.tablas ?? [],
  set: (val) => {
    if (formData.value) {
      formData.value.tablas = val;
    }
  },
});

function isTablaExpanded(id) {
  return id != null && expandedTablas.value.includes(id);
}

function toggleTabla(tabla) {
  if (!tabla || tabla.id == null) {
    return;
  }
  const id = tabla.id;
  const index = expandedTablas.value.indexOf(id);
  if (index === -1) {
    expandedTablas.value.push(id);
  } else {
    expandedTablas.value.splice(index, 1);
  }
}

function getTablaError(tabla) {
  if (!tabla || tabla.id == null) {
    return ref('');
  }
  if (!_tablaErrores.has(tabla.id)) {
    _tablaErrores.set(tabla.id, ref(''));
  }
  return _tablaErrores.get(tabla.id);
}

function agregarTabla() {
  const nueva = {
    id: generarIdTemporal(),
    nombre: '',
    campos: [],
  };
  tablas.value.push(nueva);
  getTablaError(nueva);
  if (!isTablaExpanded(nueva.id)) {
    expandedTablas.value.push(nueva.id);
  }
}

function quitarTabla(index) {
  const tablaId = tablas.value[index]?.id;
  tablas.value.splice(index, 1);
  if (tablaId != null) {
    expandedTablas.value = expandedTablas.value.filter((id) => id !== tablaId);
    _tablaErrores.delete(tablaId);
  }
}


function actualizarComponentesRelacionados(subproyectoId, seleccionados) {
  if (!subproyectoId) return;
  componentes.value.forEach((componente) => {
    if (!Array.isArray(componente.subproyectos)) {
      componente.subproyectos = [];
    }
    const existe = componente.subproyectos.includes(subproyectoId);
    const debeExistir = Array.isArray(seleccionados) && seleccionados.includes(subproyectoId);
    if (debeExistir && !existe) {
      componente.subproyectos.push(subproyectoId);
    }
    if (!debeExistir && existe) {
      componente.subproyectos = componente.subproyectos.filter((id) => id !== subproyectoId);
    }
  });
}

function quitarSubproyecto(index) {
  const subproyectoId = subproyectos.value[index]?.id;
  subproyectos.value.splice(index, 1);
  if (subproyectoId !== undefined) {
    expandedSubproyectos.value = expandedSubproyectos.value.filter((id) => id !== subproyectoId);
    _subproyectoErrores.delete(subproyectoId);
    if (Array.isArray(componentes.value)) {
      componentes.value = componentes.value.filter((componente) => componente.id_subproyecto !== subproyectoId);
    }
  }
}

function isSubproyectoExpanded(id) {
  return id != null && expandedSubproyectos.value.includes(id);
}

function toggleSubproyecto(subproyecto) {
  if (!subproyecto || subproyecto.id == null) {
    return;
  }
  const id = subproyecto.id;
  const index = expandedSubproyectos.value.indexOf(id);
  if (index === -1) {
    expandedSubproyectos.value.push(id);
  } else {
    expandedSubproyectos.value.splice(index, 1);
  }
}

function getSubproyectoError(subproyecto) {
  if (!subproyecto || subproyecto.id == null) {
    return ref('');
  }
  if (!_subproyectoErrores.has(subproyecto.id)) {
    _subproyectoErrores.set(subproyecto.id, ref(''));
  }
  return _subproyectoErrores.get(subproyecto.id);
}

function agregarSubproyecto() {
  const nuevo = {
    id: generarIdTemporal(),
    nombre: '',
    descripcion: '',
    tipo: 'backend',
    tecnologias: [],
    componentes: [],
  };
  subproyectos.value.push(nuevo);
  getSubproyectoError(nuevo);
  if (!isSubproyectoExpanded(nuevo.id)) {
    expandedSubproyectos.value.push(nuevo.id);
  }
}

</script>
