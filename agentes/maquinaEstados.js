const Agente = require('./agentesMin.js');
const db = require('../backend/src/db');
const DEBUG_FLOW_LOGS = String(process.env.DEBUG || '').trim().toLowerCase() === 'true';

function normalizeJsonValue(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  try {
    return JSON.stringify(value);
  } catch (error) {
    return null;
  }
}

function parseNodeConfig(config) {
  if (config == null) {
    return {};
  }
  if (typeof config === 'object' && !Array.isArray(config)) {
    return config;
  }
  if (typeof config === 'string') {
    try {
      return JSON.parse(config);
    } catch {
      return {};
    }
  }
  return {};
}

function formatDateTime(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createEjecucion(id_flujo) {
  const fecha_hora_inicio = formatDateTime(new Date());
  const [id] = await db('ejecucion_flujo').insert({ id_flujo, fecha_hora_inicio, fecha_hora_fin: null });
  return { id, id_flujo, fecha_hora_inicio, fecha_hora_fin: null };
}

async function finishEjecucion(id) {
  const fecha_hora_fin = formatDateTime(new Date());
  await db('ejecucion_flujo').where({ id }).update({ fecha_hora_fin });
  return fecha_hora_fin;
}

async function insertRegistro({ id_flujo, id_ejecucion, node, dataEntrada, dataSalida, fechaInicio, fechaFin }) {
  const nodoId = Number(node?.id ?? node) || null;
  return db('registro_ejecucion_flujo').insert({
    id_flujo,
    id_ejecucion,
    nodo: nodoId,
    fecha_hora_ini: formatDateTime(fechaInicio),
    fecha_hora_fin: formatDateTime(fechaFin),
    data_entrada: normalizeJsonValue(dataEntrada),
    data_salida: normalizeJsonValue(dataSalida),
  });
}

async function loadFlowNodesAndConnections(id_flujo) {
  const nodos = await db('agentes_nodo_flujo as n')
    .leftJoin('agentes_tipo_bloques_especiales as t', 'n.id_tipo_bloque', 't.id')
    .where({ 'n.id_flujo': id_flujo })
    .select('n.*', 't.nombre as tipo_bloque_nombre');
  const conexiones = await db('agentes_nodo_flujo_coneccion').where({ id_flujo }).select('*');
  return { nodos, conexiones };
}

function buildNodeMap(nodos) {
  return Object.fromEntries(nodos.map((nodo) => [nodo.id, nodo]));
}

function buildConnectionMap(conexiones) {
  return conexiones.reduce((acc, conexion) => {
    const origin = Number(conexion.id_nodo_origen);
    if (!acc[origin]) acc[origin] = [];
    acc[origin].push(conexion);
    return acc;
  }, {});
}

function getValueFromPath(source, path) {
  if (source == null || typeof path !== 'string' || !path.trim()) return null;
  return String(path)
    .split('.')
    .filter((segment) => segment !== '')
    .reduce((current, segment) => {
      if (current == null || typeof current !== 'object') return null;
      if (Array.isArray(current)) {
        return /^\\d+$/.test(segment) ? current[Number(segment)] : null;
      }
      return Object.prototype.hasOwnProperty.call(current, segment) ? current[segment] : null;
    }, source);
}

function parseComparisonValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;
  if (/^[+-]?\d+(?:\.\d+)?$/.test(trimmed)) {
    const numberValue = Number(trimmed);
    return Number.isFinite(numberValue) ? numberValue : trimmed;
  }
  return trimmed;
}

function compareValues(left, right, operator = '==') {
  const a = parseComparisonValue(left);
  const b = parseComparisonValue(right);
  switch (String(operator || '').trim()) {
    case '!=':
    case '<>':
    case '!==':
      return a !== b;
    case '>=':
      return a >= b;
    case '<=':
      return a <= b;
    case '>':
      return a > b;
    case '<':
      return a < b;
    case '==':
    case '=':
    case '===':
    default:
      return a === b;
  }
}

