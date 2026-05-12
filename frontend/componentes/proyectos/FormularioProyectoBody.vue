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
                :class="{ active: seccionActiva === 'componentes' }"
                @click="seccionActiva = 'componentes'"
              >
                Componentes
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
                    />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="seccionActiva === 'componentes'">
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <label class="form-label mb-0">Componentes</label>
                  <button type="button" class="btn btn-sm btn-outline-primary" @click="agregarComponente()">Agregar componente</button>
                </div>
                <div v-if="!componentes.length" class="text-muted mb-2">Sin componentes aún.</div>
                <div v-for="(componente, index) in componentes" :key="componente.id ?? index" class="card mb-2">
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
                      <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarComponente(index)">Eliminar</button>
                    </div>
                  </div>
                  <div v-show="isComponenteExpanded(componente.id)" class="card-body">
                    <FormularioComponenteBody
                      :componente="componente"
                      :mensajeError="getComponenteError(componente)"
                      :subproyectos="subproyectos"
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
import { computed, ref } from 'vue';
import FormularioComponenteBody from './FormularioComponenteBody.vue';
import FormularioSubproyectoBody from './FormularioSubproyectoBody.vue';
import FormularioTablaBody from './FormularioTablaBody.vue';

const props = defineProps(['form', 'mensajeError']);
const seccionActiva = ref('general');
const expandedSubproyectos = ref([]);
const subproyectoErrores = ref({});
const expandedComponentes = ref([]);
const componenteErrores = ref({});
const expandedTablas = ref([]);
const tablaErrores = ref({});

const generarIdTemporal = () => -(Date.now() + Math.floor(Math.random() * 1000));

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
  get: () => {
    if (!props.form?.value) return [];
    if (!Array.isArray(props.form.value.subproyectos)) {
      props.form.value.subproyectos = [];
    }
    return props.form.value.subproyectos;
  },
  set: (val) => {
    if (props.form?.value) {
      props.form.value.subproyectos = val;
    }
  },
});

const componentes = computed({
  get: () => {
    if (!props.form?.value) return [];
    if (!Array.isArray(props.form.value.componentes)) {
      props.form.value.componentes = [];
    }
    return props.form.value.componentes;
  },
  set: (val) => {
    if (props.form?.value) {
      props.form.value.componentes = val;
    }
  },
});

const tablas = computed({
  get: () => {
    if (!props.form?.value) return [];
    if (!Array.isArray(props.form.value.tablas)) {
      props.form.value.tablas = [];
    }
    return props.form.value.tablas;
  },
  set: (val) => {
    if (props.form?.value) {
      props.form.value.tablas = val;
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
  if (!tablaErrores.value[tabla.id]) {
    tablaErrores.value[tabla.id] = ref('');
  }
  return tablaErrores.value[tabla.id];
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
    delete tablaErrores.value[tablaId];
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
    delete subproyectoErrores.value[subproyectoId];
    componentes.value.forEach((componente) => {
      if (Array.isArray(componente.subproyectos)) {
        componente.subproyectos = componente.subproyectos.filter((id) => id !== subproyectoId);
      }
    });
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
  if (!subproyectoErrores.value[subproyecto.id]) {
    subproyectoErrores.value[subproyecto.id] = ref('');
  }
  return subproyectoErrores.value[subproyecto.id];
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
  if (!componenteErrores.value[componente.id]) {
    componenteErrores.value[componente.id] = ref('');
  }
  return componenteErrores.value[componente.id];
}

function agregarComponente() {
  const nuevo = {
    id: generarIdTemporal(),
    nombre: '',
    descripcion: '',
    configText: '{}',
    subproyectos: [],
    tablas: [],
  };
  componentes.value.push(nuevo);
  getComponenteError(nuevo);
  if (!isComponenteExpanded(nuevo.id)) {
    expandedComponentes.value.push(nuevo.id);
  }
}

function quitarComponente(index) {
  componentes.value.splice(index, 1);
}
</script>
