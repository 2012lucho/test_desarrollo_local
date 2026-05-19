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
  const nodos = await db('agentes_nodo_flujo').where({ id_flujo }).select('*');
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

async function executeNode(node, dataEntrada) {
  const fechaInicio = new Date();
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
    return;
  }

  const node = nodesById[nodeId];
  if (!node) {
    return;
  }

  const { dataSalida, fechaInicio, fechaFin } = await executeNode(node, dataEntrada);

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
    return;
  }

  const nextVisited = [...visited, nodeId];
  for (const conexion of nextConnections) {
    await executePath({
      id_flujo,
      id_ejecucion,
      nodeId: Number(conexion.id_nodo_destino),
      dataEntrada: dataSalida,
      nodesById,
      connectionsByOrigin,
      visited: nextVisited,
    });
  }
}

async function runFlow({ id_flujo, id_nodo_inicio, data_entrada = null }) {
  const ejecucion = await createEjecucion(id_flujo);
  const { nodos, conexiones } = await loadFlowNodesAndConnections(id_flujo);
  const nodesById = buildNodeMap(nodos);
  const connectionsByOrigin = buildConnectionMap(conexiones);

  if (!nodesById[id_nodo_inicio]) {
    throw new Error(`Nodo de inicio ${id_nodo_inicio} no encontrado en flujo ${id_flujo}`);
  }

  await executePath({
    id_flujo,
    id_ejecucion: ejecucion.id,
    nodeId: id_nodo_inicio,
    dataEntrada: data_entrada,
    nodesById,
    connectionsByOrigin,
    visited: [],
  });

  const fecha_hora_fin = await finishEjecucion(ejecucion.id);
  return { ...ejecucion, fecha_hora_fin };
}

module.exports = {
  runFlow,
};
