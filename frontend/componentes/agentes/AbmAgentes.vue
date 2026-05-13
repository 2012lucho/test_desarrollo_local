<template>
  <div class="agentes-page">
    <div class="toolbar">
      <button class="btn" @click="abrirNuevoAgente">+ Nuevo agente</button>
      <button class="btn" @click="zoomOut">- Alejar</button>
      <button class="btn" @click="zoomReset">100%</button>
      <button class="btn" @click="zoomIn">+ Acercar</button>
      <div class="toolbar-status">
        <span>Zoom: <strong>{{ Math.round(zoom * 100) }}%</strong></span>
        <span v-if="connectionStart" class="toolbar-connection-status">
          Conectando desde <strong>{{ connectionStart.fromLabel }}</strong>. Haz clic en la entrada de otro nodo.
        </span>
        <span v-else>
          Haz clic en el punto de salida de un nodo para crear una conexión.
        </span>
      </div>
    </div>
    <div v-if="mensajeError" class="toolbar-error">{{ mensajeError }}</div>

    <div
      class="canvas-area"
      ref="canvasRef"
      @pointermove="onCanvasPointerMove"
      @pointerup="endPointerActions"
      @click.self="cancelConnection"
      @wheel.prevent="onCanvasWheel"
    >
      <div class="canvas-content" :style="canvasTransformStyle">
        <svg class="canvas-svg" :width="canvasWidth" :height="canvasHeight">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#2c7be5" />
            </marker>
          </defs>

          <path
            v-for="conexion in conexiones"
            :key="conexion.id"
            :d="connectionPath(conexion)"
            class="connection-line"
            marker-end="url(#arrow)"
          />

          <path
            v-if="connectionStart"
            :d="tempConnectionPath"
            class="connection-line connection-temp"
            marker-end="url(#arrow)"
          />
        </svg>

        <div class="canvas-grid" />

        <div v-if="!nodes.length" class="canvas-empty">
          Sin agentes registrados. Usa + Nuevo agente para crear uno.
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
          <button class="btn btn-edit" @click.stop="editarAgente(node.id)" type="button">Editar</button>
        </div>
        <div class="node-body">
          <div class="handle input-handle" @pointerdown.stop.prevent="finishConnection(node)" @click.stop>
            <span class="handle-dot" />
            Entrada
          </div>
          <div class="handle output-handle" @pointerdown.stop.prevent="startConnection(node)" @click.stop>
            Salida
            <span class="handle-dot" />
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { useModal } from '../../composables/useModal.js';
import FormularioAgenteHeader from './FormularioAgenteHeader.vue';
import FormularioAgenteBody from './FormularioAgenteBody.vue';
import FormularioAgenteFooter from './FormularioAgenteFooter.vue';

const socket = io(import.meta.env.VITE_API_URL);
const { mostrarModal } = useModal();
const canvasRef = ref(null);
const agentes = ref([]);
const mensajeError = ref('');
const nodes = ref([]);
const agentesMap = computed(() => Object.fromEntries(agentes.value.map((agente) => [agente.id, agente])));
const conexiones = ref([]);
const connectionStart = ref(null);
const draggingNode = ref(null);
const canvasRect = reactive({ left: 0, top: 0, width: 0, height: 0 });
const pointerPos = reactive({ x: 0, y: 0 });
const zoom = ref(1);
const minZoom = 0.5;
const maxZoom = 2.5;
const zoomStep = 0.1;

const canvasTransformStyle = computed(() => ({
  transform: `scale(${zoom.value})`,
  transformOrigin: '0 0',
}));

const NODE_WIDTH = 220;
const NODE_HEIGHT = 110;
const HANDLE_Y = 75;

const canvasWidth = computed(() => Math.max(canvasRect.width, 900));
const canvasHeight = computed(() => Math.max(canvasRect.height, 500));

function updateCanvasRect() {
  const el = canvasRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  canvasRect.left = rect.left;
  canvasRect.top = rect.top;
  canvasRect.width = rect.width;
  canvasRect.height = rect.height;
}

