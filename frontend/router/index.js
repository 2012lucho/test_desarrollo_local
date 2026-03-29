import { createRouter, createWebHashHistory } from 'vue-router';
import AbmProyectos from '../componentes/proyectos/abmProyectos.vue';
import AbmOllama from '../componentes/ollama/abmOllama.vue';

const routes = [
  {
    path: '/',
    name: 'Inicio',
    component: {
      template: `<div class="alert alert-info my-3">Seleccione una opción desde la barra lateral.</div>`,
    },
  },
  {
    path: '/proyectos',
    name: 'Proyectos',
    component: AbmProyectos,
  },
  {
    path: '/ollama',
    name: 'Ollama',
    component: AbmOllama,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
