import { createRouter, createWebHashHistory } from 'vue-router';
import AbmProyectos from '../componentes/proyectos/abmProyectos.vue';
import AbmOllama from '../componentes/ollama/abmOllama.vue';
import AbmTecnologias from '../componentes/tecnologias/abmTecnologias.vue';
import AbmAgentes from '../componentes/agentes/AbmAgentes.vue';
import ChatInicio from '../componentes/ollama/ChatInicio.vue';

const routes = [
  {
    path: '/',
    name: 'Inicio',
    component: ChatInicio,
  },
  {
    path: '/proyectos',
    name: 'Proyectos',
    component: AbmProyectos,
  },
  {
    path: '/tecnologias',
    name: 'Tecnologias',
    component: AbmTecnologias,
  },
  {
    path: '/ollama',
    name: 'Ollama',
    component: AbmOllama,
  },
  {
    path: '/agentes',
    name: 'Agentes',
    component: AbmAgentes,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