function abrirNuevoAgente() {
  abrirFormularioAgente(null);
}

function syncNodesWithAgentes() {
  const existById = Object.fromEntries(nodes.value.map((node) => [node.id, node]));
  nodes.value = agentes.value.map((agente, index) => {
    if (existById[agente.id]) {
      return existById[agente.id];
    }
    return {
      id: agente.id,
      x: 60 + (index % 3) * 260,
      y: 60 + Math.floor(index / 3) * 180,
    };
  });
}

function cargarAgentes() {
  socket.emit('agentes:list', null, (resp) => {
    if (resp.ok) {
      agentes.value = resp.data || [];
      syncNodesWithAgentes();
      mensajeError.value = '';
    } else {
      mensajeError.value = resp.error || 'Error cargando agentes';
    }
  });
}

function abrirFormularioAgente(agente = null) {
  const form = ref({
    id: agente?.id ?? '',
    nombre: agente?.nombre ?? '',
    descripcion: agente?.descripcion ?? '',
    promt_sistema: agente?.promt_sistema ?? '',
  });
  const editandoId = ref(agente?.id ?? null);
  const mensajeErrorForm = ref('');
  const cargandoForm = ref(false);
  let cerrar = null;

  function guardar() {
    mensajeErrorForm.value = '';
    const id = String(form.value.id || '').trim();
    const nombre = String(form.value.nombre || '').trim();
    if (!nombre) {
      mensajeErrorForm.value = 'El nombre es requerido';
      return;
    }
    if (!id) {
      mensajeErrorForm.value = 'El id es requerido';
      return;
    }

    cargandoForm.value = true;
    const payload = {
      id,
      originalId: editandoId.value,
      nombre,
      descripcion: String(form.value.descripcion || '').trim(),
      promt_sistema: String(form.value.promt_sistema || '').trim(),
    };
    const accion = editandoId.value ? 'agentes:update' : 'agentes:create';

    socket.emit(accion, payload, (resp) => {
      cargandoForm.value = false;
      if (resp.ok) {
        if (typeof cerrar === 'function') cerrar();
      } else {
        mensajeErrorForm.value = resp.error || 'Error guardando agente';
      }
    });
  }

  function abrirModal() {
    cerrar = mostrarModal({
      header: FormularioAgenteHeader,
      body: FormularioAgenteBody,
      footer: FormularioAgenteFooter,
      headerProps: { editandoId },
      bodyProps: { form, mensajeError: mensajeErrorForm },
      footerProps: { cargando: cargandoForm, onGuardar: guardar, onCerrar: () => cerrar && cerrar() },
      fullscreen: false,
    });
  }

  abrirModal();
}

function editarAgente(id) {
  const agente = agentesMap.value[id];
  if (!agente) return;
  abrirFormularioAgente(agente);
}

function removeNode(id) {
  nodes.value = nodes.value.filter((node) => node.id !== id);
  conexiones.value = conexiones.value.filter((con) => con.from !== id && con.to !== id);
  if (connectionStart.value && connectionStart.value.fromId === id) {
    connectionStart.value = null;
  }
}

function nodeStyle(node) {
  return {
    transform: `translate(${node.x}px, ${node.y}px)`,
  };
}

function getNodeLabel(node) {
  return agentesMap.value[node.id]?.nombre || 'Agente';
}

function connectorPosition(node, type) {
  const x = node.x + (type === 'output' ? NODE_WIDTH : 0);
  const y = node.y + HANDLE_Y;
  return { x, y };
}

function startConnection(node) {
  connectionStart.value = {
    fromId: node.id,
    fromLabel: getNodeLabel(node),
    start: connectorPosition(node, 'output'),
  };
}

function finishConnection(node) {
  if (!connectionStart.value) return;
  if (node.id === connectionStart.value.fromId) return;
  const exists = conexiones.value.some(
    (con) => con.from === connectionStart.value.fromId && con.to === node.id,
  );
  if (!exists) {
    conexiones.value.push({
      id: `con-${Date.now()}`,
      from: connectionStart.value.fromId,
      to: node.id,
    });
  }
  connectionStart.value = null;
}

