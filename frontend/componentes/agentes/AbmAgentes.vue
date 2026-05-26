<template>
  <div class="agentes-page">
    <div v-if="mensajeError" class="toolbar-error">{{ mensajeError }}</div>

    <div
      class="canvas-area"
      :class="{ 'canvas-disabled': !hasSelectedFlujo }"
      ref="canvasRef"
      @pointermove="onCanvasPointerMove"
      @pointerup="endPointerActions"
      @click.self="cancelConnection"
      @wheel.prevent="onCanvasWheel"
    >
      <div v-if="toolbar.visible" class="toolbar-overlay" :style="toolbarStyle" @pointerdown.stop="handleToolbarPointerDown($event)">
        <div class="toolbar-overlay-body">
          <select v-model.number="selectedFlujo" class="form-select flujo-selector">
            <option value="">Selecciona un flujo</option>
            <option v-for="flujo in flujos" :key="flujo.id" :value="flujo.id">{{ flujo.nombre }}</option>
          </select>
          <div class="toolbar-buttons">
            <button class="btn btn-secondary" @click="abrirGestionFlujos" type="button">Gestionar Flujos</button>
            <button class="btn" :disabled="!hasSelectedFlujo" @click="abrirNuevoAgente" type="button">+ Nuevo nodo</button>
            <button class="btn btn-secondary" @click="abrirGestionBloques" type="button">Gestionar Bloques</button>
            <button class="btn btn-secondary" :disabled="!hasSelectedFlujo" @click="abrirEjecuciones" type="button">Ejecuciones</button>
            <button class="btn btn-danger" :disabled="!isFlowRunning || isStoppingExecution" @click="detenerEjecucion" type="button">
              {{ isStoppingExecution ? 'Deteniendo...' : 'Detener ejecución' }}
            </button>
            <button class="btn" :disabled="!hasSelectedFlujo" @click="zoomOut" type="button">- Alejar</button>
            <button class="btn" :disabled="!hasSelectedFlujo" @click="zoomReset" type="button">100%</button>
            <button class="btn" :disabled="!hasSelectedFlujo" @click="zoomIn" type="button">+ Acercar</button>
          </div>
          <div class="toolbar-status">
            <input class="form-control toolbar-zoom-input" type="text" readonly :value="Math.round(zoom * 100) + '%'"></input>
          </div>
        </div>
      </div>
      <div class="canvas-content" :style="canvasTransformStyle">
        <svg class="canvas-svg" :width="canvasWidth" :height="canvasHeight">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
            <marker id="arrow-yellow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>

          <path
            v-for="conexion in conexiones"
            :key="conexion.id"
            :d="connectionPath(conexion)"
            :class="connectionClass(conexion)"
            :marker-end="connectionMarker(conexion)"
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
          {{ hasSelectedFlujo ? 'Sin nodos de flujo registrados. Usa + Nuevo nodo para crear uno.' : 'Selecciona un flujo para habilitar el canvas.' }}
        </div>

        <div
          v-for="node in nodes"
          :key="node.id"
          class="node-card"
          :class="nodeClasses(node)"
          :style="nodeStyle(node)"
          @pointerdown="startNodeDrag(node, $event)"
        >
        <div class="node-header">
          <span>{{ getNodeLabel(node) }}</span>
        </div>
        <div class="node-body">
          <div class="node-actions">
            <button class="icon-button" @pointerdown.stop @click.stop="editarAgente(node.id)" type="button" aria-label="Editar agente">
              ✏️
            </button>
            <button class="icon-button icon-danger" @pointerdown.stop @click.stop="eliminarAgente(node.id)" type="button" aria-label="Eliminar agente">
              🗑️
            </button>
            <button
              v-if="nodeHasExecutionRecord(node)"
              class="icon-button icon-view"
              @pointerdown.stop.prevent="abrirDetalleUltimaEjecucion(node)"
              @click.stop
              type="button"
              aria-label="Ver última ejecución"
            >
              👁️
            </button>
            <button
              v-if="nodeHasChatInput(node)"
              class="icon-button icon-chat"
              @pointerdown.stop.prevent="openChatWindow(node)"
              @click.stop
              type="button"
              aria-label="Abrir chat"
            >
              💬
            </button>
          </div>
          <div
            class="handle input-handle"
            :class="{ 'handle-disabled': !nodeAcceptsInput(node) }"
            @pointerdown.stop.prevent="nodeAcceptsInput(node) && finishConnection(node)"
            @click.stop
          >
            <span class="handle-dot" />
            Entrada
          </div>
          <div
            v-for="(output, outputIndex) in getNodeOutputItems(node)"
            :key="`${node.id}-output-${outputIndex}`"
            class="handle output-handle"
            :class="{ 'handle-disabled': !nodeProvidesOutput(node) }"
            @pointerdown.stop.prevent="nodeProvidesOutput(node) && startConnection(node, output, outputIndex)"
            @click.stop
          >
            <span class="handle-label">{{ output.name || 'Salida' }}</span>
            <span class="handle-dot" />
          </div>
        </div>
      </div>
      </div>
      <div
        v-if="chatWindow.visible"
        class="chat-window"
        :style="{ left: `${chatWindow.x}px`, top: `${chatWindow.y}px`, width: `${chatWindow.width}px`, height: `${chatWindow.height}px` }"
      >
        <div class="chat-window-header" @pointerdown.prevent="startChatDrag($event)">
          <span>Chat: {{ chatWindow.title }}</span>
          <button class="btn-close" type="button" aria-label="Cerrar" @pointerdown.stop @click="closeChatWindow"></button>
        </div>
        <div class="chat-window-resize-handle" @pointerdown.prevent="startChatResize($event)"></div>
        <div class="chat-window-body">
          <div class="chat-messages">
            <div v-for="(message, index) in chatMessages" :key="index" :class="['chat-message', message.role]">
              <div class="chat-message-role">{{ message.role === 'user' ? 'Tú' : 'Sistema' }}</div>
              <div class="chat-message-text">{{ message.text }}</div>
            </div>
          </div>
          <div class="chat-input-row">
            <textarea v-model="chatInput" class="form-control chat-input" placeholder="Escribe un mensaje..."></textarea>
            <button class="btn btn-primary chat-send-button" type="button" @click="sendChatMessage">Enviar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { useModal } from '../../composables/useModal.js';
