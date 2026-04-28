<template>
  <div class="d-flex justify-content-end gap-2">
    <button type="button" class="btn btn-secondary" @click="props.onCerrar">Cancelar</button>
    <button type="button" class="btn btn-primary" :disabled="isCargando" @click="props.onGuardar">
      {{ isCargando ? 'Guardando...' : 'Guardar' }}
    </button>
  </div>
</template>

<script setup>
import { computed, unref } from 'vue';

const props = defineProps(['cargando', 'onGuardar', 'onCerrar']);
const isCargando = computed(() => Boolean(unref(props.cargando)));
</script>
