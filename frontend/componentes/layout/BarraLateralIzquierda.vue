<template>
  <div class="p-3">
    <h2 class="h5 mb-3">Barra Lateral</h2>
    <nav class="nav flex-column">
      <router-link class="nav-link" to="/" active-class="active" exact-active-class="active">Inicio</router-link>
      <router-link class="nav-link" to="/proyectos" active-class="active">Proyectos</router-link>
      <router-link class="nav-link" to="/ollama" active-class="active">Ollama</router-link>
      <a class="nav-link" href="#">Configuración</a>
      <a class="nav-link" href="#">Documentación</a>
    </nav>

    <div class="mt-4">
      <h3 class="h6">Estado</h3>
      <ul class="list-group list-group-flush">
        <li class="list-group-item px-0">WS: conectado</li>
        <li class="list-group-item px-0">API: OK</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
// Componente en Composition API (script setup)
</script>

<style scoped>
.nav-link.active {
  font-weight: 700;
}
</style>
