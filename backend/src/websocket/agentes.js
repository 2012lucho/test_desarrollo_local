const db = require('../db');

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
};
