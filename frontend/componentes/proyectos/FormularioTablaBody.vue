<template>
  <div style="min-width: 320px;">
    <div class="row g-3">
      <div class="col-12">
        <label class="form-label">Nombre de la tabla</label>
        <input v-model="nombre" type="text" class="form-control" maxlength="100" />
      </div>

      <div class="col-12">
        <label class="form-label">Campos</label>
        <div class="mb-2">
          <div v-if="!campos.length" class="text-muted">Sin campos definidos.</div>
          <div v-else class="list-group">
            <div
              v-for="(campo, index) in camposSorted"
              :key="campo.id ?? index"
              class="list-group-item"
            >
              <div class="row g-2 align-items-center mb-2">
                <div class="col-6 col-lg-1">
                  <input
                    v-model.number="campo.orden"
                    type="number"
                    class="form-control form-control-sm"
                    placeholder="Orden"
                    min="0"
                  />
                </div>
                <div class="col-6 col-lg-3">
                  <input
                    v-model="campo.nombre"
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="Nombre del campo"
                  />
                </div>
                <div class="col-6 col-lg-2">
                  <select v-model="campo.tipo" class="form-select form-select-sm">
                    <option disabled value="">Tipo de campo</option>
                    <option v-for="tipo in tiposCampo" :key="tipo" :value="tipo">{{ tipo }}</option>
                  </select>
                </div>
                <div class="col-6 col-lg-2">
                  <input
                    v-model="campo.descripcion"
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="Descripción (opcional)"
                  />
                </div>
                <div class="col-6 col-lg-2 d-flex align-items-center">
                  <div class="form-check mb-0">
                    <input
                      v-model="campo.nulo"
                      type="checkbox"
                      class="form-check-input"
                      :id="'nulo-' + (campo.id ?? index)"
                    />
                    <label class="form-check-label" :for="'nulo-' + (campo.id ?? index)">Nulo</label>
                  </div>
                </div>
                <div class="col-6 col-lg-2 d-flex align-items-center">
                  <div class="form-check mb-0">
                    <input
                      v-model="campo.clave_primaria"
                      type="checkbox"
                      class="form-check-input"
                      :id="'pk-' + (campo.id ?? index)"
                    />
                    <label class="form-check-label" :for="'pk-' + (campo.id ?? index)">PK</label>
                  </div>
                </div>
                <div class="col-6 col-lg-2 d-flex align-items-center">
                  <div class="form-check mb-0">
                    <input
                      v-model="campo.autoincremental"
                      type="checkbox"
                      class="form-check-input"
                      :id="'autoincremental-' + (campo.id ?? index)"
                    />
                    <label class="form-check-label" :for="'autoincremental-' + (campo.id ?? index)">Autoincremental</label>
                  </div>
                </div>
                <div class="col-12 col-lg-3 d-flex flex-wrap gap-2 justify-content-end">
                  <button type="button" class="btn btn-sm btn-outline-secondary" @click="abrirAgregarRelacion(campo)">
                    Agregar relación
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarCampo(campo.id)">
                    Eliminar
                  </button>
                </div>
              </div>
              <div class="row g-2">
                <div class="col-12 col-lg-2">
                  <input
                    v-model.number="campo.longitud"
                    type="number"
                    class="form-control form-control-sm"
                    placeholder="Longitud"
                    min="1"
                  />
                </div>
                <div class="col-12 col-lg-10">
                  <textarea
                    v-model="campo.config"
                    class="form-control form-control-sm font-monospace"
                    placeholder='Config JSON (ej: {"precision": 10, "escala": 2})'
                    rows="2"
                  />
                </div>
              </div>
              <div class="row g-2 mt-2" v-if="campo.relaciones && campo.relaciones.length">
                <div class="col-12">
                  <div class="small text-muted mb-1">Relaciones:</div>
                  <ul class="list-group list-group-flush">
                    <li v-for="(rel, relIndex) in campo.relaciones" :key="relIndex" class="list-group-item py-1 d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{{ rel.tipo_relacion }}</strong>
                        <span v-if="rel.invertida"> desde </span>
                        <span v-else> hacia </span>
                        <strong>{{ obtenerNombreCampoRelacion(rel) }}</strong>
                      </div>
                      <button type="button" class="btn btn-sm btn-outline-danger" @click="eliminarRelacion(campo, relIndex)">Eliminar</button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-outline-primary" @click="agregarCampo">
          Agregar campo
        </button>
      </div>
    </div>

    <div v-if="props.mensajeError?.value" class="alert alert-danger py-1 mb-0 mt-3">
      {{ props.mensajeError.value }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useModal } from '../../composables/useModal.js';
