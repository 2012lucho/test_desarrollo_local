<template>
  <div style="min-width: 320px;">
    <div class="mb-3">
      <label class="form-label">Campo origen</label>
      <input type="text" class="form-control" :value="campo?.nombre || ''" disabled />
    </div>

    <div class="mb-3">
      <label class="form-label">Tabla destino</label>
      <select v-model="tablaSeleccionadaId" class="form-select">
        <option disabled value="">Selecciona tabla</option>
        <option v-for="tabla in tablasDisponibles" :key="tabla.id" :value="tabla.id">
          {{ tabla.nombre || 'Tabla sin nombre' }}
        </option>
      </select>
    </div>

    <div class="mb-3">
      <label class="form-label">Campo destino</label>
      <select v-model="campoSeleccionadoId" class="form-select" :disabled="camposDisponibles.length === 0">
        <option disabled value="">Selecciona campo</option>
        <option v-for="campoItem in camposDisponibles" :key="campoItem.id" :value="campoItem.id">
          {{ campoItem.nombre || 'Campo sin nombre' }}
        </option>
      </select>
    </div>

    <div class="mb-3">
      <label class="form-label">Tipo de relación</label>
      <select v-model="tipoRelacion" class="form-select">
        <option value="1-1">1-1</option>
        <option value="1-N">1-N</option>
        <option value="N-N">N-N</option>
      </select>
    </div>

    <div class="d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-sm btn-secondary" @click="props.onCerrar">Cancelar</button>
      <button type="button" class="btn btn-sm btn-success" @click="guardarRelacion">Agregar relación</button>
    </div>

    <div v-if="props.mensajeError?.value" class="alert alert-danger py-1 mt-3">
      {{ props.mensajeError.value }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
const props = defineProps(['campo', 'tablas', 'mensajeError', 'onCerrar']);
const tablaSeleccionadaId = ref('');
const campoSeleccionadoId = ref('');
const tipoRelacion = ref('1-1');

const tablasDisponibles = computed(() => {
  return Array.isArray(props.tablas) ? props.tablas : [];
});

const camposDisponibles = computed(() => {
  const tabla = tablasDisponibles.value.find((item) => String(item.id) === String(tablaSeleccionadaId.value));
  if (!tabla || !Array.isArray(tabla.campos)) return [];
  return tabla.campos.filter((item) => String(item.id) !== String(props.campo?.id));
});

watch(tablaSeleccionadaId, () => {
  campoSeleccionadoId.value = '';
});

function guardarRelacion() {
  props.mensajeError.value = '';

  if (!tablaSeleccionadaId.value) {
    props.mensajeError.value = 'Selecciona la tabla destino';
    return;
  }
  if (!campoSeleccionadoId.value) {
    props.mensajeError.value = 'Selecciona el campo destino';
    return;
  }
  if (!props.campo) {
    props.mensajeError.value = 'Campo origen inválido';
    return;
  }

  if (!Array.isArray(props.campo.relaciones)) {
    props.campo.relaciones = [];
  }

  const destinoId = String(campoSeleccionadoId.value);
  const existe = props.campo.relaciones.some((rel) => String(rel.id_campo_2) === destinoId && rel.tipo_relacion === tipoRelacion.value);
  if (existe) {
    props.mensajeError.value = 'Ya existe esa relación para este campo';
    return;
  }

  const tablaDestino = tablasDisponibles.value.find((item) => String(item.id) === String(tablaSeleccionadaId.value));
  const campoDestino = camposDisponibles.value.find((item) => String(item.id) === destinoId);

  props.campo.relaciones.push({
    id_campo_1: props.campo.id,
    id_campo_2: campoSeleccionadoId.value,
    tipo_relacion: tipoRelacion.value,
    destino: campoDestino
      ? {
          id: campoDestino.id,
          nombre: campoDestino.nombre,
          id_tabla: tablaDestino?.id,
          tabla_nombre: tablaDestino?.nombre,
        }
      : null,
    origen: {
      id: props.campo.id,
      nombre: props.campo.nombre,
      id_tabla: props.campo.id_tabla ?? null,
    },
  });

  if (typeof props.onCerrar === 'function') {
    props.onCerrar();
  }
}
</script>
