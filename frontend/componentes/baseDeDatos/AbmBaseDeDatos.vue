<template>
  <div class="basededatos-page">
    <div class="toolbar">
      <div class="toolbar-actions">
        <button type="button" class="btn" @click="zoomOut">- Alejar</button>
        <button type="button" class="btn" @click="zoomReset">100%</button>
        <button type="button" class="btn" @click="zoomIn">+ Acercar</button>
        <button type="button" class="btn" @click="abrirNuevaTabla">+ Agregar tabla</button>
      </div>
      <div class="toolbar-status">
        <span v-if="currentProjectName">Proyecto: <strong>{{ currentProjectName }}</strong></span>
        <span>Zoom: <strong>{{ Math.round(zoom * 100) }}%</strong></span>
      </div>
    </div>

    <div v-if="!selectedProject" class="toolbar-error">
      Selecciona un proyecto en la barra superior para ver las tablas de la base de datos.
    </div>
    <div v-else-if="loadingProject" class="toolbar-status">
      Cargando tablas de la base de datos...
    </div>
    <div v-else class="canvas-area" ref="canvasRef" @pointermove="onCanvasPointerMove" @pointerup="endPointerActions" @wheel.prevent="onCanvasWheel">
      <div class="canvas-content" :style="canvasTransformStyle">
        <svg class="canvas-svg" :width="canvasWidth" :height="canvasHeight">
          <defs>
            <linearGradient id="gridGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="rgba(44, 123, 229, 0.06)" />
              <stop offset="100%" stop-color="rgba(44, 123, 229, 0.02)" />
            </linearGradient>
            <marker id="relationArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#2c7be5" />
            </marker>
          </defs>

          <path
            v-for="connection in tableConnections"
            :key="`${connection.from}-${connection.to}`"
            :d="connectionPath(connection)"
            class="relation-line"
            marker-end="url(#relationArrow)"
          />
        </svg>
        <div class="canvas-grid" />

        <div v-if="!tables.length" class="canvas-empty">
          No hay tablas registradas para este proyecto.
        </div>

        <div
          v-for="node in nodes"
          :key="node.id"
          class="node-card"
          :style="nodeStyle(node)"
          @pointerdown="startNodeDrag(node, $event)"
        >
          <div class="node-header">
            <span>{{ getNodeLabel(node) }}</span>
            <div class="node-actions">
              <button type="button" class="btn btn-sm btn-outline-secondary btn-edit-table" @click.stop.prevent="editarTabla(node.id)">Editar</button>
              <button type="button" class="btn btn-sm btn-outline-danger btn-delete-table" @click.stop.prevent="eliminarTabla(node.id)">Eliminar</button>
            </div>
          </div>
          <div class="node-body">
            <ul class="field-list">
              <li v-for="campo in getNodeFields(node)" :key="campo.id" class="field-item">
                {{ campo.nombre || 'Campo sin nombre' }}
              </li>
              <li v-if="!getNodeFields(node).length" class="field-item text-muted">
                Sin campos definidos.
              </li>
            </ul>
            <div v-if="getNodeDescription(node)" class="node-description">{{ getNodeDescription(node) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useModal } from '../../composables/useModal.js';
import { useProyectos, loadProjectDetails, updateProjectTables, updateTablePosition } from '../../composables/useProyectos';
import FormularioTablaHeader from '../proyectos/FormularioTablaHeader.vue';
import FormularioTablaBody from '../proyectos/FormularioTablaBody.vue';
import FormularioTablaFooter from '../proyectos/FormularioTablaFooter.vue';

const canvasRef = ref(null);
const { selectedProject, projectData, loadingProject } = useProyectos();
const { mostrarModal } = useModal();
const tables = computed(() => Array.isArray(projectData.value?.tablas) ? projectData.value.tablas : []);
const currentProjectName = computed(() => projectData.value?.nombre ?? '');
const nodes = ref([]);
const draggingNode = ref(null);
const canvasRect = reactive({ left: 0, top: 0, width: 0, height: 0 });
const zoom = ref(1);
const minZoom = 0.5;
const maxZoom = 2.5;
const zoomStep = 0.1;
const NODE_WIDTH = 220;
const NODE_HEIGHT = 200;
const mensajeErrorTabla = ref('');

const canvasTransformStyle = computed(() => ({
  transform: `scale(${zoom.value})`,
  transformOrigin: '0 0',
}));

const canvasWidth = computed(() => {
  const maxNodeX = nodes.value.reduce((max, node) => Math.max(max, node.x + NODE_WIDTH + 60), 0);
  return Math.max(canvasRect.width, maxNodeX, 900);
});
const canvasHeight = computed(() => {
  const maxNodeY = nodes.value.reduce((max, node) => Math.max(max, node.y + NODE_HEIGHT + 60), 0);
  return Math.max(canvasRect.height, maxNodeY, 520);
});

const tableConnections = computed(() => {
  const seen = new Set();
  const connections = [];
  const campoPorId = new Map();

  tables.value.forEach((tabla) => {
    if (!Array.isArray(tabla.campos)) return;
    tabla.campos.forEach((campo) => {
      if (campo?.id !== undefined && campo?.id !== null) {
        campoPorId.set(String(campo.id), { ...campo, tablaId: tabla.id });
      }
    });
  });

  tables.value.forEach((tabla) => {
    if (!Array.isArray(tabla.campos)) return;

    tabla.campos.forEach((campo) => {
      if (!Array.isArray(campo.relaciones)) return;
      campo.relaciones.forEach((rel) => {
        const destinoTablaId = rel.destino?.id_tabla
          || rel.origen?.id_tabla
          || (rel.id_campo_2 ? campoPorId.get(String(rel.id_campo_2))?.tablaId : null)
          || (rel.id_campo_1 ? campoPorId.get(String(rel.id_campo_1))?.tablaId : null);
        const origenTablaId = tabla.id;
        if (!destinoTablaId || destinoTablaId === origenTablaId) return;

        const key = [Math.min(origenTablaId, destinoTablaId), Math.max(origenTablaId, destinoTablaId)].join(':');
        if (seen.has(key)) return;

        seen.add(key);
        connections.push({ from: origenTablaId, to: destinoTablaId });
      });
    });
  });

  return connections;
});

function updateCanvasRect() {
  const el = canvasRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  canvasRect.left = rect.left;
  canvasRect.top = rect.top;
  canvasRect.width = rect.width;
  canvasRect.height = rect.height;
}

function syncNodesWithTables() {
  const existing = Object.fromEntries(nodes.value.map((node) => [node.id, node]));
  nodes.value = tables.value.map((tabla, index) => {
    const hasStoredPos = tabla.pos_canvas_x !== null && tabla.pos_canvas_x !== undefined && tabla.pos_canvas_y !== null && tabla.pos_canvas_y !== undefined;
    const storedX = Number(tabla.pos_canvas_x);
    const storedY = Number(tabla.pos_canvas_y);

    if (existing[tabla.id]) {
      const node = existing[tabla.id];
      if (hasStoredPos) {
        node.x = storedX;
        node.y = storedY;
      }
      return node;
    }

    return {
      id: tabla.id,
      x: hasStoredPos ? storedX : 60 + (index % 3) * 260,
      y: hasStoredPos ? storedY : 60 + Math.floor(index / 3) * 180,
    };
  });
}

function loadTables() {
  if (!selectedProject.value) {
    projectData.value = null;
    nodes.value = [];
    return;
  }
  loadProjectDetails(selectedProject.value).then((resp) => {
    if (resp.ok) {
      syncNodesWithTables();
    } else {
      nodes.value = [];
    }
  });
}

function generarIdTemporal() {
  return -(Date.now() + Math.floor(Math.random() * 1000));
}

function abrirNuevaTabla() {
  const nuevaTabla = ref({
    id: generarIdTemporal(),
    nombre: '',
    descripcion: '',
    campos: [],
    pos_canvas_x: 60,
    pos_canvas_y: 60,
  });
  abrirModalTabla(nuevaTabla, true);
}

function editarTabla(tablaId) {
  const tablaOrigen = tables.value.find((item) => item.id === tablaId);
  if (!tablaOrigen) return;
  const tablaCopia = ref(JSON.parse(JSON.stringify(tablaOrigen)));
  abrirModalTabla(tablaCopia, false);
}

async function eliminarTabla(tablaId) {
  const tablaOrigen = tables.value.find((item) => item.id === tablaId);
  if (!tablaOrigen || !selectedProject.value) return;
  const confirmMessage = `¿Eliminar la tabla "${tablaOrigen.nombre || 'Tabla'}"? Esta acción eliminará la tabla del proyecto.`;
  if (!window.confirm(confirmMessage)) return;

  const tablasActuales = tables.value.filter((item) => item.id !== tablaId);
  const tablasPayload = prepararTablasPayload(tablasActuales);
  const resp = await updateProjectTables(selectedProject.value, tablasPayload);

  if (resp.ok) {
    loadTables();
  } else {
    mensajeErrorTabla.value = resp.error || 'Error eliminando la tabla';
  }
}

function prepararTablasPayload(tablas) {
  return tablas
    .map((item) => {
      const nombre = String(item?.nombre ?? '').trim();
      if (!nombre) return null;
      return {
        id: item?.id,
        nombre,
        descripcion: item?.descripcion ?? '',
        pos_canvas_x: item?.pos_canvas_x ?? null,
        pos_canvas_y: item?.pos_canvas_y ?? null,
        campos: Array.isArray(item?.campos)
          ? item.campos
              .map((campo) => ({
                id: campo?.id,
                nombre: String(campo?.nombre ?? '').trim(),
                tipo: String(campo?.tipo || 'VARCHAR').trim() || 'VARCHAR',
                descripcion: campo?.descripcion ? String(campo.descripcion).trim() : null,
                orden: Number.isNaN(Number(campo?.orden)) ? 0 : Number(campo.orden),
                nulo: Boolean(campo?.nulo),
                clave_primaria: Boolean(campo?.clave_primaria),
                autoincremental: Boolean(campo?.autoincremental),
                longitud: campo?.longitud == null || campo?.longitud === '' || Number.isNaN(Number(campo?.longitud)) ? null : Number(campo.longitud),
                config: campo?.config ?? '{}',
                relaciones: Array.isArray(campo?.relaciones)
                  ? campo.relaciones
                      .filter((rel) => rel && rel.id_campo_2)
                      .map((rel) => ({
                        id_campo_2: rel.id_campo_2,
                        tipo_relacion: String(rel.tipo_relacion || '1-1').trim() || '1-1',
                      }))
                  : [],
              }))
              .filter((campo) => campo.nombre)
          : [],
      };
    })
    .filter(Boolean);
}

async function abrirModalTabla(tablaRef, esNueva) {
  mensajeErrorTabla.value = '';
  let cerrar = null;

  function guardarTabla() {
    mensajeErrorTabla.value = '';
    const tabla = tablaRef.value;
    if (!tabla || !String(tabla.nombre || '').trim()) {
      mensajeErrorTabla.value = 'El nombre de la tabla es requerido.';
      return;
    }

    const tablasActuales = Array.isArray(projectData.value?.tablas) ? projectData.value.tablas : [];
    const index = tablasActuales.findIndex((item) => item.id === tabla.id);
    if (index === -1) {
      tablasActuales.push(tabla);
    } else {
      tablasActuales[index] = tabla;
    }

    const tablasPayload = prepararTablasPayload(tablasActuales);
    updateProjectTables(selectedProject.value, tablasPayload).then((resp) => {
      if (resp.ok) {
        loadTables();
        if (typeof cerrar === 'function') cerrar();
      } else {
        mensajeErrorTabla.value = resp.error || 'Error guardando la tabla';
      }
    });
  }

  cerrar = mostrarModal({
    header: FormularioTablaHeader,
    body: FormularioTablaBody,
    footer: FormularioTablaFooter,
    headerProps: { tabla: tablaRef },
    bodyProps: { tabla: tablaRef, tablas: tables.value, mensajeError: mensajeErrorTabla },
    footerProps: { onGuardar: guardarTabla, onCerrar: () => cerrar && cerrar() },
    fullscreen: false,
  });
}

function getNodeLabel(node) {
  const tabla = tables.value.find((item) => item.id === node.id);
  return tabla?.nombre ?? 'Tabla';
}

function getTableFieldCount(node) {
  const tabla = tables.value.find((item) => item.id === node.id);
  return tabla?.campos?.length ?? 0;
}

function getNodeDescription(node) {
  const tabla = tables.value.find((item) => item.id === node.id);
  return tabla?.descripcion ? tabla.descripcion : '';
}

function getNodeFields(node) {
  const tabla = tables.value.find((item) => item.id === node.id);
  return Array.isArray(tabla?.campos) ? tabla.campos : [];
}

function nodeStyle(node) {
  return {
    transform: `translate(${node.x}px, ${node.y}px)`,
  };
}

function connectionPath(connection) {
  const fromNode = nodes.value.find((node) => node.id === connection.from);
  const toNode = nodes.value.find((node) => node.id === connection.to);
  if (!fromNode || !toNode) return '';

  const start = {
    x: fromNode.x + NODE_WIDTH,
    y: fromNode.y + NODE_HEIGHT / 2,
  };
  const end = {
    x: toNode.x,
    y: toNode.y + NODE_HEIGHT / 2,
  };

  const midX = start.x + (end.x - start.x) / 2;
  return `M ${start.x} ${start.y} C ${midX} ${start.y} ${midX} ${end.y} ${end.x} ${end.y}`;
}

function startNodeDrag(node, event) {
  if (event.target.closest('button')) return;
  const pointerX = (event.clientX - canvasRect.left) / zoom.value;
  const pointerY = (event.clientY - canvasRect.top) / zoom.value;
  const offsetX = pointerX - node.x;
  const offsetY = pointerY - node.y;
  draggingNode.value = { node, offsetX, offsetY };
  event.currentTarget.setPointerCapture(event.pointerId);
}

function onCanvasPointerMove(event) {
  updateCanvasRect();
  if (!draggingNode.value) return;
  const pointerX = (event.clientX - canvasRect.left) / zoom.value;
  const pointerY = (event.clientY - canvasRect.top) / zoom.value;
  const { node, offsetX, offsetY } = draggingNode.value;
  node.x = Math.max(0, Math.min(canvasRect.width / zoom.value - 220, pointerX - offsetX));
  node.y = Math.max(0, Math.min(canvasRect.height / zoom.value - 120, pointerY - offsetY));
}

async function endPointerActions() {
  if (draggingNode.value) {
    const node = draggingNode.value.node;
    await persistNodePosition(node);
  }
  draggingNode.value = null;
}

async function persistNodePosition(node) {
  const tabla = tables.value.find((item) => item.id === node.id);
  if (!tabla) return;

  const pos_canvas_x = Math.round(node.x);
  const pos_canvas_y = Math.round(node.y);
  if (tabla.pos_canvas_x === pos_canvas_x && tabla.pos_canvas_y === pos_canvas_y) return;

  const resp = await updateTablePosition({ id: node.id, pos_canvas_x, pos_canvas_y });
  if (resp.ok) {
    tabla.pos_canvas_x = pos_canvas_x;
    tabla.pos_canvas_y = pos_canvas_y;
  }
}

function zoomIn() {
  zoom.value = Math.min(maxZoom, zoom.value + zoomStep);
}

function zoomOut() {
  zoom.value = Math.max(minZoom, zoom.value - zoomStep);
}

function zoomReset() {
  zoom.value = 1;
}

function onCanvasWheel(event) {
  const delta = event.deltaY > 0 ? -zoomStep : zoomStep;
  zoom.value = Math.min(maxZoom, Math.max(minZoom, zoom.value + delta));
}

watch(selectedProject, () => {
  loadTables();
});

watch(tables, () => {
  syncNodesWithTables();
});

onMounted(() => {
  updateCanvasRect();
  loadTables();
  window.addEventListener('resize', updateCanvasRect);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasRect);
});
</script>

