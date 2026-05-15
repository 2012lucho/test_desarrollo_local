<template>
  <div class="barra-superior border-bottom px-3 d-flex justify-content-end align-items-center">
    <div class="d-flex align-items-center gap-2" style="min-width: 220px;">
      <label class="form-label mb-0 small text-muted">Proyecto</label>
      <select
        class="form-select form-select-sm"
        v-model="selectedProject"
        :disabled="loadingProjects || projects.length === 0"
      >
        <option value="" disabled>
          {{ projects.length ? 'Selecciona un proyecto' : 'No hay proyectos disponibles' }}
        </option>
        <option
          v-for="project in projects"
          :key="project.id ?? project"
          :value="project.id ?? project"
        >
          {{ project.nombre ?? project }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useProyectos, loadProjects } from '../../composables/useProyectos';

const { projects, selectedProject, loadingProjects } = useProyectos();

onMounted(() => {
  if (!projects.value.length) {
    loadProjects();
  }
});
</script>

<style scoped>
.barra-superior {
  background-color: #f8f9fa;
}
</style>
