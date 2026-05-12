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
                <label class="form-label">Componentes</label>
                <ul class="list-group mb-2">
                  <li v-for="(componente, index) in componentes" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
                    <span class="flex-grow-1">{{ componente.nombre || 'Componente sin nombre' }}</span>
                    <div class="btn-group">
                      <button type="button" class="btn btn-sm btn-outline-primary" @click="abrirDetalleComponente(componente, index)">Ver detalles</button>
                      <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarComponente(index)">Eliminar</button>
                    </div>
                  </li>
                  <li v-if="!componentes.length" class="list-group-item text-muted">Sin componentes aún.</li>
                </ul>
                <button type="button" class="btn btn-sm btn-outline-primary" @click="abrirDetalleComponente()">Agregar componente</button>
              </div>
            </div>

            <div v-if="seccionActiva === 'tablas'">
              <div class="mb-3">
                <label class="form-label">Tablas de base de datos</label>
                <ul class="list-group mb-2">
                  <li v-for="(tabla, index) in tablas" :key="tabla.id ?? index" class="list-group-item d-flex justify-content-between align-items-center">
                    <span class="flex-grow-1">{{ tabla.nombre || 'Tabla sin nombre' }}</span>
                    <div class="btn-group">
                      <button type="button" class="btn btn-sm btn-outline-primary" @click="editarTabla(index)">Editar</button>
                      <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarTabla(index)">Eliminar</button>
                    </div>
                  </li>
                  <li v-if="!tablas.length" class="list-group-item text-muted">Sin tablas aún.</li>
                </ul>
                <button type="button" class="btn btn-sm btn-outline-primary" @click="abrirDetalleTabla()">Agregar tabla</button>
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
import { useModal } from '../../composables/useModal.js';
import FormularioComponenteHeader from './FormularioComponenteHeader.vue';
import FormularioComponenteBody from './FormularioComponenteBody.vue';
import FormularioComponenteFooter from './FormularioComponenteFooter.vue';
import FormularioSubproyectoBody from './FormularioSubproyectoBody.vue';
import FormularioTablaHeader from './FormularioTablaHeader.vue';
import FormularioTablaBody from './FormularioTablaBody.vue';
import FormularioTablaFooter from './FormularioTablaFooter.vue';

const props = defineProps(['form', 'mensajeError']);
const { mostrarModal } = useModal();
const seccionActiva = ref('general');
const expandedSubproyectos = ref([]);
const subproyectoErrores = ref({});

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

function abrirDetalleTabla(tabla = null, index = null) {
  const tablaTemp = ref(
    tabla
      ? {
          id: tabla.id ?? generarIdTemporal(),
          nombre: tabla.nombre ?? '',
          campos: Array.isArray(tabla.campos) ? [...tabla.campos] : [],
        }
      : { id: generarIdTemporal(), nombre: '', campos: [] }
  );
  const mensajeErrorTabla = ref('');
  let cerrarDetalle = null;

  function guardarTabla() {
    mensajeErrorTabla.value = '';
    const nombreTrim = String(tablaTemp.value.nombre ?? '').trim();
    if (!nombreTrim) {
      mensajeErrorTabla.value = 'Nombre de la tabla es requerido';
      return;
    }

    const tablaGuardada = {
      id: tablaTemp.value.id,
      nombre: nombreTrim,
      campos: Array.isArray(tablaTemp.value.campos)
        ? tablaTemp.value.campos
            .map((campo) => ({
              id: campo.id ?? generarIdTemporal(),
              nombre: String(campo.nombre ?? '').trim(),
              tipo: String(campo.tipo || 'VARCHAR').trim() || 'VARCHAR',
              longitud: (() => {
                const valor = campo?.longitud;
                return valor == null || valor === '' || Number.isNaN(Number(valor)) ? null : Number(valor);
              })(),
              descripcion: campo.descripcion ? String(campo.descripcion).trim() : null,
              orden: Number.isNaN(Number(campo.orden)) ? 0 : Number(campo.orden),
              nulo: Boolean(campo.nulo),
              clave_primaria: Boolean(campo.clave_primaria),
              autoincremental: Boolean(campo.autoincremental),
              config: campo?.config ?? '{}',
              relaciones: Array.isArray(campo.relaciones) ? campo.relaciones : [],
            }))
            .filter((campo) => campo.nombre)
        : [],
    };

    if (index !== null && index !== undefined && index >= 0) {
      tablas.value[index] = tablaGuardada;
    } else {
      tablas.value.push(tablaGuardada);
    }

    if (typeof cerrarDetalle === 'function') {
      cerrarDetalle();
    }
  }

  cerrarDetalle = mostrarModal({
    header: FormularioTablaHeader,
    body: FormularioTablaBody,
    footer: FormularioTablaFooter,
    headerProps: { tabla: tablaTemp },
    bodyProps: { tabla: tablaTemp, tablas: tablas.value, mensajeError: mensajeErrorTabla },
    footerProps: { onGuardar: guardarTabla, onCerrar: () => cerrarDetalle && cerrarDetalle() },
  });
}

