const db = require('../db');

/**
 * Manejador de eventos WebSocket para la entidad proyectos.
 *
 * Eventos entrantes (cliente -> servidor):
 * - proyectos:list
 * - proyectos:get { id }
 * - proyectos:create { nombre, descripcion, subproyectos?: string[], componentes?: Array<{ nombre, descripcion?, config?: object | string }> }
 * - proyectos:update { id, nombre?, descripcion?, subproyectos?: string[], componentes?: Array<{ nombre, descripcion?, config?: object | string }> }
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

  const cargarComponentes = async (proyectoId) => {
    return await db('componentes').where({ proyecto_id: proyectoId }).orderBy('id', 'asc');
  };

  const prepararRegistrosComponentes = (componentes, proyectoId) => {
    if (!Array.isArray(componentes)) return [];
    return componentes
      .map((item) => {
        const nombre = String(item?.nombre ?? '').trim();
        if (!nombre) return null;
        const descripcion = String(item?.descripcion ?? '').trim();
        let config = item?.config ?? {};

        if (typeof config === 'string') {
          config = config.trim();
          if (config === '') {
            config = {};
          } else {
            try {
              config = JSON.parse(config);
            } catch (error) {
              throw new Error('El campo config de un componente debe ser JSON válido');
            }
          }
        }

        if (config == null || typeof config !== 'object' || Array.isArray(config)) {
          throw new Error('El campo config de un componente debe ser un objeto JSON');
        }

        return {
          proyecto_id: proyectoId,
          nombre,
          descripcion,
          config,
        };
      })
      .filter(Boolean);
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
      const componentes = await cargarComponentes(id);
      safeCallback(callback, { ok: true, data: { ...proyecto, subproyectos, componentes } });
    } catch (error) {
      console.error('proyectos:get error', error);
      safeCallback(callback, { ok: false, error: 'Error obteniendo proyecto' });
    }
  });

  socket.on('proyectos:create', async (payload, callback) => {
    const { nombre, descripcion, subproyectos, componentes } = payload || {};
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

      if (Array.isArray(componentes)) {
        const registros = prepararRegistrosComponentes(componentes, id);
        if (registros.length) {
          await db('componentes').insert(registros);
        }
      }

      const nuevoProyecto = await db('proyectos').where({ id }).first();
      const nuevoProyectoCompleto = {
        ...nuevoProyecto,
        subproyectos: await cargarSubproyectos(id),
        componentes: await cargarComponentes(id),
      };

      io.emit('proyectos:changed', { action: 'created', proyecto: nuevoProyectoCompleto });
      safeCallback(callback, { ok: true, data: nuevoProyectoCompleto });
    } catch (error) {
      console.error('proyectos:create error', error);
      safeCallback(callback, { ok: false, error: error.message || 'Error creando proyecto' });
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

    if (Object.keys(data).length === 0 && !Array.isArray(payload.subproyectos) && !Array.isArray(payload.componentes)) {
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

      if (Array.isArray(payload.componentes)) {
        await db('componentes').where({ proyecto_id: id }).delete();
        const registros = prepararRegistrosComponentes(payload.componentes, id);
        if (registros.length) {
          await db('componentes').insert(registros);
        }
      }

      const proyectoActualizado = await db('proyectos').where({ id }).first();
      const proyectoActualizadoCompleto = {
        ...proyectoActualizado,
        subproyectos: await cargarSubproyectos(id),
        componentes: await cargarComponentes(id),
      };
      io.emit('proyectos:changed', { action: 'updated', proyecto: proyectoActualizadoCompleto });
      safeCallback(callback, { ok: true, data: proyectoActualizadoCompleto });
    } catch (error) {
      console.error('proyectos:update error', error);
      safeCallback(callback, { ok: false, error: error.message || 'Error actualizando proyecto' });
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
      await db('componentes').where({ proyecto_id: id }).delete();
      await db('proyectos').where({ id }).delete();

      io.emit('proyectos:changed', { action: 'deleted', proyecto });
      safeCallback(callback, { ok: true, data: { id } });
    } catch (error) {
      console.error('proyectos:delete error', error);
      safeCallback(callback, { ok: false, error: 'Error eliminando proyecto' });
    }
  });
};
