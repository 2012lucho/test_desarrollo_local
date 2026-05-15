import { ref } from 'vue';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL);
const projects = ref([]);
const selectedProject = ref('');
const projectData = ref(null);
const loadingProjects = ref(false);
const loadingProject = ref(false);

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

export function loadProjectDetails(projectId) {
  loadingProject.value = true;
  projectData.value = null;
  return new Promise((resolve) => {
    if (!projectId) {
      loadingProject.value = false;
      resolve({ ok: false, error: 'Se requiere proyecto seleccionado' });
      return;
    }

    socket.emit('proyectos:get', { id: Number(projectId) }, (resp) => {
      if (resp.ok) {
        projectData.value = resp.data ?? null;
      } else {
        projectData.value = null;
      }
      loadingProject.value = false;
      resolve(resp);
    });
  });
}

export function updateProjectTables(projectId, tablas) {
  return new Promise((resolve) => {
    socket.emit('proyectos:update', { id: Number(projectId), tablas }, (resp) => {
      resolve(resp);
    });
  });
}

export function updateTablePosition({ id, pos_canvas_x, pos_canvas_y }) {
  return new Promise((resolve) => {
    socket.emit('tablas:update-position', { id, pos_canvas_x, pos_canvas_y }, (resp) => {
      resolve(resp);
    });
  });
}

export function useProyectos() {
  return {
    projects,
    selectedProject,
    projectData,
    loadingProjects,
    loadingProject,
    loadProjects,
    loadProjectDetails,
    updateProjectTables,
    updateTablePosition,
  };
}