function cancelConnection() {
  connectionStart.value = null;
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

function connectionPath(connection) {
  const from = connectorPosition(nodes.value.find((n) => n.id === connection.from), 'output');
  const to = connectorPosition(nodes.value.find((n) => n.id === connection.to), 'input');
  if (!from || !to) return '';
  const midX = from.x + (to.x - from.x) / 2;
  return `M ${from.x} ${from.y} C ${midX} ${from.y} ${midX} ${to.y} ${to.x} ${to.y}`;
}

const tempConnectionPath = computed(() => {
  if (!connectionStart.value) return '';
  const from = connectionStart.value.start;
  const to = { x: pointerPos.x, y: pointerPos.y };
  const midX = from.x + (to.x - from.x) / 2;
  return `M ${from.x} ${from.y} C ${midX} ${from.y} ${midX} ${to.y} ${to.x} ${to.y}`;
});

function startNodeDrag(node, event) {
  if (event.target.closest('.handle') || event.target.closest('.btn-close')) return;
  const pointerX = (event.clientX - canvasRect.left) / zoom.value;
  const pointerY = (event.clientY - canvasRect.top) / zoom.value;
  const offsetX = pointerX - node.x;
  const offsetY = pointerY - node.y;
  draggingNode.value = { node, offsetX, offsetY, pointerId: event.pointerId };
  event.currentTarget.setPointerCapture(event.pointerId);
}

function onCanvasPointerMove(event) {
  updateCanvasRect();
  const pointerX = (event.clientX - canvasRect.left) / zoom.value;
  const pointerY = (event.clientY - canvasRect.top) / zoom.value;
  pointerPos.x = pointerX;
  pointerPos.y = pointerY;

  if (draggingNode.value) {
    const { node, offsetX, offsetY } = draggingNode.value;
    node.x = Math.max(0, Math.min(canvasRect.width / zoom.value - NODE_WIDTH, pointerX - offsetX));
    node.y = Math.max(0, Math.min(canvasRect.height / zoom.value - NODE_HEIGHT, pointerY - offsetY));
  }
}

function endPointerActions() {
  draggingNode.value = null;
}

onMounted(() => {
  updateCanvasRect();
  cargarAgentes();
  window.addEventListener('resize', updateCanvasRect);
  socket.on('agentes:changed', cargarAgentes);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasRect);
  socket.off('agentes:changed', cargarAgentes);
  socket.disconnect();
});
</script>

<style scoped>
.agentes-page {
  padding: 1rem;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
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
}

.toolbar-error {
  color: #842029;
  background: #f8d7da;
  border: 1px solid #f5c2c7;
  padding: 0.65rem 0.9rem;
  border-radius: 0.65rem;
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
}

.canvas-grid {
  position: absolute;
  inset: 0;
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
  max-width: 320px;
}

.node-card {
  position: absolute;
  width: 220px;
  min-height: 110px;
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
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #eef4ff;
  font-weight: 600;
  color: #1d3557;
}

.btn-edit {
  border: 1px solid #2c7be5;
  background: #2c7be5;
  color: white;
  padding: 0.2rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-edit:hover {
  background: #1a5dc6;
}

.btn-close {
  border: none;
  background: transparent;
  font-size: 1.1rem;
  color: #7a8ba9;
  line-height: 1;
  cursor: pointer;
}

.node-body {
  padding: 1rem;
  display: grid;
  gap: 0.75rem;
}

.handle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.85rem;
  border-radius: 0.8rem;
  background: #f4f8ff;
  border: 1px solid #e6ecff;
  color: #334e6a;
  cursor: pointer;
}

.input-handle {
  justify-content: flex-start;
}

.output-handle {
  justify-content: flex-end;
}

.handle-dot {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: #2c7be5;
  margin-left: 0.5rem;
}

.connection-line {
  fill: none;
  stroke: #2c7be5;
  stroke-width: 3;
  opacity: 0.85;
}

.connection-temp {
  stroke-dasharray: 8 6;
  opacity: 0.7;
}
</style>
