<template>
  <div :class="['sidebar-card', collapsed ? 'sidebar-card-collapsed' : 'sidebar-card-expanded']">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <div>
        <h2 class="h5 mb-0" v-if="!collapsed">Barra Lateral</h2>
      </div>
      <button
        type="button"
        class="btn btn-sm btn-outline-primary"
        @click="$emit('toggle')"
        :aria-label="collapsed ? 'Expandir menú' : 'Colapsar menú'"
      >
        <span v-if="collapsed">▶</span>
        <span v-else>◀</span>
      </button>
    </div>

    <nav :class="['nav', 'nav-pills', 'flex-column', collapsed ? 'text-center' : '']">
      <router-link
        class="nav-link d-flex align-items-center gap-2"
        to="/"
        active-class="active"
        exact-active-class="active"
        title="Inicio"
      >
        <span class="menu-icon">🏠</span>
        <span v-if="!collapsed">Inicio</span>
      </router-link>
      <router-link
        class="nav-link d-flex align-items-center gap-2"
        to="/proyectos"
        active-class="active"
        title="Proyectos"
      >
        <span class="menu-icon">📁</span>
        <span v-if="!collapsed">Proyectos</span>
      </router-link>
      <router-link
        class="nav-link d-flex align-items-center gap-2"
        to="/tecnologias"
        active-class="active"
        title="Tecnologías"
      >
        <span class="menu-icon">🧩</span>
        <span v-if="!collapsed">Tecnologías</span>
      </router-link>
      <router-link
        class="nav-link d-flex align-items-center gap-2"
        to="/ollama"
        active-class="active"
        title="Ollama"
      >
        <span class="menu-icon">🤖</span>
        <span v-if="!collapsed">Ollama</span>
      </router-link>
      <a class="nav-link d-flex align-items-center gap-2" href="#" title="Configuración">
        <span class="menu-icon">⚙️</span>
        <span v-if="!collapsed">Configuración</span>
      </a>
    </nav>

    <div class="mt-4" v-if="!collapsed">
      <h3 class="h6">Estado</h3>
      <ul class="list-group list-group-flush">
        <li class="list-group-item px-0">WS: conectado</li>
        <li class="list-group-item px-0">API: OK</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  collapsed: { type: Boolean, default: false },
});
</script>

<style scoped>
.sidebar-card {
  min-height: 100vh;
  background: #ffffff;
  border-radius: 1rem 0 0 1rem;
  box-shadow: 0 0.75rem 1.5rem rgba(0, 0, 0, 0.05);
  padding: 1rem 1.25rem;
  transition: width 0.3s ease, padding 0.3s ease;
}
.sidebar-card-collapsed {
  width: 100%;
  padding: 1rem 0.75rem;
}
.sidebar-card-expanded {
  width: 100%;
}
.nav-link {
  border-radius: 0.75rem;
  margin-bottom: 0.35rem;
}
.nav-link:hover,
.nav-link.active {
  background-color: #e7f1ff;
  color: #0d6efd;
}
.menu-icon {
  width: 1.8rem;
  display: inline-flex;
  justify-content: center;
}
</style>
