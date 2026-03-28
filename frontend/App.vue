<template>
  <div class="container py-5">
    <h1 class="mb-4">Frontend base</h1>
    <div v-if="status === 'ok'" class="alert alert-success" role="alert">Conexión API OK</div>
    <div v-else-if="status === 'error'" class="alert alert-danger" role="alert">API no disponible</div>
    <div v-else class="alert alert-secondary" role="alert">Presiona el botón para chequear la API</div>
    <button class="btn btn-primary" @click="checkApi">Comprobar API</button>
    <p class="mt-3">URL API: <code>{{ apiUrl }}</code></p>
  </div>
</template>

<script>
import { ref } from 'vue';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default {
  setup() {
    const status = ref('unknown');

    const checkApi = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/health`);
        status.value = response.ok ? 'ok' : 'error';
      } catch {
        status.value = 'error';
      }
    };

    return { apiUrl, status, checkApi };
  }
};
</script>