async function executeNode(node, dataEntrada, id_ejecucion, options = {}) {
  const { socket = null, requestId = null } = options;
  const fechaInicio = new Date();
  const config = parseNodeConfig(node.config);
  const tipoBloque = String(node.tipo_bloque_nombre || '').trim().toUpperCase();
  const nombreNodo = String(node.nombre || '').trim().toUpperCase();
  const isChatOut = tipoBloque === 'CHAT_OUT' || nombreNodo === 'CHAT_OUT';
  const isAgenteIa = tipoBloque === 'AGENTE_IA' || nombreNodo === 'AGENTE_IA';
  const isFormatJson = tipoBloque === 'FORMAT_JSON' || nombreNodo === 'FORMAT_JSON';
  const isEdit = tipoBloque === 'EDIT' || nombreNodo === 'EDIT';

  const entradaTexto = (() => {
    if (dataEntrada == null) return '';
    if (typeof dataEntrada === 'string') return dataEntrada;
    if (typeof dataEntrada === 'object') {
      if (typeof dataEntrada.respuesta === 'string' && dataEntrada.respuesta.trim()) {
        return dataEntrada.respuesta;
      }
      if (typeof dataEntrada.input === 'string' && dataEntrada.input.trim()) {
        return dataEntrada.input;
      }
      if (dataEntrada.input && typeof dataEntrada.input === 'object') {
        if (typeof dataEntrada.input.mensaje === 'string' && dataEntrada.input.mensaje.trim()) {
          return dataEntrada.input.mensaje;
        }
        try {
          return JSON.stringify(dataEntrada.input, null, 2);
        } catch {
          // fall through to stringify full object
        }
      }
      if (typeof dataEntrada.mensaje === 'string' && dataEntrada.mensaje.trim()) {
        return dataEntrada.mensaje;
      }
      try {
        return JSON.stringify(dataEntrada, null, 2);
      } catch {
        return String(dataEntrada);
      }
    }
    return String(dataEntrada);
  })();

  if (isChatOut) {
    const dataSalida = {
      nodo: { id: node.id, nombre: node.nombre },
      chatText: entradaTexto,
      input: dataEntrada,
      ejecutado_en: formatDateTime(new Date()),
    };

    return { dataSalida, fechaInicio, fechaFin: new Date() };
  }

  if (isFormatJson) {
    let parsed = null;
    if (typeof dataEntrada === 'string') {
      try {
        parsed = JSON.parse(dataEntrada);
      } catch (error) {
        parsed = null;
      }
    } else if (dataEntrada !== null && dataEntrada !== undefined && typeof dataEntrada === 'object') {
      parsed = dataEntrada;
    }

    const dataSalida = (parsed !== null && typeof parsed === 'object') ? parsed : null;
    return { dataSalida, fechaInicio, fechaFin: new Date() };
  }

  if (isEdit) {
    const keyArray = String(config?.key_array || '').trim();
    const originalInput = dataEntrada;
    let dataSalida = null;

    const cloneInput = (value) => {
      if (value === null || value === undefined) return value;
      try {
        return JSON.parse(JSON.stringify(value));
      } catch {
        return value;
      }
    };

    if (keyArray && originalInput && typeof originalInput === 'object' && !Array.isArray(originalInput)) {
      const arrayValue = originalInput[keyArray];
      if (Array.isArray(arrayValue)) {
        dataSalida = arrayValue.map((element) => ({ input: cloneInput(originalInput), element }));
      } else if (arrayValue !== null && arrayValue !== undefined) {
        dataSalida = [{ input: cloneInput(originalInput), element: arrayValue }];
      } else {
        dataSalida = [];
      }
    } else {
      dataSalida = [];
    }

    return { dataSalida, fechaInicio, fechaFin: new Date() };
  }

  if (isAgenteIa) {
    const model = String(config?.t_select_llm || config?.llm_model || config?.model || '').trim();
    const systemPrompt = String(config?.system_promt || config?.system_prompt || '').trim();
    const agenteId = node.id_agente != null ? String(node.id_agente).trim() : '';
    const retornoParcial = config?.retorno_parcial === true || String(config?.retorno_parcial || '').trim().toLowerCase() === 'true';
    const shouldEmitPartial = retornoParcial && socket && requestId;

    if (!model) {
      throw new Error(`Nodo AGENTE_IA ${node.id} no tiene modelo configurado en t_select_llm, llm_model o model`);
    }

    const agente = new Agente(model).setPromptSistema(systemPrompt).setEntrada(entradaTexto);
    if (agenteId) {
      agente.setSessionContext({ id_agente: agenteId, originado_por: 'AUTOMATICO' }).setSessionId(id_ejecucion);
      if (entradaTexto) {
        await agente.logMessage({ origen: 'HUMANO', mensaje: entradaTexto });
      }
    }

    const partialCallback = shouldEmitPartial ? {
      onPartial: (_chunk, resultado, kind) => {
        const partialText = `${resultado.thinking || ''}${resultado.respuesta || ''}`.trim();
        socket.emit('agentes_nodo_flujo_ejecucion:partial', {
          requestId,
          nodeId: node.id,
          type: kind === 'thinking' ? 'reasoning' : 'response',
          text: partialText,
          done: Boolean(resultado.completo),
        });
      },
    } : undefined;

    const resultadoAgente = await agente.ejecutar(partialCallback);

    if (agenteId) {
      await agente.logMessage({ origen: 'AUTOMATICO', mensaje: resultadoAgente.respuesta || '' });
    }

    const dataSalida = String(resultadoAgente.respuesta ?? '');

    return { dataSalida, fechaInicio, fechaFin: new Date() };
  }

  const isIf = tipoBloque === 'IF' || nombreNodo === 'IF';
  if (isIf) {
    const campoEntrada = String(config?.campo_entrada || '').trim();
    const operador = String(config?.operador || '==').trim();
    const compararCon = config?.comparar_con;
    const valorEntrada = getValueFromPath(dataEntrada, campoEntrada);
    const resultadoComparacion = compareValues(valorEntrada, compararCon, operador);
    const dataSalida = dataEntrada;

    return { dataSalida, fechaInicio, fechaFin: new Date(), ifResult: resultadoComparacion };
  }

  await sleep(1000);

  const dataSalida = {
    nodo: { id: node.id, nombre: node.nombre },
    input: dataEntrada,
    ejecutado_en: formatDateTime(new Date()),
  };

  return { dataSalida, fechaInicio, fechaFin: new Date() };
}