import FormularioAgenteHeader from './FormularioAgenteHeader.vue';
import FormularioAgenteBody from './FormularioAgenteBody.vue';
import FormularioAgenteFooter from './FormularioAgenteFooter.vue';
import GestionBloquesHeader from './GestionBloquesHeader.vue';
import GestionBloquesEspeciales from './GestionBloquesEspeciales.vue';
import GestionFlujosHeader from './GestionFlujosHeader.vue';
import GestionFlujos from './GestionFlujos.vue';
import EjecucionesFlujo from './EjecucionesFlujo.vue';
import DetalleRegistroNodoEjecucion from './DetalleRegistroNodoEjecucion.vue';

const socket = io(import.meta.env.VITE_API_URL);
const { mostrarModal } = useModal();
const canvasRef = ref(null);
const agentes = ref([]);
const flujos = ref([]);
const selectedFlujo = ref(null);
const availableBloques = ref([]);
const mensajeError = ref('');
const nodes = ref([]);
const agentesMap = computed(() => Object.fromEntries(agentes.value.map((agente) => [agente.id, agente])));
const bloquesMap = computed(() => Object.fromEntries(availableBloques.value.map((bloque) => [bloque.id, bloque])));
const hasSelectedFlujo = computed(() => selectedFlujo.value !== null && selectedFlujo.value !== undefined && selectedFlujo.value !== '');
const conexiones = ref([]);
const lastNodeExecutionRecords = ref({});
const executionState = reactive({
  requestId: null,
  currentNodeId: null,
});
const isStoppingExecution = ref(false);
const isFlowRunning = computed(() => Boolean(executionState.requestId));
const finishedNodeIds = ref([]);
const connectionStart = ref(null);
const toolbar = reactive({
  x: 20,
  y: 20,
  visible: true,
  dragging: false,
  offsetX: 0,
  offsetY: 0,
  lastPersistedX: 20,
  lastPersistedY: 20,
});
const TOOLBAR_WIDTH = 1260;
const toolbarStyle = computed(() => ({
  left: `${toolbar.x}px`,
  top: `${toolbar.y}px`,
}));
const chatWindow = reactive({
  visible: false,
  nodeId: null,
  title: '',
  x: 80,
  y: 80,
  width: 420,
  height: 360,
  dragging: false,
  offsetX: 0,
  offsetY: 0,
  resizing: false,
  resizeStartX: 0,
  resizeStartY: 0,
  resizeStartWidth: 420,
  resizeStartHeight: 360,
});
const chatMessages = ref([]);
const currentChatRequestId = ref(null);
const currentAssistantMessageIndex = ref(null);
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
  width: `${canvasWidth.value}px`,
  height: `${canvasHeight.value}px`,
}));

const NODE_WIDTH = 220;
const NODE_HEIGHT = 110;
const HANDLE_Y = 75;

