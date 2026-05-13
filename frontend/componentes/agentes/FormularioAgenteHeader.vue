<template>
  <div>
    <h5 class="mb-0">{{ editandoId ? 'Editar agente' : 'Nuevo agente' }}</h5>
  </div>
</template>

<script setup>
const props = defineProps({
  editandoId: { type: String, default: null },
});
</script>

<style scoped>
</style>
