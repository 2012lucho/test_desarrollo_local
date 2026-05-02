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
                <div class="col-6 col-lg-3">
                  <input
                    v-model="campo.tipo"
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="Tipo (ej: string, integer)"
                  />
                </div>
                <div class="col-6 col-lg-3">
                  <input
                    v-model="campo.descripcion"
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="Descripción (opcional)"
                  />
                </div>
                <div class="col-12 col-lg-2 d-flex align-items-center justify-content-between gap-2">
                  <div class="form-check mb-0">
                    <input
                      v-model="campo.nulo"
                      type="checkbox"
                      class="form-check-input"
                      :id="'nulo-' + (campo.id ?? index)"
                    />
                    <label class="form-check-label" :for="'nulo-' + (campo.id ?? index)">Nulo</label>
                  </div>
                  <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarCampo(campo.id)">
                    Eliminar
                  </button>
                </div>
              </div>
              <div class="row g-2">
                <div class="col-12">
                  <textarea
                    v-model="campo.config"
                    class="form-control form-control-sm font-monospace"
                    placeholder='Config JSON (ej: {"longitud": 255})'
                    rows="2"
                  />
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
import { computed } from 'vue';
const props = defineProps(['tabla', 'mensajeError']);

const generarIdTemporal = () => -(Date.now() + Math.floor(Math.random() * 1000));

const nombre = computed({
  get: () => props.tabla?.value?.nombre ?? '',
  set: (val) => {
    if (props.tabla?.value) {
      props.tabla.value.nombre = val;
    }
  },
});

const campos = computed({
  get: () => {
    if (!props.tabla?.value) return [];
    if (!Array.isArray(props.tabla.value.campos)) {
      props.tabla.value.campos = [];
    }
    return props.tabla.value.campos;
  },
  set: (val) => {
    if (props.tabla?.value) {
      props.tabla.value.campos = val;
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
  campos.value.push({ id: generarIdTemporal(), nombre: '', tipo: '', descripcion: '', nulo: false, config: '{}', orden: maxOrden + 1 });
}

function quitarCampo(campoId) {
  campos.value = campos.value.filter((campo) => campo.id !== campoId);
}
</script>