import FormularioRelacionCampoBody from './FormularioRelacionCampoBody.vue';
const props = defineProps(['tabla', 'tablas', 'mensajeError']);

const { mostrarModal } = useModal();

const tabla = computed({
  get: () => props.tabla?.value ?? props.tabla ?? {},
  set: (val) => {
    if (props.tabla?.value) {
      props.tabla.value = val;
    } else if (props.tabla && typeof props.tabla === 'object') {
      Object.assign(props.tabla, val);
    }
  },
});

const generarIdTemporal = () => -(Date.now() + Math.floor(Math.random() * 1000));

const tiposCampo = [
  'VARCHAR',
  'CHAR',
  'TEXT',
  'INT',
  'BIGINT',
  'DECIMAL',
  'FLOAT',
  'DOUBLE',
  'BOOLEAN',
  'DATE',
  'DATETIME',
  'TIMESTAMP',
  'JSON',
  'BLOB',
];

const nombre = computed({
  get: () => tabla.value?.nombre ?? '',
  set: (val) => {
    if (tabla.value) {
      tabla.value.nombre = val;
    }
  },
});

const campos = computed({
  get: () => {
    if (!tabla.value) return [];
    if (!Array.isArray(tabla.value.campos)) {
      tabla.value.campos = [];
    }
    return tabla.value.campos;
  },
  set: (val) => {
    if (tabla.value) {
      tabla.value.campos = val;
    }
  },
});

const camposSorted = computed(() => {
  return [...campos.value].sort((a, b) => {
    const ordenA = Number(a?.orden ?? 0);
    const ordenB = Number(b?.orden ?? 0);
    if (ordenA !== ordenB) return ordenA - ordenB;
    return (a.id ?? 0) - (b.id ?? 0);
  });
});

function agregarCampo() {
  const maxOrden = campos.value.reduce((max, campo) => {
    const orden = Number(campo?.orden ?? 0);
    return Number.isNaN(orden) ? max : Math.max(max, orden);
  }, -1);
  campos.value.push({
    id: generarIdTemporal(),
    nombre: '',
    tipo: 'VARCHAR',
    longitud: null,
    descripcion: '',
    nulo: false,
    clave_primaria: false,
    autoincremental: false,
    config: '{}',
    orden: maxOrden + 1,
    relaciones: [],
  });
}

function abrirAgregarRelacion(campo) {
  const mensajeErrorRelacion = ref('');
  let cerrarRelacion = null;

  cerrarRelacion = mostrarModal({
    body: FormularioRelacionCampoBody,
    bodyProps: {
      campo,
      tablas: props.tablas,
      mensajeError: mensajeErrorRelacion,
      onCerrar: () => cerrarRelacion && cerrarRelacion(),
    },
  });
}

function obtenerNombreCampoRelacion(relacion) {
  if (relacion.destino?.nombre) {
    const tabla = relacion.destino.tabla_nombre ? `${relacion.destino.tabla_nombre} / ` : '';
    return `${tabla}${relacion.destino.nombre}`;
  }
  if (relacion.origen?.nombre) {
    const tabla = relacion.origen.tabla_nombre ? `${relacion.origen.tabla_nombre} / ` : '';
    return `${tabla}${relacion.origen.nombre}`;
  }
  if (relacion.id_campo_2) {
    return `Campo #${relacion.id_campo_2}`;
  }
  return 'campo desconocido';
}

function eliminarRelacion(campo, index) {
  if (!Array.isArray(campo.relaciones)) return;
  const relacion = campo.relaciones[index];
  if (!relacion) return;

  if (relacion.id) {
    if (Array.isArray(props.tablas)) {
      props.tablas.forEach((tablaItem) => {
        if (!Array.isArray(tablaItem.campos)) return;
        tablaItem.campos.forEach((campoItem) => {
          if (!Array.isArray(campoItem.relaciones)) return;
          campoItem.relaciones = campoItem.relaciones.filter((relItem) => relItem.id !== relacion.id);
        });
      });
    }
  }

  campo.relaciones.splice(index, 1);
}

function quitarCampo(campoId) {
  campos.value = campos.value.filter((campo) => campo.id !== campoId);
}
</script>
