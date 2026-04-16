const db = require('../db');

/**
 * Manejador de eventos WebSocket para la entidad proyectos.
 *
 * Eventos entrantes (cliente -> servidor):
 * - proyectos:list
 * - proyectos:get { id }
 * - proyectos:create { nombre, descripcion, subproyectos?: string[] }
 * - proyectos:update { id, nombre?, descripcion?, subproyectos?: string[] }
 * - proyectos:delete { id }
 *
 * Respuestas por callback de ack o emisión general:
 * - proyectos:list:result
 * - proyectos:get:result
 * - proyectos:changed
 */
module.exports = (socket, io) => {
  const safeCallback = (callback, payload) => {
    if (typeof callback === 'function') {
      callback(payload);
    } else {
      if (payload.event) {
        socket.emit(payload.event, payload);
      }
    }
  };

  const cargarSubproyectos = async (proyectoId) => {
    return await db('subproyectos').where({ proyecto_id: proyectoId }).orderBy('id', 'asc');
  };

  socket.on('proyectos:list', async (payload, callback) => {
    try {
      const proyectos = await db('proyectos').select('*').orderBy('id', 'asc');
      safeCallback(callback, { ok: true, data: proyectos });
    } catch (error) {
      console.error('proyectos:list error', error);
      safeCallback(callback, { ok: false, error: 'Error listando proyectos' });
    }
  });

  socket.on('proyectos:get', async (payload, callback) => {
    const id = Number(payload?.id || payload);
    if (!id || id <= 0) {
      return safeCallback(callback, { ok: false, error: 'Se requiere id válido para obtener proyecto' });
    }

    try {
      const proyecto = await db('proyectos').where({ id }).first();
      if (!proyecto) {
        return safeCallback(callback, { ok: false, error: 'Proyecto no encontrado', status: 404 });
      }
      const subproyectos = await cargarSubproyectos(id);
      safeCallback(callback, { ok: true, data: { ...proyecto, subproyectos } });
    } catch (error) {
      console.error('proyectos:get error', error);
      safeCallback(callback, { ok: false, error: 'Error obteniendo proyecto' });
    }
  });

  socket.on('proyectos:create', async (payload, callback) => {
    const { nombre, descripcion, subproyectos } = payload || {};
    if (!nombre || !descripcion) {
      return safeCallback(callback, { ok: false, error: 'nombre y descripcion son requeridos' });
    }

    try {
      const [id] = await db('proyectos').insert({ nombre, descripcion });
      if (Array.isArray(subproyectos) && subproyectos.length) {
        const registros = subproyectos
          .map((nombreSub) => ({ proyecto_id: id, nombre: String(nombreSub || '').trim() }))
          .filter((item) => item.nombre);
        if (registros.length) {
          await db('subproyectos').insert(registros);
        }
      }
      const nuevoProyecto = await db('proyectos').where({ id }).first();
      const nuevoProyectoCompleto = {
        ...nuevoProyecto,
        subproyectos: await cargarSubproyectos(id),
      };

      io.emit('proyectos:changed', { action: 'created', proyecto: nuevoProyectoCompleto });
      safeCallback(callback, { ok: true, data: nuevoProyectoCompleto });
    } catch (error) {
      console.error('proyectos:create error', error);
      safeCallback(callback, { ok: false, error: 'Error creando proyecto' });
    }
  });

  socket.on('proyectos:update', async (payload, callback) => {
    const id = Number(payload?.id);
    if (!id || id <= 0) {
      return safeCallback(callback, { ok: false, error: 'Se requiere id válido para actualizar proyecto' });
    }

    const data = {};
    if (payload.nombre) data.nombre = payload.nombre;
    if (payload.descripcion) data.descripcion = payload.descripcion;

    if (Object.keys(data).length === 0 && !Array.isArray(payload.subproyectos)) {
      return safeCallback(callback, { ok: false, error: 'Se necesita al menos un campo para actualizar' });
    }

    data.actualizado_el = new Date();

    try {
      if (Object.keys(data).length > 0) {
        const affected = await db('proyectos').where({ id }).update(data);
        if (!affected) {
          return safeCallback(callback, { ok: false, error: 'Proyecto no encontrado', status: 404 });
        }
      }

      if (Array.isArray(payload.subproyectos)) {
        await db('subproyectos').where({ proyecto_id: id }).delete();
        const registros = payload.subproyectos
          .map((nombreSub) => ({ proyecto_id: id, nombre: String(nombreSub || '').trim() }))
          .filter((item) => item.nombre);
        if (registros.length) {
          await db('subproyectos').insert(registros);
        }
      }

      const proyectoActualizado = await db('proyectos').where({ id }).first();
      const proyectoActualizadoCompleto = {
        ...proyectoActualizado,
        subproyectos: await cargarSubproyectos(id),
      };
      io.emit('proyectos:changed', { action: 'updated', proyecto: proyectoActualizadoCompleto });
      safeCallback(callback, { ok: true, data: proyectoActualizadoCompleto });
    } catch (error) {
      console.error('proyectos:update error', error);
      safeCallback(callback, { ok: false, error: 'Error actualizando proyecto' });
    }
  });

  socket.on('proyectos:delete', async (payload, callback) => {
    const id = Number(payload?.id || payload);
    if (!id || id <= 0) {
      return safeCallback(callback, { ok: false, error: 'Se requiere id válido para eliminar proyecto' });
    }

    try {
      const proyecto = await db('proyectos').where({ id }).first();
      if (!proyecto) {
        return safeCallback(callback, { ok: false, error: 'Proyecto no encontrado', status: 404 });
      }
      await db('subproyectos').where({ proyecto_id: id }).delete();
      await db('proyectos').where({ id }).delete();

      io.emit('proyectos:changed', { action: 'deleted', proyecto });
      safeCallback(callback, { ok: true, data: { id } });
    } catch (error) {
      console.error('proyectos:delete error', error);
      safeCallback(callback, { ok: false, error: 'Error eliminando proyecto' });
    }
  });
};
