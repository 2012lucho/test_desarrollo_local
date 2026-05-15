import { createRouter, createWebHashHistory } from 'vue-router';
import AbmProyectos from '../componentes/proyectos/abmProyectos.vue';
import AbmOllama from '../componentes/ollama/abmOllama.vue';
import AbmTecnologias from '../componentes/tecnologias/abmTecnologias.vue';
import AbmBaseDeDatos from '../componentes/baseDeDatos/AbmBaseDeDatos.vue';
import AbmAgentes from '../componentes/agentes/AbmAgentes.vue';
import AbmInteracciones from '../componentes/interacciones/abmInteracciones.vue';
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
    path: '/basededatos',
    name: 'Base de Datos',
    component: AbmBaseDeDatos,
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
  {
    path: '/interacciones',
    name: 'Interacciones',
    component: AbmInteracciones,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
