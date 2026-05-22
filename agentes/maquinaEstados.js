const Agente = require('./agentesMin.js');
const db = require('../backend/src/db');

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
  return db('registro_ejecucion_flujo').insert({
    id_flujo,
    id_ejecucion,
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

async function executeNode(node, dataEntrada, id_ejecucion) {
  const fechaInicio = new Date();
  const config = parseNodeConfig(node.config);
  const tipoBloque = String(node.tipo_bloque_nombre || '').trim().toUpperCase();
  const nombreNodo = String(node.nombre || '').trim().toUpperCase();
  const isChatOut = tipoBloque === 'CHAT_OUT' || nombreNodo === 'CHAT_OUT';
  const isAgenteIa = tipoBloque === 'AGENTE_IA' || nombreNodo === 'AGENTE_IA';

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

  if (isAgenteIa) {
    const model = String(config?.t_select_llm || config?.llm_model || config?.model || '').trim();
    const systemPrompt = String(config?.system_promt || config?.system_prompt || '').trim();
    const agenteId = node.id_agente != null ? String(node.id_agente).trim() : '';

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

    const resultadoAgente = await agente.ejecutar();

    if (agenteId) {
      await agente.logMessage({ origen: 'AUTOMATICO', mensaje: resultadoAgente.respuesta });
    }

    const dataSalida = {
      nodo: { id: node.id, nombre: node.nombre },
      model,
      input: entradaTexto,
      promptSistema: systemPrompt,
      respuesta: resultadoAgente.respuesta,
      ejecutado_en: formatDateTime(new Date()),
      sessionId: id_ejecucion,
    };

    return { dataSalida, fechaInicio, fechaFin: new Date() };
  }

  await sleep(1000);

  const dataSalida = {
    nodo: { id: node.id, nombre: node.nombre },
    input: dataEntrada,
    ejecutado_en: formatDateTime(new Date()),
  };

  return { dataSalida, fechaInicio, fechaFin: new Date() };
}

async function executePath({ id_flujo, id_ejecucion, nodeId, dataEntrada, nodesById, connectionsByOrigin, visited = [] }) {
  if (visited.includes(nodeId)) {
    return [];
  }

  const node = nodesById[nodeId];
  if (!node) {
    return [];
  }

  const { dataSalida, fechaInicio, fechaFin } = await executeNode(node, dataEntrada, id_ejecucion);

  await insertRegistro({
    id_flujo,
    id_ejecucion,
    node,
    dataEntrada,
    dataSalida,
    fechaInicio,
    fechaFin,
  });

  const nextConnections = connectionsByOrigin[nodeId] || [];
  if (!nextConnections.length) {
    return [{ nodo: node.id, dataSalida }];
  }

  const nextVisited = [...visited, nodeId];
  const results = [];
  for (const conexion of nextConnections) {
    const childResults = await executePath({
      id_flujo,
      id_ejecucion,
      nodeId: Number(conexion.id_nodo_destino),
      dataEntrada: dataSalida,
      nodesById,
      connectionsByOrigin,
      visited: nextVisited,
    });
    if (Array.isArray(childResults)) {
      results.push(...childResults);
    }
  }

  return results.length ? results : [{ nodo: node.id, dataSalida }];
}

async function runFlow({ id_flujo, id_nodo_inicio, data_entrada = null }) {
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
  });

  const fecha_hora_fin = await finishEjecucion(ejecucion.id);
  return { ...ejecucion, fecha_hora_fin, resultados };
}

module.exports = {
  runFlow,
};
