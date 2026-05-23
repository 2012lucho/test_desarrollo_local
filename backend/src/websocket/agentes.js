const db = require('../db');
const maquinaEstados = require('../../../agentes/maquinaEstados.js');

function normalizeJsonValue(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }
    try {
      return JSON.stringify(JSON.parse(trimmed));
    } catch {
      return trimmed;
    }
  }
  try {
    return JSON.stringify(value);
  } catch (error) {
    return null;
  }
}

module.exports = (socket, io) => {
  const safeCallback = (callback, payload) => {
    if (typeof callback === 'function') {
      callback(payload);
    } else if (payload?.event) {
      socket.emit(payload.event, payload);
    }
  };

  socket.on('agentes:list', async (_payload, callback) => {
    try {
      const agentes = await db('agentes').select('*').orderBy('id', 'asc');
      safeCallback(callback, { ok: true, data: agentes });
    } catch (error) {
      console.error('agentes:list error', error);
      safeCallback(callback, { ok: false, error: 'Error listando agentes' });
    }
  });

  socket.on('agentes_tipo_bloques_especiales:list', async (_payload, callback) => {
    try {
      const tipos = await db('agentes_tipo_bloques_especiales').select('*').orderBy('id', 'asc');
      safeCallback(callback, { ok: true, data: tipos });
    } catch (error) {
      console.error('agentes_tipo_bloques_especiales:list error', error);
      safeCallback(callback, { ok: false, error: 'Error listando tipos de bloque especiales' });
    }
  });

  socket.on('agentes_tipo_bloques_especiales:get', async (payload, callback) => {
    const id = Number(payload?.id || payload || 0);
    if (!id) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para obtener tipo de bloque especial' });
    }

    try {
      const tipo = await db('agentes_tipo_bloques_especiales').where({ id }).first();
      if (!tipo) {
        return safeCallback(callback, { ok: false, error: 'Tipo de bloque especial no encontrado', status: 404 });
      }
      safeCallback(callback, { ok: true, data: tipo });
    } catch (error) {
      console.error('agentes_tipo_bloques_especiales:get error', error);
      safeCallback(callback, { ok: false, error: 'Error obteniendo tipo de bloque especial' });
    }
  });

  socket.on('agentes_tipo_bloques_especiales:create', async (payload, callback) => {
    const nombre = String(payload?.nombre || '').trim();
    const descripcion = String(payload?.descripcion || '').trim() || null;
    const config_entrada = normalizeJsonValue(payload?.config_entrada);
    const config_general = normalizeJsonValue(payload?.config_general);
    const config_salida = normalizeJsonValue(payload?.config_salida);

    if (!nombre) {
      return safeCallback(callback, { ok: false, error: 'El nombre es requerido' });
    }

    try {
      const [id] = await db('agentes_tipo_bloques_especiales').insert({ nombre, descripcion, config_entrada, config_general, config_salida });
      const tipo = await db('agentes_tipo_bloques_especiales').where({ id }).first();
      io.emit('agentes_tipo_bloques_especiales:changed', { action: 'created', tipo });
      safeCallback(callback, { ok: true, data: tipo });
    } catch (error) {
      console.error('agentes_tipo_bloques_especiales:create error', error);
      safeCallback(callback, { ok: false, error: 'Error creando tipo de bloque especial' });
    }
  });

  socket.on('agentes_tipo_bloques_especiales:update', async (payload, callback) => {
    const id = Number(payload?.id || 0);
    const nombre = String(payload?.nombre || '').trim();
    const descripcion = String(payload?.descripcion || '').trim() || null;
    const config_entrada = normalizeJsonValue(payload?.config_entrada);
    const config_general = normalizeJsonValue(payload?.config_general);
    const config_salida = normalizeJsonValue(payload?.config_salida);

    if (!id) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para actualizar tipo de bloque especial' });
    }
    if (!nombre) {
      return safeCallback(callback, { ok: false, error: 'El nombre es requerido' });
    }

    try {
      const affected = await db('agentes_tipo_bloques_especiales').where({ id }).update({ nombre, descripcion, config_entrada, config_general, config_salida });
      if (!affected) {
        return safeCallback(callback, { ok: false, error: 'Tipo de bloque especial no encontrado', status: 404 });
      }
      const tipo = await db('agentes_tipo_bloques_especiales').where({ id }).first();
      io.emit('agentes_tipo_bloques_especiales:changed', { action: 'updated', tipo });
      safeCallback(callback, { ok: true, data: tipo });
    } catch (error) {
      console.error('agentes_tipo_bloques_especiales:update error', error);
      safeCallback(callback, { ok: false, error: 'Error actualizando tipo de bloque especial' });
    }
  });

  socket.on('agentes_tipo_bloques_especiales:delete', async (payload, callback) => {
    const id = Number(payload?.id || payload || 0);
    if (!id) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para eliminar tipo de bloque especial' });
    }

    try {
      const tipo = await db('agentes_tipo_bloques_especiales').where({ id }).first();
      if (!tipo) {
        return safeCallback(callback, { ok: false, error: 'Tipo de bloque especial no encontrado', status: 404 });
      }
      await db('agentes_tipo_bloques_especiales').where({ id }).delete();
      io.emit('agentes_tipo_bloques_especiales:changed', { action: 'deleted', tipo });
      safeCallback(callback, { ok: true, data: { id } });
    } catch (error) {
      console.error('agentes_tipo_bloques_especiales:delete error', error);
      safeCallback(callback, { ok: false, error: 'Error eliminando tipo de bloque especial' });
    }
  });

  socket.on('agentes_flujos:list', async (_payload, callback) => {
    try {
      const flujos = await db('agentes_flujos').select('*').orderBy('id', 'asc');
      safeCallback(callback, { ok: true, data: flujos });
    } catch (error) {
      console.error('agentes_flujos:list error', error);
      safeCallback(callback, { ok: false, error: 'Error listando flujos' });
    }
  });

  socket.on('agentes_flujos:get', async (payload, callback) => {
    const id = Number(payload?.id || payload || 0);
    if (!id) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para obtener flujo' });
    }

    try {
      const flujo = await db('agentes_flujos').where({ id }).first();
      if (!flujo) {
        return safeCallback(callback, { ok: false, error: 'Flujo no encontrado', status: 404 });
      }
      safeCallback(callback, { ok: true, data: flujo });
    } catch (error) {
      console.error('agentes_flujos:get error', error);
      safeCallback(callback, { ok: false, error: 'Error obteniendo flujo' });
    }
  });

  socket.on('agentes_flujos:create', async (payload, callback) => {
    const nombre = String(payload?.nombre || '').trim();
    if (!nombre) {
      return safeCallback(callback, { ok: false, error: 'El nombre es requerido' });
    }

    try {
      const [id] = await db('agentes_flujos').insert({ nombre });
      const flujo = await db('agentes_flujos').where({ id }).first();
      io.emit('agentes_flujos:changed', { action: 'created', flujo });
      safeCallback(callback, { ok: true, data: flujo });
    } catch (error) {
      console.error('agentes_flujos:create error', error);
      safeCallback(callback, { ok: false, error: 'Error creando flujo' });
    }
  });

  socket.on('agentes_flujos:update', async (payload, callback) => {
    const id = Number(payload?.id || 0);
    const nombre = String(payload?.nombre || '').trim();

    if (!id) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para actualizar flujo' });
    }
    if (!nombre) {
      return safeCallback(callback, { ok: false, error: 'El nombre es requerido' });
    }

    try {
      const affected = await db('agentes_flujos').where({ id }).update({ nombre });
      if (!affected) {
        return safeCallback(callback, { ok: false, error: 'Flujo no encontrado', status: 404 });
      }
      const flujo = await db('agentes_flujos').where({ id }).first();
      io.emit('agentes_flujos:changed', { action: 'updated', flujo });
      safeCallback(callback, { ok: true, data: flujo });
    } catch (error) {
      console.error('agentes_flujos:update error', error);
      safeCallback(callback, { ok: false, error: 'Error actualizando flujo' });
    }
  });

  socket.on('agentes_flujos:delete', async (payload, callback) => {
    const id = Number(payload?.id || payload || 0);
    if (!id) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para eliminar flujo' });
    }

    try {
      const flujo = await db('agentes_flujos').where({ id }).first();
      if (!flujo) {
        return safeCallback(callback, { ok: false, error: 'Flujo no encontrado', status: 404 });
      }
      await db('agentes_flujos').where({ id }).delete();
      io.emit('agentes_flujos:changed', { action: 'deleted', flujo });
      safeCallback(callback, { ok: true, data: { id } });
    } catch (error) {
      console.error('agentes_flujos:delete error', error);
      safeCallback(callback, { ok: false, error: 'Error eliminando flujo' });
    }
  });

  socket.on('agentes_flujo_ejecuciones:list', async (payload, callback) => {
    const id_flujo = Number(payload?.id_flujo || 0);
    if (!id_flujo) {
      return safeCallback(callback, { ok: false, error: 'Id de flujo inválido para listar ejecuciones' });
    }

    try {
      const ejecuciones = await db('ejecucion_flujo').where({ id_flujo }).orderBy('id', 'desc');
      safeCallback(callback, { ok: true, data: ejecuciones });
    } catch (error) {
      console.error('agentes_flujo_ejecuciones:list error', error);
      safeCallback(callback, { ok: false, error: 'Error listando ejecuciones de flujo' });
    }
  });

  socket.on('agentes_nodo_flujo_ejecucion:last-records', async (payload, callback) => {
    const id_flujo = Number(payload?.id_flujo || 0);
    if (!id_flujo) {
      return safeCallback(callback, { ok: false, error: 'Id de flujo inválido para listar registros de nodos' });
    }

    try {
      const subquery = db('registro_ejecucion_flujo')
        .join('ejecucion_flujo as e2', 'registro_ejecucion_flujo.id_ejecucion', 'e2.id')
        .where('e2.id_flujo', id_flujo)
        .groupBy('registro_ejecucion_flujo.nodo')
        .select(db.raw('MAX(registro_ejecucion_flujo.id) as max_id'));

      const registros = await db('registro_ejecucion_flujo as r')
        .join('ejecucion_flujo as e', 'r.id_ejecucion', 'e.id')
        .where('e.id_flujo', id_flujo)
        .whereIn('r.id', subquery)
        .orderBy('r.nodo', 'asc');

      safeCallback(callback, { ok: true, data: registros });
    } catch (error) {
      console.error('agentes_nodo_flujo_ejecucion:last-records error', error);
      safeCallback(callback, { ok: false, error: 'Error listando los últimos registros de ejecución por nodo' });
    }
  });

  socket.on('agentes_flujo_ejecucion:records', async (payload, callback) => {
    const id_ejecucion = Number(payload?.id_ejecucion || 0);
    if (!id_ejecucion) {
      return safeCallback(callback, { ok: false, error: 'Id de ejecución inválido para listar registros' });
    }

    try {
      const registros = await db('registro_ejecucion_flujo').where({ id_ejecucion }).orderBy('id', 'asc');
      safeCallback(callback, { ok: true, data: registros });
    } catch (error) {
      console.error('agentes_flujo_ejecucion:records error', error);
      safeCallback(callback, { ok: false, error: 'Error listando registros de ejecución' });
    }
  });

  socket.on('agentes_nodo_flujo_ejecucion:start', async (payload, callback) => {
    const id_flujo = Number(payload?.id_flujo || 0);
    const id_nodo_inicio = Number(payload?.id_nodo_inicio || 0);
    const data_entrada = payload?.data_entrada ?? null;
    const requestId = payload?.requestId ? String(payload.requestId) : `flow-${Date.now()}-${Math.random()}`;

    if (!id_flujo) {
      return safeCallback(callback, { ok: false, error: 'Id de flujo inválido para iniciar ejecución' });
    }
    if (!id_nodo_inicio) {
      return safeCallback(callback, { ok: false, error: 'Id de nodo de inicio inválido para iniciar ejecución' });
    }

    try {
      const ejecucion = await maquinaEstados.runFlow({ id_flujo, id_nodo_inicio, data_entrada, socket, requestId });
      safeCallback(callback, { ok: true, data: { ...ejecucion, requestId } });
    } catch (error) {
      console.error('agentes_nodo_flujo_ejecucion:start error', error);
      safeCallback(callback, { ok: false, error: 'Error iniciando la ejecución de flujo' });
    }
  });

  socket.on('agentes_nodo_flujo:list', async (payload, callback) => {
    try {
      const query = db('agentes_nodo_flujo').select('*').orderBy('id', 'asc');
      const id_flujo = Number(payload?.id_flujo || 0);
      if (id_flujo) {
        query.where({ id_flujo });
      }
      const nodos = await query;
      safeCallback(callback, { ok: true, data: nodos });
    } catch (error) {
      console.error('agentes_nodo_flujo:list error', error);
      safeCallback(callback, { ok: false, error: 'Error listando nodos de flujo' });
    }
  });

  socket.on('agentes_nodo_flujo_coneccion:list', async (payload, callback) => {
    try {
      const query = db('agentes_nodo_flujo_coneccion').select('*').orderBy('id', 'asc');
      const id_flujo = Number(payload?.id_flujo || 0);
      if (id_flujo) {
        query.where({ id_flujo });
      }
      const conexiones = await query;
      safeCallback(callback, { ok: true, data: conexiones });
    } catch (error) {
      console.error('agentes_nodo_flujo_coneccion:list error', error);
      safeCallback(callback, { ok: false, error: 'Error listando conexiones de flujo' });
    }
  });

  socket.on('agentes_nodo_flujo_coneccion:create', async (payload, callback) => {
    const id_nodo_origen = Number(payload?.id_nodo_origen || 0);
    const id_nodo_destino = Number(payload?.id_nodo_destino || 0);
    const id_flujo = Number(payload?.id_flujo || 0);
    const name_salida_nodo = payload?.name_salida_nodo ? String(payload.name_salida_nodo).trim() : null;

    if (!id_nodo_origen || !id_nodo_destino || !id_flujo) {
      return safeCallback(callback, { ok: false, error: 'Origen, destino y flujo son requeridos' });
    }
    if (id_nodo_origen === id_nodo_destino) {
      return safeCallback(callback, { ok: false, error: 'No se puede conectar un nodo consigo mismo' });
    }

    try {
      const [id] = await db('agentes_nodo_flujo_coneccion').insert({ id_nodo_origen, id_nodo_destino, id_flujo, name_salida_nodo });
      const conexion = await db('agentes_nodo_flujo_coneccion').where({ id }).first();
      io.emit('agentes_nodo_flujo_coneccion:changed', { action: 'created', conexion });
      safeCallback(callback, { ok: true, data: conexion });
    } catch (error) {
      console.error('agentes_nodo_flujo_coneccion:create error', error);
      safeCallback(callback, { ok: false, error: 'Error creando conexión de flujo' });
    }
  });

  socket.on('agentes_nodo_flujo_coneccion:delete', async (payload, callback) => {
    const id = Number(payload?.id || 0);
    if (!id) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para eliminar conexión' });
    }

    try {
      const conexion = await db('agentes_nodo_flujo_coneccion').where({ id }).first();
      if (!conexion) {
        return safeCallback(callback, { ok: false, error: 'Conexión no encontrada', status: 404 });
      }
      await db('agentes_nodo_flujo_coneccion').where({ id }).delete();
      io.emit('agentes_nodo_flujo_coneccion:changed', { action: 'deleted', conexion });
      safeCallback(callback, { ok: true, data: { id } });
    } catch (error) {
      console.error('agentes_nodo_flujo_coneccion:delete error', error);
      safeCallback(callback, { ok: false, error: 'Error eliminando conexión de flujo' });
    }
  });

  socket.on('agentes_nodo_flujo:get', async (payload, callback) => {
    const id = Number(payload?.id || payload || 0);
    if (!id) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para obtener nodo de flujo' });
    }

    try {
      const nodo = await db('agentes_nodo_flujo').where({ id }).first();
      if (!nodo) {
        return safeCallback(callback, { ok: false, error: 'Nodo de flujo no encontrado', status: 404 });
      }
      safeCallback(callback, { ok: true, data: nodo });
    } catch (error) {
      console.error('agentes_nodo_flujo:get error', error);
      safeCallback(callback, { ok: false, error: 'Error obteniendo nodo de flujo' });
    }
  });

  socket.on('agentes:get', async (payload, callback) => {
    const id = String(payload?.id || payload || '').trim();
    if (!id) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para obtener agente' });
    }

    try {
      const agente = await db('agentes').where({ id }).first();
      if (!agente) {
        return safeCallback(callback, { ok: false, error: 'Agente no encontrado', status: 404 });
      }
      safeCallback(callback, { ok: true, data: agente });
    } catch (error) {
      console.error('agentes:get error', error);
      safeCallback(callback, { ok: false, error: 'Error obteniendo agente' });
    }
  });

  socket.on('agentes:create', async (payload, callback) => {
    const id = String(payload?.id || `agente-${Date.now()}`).trim();
    const nombre = String(payload?.nombre || '').trim();
    const descripcion = String(payload?.descripcion || '').trim() || null;
    const promt_sistema = String(payload?.promt_sistema || '').trim() || null;
    const modelo = String(payload?.modelo || '').trim() || null;

    if (!id) {
      return safeCallback(callback, { ok: false, error: 'El id es requerido' });
    }
    if (!nombre) {
      return safeCallback(callback, { ok: false, error: 'El nombre es requerido' });
    }

    try {
      await db('agentes').insert({ id, nombre, descripcion, promt_sistema, modelo });
      const agente = await db('agentes').where({ id }).first();
      io.emit('agentes:changed', { action: 'created', agente });
      safeCallback(callback, { ok: true, data: agente });
    } catch (error) {
      console.error('agentes:create error', error);
      safeCallback(callback, { ok: false, error: 'Error creando agente' });
    }
  });

  socket.on('agentes:update', async (payload, callback) => {
    const originalId = String(payload?.originalId || payload?.id || '').trim();
    const newId = String(payload?.id || '').trim();
    const nombre = String(payload?.nombre || '').trim();
    const descripcion = String(payload?.descripcion || '').trim() || null;
    const promt_sistema = String(payload?.promt_sistema || '').trim() || null;
    const modelo = String(payload?.modelo || '').trim() || null;

    if (!originalId) {
      return safeCallback(callback, { ok: false, error: 'Id original es requerido para actualizar' });
    }
    if (!newId) {
      return safeCallback(callback, { ok: false, error: 'El id es requerido' });
    }
    if (!nombre) {
      return safeCallback(callback, { ok: false, error: 'El nombre es requerido' });
    }

    try {
      const affected = await db('agentes').where({ id: originalId }).update({ id: newId, nombre, descripcion, promt_sistema, modelo });
      if (!affected) {
        return safeCallback(callback, { ok: false, error: 'Agente no encontrado', status: 404 });
      }
      const agente = await db('agentes').where({ id: newId }).first();
      io.emit('agentes:changed', { action: 'updated', agente });
      safeCallback(callback, { ok: true, data: agente });
    } catch (error) {
      console.error('agentes:update error', error);
      safeCallback(callback, { ok: false, error: 'Error actualizando agente' });
    }
  });

  socket.on('agentes:update-position', async (payload, callback) => {
    const id = String(payload?.id || '').trim();
    const pos_canvas_x = payload.pos_canvas_x !== undefined ? Number(payload.pos_canvas_x) : null;
    const pos_canvas_y = payload.pos_canvas_y !== undefined ? Number(payload.pos_canvas_y) : null;

    if (!id) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para actualizar posición' });
    }

    try {
      const affected = await db('agentes').where({ id }).update({ pos_canvas_x, pos_canvas_y });
      if (!affected) {
        return safeCallback(callback, { ok: false, error: 'Agente no encontrado', status: 404 });
      }
      const agente = await db('agentes').where({ id }).first();
      io.emit('agentes:changed', { action: 'updated', agente });
      safeCallback(callback, { ok: true, data: agente });
    } catch (error) {
      console.error('agentes:update-position error', error);
      safeCallback(callback, { ok: false, error: 'Error actualizando posición del agente' });
    }
  });

  socket.on('agentes:delete', async (payload, callback) => {
    const id = String(payload?.id || payload || '').trim();
    if (!id) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para eliminar agente' });
    }

    try {
      const agente = await db('agentes').where({ id }).first();
      if (!agente) {
        return safeCallback(callback, { ok: false, error: 'Agente no encontrado', status: 404 });
      }
      await db('agentes').where({ id }).delete();
      io.emit('agentes:changed', { action: 'deleted', agente });
      safeCallback(callback, { ok: true, data: { id } });
    } catch (error) {
      console.error('agentes:delete error', error);
      safeCallback(callback, { ok: false, error: 'Error eliminando agente' });
    }
  });

  socket.on('agentes_nodo_flujo:create', async (payload, callback) => {
    const nombre = String(payload?.nombre || '').trim();
    const id_tipo_bloque = Number(payload?.id_tipo_bloque || 0);
    const id_agente = payload?.id_agente ? String(payload.id_agente).trim() : null;
    const id_flujo = Number(payload?.id_flujo || 0);
    const config = normalizeJsonValue(payload?.config);

    if (!nombre) {
      return safeCallback(callback, { ok: false, error: 'El nombre es requerido' });
    }
    if (!id_tipo_bloque) {
      return safeCallback(callback, { ok: false, error: 'El tipo de bloque es requerido' });
    }
    if (!id_flujo) {
      return safeCallback(callback, { ok: false, error: 'El flujo es requerido' });
    }

    try {
      const [id] = await db('agentes_nodo_flujo').insert({ nombre, id_tipo_bloque, id_agente, id_flujo, pos_canvas_x: null, pos_canvas_y: null, config });
      const nodo = await db('agentes_nodo_flujo').where({ id }).first();
      io.emit('agentes_nodo_flujo:changed', { action: 'created', nodo });
      safeCallback(callback, { ok: true, data: nodo });
    } catch (error) {
      console.error('agentes_nodo_flujo:create error', error);
      safeCallback(callback, { ok: false, error: 'Error creando nodo de flujo' });
    }
  });

  socket.on('agentes_nodo_flujo:update', async (payload, callback) => {
    const id = Number(payload?.id || 0);
    const nombre = String(payload?.nombre || '').trim();
    const id_tipo_bloque = Number(payload?.id_tipo_bloque || 0);
    const id_agente = payload?.id_agente ? String(payload.id_agente).trim() : null;
    const id_flujo = Number(payload?.id_flujo || 0);
    const config = normalizeJsonValue(payload?.config);

    if (!id) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para actualizar nodo de flujo' });
    }
    if (!nombre) {
      return safeCallback(callback, { ok: false, error: 'El nombre es requerido' });
    }
    if (!id_tipo_bloque) {
      return safeCallback(callback, { ok: false, error: 'El tipo de bloque es requerido' });
    }
    if (!id_flujo) {
      return safeCallback(callback, { ok: false, error: 'El flujo es requerido' });
    }

    try {
      const affected = await db('agentes_nodo_flujo').where({ id }).update({ nombre, id_tipo_bloque, id_agente, id_flujo, config });
      if (!affected) {
        return safeCallback(callback, { ok: false, error: 'Nodo de flujo no encontrado', status: 404 });
      }
      const nodo = await db('agentes_nodo_flujo').where({ id }).first();
      io.emit('agentes_nodo_flujo:changed', { action: 'updated', nodo });
      safeCallback(callback, { ok: true, data: nodo });
    } catch (error) {
      console.error('agentes_nodo_flujo:update error', error);
      safeCallback(callback, { ok: false, error: 'Error actualizando nodo de flujo' });
    }
  });

  socket.on('agentes_nodo_flujo:update-position', async (payload, callback) => {
    const id = Number(payload?.id || 0);
    const pos_canvas_x = payload.pos_canvas_x !== undefined ? Number(payload.pos_canvas_x) : null;
    const pos_canvas_y = payload.pos_canvas_y !== undefined ? Number(payload.pos_canvas_y) : null;

    if (!id) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para actualizar posición' });
    }

    try {
      const affected = await db('agentes_nodo_flujo').where({ id }).update({ pos_canvas_x, pos_canvas_y });
      if (!affected) {
        return safeCallback(callback, { ok: false, error: 'Nodo de flujo no encontrado', status: 404 });
      }
      const nodo = await db('agentes_nodo_flujo').where({ id }).first();
      io.emit('agentes_nodo_flujo:changed', { action: 'updated', nodo });
      safeCallback(callback, { ok: true, data: nodo });
    } catch (error) {
      console.error('agentes_nodo_flujo:update-position error', error);
      safeCallback(callback, { ok: false, error: 'Error actualizando posición del nodo de flujo' });
    }
  });

  socket.on('config_general:list', async (_payload, callback) => {
    try {
      const rows = await db('config_general').select('clave', 'valor');
      safeCallback(callback, { ok: true, data: rows });
    } catch (error) {
      console.error('config_general:list error', error);
      safeCallback(callback, { ok: false, error: 'Error obteniendo configuración general' });
    }
  });

  socket.on('config_general:update', async (payload, callback) => {
    const clave = String(payload?.clave || '').trim();
    const valor = payload?.valor !== undefined && payload?.valor !== null ? String(payload.valor) : '';

    if (!clave) {
      return safeCallback(callback, { ok: false, error: 'Clave inválida para actualizar configuración general' });
    }

    try {
      const existent = await db('config_general').where({ clave }).first();
      if (existent) {
        await db('config_general').where({ clave }).update({ valor });
      } else {
        await db('config_general').insert({ clave, valor });
      }
      safeCallback(callback, { ok: true, data: { clave, valor } });
    } catch (error) {
      console.error('config_general:update error', error);
      safeCallback(callback, { ok: false, error: 'Error actualizando configuración general' });
    }
  });

  socket.on('agentes_nodo_flujo:delete', async (payload, callback) => {
    const id = Number(payload?.id || payload || 0);
    if (!id) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para eliminar nodo de flujo' });
    }

    try {
      const nodo = await db('agentes_nodo_flujo').where({ id }).first();
      if (!nodo) {
        return safeCallback(callback, { ok: false, error: 'Nodo de flujo no encontrado', status: 404 });
      }
      await db.transaction(async (trx) => {
        await trx('agentes_nodo_flujo_coneccion').where({ id_nodo_origen: id }).orWhere({ id_nodo_destino: id }).delete();
        await trx('agentes_nodo_flujo').where({ id }).delete();
      });
      io.emit('agentes_nodo_flujo:changed', { action: 'deleted', nodo });
      io.emit('agentes_nodo_flujo_coneccion:changed', { action: 'deleted-by-node', nodoId: id });
      safeCallback(callback, { ok: true, data: { id } });
    } catch (error) {
      console.error('agentes_nodo_flujo:delete error', error);
      safeCallback(callback, { ok: false, error: 'Error eliminando nodo de flujo' });
    }
  });
};