async function executePath({ id_flujo, id_ejecucion, nodeId, dataEntrada, nodesById, connectionsByOrigin, visited = [], socket = null, requestId = null }) {
  if (visited.includes(nodeId)) {
    return [];
  }

  const node = nodesById[nodeId];
  if (!node) {
    return [];
  }

  if (socket) {
    socket.emit('agentes_nodo_flujo_ejecucion:node_started', {
      requestId,
      id_flujo,
      id_ejecucion,
      nodeId: node.id,
      nodeName: node.nombre,
    });
  }

  const { dataSalida, fechaInicio, fechaFin, ifResult } = await executeNode(node, dataEntrada, id_ejecucion, { socket, requestId });

  if (DEBUG_FLOW_LOGS) {
    console.log('[EJECUCION_FLUJO] Nodo:', {
      id: node.id,
      nombre: node.nombre,
      tipo: node.tipo_bloque_nombre || node.tipo_bloque || null,
      dataEntrada,
      dataSalida,
    });
  }

  await insertRegistro({
    id_flujo,
    id_ejecucion,
    node,
    dataEntrada,
    dataSalida,
    fechaInicio,
    fechaFin,
  });

  if (socket) {
    socket.emit('agentes_nodo_flujo_ejecucion:node_finished', {
      requestId,
      id_flujo,
      id_ejecucion,
      nodeId: node.id,
      nodeName: node.nombre,
      ifResult,
    });
  }

  let nextConnections = connectionsByOrigin[nodeId] || [];
  const isIfNode = String(node.tipo_bloque_nombre || '').trim().toUpperCase() === 'IF' || String(node.nombre || '').trim().toUpperCase() === 'IF';
  if (isIfNode) {
    const resultadoComparacion = Boolean(ifResult);
    const outputName = resultadoComparacion ? 'true' : 'false';
    const filteredConnections = nextConnections.filter((conexion) => String(conexion.name_salida_nodo || '').trim().toLowerCase() === outputName);
    if (filteredConnections.length) {
      nextConnections = filteredConnections;
    }
  }

  if (!nextConnections.length) {
    return [{ nodo: node.id, dataSalida }];
  }

  const nextVisited = [...visited, nodeId];
  const nextDataEntrada = isIfNode ? dataEntrada : dataSalida;
  const results = [];
  for (const conexion of nextConnections) {
    const childResults = await executePath({
      id_flujo,
      id_ejecucion,
      nodeId: Number(conexion.id_nodo_destino),
      dataEntrada: nextDataEntrada,
      nodesById,
      connectionsByOrigin,
      visited: nextVisited,
      socket,
      requestId,
    });
    if (Array.isArray(childResults)) {
      results.push(...childResults);
    }
  }

  return results.length ? results : [{ nodo: node.id, dataSalida }];
}

async function runFlow({ id_flujo, id_nodo_inicio, data_entrada = null, socket = null, requestId = null }) {
  const ejecucion = await createEjecucion(id_flujo);
  const { nodos, conexiones } = await loadFlowNodesAndConnections(id_flujo);
  const nodesById = buildNodeMap(nodos);
  const connectionsByOrigin = buildConnectionMap(conexiones);

  if (!nodesById[id_nodo_inicio]) {
    throw new Error(`Nodo de inicio ${id_nodo_inicio} no encontrado en flujo ${id_flujo}`);
  }

  const resultados = await executePath({
    id_flujo,
    id_ejecucion: ejecucion.id,
    nodeId: id_nodo_inicio,
    dataEntrada: data_entrada,
    nodesById,
    connectionsByOrigin,
    visited: [],
    socket,
    requestId,
  });

  const fecha_hora_fin = await finishEjecucion(ejecucion.id);
  return { ...ejecucion, fecha_hora_fin, resultados };
}

module.exports = {
  runFlow,
};
