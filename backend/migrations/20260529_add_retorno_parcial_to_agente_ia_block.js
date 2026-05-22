exports.up = async function (knex) {
  const bloque = await knex('agentes_tipo_bloques_especiales').where({ nombre: 'AGENTE_IA' }).first();
  if (!bloque) return;

  let configGeneral = bloque.config_general;
  if (typeof configGeneral === 'string') {
    try {
      configGeneral = JSON.parse(configGeneral);
    } catch {
      configGeneral = null;
    }
  }

  if (!configGeneral || typeof configGeneral !== 'object') {
    configGeneral = {};
  }

  const options = Array.isArray(configGeneral.options) ? configGeneral.options : [];
  if (!options.some((item) => String(item.field || '') === 'retorno_parcial')) {
    options.push({
      type: 'checkbox',
      required: false,
      field: 'retorno_parcial',
      label: 'Retorno Parcial en Chat',
    });
    configGeneral.options = options;
    await knex('agentes_tipo_bloques_especiales').where({ id: bloque.id }).update({ config_general: configGeneral });
  }
};

exports.down = async function (knex) {
  const bloque = await knex('agentes_tipo_bloques_especiales').where({ nombre: 'AGENTE_IA' }).first();
  if (!bloque) return;

  let configGeneral = bloque.config_general;
  if (typeof configGeneral === 'string') {
    try {
      configGeneral = JSON.parse(configGeneral);
    } catch {
      configGeneral = null;
    }
  }

  if (!configGeneral || typeof configGeneral !== 'object' || !Array.isArray(configGeneral.options)) {
    return;
  }

  const filtered = configGeneral.options.filter((item) => String(item.field || '') !== 'retorno_parcial');
  if (filtered.length !== configGeneral.options.length) {
    configGeneral.options = filtered;
    await knex('agentes_tipo_bloques_especiales').where({ id: bloque.id }).update({ config_general: configGeneral });
  }
};