const canvasWidth = computed(() => {
  const maxNodeX = nodes.value.reduce((max, node) => Math.max(max, node.x + NODE_WIDTH + 60), 0);
  return Math.max(canvasRect.width, maxNodeX, 900);
});
const canvasHeight = computed(() => {
  const maxNodeY = nodes.value.reduce((max, node) => Math.max(max, node.y + NODE_HEIGHT + 60), 0);
  return Math.max(canvasRect.height, maxNodeY, 500);
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

function ensureConfigGeneralKey(clave, valor) {
  socket.emit('config_general:update', { clave, valor }, (resp) => {
    if (!resp.ok) {
      console.error(resp.error || `Error creando clave config_general ${clave}`);
    }
  });
}

function loadToolbarPosition() {
  socket.emit('config_general:list', null, (resp) => {
    if (!resp.ok) return;
    const values = Object.fromEntries((resp.data || []).map((item) => [item.clave, item.valor]));
    const x = Number(values.v_agentes_barra1_px);
    const y = Number(values.v_agentes_barra1_py);
    const selected = values.v_agentes_flujo_selected;

    if (Number.isFinite(x)) toolbar.x = x;
    if (Number.isFinite(y)) toolbar.y = y;
    toolbar.lastPersistedX = toolbar.x;
    toolbar.lastPersistedY = toolbar.y;

    if (selected !== undefined && selected !== null && String(selected).trim() !== '') {
      selectedFlujo.value = Number(selected);
    }
    const zoomValue = Number(values.v_agentes_zoom);
    if (Number.isFinite(zoomValue)) {
      zoom.value = Math.min(maxZoom, Math.max(minZoom, zoomValue));
    }

    if (values.v_agentes_barra1_px === undefined) {
      ensureConfigGeneralKey('v_agentes_barra1_px', String(toolbar.x));
    }
    if (values.v_agentes_barra1_py === undefined) {
      ensureConfigGeneralKey('v_agentes_barra1_py', String(toolbar.y));
    }
    if (values.v_agentes_flujo_selected === undefined) {
      ensureConfigGeneralKey('v_agentes_flujo_selected', '');
    }
    if (values.v_agentes_zoom === undefined) {
      ensureConfigGeneralKey('v_agentes_zoom', String(zoom.value));
    }
  });
}

function persistZoom() {
  socket.emit('config_general:update', { clave: 'v_agentes_zoom', valor: String(zoom.value) }, (resp) => {
    if (!resp.ok) console.error(resp.error || 'Error guardando valor de zoom');
  });
}

function clampToolbarPosition(x, y) {
  return {
    x: Math.min(Math.max(10, x), Math.max(10, window.innerWidth - TOOLBAR_WIDTH - 10)),
    y: Math.min(Math.max(10, y), Math.max(10, window.innerHeight - 10)),
  };
}

function handleToolbarPointerDown(event) {
  const interactiveElement = event.target.closest('button, input, select, textarea, option, a, label');
  if (interactiveElement) return;
  startToolbarDrag(event);
}

function startToolbarDrag(event) {
  toolbar.dragging = true;
  toolbar.offsetX = event.clientX - toolbar.x;
  toolbar.offsetY = event.clientY - toolbar.y;
  event.currentTarget.setPointerCapture(event.pointerId);
}

function persistToolbarPosition() {
  const posX = Math.round(toolbar.x);
  const posY = Math.round(toolbar.y);
  if (toolbar.lastPersistedX === posX && toolbar.lastPersistedY === posY) return;
  toolbar.lastPersistedX = posX;
  toolbar.lastPersistedY = posY;

  socket.emit('config_general:update', { clave: 'v_agentes_barra1_px', valor: String(posX) }, (resp) => {
    if (!resp.ok) console.error(resp.error || 'Error guardando posición X de la barra de agentes');
  });
  socket.emit('config_general:update', { clave: 'v_agentes_barra1_py', valor: String(posY) }, (resp) => {
    if (!resp.ok) console.error(resp.error || 'Error guardando posición Y de la barra de agentes');
  });
}

function persistSelectedFlujo() {
  const valor = selectedFlujo.value !== null && selectedFlujo.value !== undefined && selectedFlujo.value !== ''
    ? String(selectedFlujo.value)
    : '';
  socket.emit('config_general:update', { clave: 'v_agentes_flujo_selected', valor }, (resp) => {
    if (!resp.ok) console.error(resp.error || 'Error guardando flujo seleccionado');
  });
}

function resetToolbarPosition() {
  toolbar.x = 20;
  toolbar.y = 20;
  persistToolbarPosition();
}

function abrirNuevoAgente() {
  if (!hasSelectedFlujo.value) return;
  abrirFormularioAgente(null);
}

function abrirGestionFlujos() {
  mostrarModal({
    header: GestionFlujosHeader,
    body: GestionFlujos,
    bodyProps: { socket },
    fullscreen: false,
  });
}

function abrirGestionBloques() {
  mostrarModal({
    header: GestionBloquesHeader,
    body: GestionBloquesEspeciales,
    bodyProps: { socket },
    fullscreen: false,
  });
}

function syncNodesWithAgentes() {
  const existById = Object.fromEntries(nodes.value.map((node) => [node.id, node]));

  nodes.value = agentes.value.map((agente, index) => {
    const existingNode = existById[agente.id];
    const hasStoredPos = agente.pos_canvas_x !== null && agente.pos_canvas_x !== undefined && agente.pos_canvas_y !== null && agente.pos_canvas_y !== undefined;
    const storedX = hasStoredPos ? Number(agente.pos_canvas_x) : null;
    const storedY = hasStoredPos ? Number(agente.pos_canvas_y) : null;
    const defaultX = 60 + (index % 3) * 260;
    const defaultY = 60 + Math.floor(index / 3) * 180;

    if (existingNode) {
      return {
        ...existingNode,
        x: hasStoredPos ? storedX : existingNode.x,
        y: hasStoredPos ? storedY : existingNode.y,
      };
    }

    return {
      id: agente.id,
      x: hasStoredPos ? storedX : defaultX,
      y: hasStoredPos ? storedY : defaultY,
    };
  });
}

function cargarAgentes() {
  if (!hasSelectedFlujo.value) {
    agentes.value = [];
    nodes.value = [];
    conexiones.value = [];
    return;
  }

  socket.emit('agentes_nodo_flujo:list', { id_flujo: selectedFlujo.value }, (resp) => {
    if (resp.ok) {
      agentes.value = resp.data || [];
      syncNodesWithAgentes();
      mensajeError.value = '';
      cargarConexiones();
      cargarUltimosRegistrosPorNodo();
    } else {
      mensajeError.value = resp.error || 'Error cargando nodos de flujo';
    }
  });
}

function cargarConexiones() {
  if (!hasSelectedFlujo.value) {
    conexiones.value = [];
    return;
  }

  socket.emit('agentes_nodo_flujo_coneccion:list', { id_flujo: selectedFlujo.value }, (resp) => {
    if (resp.ok) {
      conexiones.value = (resp.data || []).map((connection) => ({
        ...connection,
        from: connection.id_nodo_origen,
        to: connection.id_nodo_destino,
      }));
    } else {
      conexiones.value = [];
      console.error(resp.error || 'Error cargando conexiones de flujo');
    }
  });
}

function loadBloquesEspeciales() {
  socket.emit('agentes_tipo_bloques_especiales:list', null, (resp) => {
    if (resp.ok) {
      availableBloques.value = resp.data ?? [];
    } else {
      availableBloques.value = [];
    }
  });
}

function cargarFlujos() {
  socket.emit('agentes_flujos:list', null, (resp) => {
    if (resp.ok) {
      flujos.value = resp.data ?? [];
    } else {
      flujos.value = [];
      mensajeError.value = resp.error || 'Error cargando flujos';
    }
  });
}

watch(selectedFlujo, () => {
  cargarAgentes();
  persistSelectedFlujo();
});

watch(zoom, () => {
  persistZoom();
});

function abrirFormularioAgente(agente = null) {
  const form = ref({
    id: agente?.id ?? null,
    nombre: agente?.nombre ?? '',
    id_tipo_bloque: agente?.id_tipo_bloque ?? '',
    id_agente: agente?.id_agente ?? null,
    id_flujo: agente?.id_flujo ?? selectedFlujo.value ?? null,
    config: parseConfigValue(agente?.config) || {},
  });
  const originalId = agente?.id ?? null;
  const isEditing = !!originalId;
  const mensajeErrorForm = ref('');
  const cargandoForm = ref(false);
  let cerrar = null;

  const incomingConnections = computed(() => {
    if (!originalId) return [];
    return conexiones.value
      .filter((conexion) => conexion.id_nodo_destino === originalId)
      .map((conexion) => {
        const fromNode = agentesMap.value[conexion.id_nodo_origen];
        return {
          ...conexion,
          fromNodeName: fromNode?.nombre ?? `Nodo ${conexion.id_nodo_origen}`,
          salidaLabel: String(conexion.name_salida_nodo || 'Salida'),
        };
      });
  });

  const outgoingConnections = computed(() => {
    if (!originalId) return [];
    return conexiones.value
      .filter((conexion) => conexion.id_nodo_origen === originalId)
      .map((conexion) => {
        const toNode = agentesMap.value[conexion.id_nodo_destino];
        return {
          ...conexion,
          toNodeName: toNode?.nombre ?? `Nodo ${conexion.id_nodo_destino}`,
          salidaLabel: String(conexion.name_salida_nodo || 'Salida'),
        };
      });
  });

  function guardar() {
    mensajeErrorForm.value = '';
    const nombre = String(form.value.nombre || '').trim();
    const idTipoBloque = Number(form.value.id_tipo_bloque || 0);

    if (!nombre) {
      mensajeErrorForm.value = 'El nombre es requerido';
      return;
    }
    if (!idTipoBloque) {
      mensajeErrorForm.value = 'El tipo de bloque es requerido';
      return;
    }

    const bloque = availableBloques.value.find((block) => Number(block.id) === idTipoBloque);
    if (bloque) {
      const configGeneral = parseConfigValue(bloque.config_general);
      const configOptions = configGeneral && typeof configGeneral === 'object' && Array.isArray(configGeneral.options)
        ? configGeneral.options
        : [];

      for (const option of configOptions) {
        const value = form.value.config?.[option.field];
        if (option.required === true) {
          if (option.type === 't_list_switch') {
            if (!Array.isArray(value) || value.length === 0) {
              mensajeErrorForm.value = `El campo '${option.label || option.field}' es requerido`;
              return;
            }
            const invalidCondition = value.some((item) => {
              return (
                !item ||
                typeof item !== 'object' ||
                !String(item.nombre_salida || '').trim() ||
                !String(item.condicion || '').trim()
              );
            });
            if (invalidCondition) {
              mensajeErrorForm.value = `Cada condición en '${option.label || option.field}' debe tener nombre_salida y condicion`;
              return;
            }
          } else if (value === null || value === undefined || String(value).trim() === '') {
            mensajeErrorForm.value = `El campo '${option.label || option.field}' es requerido`;
            return;
          }
        }
      }
    }

    cargandoForm.value = true;
    const payload = {
      id: originalId,
      nombre,
      id_tipo_bloque: idTipoBloque,
      id_agente: form.value.id_agente || null,
      id_flujo: Number(form.value.id_flujo || selectedFlujo.value || 0),
      config: form.value.config || {},
    };
    const accion = isEditing ? 'agentes_nodo_flujo:update' : 'agentes_nodo_flujo:create';

    socket.emit(accion, payload, (resp) => {
      cargandoForm.value = false;
      if (resp.ok) {
        if (typeof cerrar === 'function') cerrar();
        cargarAgentes();
      } else {
        mensajeErrorForm.value = resp.error || 'Error guardando nodo de flujo';
      }
    });
  }

  function eliminarConexion(connectionId) {
    socket.emit('agentes_nodo_flujo_coneccion:delete', { id: connectionId }, (resp) => {
      if (resp.ok) {
        conexiones.value = conexiones.value.filter((conexion) => conexion.id !== connectionId);
      } else {
        mensajeError.value = resp.error || 'Error eliminando conexión';
      }
    });
  }

  function abrirModal() {
    cerrar = mostrarModal({
      header: FormularioAgenteHeader,
      body: FormularioAgenteBody,
      footer: FormularioAgenteFooter,
      headerProps: { isEditing },
      bodyProps: {
        form,
        mensajeError: mensajeErrorForm,
        blocks: availableBloques.value,
        incomingConnections,
        outgoingConnections,
        onDeleteConnection: eliminarConexion,
        socket,
        isEditing,
      },
      footerProps: { cargando: cargandoForm.value, onGuardar: guardar, onCerrar: () => cerrar && cerrar() },
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

function eliminarAgente(id) {
  if (!confirm('¿Eliminar este nodo de flujo?')) return;
  socket.emit('agentes_nodo_flujo:delete', { id }, (resp) => {
    if (resp.ok) {
      cargarAgentes();
    } else {
      mensajeError.value = resp.error || 'Error eliminando nodo de flujo';
    }
  });
}

function removeNode(id) {
  nodes.value = nodes.value.filter((node) => node.id !== id);
  conexiones.value = conexiones.value.filter((con) => {
    const fromId = con.from ?? con.id_nodo_origen;
    const toId = con.to ?? con.id_nodo_destino;
    return fromId !== id && toId !== id;
  });
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
  return agentesMap.value[node.id]?.nombre || 'Nodo';
}

function getNodeOutputItems(node) {
  const agente = agentesMap.value[node.id];
  const agenteConfig = getAgentConfigObject(agente);
  if (Array.isArray(agenteConfig?.condiciones_switch)) {
    const outputs = agenteConfig.condiciones_switch.map((item, index) => {
      const name = item && typeof item === 'object' ? String(item.nombre_salida || `Salida ${index + 1}`) : `Salida ${index + 1}`;
      return { ...(item && typeof item === 'object' ? item : {}), name };
    });
    const hasDefault = outputs.some((output) => String(output.name || '').trim().toLowerCase() === 'default');
    return hasDefault ? outputs : [...outputs, { name: 'default' }];
  }

  const bloque = agente ? bloquesMap.value[agente.id_tipo_bloque] : null;
  const configSalida = bloque ? parseConfigValue(bloque.config_salida) : null;
  if (!bloque) {
    return [{ name: 'Salida' }];
  }
  if (configSalida === null) {
    return [];
  }
  if (Array.isArray(configSalida)) {
    return configSalida.map((item, index) => {
      const name = item && typeof item === 'object' ? String(item.name || `Salida ${index + 1}`) : `Salida ${index + 1}`;
      return { ...(item && typeof item === 'object' ? item : {}), name };
    });
  }
  if (typeof configSalida === 'object') {
    return [{ ...configSalida, name: String(configSalida.name || 'Salida') }];
  }
  return [{ name: String(configSalida) }];
}

function connectorPosition(node, type, outputIndex = 0) {
  const x = node.x + (type === 'output' ? NODE_WIDTH : 0);
  if (type === 'output') {
    const outputs = getNodeOutputItems(node);
    const index = Math.max(0, Math.min(outputIndex, outputs.length - 1));
    const startY = 52;
    const spacing = 22;
    const y = node.y + Math.min(startY + index * spacing, NODE_HEIGHT - 20);
    return { x, y };
  }
  const y = node.y + HANDLE_Y;
  return { x, y };
}

function parseConfigValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function getAgentConfigObject(agente) {
  const config = parseConfigValue(agente?.config);
  return config && typeof config === 'object' && !Array.isArray(config) ? config : {};
}

function applyChatWindowConfigFromNode(node) {
  const agente = agentesMap.value[node.id];
  const config = getAgentConfigObject(agente);
  const saved = config.chat_window;
  const width = Number(saved?.width);
  const height = Number(saved?.height);
  const x = Number(saved?.x);
  const y = Number(saved?.y);

  chatWindow.width = Number.isFinite(width) && width > 0 ? Math.min(Math.max(320, width), window.innerWidth - 20) : chatWindow.width;
  chatWindow.height = Number.isFinite(height) && height > 0 ? Math.min(Math.max(320, height), window.innerHeight - 20) : chatWindow.height;
  chatWindow.x = Number.isFinite(x)
    ? Math.min(Math.max(20, x), window.innerWidth - chatWindow.width - 20)
    : Math.min(Math.max(20, node.x + 20), window.innerWidth - chatWindow.width - 20);
  chatWindow.y = Number.isFinite(y)
    ? Math.min(Math.max(20, y), window.innerHeight - chatWindow.height - 20)
    : Math.min(Math.max(20, node.y + 20), window.innerHeight - chatWindow.height - 20);
}

function isChatWindowConfigEqual(saved, current) {
  if (!saved || !current) return false;
  return (
    Number(saved.x) === Number(current.x) &&
    Number(saved.y) === Number(current.y) &&
    Number(saved.width) === Number(current.width) &&
    Number(saved.height) === Number(current.height)
  );
}

function persistChatWindowConfig() {
  if (!chatWindow.visible || !chatWindow.nodeId) return;
  const agente = agentesMap.value[chatWindow.nodeId];
  if (!agente) return;

  const config = getAgentConfigObject(agente);
  const chatConfig = {
    x: Math.round(chatWindow.x),
    y: Math.round(chatWindow.y),
    width: Math.round(chatWindow.width),
    height: Math.round(chatWindow.height),
  };

  if (isChatWindowConfigEqual(config.chat_window, chatConfig)) return;

  config.chat_window = chatConfig;

  socket.emit(
    'agentes_nodo_flujo:update',
    {
      id: agente.id,
      nombre: agente.nombre,
      id_tipo_bloque: agente.id_tipo_bloque,
      id_agente: agente.id_agente || null,
      id_flujo: agente.id_flujo,
      config,
    },
    (resp) => {
      if (resp.ok && resp.data) {
        agente.config = resp.data.config;
      } else {
        console.error(resp.error || 'Error actualizando configuración del chat del nodo');
      }
    },
  );
}

function openChatWindow(node) {
  chatWindow.visible = true;
  chatWindow.nodeId = node.id;
  chatWindow.title = getNodeLabel(node);
  applyChatWindowConfigFromNode(node);
  chatMessages.value = [{ role: 'system', text: `Chat del nodo ${chatWindow.title}` }];
}

function startChatResize(event) {
  chatWindow.resizing = true;
  chatWindow.resizeStartX = event.clientX;
  chatWindow.resizeStartY = event.clientY;
  chatWindow.resizeStartWidth = chatWindow.width;
  chatWindow.resizeStartHeight = chatWindow.height;
  event.currentTarget.setPointerCapture(event.pointerId);
}

function isChatConfigItem(item) {
  return item && typeof item === 'object' && String(item.type) === 't_chat';
}

function configValueHasChatType(value) {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object') return false;
  if (Array.isArray(value)) {
    return value.some(isChatConfigItem);
  }
  return isChatConfigItem(value);
}

function nodeAcceptsInput(node) {
  const agente = agentesMap.value[node.id];
  const bloque = agente ? bloquesMap.value[agente.id_tipo_bloque] : null;
  if (!bloque) return true;
  const configEntrada = parseConfigValue(bloque.config_entrada);
  if (configEntrada === null) return false;
  if (Array.isArray(configEntrada) && configEntrada.length === 0) return false;
  if (configValueHasChatType(configEntrada)) return false;
  return true;
}

function nodeHasChatInput(node) {
  const agente = agentesMap.value[node.id];
  const bloque = agente ? bloquesMap.value[agente.id_tipo_bloque] : null;
  if (!bloque) return false;
  const configEntrada = parseConfigValue(bloque.config_entrada);
  return configValueHasChatType(configEntrada);
}

function nodeIsInitial(node) {
  const agente = agentesMap.value[node.id];
  const bloque = agente ? bloquesMap.value[agente.id_tipo_bloque] : null;
  if (!bloque) return false;
  const configGeneral = parseConfigValue(bloque.config_general);
  return configGeneral && typeof configGeneral === 'object' && configGeneral.is_nodo_inicial === true;
}

function nodeProvidesOutput(node) {
  const agente = agentesMap.value[node.id];
  const bloque = agente ? bloquesMap.value[agente.id_tipo_bloque] : null;
  if (!bloque) return true;
  return getNodeOutputItems(node).length > 0;
}

function cargarUltimosRegistrosPorNodo() {
  if (!hasSelectedFlujo.value) {
    lastNodeExecutionRecords.value = {};
    return;
  }

  socket.emit('agentes_nodo_flujo_ejecucion:last-records', { id_flujo: selectedFlujo.value }, (resp) => {
    if (!resp.ok) {
      lastNodeExecutionRecords.value = {};
      console.error(resp.error || 'Error cargando últimos registros de ejecución por nodo');
      return;
    }

    lastNodeExecutionRecords.value = (resp.data || []).reduce((map, record) => {
      if (record && record.nodo != null) {
        map[record.nodo] = record;
      }
      return map;
    }, {});
  });
}

function nodeHasExecutionRecord(node) {
  return Boolean(lastNodeExecutionRecords.value[node.id]);
}

function abrirDetalleUltimaEjecucion(node) {
  const record = lastNodeExecutionRecords.value[node.id];
  if (!record) return;

  mostrarModal({
    body: DetalleRegistroNodoEjecucion,
    bodyProps: { record, nodeLabel: getNodeLabel(node) },
    fullscreen: false,
  });
}

function abrirEjecuciones() {
  if (!hasSelectedFlujo.value) return;
  mostrarModal({
    body: EjecucionesFlujo,
    bodyProps: { socket, idFlujo: selectedFlujo.value },
    fullscreen: false,
  });
}

function startChatDrag(event) {
  chatWindow.dragging = true;
  chatWindow.offsetX = event.clientX - chatWindow.x;
  chatWindow.offsetY = event.clientY - chatWindow.y;
  event.preventDefault();
}

function onGlobalPointerMove(event) {
  if (chatWindow.dragging) {
    chatWindow.x = Math.min(Math.max(10, event.clientX - chatWindow.offsetX), window.innerWidth - chatWindow.width - 10);
    chatWindow.y = Math.min(Math.max(10, event.clientY - chatWindow.offsetY), window.innerHeight - chatWindow.height - 10);
  }

  if (toolbar.dragging) {
    const nextPos = clampToolbarPosition(event.clientX - toolbar.offsetX, event.clientY - toolbar.offsetY);
    toolbar.x = nextPos.x;
    toolbar.y = nextPos.y;
  }

  if (chatWindow.resizing) {
    const deltaX = event.clientX - chatWindow.resizeStartX;
    const deltaY = event.clientY - chatWindow.resizeStartY;
    chatWindow.width = Math.max(320, chatWindow.resizeStartWidth + deltaX);
    chatWindow.height = Math.max(320, chatWindow.resizeStartHeight + deltaY);
  }
}

function onGlobalPointerUp() {
  if (chatWindow.dragging) {
    chatWindow.dragging = false;
    persistChatWindowConfig();
  }
  if (toolbar.dragging) {
    toolbar.dragging = false;
    persistToolbarPosition();
  }
  if (chatWindow.resizing) {
    chatWindow.resizing = false;
    persistChatWindowConfig();
  }
}

function closeChatWindow() {
  chatWindow.visible = false;
}

function sendChatMessage() {
  const message = chatInput.value.trim();
  if (!message) return;
  chatMessages.value.push({ role: 'user', text: message });
  const placeholderIndex = chatMessages.value.push({ role: 'system', text: 'Procesando...' }) - 1;
  const requestId = `${Date.now()}-${Math.random()}`;
  currentChatRequestId.value = requestId;
  currentAssistantMessageIndex.value = placeholderIndex;

  const nodeId = chatWindow.nodeId;
  if (nodeId && selectedFlujo.value) {
    socket.emit('agentes_nodo_flujo_ejecucion:start', {
      id_flujo: selectedFlujo.value,
      id_nodo_inicio: nodeId,
      data_entrada: { mensaje: message },
      requestId,
    }, (resp) => {
      if (!resp.ok) {
        chatMessages.value[placeholderIndex].text = resp.error || 'Error iniciando ejecución de flujo';
        mensajeError.value = resp.error || 'Error iniciando ejecución de flujo';
        currentChatRequestId.value = null;
        currentAssistantMessageIndex.value = null;
        return;
      }

      const resultados = resp.data?.resultados;
      if (Array.isArray(resultados) && resultados.length > 0) {
        const finalOutput = resultados[0]?.dataSalida || resultados[0];
        const finalText = typeof finalOutput === 'string'
          ? finalOutput
          : finalOutput?.chatText || finalOutput?.respuesta || finalOutput?.text || finalOutput?.output || JSON.stringify(finalOutput, null, 2);
        chatMessages.value[placeholderIndex].text = finalText;
      } else {
        chatMessages.value[placeholderIndex].text = 'Ejecución completada, pero no se obtuvo una salida final.';
      }

      currentChatRequestId.value = null;
      currentAssistantMessageIndex.value = null;
    });
  } else {
    chatMessages.value[placeholderIndex].text = 'No se pudo iniciar el flujo porque no hay nodo de chat o flujo seleccionado.';
    currentChatRequestId.value = null;
    currentAssistantMessageIndex.value = null;
  }

  chatInput.value = '';
}

const chatInput = ref('');

function handleFlowPartial(data) {
  if (!data || data.requestId !== currentChatRequestId.value) return;
  const index = currentAssistantMessageIndex.value;
  if (index == null || index < 0 || index >= chatMessages.value.length) return;
  const message = chatMessages.value[index];
  if (!message) return;
  message.text = String(data.text ?? message.text);
}

function resetExecutionState() {
  executionState.requestId = null;
  executionState.currentNodeId = null;
  finishedNodeIds.value = [];
}

function detenerEjecucion() {
  if (!executionState.requestId) return;
  isStoppingExecution.value = true;
  const requestId = executionState.requestId;

  socket.emit('agentes_nodo_flujo_ejecucion:stop', { requestId }, (resp) => {
    if (!resp?.ok) {
      mensajeError.value = resp?.error || 'Error al detener la ejecución del flujo';
    }
    socket.emit('ollama:stop', { requestId }, () => {});
    if (currentChatRequestId.value === requestId) {
      currentChatRequestId.value = null;
      currentAssistantMessageIndex.value = null;
    }
    resetExecutionState();
    isStoppingExecution.value = false;
  });
}

function handleNodeExecutionStarted(data) {
  if (!data || Number(data.id_flujo) !== Number(selectedFlujo.value)) return;
  if (data.requestId && data.requestId !== executionState.requestId) {
    // nueva ejecución — limpiar estado pero no borrar nodos terminados
    executionState.requestId = data.requestId;
    executionState.currentNodeId = null;
    finishedNodeIds.value = [];
  }
  executionState.currentNodeId = Number(data.nodeId);
}

function handleNodeExecutionFinished(data) {
  if (!data || Number(data.id_flujo) !== Number(selectedFlujo.value)) return;
  if (data.requestId && executionState.requestId && data.requestId !== executionState.requestId) return;
  const nodeId = Number(data.nodeId);
  if (!finishedNodeIds.value.includes(nodeId)) {
    finishedNodeIds.value = [...finishedNodeIds.value, nodeId];
  }
  if (executionState.currentNodeId === nodeId) {
    executionState.currentNodeId = null;
  }
}

watch(selectedFlujo, () => {
  resetExecutionState();
});


function connectionClass(conexion) {
  const sourceId = Number(conexion.id_nodo_origen);
  const targetId = Number(conexion.id_nodo_destino);
  if (sourceId === executionState.currentNodeId) {
    return 'connection-line connection-line--executing';
  }
  if (finishedNodeIds.value.includes(sourceId) || finishedNodeIds.value.includes(targetId)) {
    return 'connection-line connection-line--finished';
  }
  return 'connection-line';
}

function connectionMarker(conexion) {
  const sourceId = Number(conexion.id_nodo_origen);
  const targetId = Number(conexion.id_nodo_destino);
  if (sourceId === executionState.currentNodeId) {
    return 'url(#arrow-green)';
  }
  if (finishedNodeIds.value.includes(sourceId) || finishedNodeIds.value.includes(targetId)) {
    return 'url(#arrow-yellow)';
  }
  return 'url(#arrow)';
}

function nodeClasses(node) {
  const id = Number(node.id);
  return {
    'node-card--initial': nodeIsInitial(node),
    'node-card--executing': id === executionState.currentNodeId,
    'node-card--finished': finishedNodeIds.value.includes(id),
  };
}

function startConnection(node, output, outputIndex) {
  if (!nodeProvidesOutput(node)) return;
  const outputLabel = output?.name ? String(output.name) : getNodeLabel(node);
  connectionStart.value = {
    fromId: node.id,
    fromLabel: outputLabel,
    name_salida_nodo: outputLabel,
    start: connectorPosition(node, 'output', outputIndex),
  };
}

function finishConnection(node) {
  if (!connectionStart.value) return;
  if (node.id === connectionStart.value.fromId) return;
  if (!nodeAcceptsInput(node)) return;
  const exists = conexiones.value.some(
    (con) => con.id_nodo_origen === connectionStart.value.fromId && con.id_nodo_destino === node.id && con.name_salida_nodo === connectionStart.value.name_salida_nodo,
  );
  if (!exists) {
    const payload = {
      id_nodo_origen: connectionStart.value.fromId,
      id_nodo_destino: node.id,
      id_flujo: selectedFlujo.value,
      name_salida_nodo: connectionStart.value.name_salida_nodo,
    };
    socket.emit('agentes_nodo_flujo_coneccion:create', payload, (resp) => {
      if (resp.ok && resp.data) {
        conexiones.value.push({
          ...resp.data,
          from: resp.data.id_nodo_origen,
          to: resp.data.id_nodo_destino,
        });
      } else {
        mensajeError.value = resp.error || 'Error creando conexión';
      }
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

function getConnectionOutputIndex(connection) {
  const node = nodes.value.find((n) => n.id === connection.from);
  if (!node) return 0;
  const outputs = getNodeOutputItems(node);
  const targetName = String(connection.name_salida_nodo || '').trim();
  const index = outputs.findIndex((output) => String(output.name || '').trim() === targetName);
  return index >= 0 ? index : 0;
}

function connectionPath(connection) {
  const fromNode = nodes.value.find((n) => n.id === connection.from);
  const from = connectorPosition(fromNode, 'output', getConnectionOutputIndex(connection));
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
  if (event.target.closest('.handle') || event.target.closest('.btn-close') || event.target.closest('button')) return;
  const scrollLeft = canvasRef.value?.scrollLeft || 0;
  const scrollTop = canvasRef.value?.scrollTop || 0;
  const pointerX = (event.clientX - canvasRect.left + scrollLeft) / zoom.value;
  const pointerY = (event.clientY - canvasRect.top + scrollTop) / zoom.value;
  const offsetX = pointerX - node.x;
  const offsetY = pointerY - node.y;
  draggingNode.value = { node, offsetX, offsetY, pointerId: event.pointerId };
  event.currentTarget.setPointerCapture(event.pointerId);
}

function onCanvasPointerMove(event) {
  updateCanvasRect();
  const scrollLeft = canvasRef.value?.scrollLeft || 0;
  const scrollTop = canvasRef.value?.scrollTop || 0;
  const pointerX = (event.clientX - canvasRect.left + scrollLeft) / zoom.value;
  const pointerY = (event.clientY - canvasRect.top + scrollTop) / zoom.value;
  pointerPos.x = pointerX;
  pointerPos.y = pointerY;

  if (draggingNode.value) {
    const { node, offsetX, offsetY } = draggingNode.value;
    node.x = Math.max(0, Math.min(canvasWidth.value - NODE_WIDTH, pointerX - offsetX));
    node.y = Math.max(0, Math.min(canvasHeight.value - NODE_HEIGHT, pointerY - offsetY));
  }
}

async function persistNodePosition(node) {
  const agente = agentesMap.value[node.id];
  if (!agente) return;

  const pos_canvas_x = Math.round(node.x);
  const pos_canvas_y = Math.round(node.y);
  if (agente.pos_canvas_x === pos_canvas_x && agente.pos_canvas_y === pos_canvas_y) return;

  socket.emit('agentes_nodo_flujo:update-position', { id: node.id, pos_canvas_x, pos_canvas_y }, (resp) => {
    if (resp.ok && resp.data) {
      agente.pos_canvas_x = pos_canvas_x;
      agente.pos_canvas_y = pos_canvas_y;
    } else {
      console.error(resp.error || 'Error actualizando la posición del nodo de flujo');
    }
  });
}

async function endPointerActions() {
  if (draggingNode.value) {
    const node = draggingNode.value.node;
    await persistNodePosition(node);
  }
  draggingNode.value = null;
}

onMounted(() => {
  updateCanvasRect();
  loadToolbarPosition();
  cargarAgentes();
  cargarFlujos();
  loadBloquesEspeciales();
  window.addEventListener('resize', updateCanvasRect);
  socket.on('agentes_nodo_flujo:changed', cargarAgentes);
  socket.on('agentes_nodo_flujo_coneccion:changed', cargarConexiones);
  socket.on('agentes_tipo_bloques_especiales:changed', loadBloquesEspeciales);
  socket.on('agentes_flujos:changed', cargarFlujos);
  socket.on('agentes_nodo_flujo_ejecucion:partial', handleFlowPartial);
  socket.on('agentes_nodo_flujo_ejecucion:node_started', handleNodeExecutionStarted);
  socket.on('agentes_nodo_flujo_ejecucion:node_finished', handleNodeExecutionFinished);
  window.addEventListener('pointermove', onGlobalPointerMove);
  window.addEventListener('pointerup', onGlobalPointerUp);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasRect);
  window.removeEventListener('pointermove', onGlobalPointerMove);
  window.removeEventListener('pointerup', onGlobalPointerUp);
  socket.off('agentes_nodo_flujo:changed', cargarAgentes);
  socket.off('agentes_nodo_flujo_coneccion:changed', cargarConexiones);
  socket.off('agentes_tipo_bloques_especiales:changed', loadBloquesEspeciales);
  socket.off('agentes_flujos:changed', cargarFlujos);
  socket.off('agentes_nodo_flujo_ejecucion:partial', handleFlowPartial);
  socket.off('agentes_nodo_flujo_ejecucion:node_started', handleNodeExecutionStarted);
  socket.off('agentes_nodo_flujo_ejecucion:node_finished', handleNodeExecutionFinished);
  socket.disconnect();
});
</script>

<style scoped>
.agentes-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: calc(100vh - 72px);
  padding: 1rem;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.toolbar-overlay {
  position: fixed;
  z-index: 1100;
  width: min(1260px, calc(100vw - 24px));
  max-width: 100%;
  border: 1px solid #cfe2ff;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 1rem 2rem rgba(10, 37, 82, 0.14);
  backdrop-filter: blur(10px);
  pointer-events: auto;
}

.btn-danger {
  border-color: #dc3545;
  background: #dc3545;
  color: #fff;
}

.btn-danger:hover {
  background: #b02a37;
}

.toolbar-overlay-header:active {
  cursor: grabbing;
}

.toolbar-overlay-body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
}

.toolbar-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.toolbar-status {
  display: flex;
  align-items: center;
}

.toolbar-zoom-input {
  width: 5.5rem;
  min-width: 5.5rem;
  padding: 0.45rem 0.65rem;
  border-radius: 0.6rem;
  border: 1px solid #ced4da;
  background: #f8f9fa;
  color: #212529;
}

.toolbar-buttons .btn {
  flex: 0 0 auto;
  width: auto;
}

.flujo-selector {
  min-width: 220px;
  max-width: 300px;
  border: 1px solid #ced4da;
  border-radius: 0.6rem;
  padding: 0.45rem 0.65rem;
}

.canvas-disabled {
  opacity: 0.65;
  pointer-events: none;
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
  flex: 1;
  min-height: 0;
  border: 1px solid #d8e2ef;
  border-radius: 1rem;
  overflow: auto;
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

.node-card.node-card--executing {
  border: 2px solid #28a745;
  box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.22);
}

.node-card.node-card--finished {
  border: 2px solid #f2c94c;
  box-shadow: 0 0 0 4px rgba(242, 201, 76, 0.22);
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

.icon-button {
  border: 1px solid #cfe2ff;
  background: #ffffff;
  color: #1d3557;
  width: 2.2rem;
  height: 2.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.7rem;
  font-size: 1.05rem;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.icon-button:hover {
  background: #e7f1ff;
  border-color: #2c7be5;
}

.icon-danger {
  border-color: #f8d7da;
  color: #b02a5a;
}

.icon-danger:hover {
  background: #f8d7da;
}

.node-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.btn-close {
  border: none;
  background: transparent;
  font-size: 1.1rem;
  color: #7a8ba9;
  line-height: 1;
  cursor: pointer;
  min-width: 1.5rem;
  min-height: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-close::before {
  content: '×';
  font-size: 1.2rem;
  line-height: 1;
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

.handle-disabled {
  cursor: not-allowed;
  opacity: 0.45;
  background: #f0f0f0;
  color: #7a8ba9;
}

.node-card--initial {
  background: #e7f5ff;
  border-color: #8aceff;
}

.node-card--initial .node-header {
  background: #d7efff;
}

.icon-chat {
  border-color: #cfe2ff;
  color: #0d6efd;
}

.icon-chat:hover {
  background: #e7f1ff;
}

.chat-window {
  position: fixed;
  z-index: 1100;
  background: #fff;
  border: 1px solid #d6e4ff;
  border-radius: 1rem;
  box-shadow: 0 1rem 2rem rgba(10, 37, 82, 0.15);
  overflow: hidden;
  min-width: 320px;
  min-height: 320px;
  max-width: calc(100vw - 20px);
  max-height: calc(100vh - 20px);
}

.chat-window-resize-handle {
  position: absolute;
  width: 18px;
  height: 18px;
  right: 8px;
  bottom: 8px;
  cursor: se-resize;
  background: rgba(44, 123, 229, 0.22);
  border-radius: 0.35rem;
  z-index: 1101;
}

.chat-window-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: #eef4ff;
  border-bottom: 1px solid #d6e4ff;
  cursor: move;
  user-select: none;
}

.chat-window-body {
  display: flex;
  flex-direction: column;
  height: calc(100% - 3.25rem);
  padding: 0.75rem 1rem 1rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding-right: 0.25rem;
  margin-bottom: 0.75rem;
}

.chat-message {
  margin-bottom: 0.75rem;
  padding: 0.7rem 0.9rem;
  border-radius: 0.85rem;
  background: #f8f9ff;
}

.chat-message.user {
  background: #cfe2ff;
  align-self: flex-end;
}

.chat-message-role {
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.35rem;
}

.chat-message-text {
  white-space: pre-wrap;
}

.chat-input-row {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.chat-input {
  flex: 1;
  resize: none;
  min-height: 4rem;
}

.chat-send-button {
  flex-shrink: 0;
  align-self: flex-end;
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
  color: #2c7be5;
}

.connection-line--executing {
  stroke: #28a745;
  stroke-width: 4;
  opacity: 1;
  color: #28a745;
}

.connection-line--finished {
  stroke: #f2c94c;
  stroke-width: 4;
  opacity: 1;
  color: #f2c94c;
}

.connection-temp {
  stroke-dasharray: 8 6;
  opacity: 0.7;
}
</style>
