<template>
  <div class="d-flex justify-content-end gap-2">
    <button type="button" class="btn btn-sm btn-secondary" @click="props.onCerrar">Cancelar</button>
    <button type="button" class="btn btn-sm btn-success" @click="props.onGuardar">Guardar</button>
  </div>
</template>

<script setup>
const props = defineProps(['onGuardar', 'onCerrar']);
</script>