<style scoped>
.basededatos-page {
  padding: 1rem;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.toolbar-actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  border: 1px solid #2c7be5;
  background: #2c7be5;
  color: white;
  padding: 0.5rem 0.95rem;
  border-radius: 0.6rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn:hover {
  background: #1a5dc6;
}

.toolbar-status {
  color: #3b4b69;
  font-size: 0.95rem;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.toolbar-error {
  color: #842029;
  background: #f8d7da;
  border: 1px solid #f5c2d1;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
}

.canvas-area {
  position: relative;
  min-height: 520px;
  border: 1px solid #d8e2ef;
  border-radius: 1rem;
  overflow: hidden;
  background: #f8fbff;
}

.canvas-content {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.canvas-svg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
  z-index: 1;
}

.canvas-grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: linear-gradient(to right, rgba(44, 123, 229, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(44, 123, 229, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.65;
}

.canvas-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #5a677d;
  font-size: 1rem;
  text-align: center;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.9);
  border: 1px dashed #c7d3e3;
  border-radius: 1rem;
  max-width: 340px;
}

.node-card {
  position: absolute;
  width: 220px;
  background: #ffffff;
  border: 1px solid #d6e4ff;
  border-radius: 1rem;
  box-shadow: 0 1rem 2rem rgba(10, 37, 82, 0.06);
  cursor: grab;
  user-select: none;
}

.node-card:active {
  cursor: grabbing;
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #eef4ff;
  font-weight: 600;
  color: #1d3557;
}

.node-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-edit-table,
.btn-delete-table {
  border-color: #ffffff;
  color: #ffffff;
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
}

.btn-edit-table {
  background-color: #6c757d;
}

.btn-delete-table {
  background-color: #dc3545;
}

.btn-edit-table:hover,
.btn-delete-table:hover {
  border-color: #ffffff;
}

.btn-edit-table:hover {
  background: #5a6268;
}

.btn-delete-table:hover {
  background: #bd2130;
}

.btn-edit-table {
  border-color: #ffffff;
  color: #ffffff;
  background-color: #6c757d;
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
}

.btn-edit-table:hover {
  background: #5a6268;
  border-color: #ffffff;
}

.node-body {
  padding: 1rem;
  display: grid;
  gap: 0.65rem;
}

.node-info {
  color: #334e6a;
}

.node-description {
  color: #5a677d;
  font-size: 0.92rem;
}

.field-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
}

.field-item {
  font-size: 0.88rem;
  color: #4a5568;
  line-height: 1.4;
  padding: 0.15rem 0;
}

.field-item.text-muted {
  color: #6c757d;
}

.relation-line {
  fill: none;
  stroke: #2c7be5;
  stroke-width: 3;
  stroke-linecap: round;
  opacity: 0.9;
}
</style>
