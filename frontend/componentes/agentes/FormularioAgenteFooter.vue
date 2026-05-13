<template>
  <div class="d-flex justify-content-end gap-2">
    <button class="btn btn-secondary" @click="onCerrar" type="button">Cancelar</button>
    <button class="btn btn-primary" @click="onGuardar" type="button" :disabled="cargando">
      {{ cargando ? 'Guardando...' : 'Guardar' }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  onGuardar: { type: Function, required: true },
  onCerrar: { type: Function, required: true },
  cargando: { type: Boolean, default: false },
});
</script>

<style scoped>
.btn {
  min-width: 100px;
}
</style>
