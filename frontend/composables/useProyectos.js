import { ref } from 'vue';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL);
const projects = ref([]);
const selectedProject = ref('');
const loadingProjects = ref(false);

export function loadProjects() {
  loadingProjects.value = true;
  return new Promise((resolve) => {
    socket.emit('proyectos:list', null, (resp) => {
      if (resp.ok) {
        projects.value = resp.data ?? [];
        if (projects.value.length && !selectedProject.value) {
          selectedProject.value = projects.value[0].id ?? projects.value[0];
        }
      } else {
        projects.value = [];
      }
      loadingProjects.value = false;
      resolve(resp);
    });
  });
}

export function useProyectos() {
  return {
    projects,
    selectedProject,
    loadingProjects,
    loadProjects,
  };
}
