const db = require('../db');

/**
 * Manejador de eventos WebSocket para la entidad proyectos.
 *
 * Eventos entrantes (cliente -> servidor):
 * - proyectos:list
 * - proyectos:get { id }
 * - proyectos:create { nombre, descripcion, subproyectos?: Array<{ id?, nombre, tecnologias?: number[] }>, tablas?: Array<{ id?, nombre, campos?: Array<{ nombre: string, descripcion?: string }> }>, componentes?: Array<{ nombre, descripcion?, config?: object | string, subproyectos?: number[], tablas?: number[] }> }
 * - proyectos:update { id, nombre?, descripcion?, subproyectos?: Array<{ id?, nombre, tecnologias?: number[] }>, tablas?: Array<{ id?, nombre, campos?: Array<{ nombre: string, descripcion?: string }> }>, componentes?: Array<{ nombre, descripcion?, config?: object | string, subproyectos?: number[], tablas?: number[] }> }
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

  const normalizeKey = (key) => {
    if (key === null || key === undefined) return null;
    return String(key);
  };

  const cargarComponentes = async (proyectoId) => {
    const componentes = await db('componentes').where({ proyecto_id: proyectoId }).orderBy('id', 'asc');
    if (!componentes.length) return [];

    const componenteIds = componentes.map((item) => item.id);
    const relacionesSubproyectos = await db('subproyecto_componentes')
      .whereIn('componente_id', componenteIds)
      .select('componente_id', 'subproyecto_id');
    const relacionesTablas = await db('componente_tabla')
      .whereIn('componente_id', componenteIds)
      .select('componente_id', 'tabla_id');

    const subproyectosPorComponente = relacionesSubproyectos.reduce((acc, item) => {
      if (!acc[item.componente_id]) acc[item.componente_id] = [];
      acc[item.componente_id].push(item.subproyecto_id);
      return acc;
    }, {});

    const tablasPorComponente = relacionesTablas.reduce((acc, item) => {
      if (!acc[item.componente_id]) acc[item.componente_id] = [];
      acc[item.componente_id].push(item.tabla_id);
      return acc;
    }, {});

    return componentes.map((item) => ({
      ...item,
      subproyectos: subproyectosPorComponente[item.id] || [],
      tablas: tablasPorComponente[item.id] || [],
    }));
  };

  const cargarCamposTabla = async (tablaIds) => {
    if (!Array.isArray(tablaIds) || tablaIds.length === 0) return [];
    return db('campos_tabla').whereIn('id_tabla', tablaIds).orderBy('orden', 'asc').orderBy('id', 'asc');
  };

  const cargarTablas = async (proyectoId) => {
    const tablas = await db('tablas_db_proyectos').where({ proyecto_id: proyectoId }).orderBy('id', 'asc');
    if (!tablas.length) return [];

    const tablaIds = tablas.map((item) => item.id);
    const campos = await cargarCamposTabla(tablaIds);
    const camposPorTabla = campos.reduce((acc, item) => {
      if (!acc[item.id_tabla]) acc[item.id_tabla] = [];
      acc[item.id_tabla].push(item);
      return acc;
    }, {});

    return tablas.map((item) => ({
      ...item,
      campos: camposPorTabla[item.id] || [],
    }));
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

        const subproyectos = Array.isArray(item.subproyectos)
          ? Array.from(new Set(item.subproyectos.map((id) => normalizeKey(id)).filter((id) => id !== null)))
          : [];

        const tablas = Array.isArray(item.tablas)
          ? Array.from(new Set(item.tablas.map((id) => normalizeKey(id)).filter((id) => id !== null)))
          : [];

        return {
          proyecto_id: proyectoId,
          nombre,
          descripcion,
          config,
          subproyectos,
          tablas,
        };
      })
      .filter(Boolean);
  };

  const insertarSubproyectos = async (proyectoId, subproyectos) => {
    const mapping = {};
    if (!Array.isArray(subproyectos)) return mapping;

    for (const item of subproyectos) {
      const registro = prepararSubproyectoData(item);
      if (!registro) continue;
      const originalKey = normalizeKey(item?.id ?? item?.tempId);
      const [subproyectoId] = await db('subproyectos').insert({ proyecto_id: proyectoId, nombre: registro.nombre });
      if (registro.tecnologias.length) {
        const relaciones = registro.tecnologias.map((tecnologia_id) => ({
          subproyecto_id: subproyectoId,
          tecnologia_id,
        }));
        await db('subproyecto_tecnologias').insert(relaciones);
      }
      if (originalKey !== null) {
        mapping[originalKey] = subproyectoId;
      }
    }

    return mapping;
  };

  const insertarComponentes = async (componentes, subproyectoIdMap, tablaIdMap) => {
    if (!Array.isArray(componentes)) return;

    for (const item of componentes) {
      const { subproyectos, tablas, ...data } = item;
      const [componenteId] = await db('componentes').insert(data);

      const relacionesSubproyectos = (Array.isArray(subproyectos) ? subproyectos : [])
        .map((subId) => {
          const key = normalizeKey(subId);
          const subproyecto_id = subproyectoIdMap ? subproyectoIdMap[key] : Number(subId);
          if (!subproyecto_id || Number.isNaN(subproyecto_id)) return null;
          return { componente_id: componenteId, subproyecto_id };
        })
        .filter(Boolean);
      if (relacionesSubproyectos.length) {
        await db('subproyecto_componentes').insert(relacionesSubproyectos);
      }

      const relacionesTablas = (Array.isArray(tablas) ? tablas : [])
        .map((tablaId) => {
          const key = normalizeKey(tablaId);
          const tabla_id = tablaIdMap ? tablaIdMap[key] : Number(tablaId);
          if (!tabla_id || Number.isNaN(tabla_id)) return null;
          return { componente_id: componenteId, tabla_id };
        })
        .filter(Boolean);
      if (relacionesTablas.length) {
        await db('componente_tabla').insert(relacionesTablas);
      }
    }
  };

  const prepararSubproyectoData = (item) => {
    if (typeof item === 'string') {
      item = { nombre: item };
    }
    if (!item || typeof item !== 'object') return null;

    const nombre = String(item.nombre ?? '').trim();
    if (!nombre) return null;

    const tecnologias = Array.isArray(item.tecnologias)
      ? Array.from(new Set(item.tecnologias.map((id) => Number(id)).filter((id) => id > 0)))
      : [];

    return { nombre, tecnologias };
  };

  const prepararTablasData = (tablas) => {
    if (!Array.isArray(tablas)) return [];
    return tablas
      .map((item) => {
        const nombre = String(item?.nombre ?? '').trim();
        if (!nombre) return null;

        const campos = Array.isArray(item.campos)
          ? item.campos
              .map((campo, index) => {
                const nombreCampo = String(campo?.nombre ?? '').trim();
                if (!nombreCampo) return null;
                return {
                  nombre: nombreCampo,
                  descripcion: campo?.descripcion ? String(campo.descripcion).trim() : null,
                  orden: Number.isNaN(Number(campo?.orden)) ? index : Number(campo.orden),
                };
              })
              .filter(Boolean)
          : [];

        return { nombre, campos };
      })
      .filter(Boolean);
  };

  const insertarCamposTabla = async (proyectoId, tablaId, campos) => {
    if (!Array.isArray(campos) || !tablaId) return;
    const registros = campos
      .map((item, index) => {
        const nombre = String(item?.nombre ?? '').trim();
        if (!nombre) return null;
        return {
          proyecto_id: proyectoId,
          id_tabla: tablaId,
          nombre,
          descripcion: item?.descripcion ? String(item.descripcion).trim() : null,
          orden: Number.isNaN(Number(item?.orden)) ? index : Number(item.orden),
        };
      })
      .filter(Boolean);

    if (registros.length) {
      await db('campos_tabla').insert(registros);
    }
  };

  const insertarTablas = async (proyectoId, tablas) => {
    const mapping = {};
    if (!Array.isArray(tablas)) return mapping;

    for (const item of tablas) {
      const nombre = String(item?.nombre ?? '').trim();
      if (!nombre) continue;
      const originalKey = normalizeKey(item?.id ?? item?.tempId);
      const [tablaId] = await db('tablas_db_proyectos').insert({
        proyecto_id: proyectoId,
        nombre,
      });
      if (Array.isArray(item.campos) && item.campos.length) {
        await insertarCamposTabla(proyectoId, tablaId, item.campos);
      }
      if (originalKey !== null) {
        mapping[originalKey] = tablaId;
      }
    }
    return mapping;
  };

  const cargarSubproyectos = async (proyectoId) => {
    const subproyectos = await db('subproyectos').where({ proyecto_id: proyectoId }).orderBy('id', 'asc');
    if (!subproyectos.length) return [];

    const subproyectoIds = subproyectos.map((sub) => sub.id);
    const relaciones = await db('subproyecto_tecnologias as st')
      .join('tecnologias as t', 'st.tecnologia_id', 't.id')
      .whereIn('st.subproyecto_id', subproyectoIds)
      .select('st.subproyecto_id', 't.id', 't.nombre', 't.color')
      .orderBy('t.nombre', 'asc');

    const tecnologiasPorSubproyecto = relaciones.reduce((acc, item) => {
      if (!acc[item.subproyecto_id]) acc[item.subproyecto_id] = [];
      acc[item.subproyecto_id].push({ id: item.id, nombre: item.nombre, color: item.color });
      return acc;
    }, {});

    return subproyectos.map((sub) => ({
      ...sub,
      tecnologias: tecnologiasPorSubproyecto[sub.id] || [],
    }));
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
      const tablas = await cargarTablas(id);
      const componentes = await cargarComponentes(id);
      safeCallback(callback, { ok: true, data: { ...proyecto, subproyectos, tablas, componentes } });
    } catch (error) {
      console.error('proyectos:get error', error);
      safeCallback(callback, { ok: false, error: 'Error obteniendo proyecto' });
    }
  });

  socket.on('proyectos:create', async (payload, callback) => {
    const { nombre, descripcion, subproyectos, tablas, componentes } = payload || {};
    if (!nombre || !descripcion) {
      return safeCallback(callback, { ok: false, error: 'nombre y descripcion son requeridos' });
    }

    try {
      const [id] = await db('proyectos').insert({ nombre, descripcion });

      const subproyectoIdMap = Array.isArray(subproyectos) && subproyectos.length
        ? await insertarSubproyectos(id, subproyectos)
        : null;

      const tablaIdMap = Array.isArray(tablas) && tablas.length
        ? await insertarTablas(id, tablas)
        : null;

      if (Array.isArray(componentes)) {
        const registros = prepararRegistrosComponentes(componentes, id);
        if (registros.length) {
          await insertarComponentes(registros, subproyectoIdMap, tablaIdMap);
        }
      }

      const nuevoProyecto = await db('proyectos').where({ id }).first();
      const nuevoProyectoCompleto = {
        ...nuevoProyecto,
        subproyectos: await cargarSubproyectos(id),
        tablas: await cargarTablas(id),
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

      let subproyectoIdMap = null;
      if (Array.isArray(payload.subproyectos)) {
        await db('subproyectos').where({ proyecto_id: id }).delete();
        subproyectoIdMap = await insertarSubproyectos(id, payload.subproyectos);
      }

      let tablaIdMap = null;
      if (Array.isArray(payload.tablas)) {
        await db('tablas_db_proyectos').where({ proyecto_id: id }).delete();
        tablaIdMap = await insertarTablas(id, payload.tablas);
      }

      if (Array.isArray(payload.componentes)) {
        await db('componentes').where({ proyecto_id: id }).delete();
        const registros = prepararRegistrosComponentes(payload.componentes, id);
        if (registros.length) {
          await insertarComponentes(registros, subproyectoIdMap, tablaIdMap);
        }
      }

      const proyectoActualizado = await db('proyectos').where({ id }).first();
      const proyectoActualizadoCompleto = {
        ...proyectoActualizado,
        subproyectos: await cargarSubproyectos(id),
        tablas: await cargarTablas(id),
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