function editarTabla(index) {
  abrirDetalleTabla(tablas.value[index], index);
}

function quitarTabla(index) {
  tablas.value.splice(index, 1);
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

function abrirDetalleComponente(componente = null, index = null) {
  const componenteTemp = ref(
    componente
      ? {
          id: componente.id ?? generarIdTemporal(),
          nombre: componente.nombre ?? '',
          descripcion: componente.descripcion ?? '',
          configText: componente.configText ?? JSON.stringify(componente.config ?? {}, null, 2),
          subproyectos: Array.isArray(componente.subproyectos) ? [...componente.subproyectos] : [],
          tablas: Array.isArray(componente.tablas) ? [...componente.tablas] : [],
        }
      : { id: generarIdTemporal(), nombre: '', descripcion: '', configText: '{}', subproyectos: [], tablas: [] }
  );
  const mensajeErrorComponente = ref('');
  let cerrarDetalle = null;

  function guardarComponente() {
    mensajeErrorComponente.value = '';
    const nombreTrim = String(componenteTemp.value.nombre ?? '').trim();
    const descripcionTrim = String(componenteTemp.value.descripcion ?? '').trim();
    const configTextValue = String(componenteTemp.value.configText ?? '').trim() || '{}';

    if (!nombreTrim) {
      mensajeErrorComponente.value = 'Nombre del componente es requerido';
      return;
    }

    try {
      JSON.parse(configTextValue);
    } catch (error) {
      mensajeErrorComponente.value = 'Config JSON inválido';
      return;
    }

    const componenteGuardado = {
      id: componenteTemp.value.id,
      nombre: nombreTrim,
      descripcion: descripcionTrim,
      configText: configTextValue,
      subproyectos: Array.isArray(componenteTemp.value.subproyectos)
        ? Array.from(new Set(componenteTemp.value.subproyectos.map((id) => Number(id)).filter((id) => id !== 0 && !Number.isNaN(id))))
        : [],
      tablas: Array.isArray(componenteTemp.value.tablas)
        ? Array.from(new Set(componenteTemp.value.tablas.map((id) => Number(id)).filter((id) => id !== 0 && !Number.isNaN(id))))
        : [],
    };

    if (index !== null && index !== undefined && index >= 0) {
      componentes.value[index] = componenteGuardado;
    } else {
      componentes.value.push(componenteGuardado);
    }

    if (typeof cerrarDetalle === 'function') {
      cerrarDetalle();
    }
  }

  cerrarDetalle = mostrarModal({
    header: FormularioComponenteHeader,
    body: FormularioComponenteBody,
    footer: FormularioComponenteFooter,
    headerProps: { componente: componenteTemp },
    bodyProps: { componente: componenteTemp, mensajeError: mensajeErrorComponente, subproyectos, tablas },
    footerProps: { onGuardar: guardarComponente, onCerrar: () => cerrarDetalle && cerrarDetalle() },
  });
}

function quitarComponente(index) {
  componentes.value.splice(index, 1);
}
</script>
