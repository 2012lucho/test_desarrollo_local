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

const activeFlowControllers = new Map();

function createAbortError() {
  const error = new Error('Flow execution aborted');
  error.name = 'AbortError';
  return error;
}

function cancelFlowExecution(requestId) {
  if (!requestId) return false;
  const controller = activeFlowControllers.get(requestId);
  if (!controller) return false;
  controller.abort();
  activeFlowControllers.delete(requestId);
  return true;
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

function resolveMustache(expr, data) {
  if (typeof expr !== 'string') return expr;
  return expr.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const resolved = getValueFromPath(data, path.trim());
    return resolved !== null && resolved !== undefined ? String(resolved) : match;
  });
}

function stripQuotes(str) {
  const s = str.trim();
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1);
  }
  return s;
}

function evaluateCondition(condition, dataEntrada) {
  const resolved = resolveMustache(condition, dataEntrada);
  const match = resolved.match(/^\s*(.+?)\s*(==|!=|<>|!==|>=|<=|>|<|=|===)\s*(.+?)\s*$/);
  if (!match) return false;
  const left = stripQuotes(match[1]);
  const operator = match[2];
  const right = stripQuotes(match[3]);
  return compareValues(left, right, operator);
}

async function executeNode(node, dataEntrada, id_ejecucion, options = {}) {
  const { socket = null, requestId = null, signal = null } = options;
  if (signal?.aborted) throw createAbortError();
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
      let cleaned = dataEntrada.trim();
      const codeBlockRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/;
      const match = cleaned.match(codeBlockRegex);
      if (match) {
        cleaned = match[1].trim();
      }
      try {
        parsed = JSON.parse(cleaned);
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

    const resultadoAgente = await agente.ejecutar({
      ...partialCallback,
      signal,
    });

    if (agenteId) {
      await agente.logMessage({ origen: 'AUTOMATICO', mensaje: resultadoAgente.respuesta || '' });
    }

    if (signal?.aborted) throw createAbortError();

    const dataSalida = String(resultadoAgente.respuesta ?? '');

    return { dataSalida, fechaInicio, fechaFin: new Date() };
  }

  if (signal?.aborted) throw createAbortError();

  const isSwitch = tipoBloque === 'SWITCH' || nombreNodo === 'SWITCH';
  if (isSwitch) {
    const condiciones = Array.isArray(config?.condiciones_switch) ? config.condiciones_switch : [];
    let outputName = 'default';
    for (const cond of condiciones) {
      const condText = String(cond.condicion || '').trim();
      if (!condText) continue;
      if (evaluateCondition(condText, dataEntrada)) {
        outputName = String(cond.nombre_salida || 'default').trim();
        break;
      }
    }
    return { dataSalida: dataEntrada, fechaInicio, fechaFin: new Date(), ifResult: outputName };
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

async function executePath({ id_flujo, id_ejecucion, nodeId, dataEntrada, nodesById, connectionsByOrigin, visited = [], socket = null, requestId = null, signal = null, loopStates = new Map(), entradaName = null }) {
  if (signal?.aborted) throw createAbortError();

  const node = nodesById[nodeId];
  if (!node) {
    return [];
  }

  const isLoop = String(node.tipo_bloque_nombre || '').trim().toUpperCase() === 'LOOP' || String(node.nombre || '').trim().toUpperCase() === 'LOOP';

  // LOOP nodes must be re-entered via fin_iteracion, skip visited check
  if (!isLoop && visited.includes(nodeId)) {
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

  // --- LOOP special handling ---
  if (isLoop) {
    return await executeLoopPath({
      id_flujo, id_ejecucion, node, dataEntrada, nodesById, connectionsByOrigin,
      visited, socket, requestId, signal, loopStates, entradaName,
    });
  }
  // --- End LOOP ---

  const { dataSalida, fechaInicio, fechaFin, ifResult } = await executeNode(node, dataEntrada, id_ejecucion, { socket, requestId, signal });

  if (signal?.aborted) throw createAbortError();

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

  const isSwitchNode = String(node.tipo_bloque_nombre || '').trim().toUpperCase() === 'SWITCH' || String(node.nombre || '').trim().toUpperCase() === 'SWITCH';
  if (isSwitchNode) {
    const outputName = String(ifResult || 'default').trim().toLowerCase();
    const filteredConnections = nextConnections.filter((conexion) => String(conexion.name_salida_nodo || '').trim().toLowerCase() === outputName);
    if (filteredConnections.length) {
      nextConnections = filteredConnections;
    }
  }

  if (!nextConnections.length) {
    return [{ nodo: node.id, dataSalida }];
  }

  const nextVisited = [...visited, nodeId];
  const nextDataEntrada = isIfNode || isSwitchNode ? dataEntrada : dataSalida;
  const results = [];
  for (const conexion of nextConnections) {
    if (socket) {
      socket.emit('agentes_nodo_flujo_ejecucion:connection_taken', {
        requestId,
        id_flujo,
        id_ejecucion,
        connectionId: conexion.id,
        fromNodeId: node.id,
        toNodeId: Number(conexion.id_nodo_destino),
      });
    }

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
      signal,
      loopStates,
      entradaName: conexion.name_entrada_nodo || null,
    });
    if (Array.isArray(childResults)) {
      results.push(...childResults);
    }
  }

  return results.length ? results : [{ nodo: node.id, dataSalida }];
}

async function executeLoopPath({ id_flujo, id_ejecucion, node, dataEntrada, nodesById, connectionsByOrigin, visited, socket, requestId, signal, loopStates, entradaName }) {
  if (signal?.aborted) throw createAbortError();

  const emitNodeEvent = (eventName, extra = {}) => {
    if (socket) {
      socket.emit(eventName, {
        requestId,
        id_flujo,
        id_ejecucion,
        nodeId: node.id,
        nodeName: node.nombre,
        ...extra,
      });
    }
  };

  const emitNodeErrorAndThrow = (errorMsg) => {
    if (socket) {
      socket.emit('agentes_nodo_flujo_ejecucion:node_error', {
        requestId,
        id_flujo,
        id_ejecucion,
        nodeId: node.id,
        nodeName: node.nombre,
        error: errorMsg,
      });
    }
    throw new Error(`LOOP node ${node.id}: ${errorMsg}`);
  };

  let outputName = '';
  let outputData = null;
  const state = loopStates.get(node.id) || null;

  if (entradaName === 'entrada' || !entradaName) {
    // Initial call with array
    if (!Array.isArray(dataEntrada)) {
      emitNodeErrorAndThrow(`entrada expects an array, got ${typeof dataEntrada === 'object' ? JSON.stringify(dataEntrada) : typeof dataEntrada}`);
    }
    if (state) {
      emitNodeErrorAndThrow('an active loop is already in progress, cannot receive a new array');
    }
    if (dataEntrada.length === 0) {
      outputName = 'fin_loop';
      outputData = null;
    } else {
      const items = [...dataEntrada];
      const first = items.shift();
      loopStates.set(node.id, { items, loopVisited: [...visited] });
      outputName = 'loop';
      outputData = first;
    }
  } else if (entradaName === 'fin_iteracion') {
    // Advance signal
    if (!state) {
      emitNodeErrorAndThrow('received fin_iteracion but no active loop');
    }
    const { items, loopVisited } = state;
    if (items.length === 0) {
      outputName = 'fin_loop';
      outputData = dataEntrada;
      loopStates.delete(node.id);
    } else {
      const next = items.shift();
      loopStates.set(node.id, { items, loopVisited });
      outputName = 'loop';
      outputData = next;
    }
  }

  const fechaInicio = new Date();

  if (DEBUG_FLOW_LOGS) {
    console.log('[EJECUCION_FLUJO] Nodo:', {
      id: node.id,
      nombre: node.nombre,
      tipo: 'LOOP',
      dataEntrada,
      dataSalida: { name: outputName, value: outputData },
    });
  }

  await insertRegistro({
    id_flujo,
    id_ejecucion,
    node,
    dataEntrada,
    dataSalida: { name: outputName, value: outputData },
    fechaInicio,
    fechaFin: new Date(),
  });

  emitNodeEvent('agentes_nodo_flujo_ejecucion:node_finished', {
    outputName,
  });

  if (signal?.aborted) throw createAbortError();

  // Find connections matching the output name
  const matchingConnections = (connectionsByOrigin[node.id] || [])
    .filter((conexion) => String(conexion.name_salida_nodo || '').trim() === outputName);

  if (!matchingConnections.length) {
    return [{ nodo: node.id, dataSalida: { name: outputName, value: outputData } }];
  }

  // Use loopVisited for iterations (resets visited per iteration so downstream nodes can be re-visited)
  // For fin_loop, use current visited (loop is done)
  const loopStateAfter = loopStates.get(node.id);
  const nextVisited = (outputName === 'loop' && loopStateAfter?.loopVisited) ? loopStateAfter.loopVisited : visited;
  const results = [];

  for (const conexion of matchingConnections) {
    emitNodeEvent('agentes_nodo_flujo_ejecucion:connection_taken', {
      connectionId: conexion.id,
      fromNodeId: node.id,
      toNodeId: Number(conexion.id_nodo_destino),
    });

    const childResults = await executePath({
      id_flujo,
      id_ejecucion,
      nodeId: Number(conexion.id_nodo_destino),
      dataEntrada: outputData,
      nodesById,
      connectionsByOrigin,
      visited: nextVisited,
      socket,
      requestId,
      signal,
      loopStates,
      entradaName: conexion.name_entrada_nodo || null,
    });
    if (Array.isArray(childResults)) {
      results.push(...childResults);
    }
  }

  return results.length ? results : [{ nodo: node.id, dataSalida: { name: outputName, value: outputData } }];
}

async function runFlow({ id_flujo, id_nodo_inicio, data_entrada = null, socket = null, requestId = null }) {
  const ejecucion = await createEjecucion(id_flujo);
  const { nodos, conexiones } = await loadFlowNodesAndConnections(id_flujo);
  const nodesById = buildNodeMap(nodos);
  const connectionsByOrigin = buildConnectionMap(conexiones);

  if (!nodesById[id_nodo_inicio]) {
    throw new Error(`Nodo de inicio ${id_nodo_inicio} no encontrado en flujo ${id_flujo}`);
  }

  const controller = new AbortController();
  const loopStates = new Map();
  if (requestId) {
    activeFlowControllers.set(requestId, controller);
  }

  try {
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
      signal: controller.signal,
      loopStates,
    });

    const fecha_hora_fin = await finishEjecucion(ejecucion.id);
    return { ...ejecucion, fecha_hora_fin, resultados };
  } catch (error) {
    if (error?.name === 'AbortError' || String(error.message).includes('aborted')) {
      const fecha_hora_fin = await finishEjecucion(ejecucion.id);
      return { ...ejecucion, fecha_hora_fin, resultados: [] };
    }
    throw error;
  } finally {
    if (requestId) {
      activeFlowControllers.delete(requestId);
    }
  }
}

module.exports = {
  runFlow,
  cancelFlowExecution,
};
