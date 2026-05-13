<template>
  <div>
    <div v-if="mensajeError" class="alert alert-danger py-1 mb-3">{{ mensajeError }}</div>
    <div class="form-group mb-3">
      <label>ID</label>
      <input v-model="form.id" class="form-control" placeholder="agente-123" />
    </div>
    <div class="form-group mb-3">
      <label>Nombre</label>
      <input v-model="form.nombre" class="form-control" placeholder="Nombre del agente" />
    </div>
    <div class="form-group mb-3">
      <label>Descripción</label>
      <textarea v-model="form.descripcion" class="form-control" rows="3" placeholder="Descripción breve"></textarea>
    </div>
    <div class="form-group mb-3">
      <label>Prompt de sistema</label>
      <textarea v-model="form.promt_sistema" class="form-control" rows="6" placeholder="Prompt del agente"></textarea>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  form: { type: Object, required: true },
  mensajeError: { type: String, default: '' },
});
</script>

<style scoped>
textarea.form-control {
  font-family: monospace;
}
</style>
