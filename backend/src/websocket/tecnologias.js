const db = require('../db');

module.exports = (socket, io) => {
  const safeCallback = (callback, payload) => {
    if (typeof callback === 'function') {
      callback(payload);
    } else if (payload?.event) {
      socket.emit(payload.event, payload);
    }
  };

  socket.on('tecnologias:list', async (_payload, callback) => {
    try {
      const tecnologias = await db('tecnologias').select('*').orderBy('id', 'asc');
      safeCallback(callback, { ok: true, data: tecnologias });
    } catch (error) {
      console.error('tecnologias:list error', error);
      safeCallback(callback, { ok: false, error: 'Error listando tecnologias' });
    }
  });

  socket.on('tecnologias:get', async (payload, callback) => {
    const id = Number(payload?.id || payload);
    if (!id || id <= 0) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para obtener tecnología' });
    }

    try {
      const tecnologia = await db('tecnologias').where({ id }).first();
      if (!tecnologia) {
        return safeCallback(callback, { ok: false, error: 'Tecnología no encontrada', status: 404 });
      }
      safeCallback(callback, { ok: true, data: tecnologia });
    } catch (error) {
      console.error('tecnologias:get error', error);
      safeCallback(callback, { ok: false, error: 'Error obteniendo tecnología' });
    }
  });

  socket.on('tecnologias:create', async (payload, callback) => {
    const nombre = String(payload?.nombre || '').trim();
    const color = String(payload?.color || '').trim() || null;
    const tipo = String(payload?.tipo || 'lenguaje').trim() || 'lenguaje';
    const tipo_aplicacion = String(payload?.tipo_aplicacion || 'backend').trim() || 'backend';
    const notas_uso = String(payload?.notas_uso || '').trim().slice(0, 512);
    if (!nombre) {
      return safeCallback(callback, { ok: false, error: 'El nombre es requerido' });
    }
    if (!['lenguaje', 'framework', 'servicio', 'libreria'].includes(tipo)) {
      return safeCallback(callback, { ok: false, error: 'Tipo de tecnología inválido' });
    }
    if (!['frontend', 'backend', 'base_datos', 'backend_y_frontend'].includes(tipo_aplicacion)) {
      return safeCallback(callback, { ok: false, error: 'Tipo de aplicación inválido' });
    }

    try {
      const [id] = await db('tecnologias').insert({ nombre, color, tipo, tipo_aplicacion, notas_uso });
      const tecnologia = await db('tecnologias').where({ id }).first();
      io.emit('tecnologias:changed', { action: 'created', tecnologia });
      safeCallback(callback, { ok: true, data: tecnologia });
    } catch (error) {
      console.error('tecnologias:create error', error);
      safeCallback(callback, { ok: false, error: 'Error creando tecnología' });
    }
  });

  socket.on('tecnologias:update', async (payload, callback) => {
    const id = Number(payload?.id);
    const nombre = String(payload?.nombre || '').trim();
    const color = String(payload?.color || '').trim() || null;
    const tipo = String(payload?.tipo || 'lenguaje').trim() || 'lenguaje';
    const tipo_aplicacion = String(payload?.tipo_aplicacion || 'backend').trim() || 'backend';
    const notas_uso = String(payload?.notas_uso || '').trim().slice(0, 512);

    if (!id || id <= 0) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para actualizar tecnología' });
    }
    if (!nombre) {
      return safeCallback(callback, { ok: false, error: 'El nombre es requerido' });
    }
    if (!['lenguaje', 'framework', 'servicio', 'libreria'].includes(tipo)) {
      return safeCallback(callback, { ok: false, error: 'Tipo de tecnología inválido' });
    }
    if (!['frontend', 'backend', 'base_datos', 'backend_y_frontend'].includes(tipo_aplicacion)) {
      return safeCallback(callback, { ok: false, error: 'Tipo de aplicación inválido' });
    }

    try {
      const affected = await db('tecnologias').where({ id }).update({ nombre, color, tipo, tipo_aplicacion, notas_uso, actualizado_el: new Date() });
      if (!affected) {
        return safeCallback(callback, { ok: false, error: 'Tecnología no encontrada', status: 404 });
      }

      const tecnologia = await db('tecnologias').where({ id }).first();
      io.emit('tecnologias:changed', { action: 'updated', tecnologia });
      safeCallback(callback, { ok: true, data: tecnologia });
    } catch (error) {
      console.error('tecnologias:update error', error);
      safeCallback(callback, { ok: false, error: 'Error actualizando tecnología' });
    }
  });

  socket.on('tecnologias:delete', async (payload, callback) => {
    const id = Number(payload?.id || payload);
    if (!id || id <= 0) {
      return safeCallback(callback, { ok: false, error: 'Id inválido para eliminar tecnología' });
    }

    try {
      const tecnologia = await db('tecnologias').where({ id }).first();
      if (!tecnologia) {
        return safeCallback(callback, { ok: false, error: 'Tecnología no encontrada', status: 404 });
      }
      await db('tecnologias').where({ id }).delete();
      io.emit('tecnologias:changed', { action: 'deleted', tecnologia });
      safeCallback(callback, { ok: true, data: { id } });
    } catch (error) {
      console.error('tecnologias:delete error', error);
      safeCallback(callback, { ok: false, error: 'Error eliminando tecnología' });
    }
  });
};
