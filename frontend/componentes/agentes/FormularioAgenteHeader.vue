<template>
  <div>
    <h5 class="mb-0">{{ isEditing ? 'Editar nodo de flujo' : 'Nuevo nodo de flujo' }}</h5>
  </div>
</template>

<script setup>
const props = defineProps({
  isEditing: { type: Boolean, default: false },
});
</script>

<style scoped>
</style>
