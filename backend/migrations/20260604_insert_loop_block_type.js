exports.up = async function (knex) {
  const exists = await knex('agentes_tipo_bloques_especiales').where({ nombre: 'LOOP' }).first();
  if (!exists) {
    await knex('agentes_tipo_bloques_especiales').insert({
      nombre: 'LOOP',
      config_entrada: JSON.stringify([
        { name: 'entrada', model: 'array' },
        { name: 'fin_iteracion', model: 'any' },
      ]),
      config_salida: JSON.stringify([
        { name: 'loop', model: 'any' },
        { name: 'fin_loop', model: 'any' },
      ]),
      config_general: '{}',
    });
  }
};

exports.down = async function (knex) {
  await knex('agentes_tipo_bloques_especiales').where({ nombre: 'LOOP' }).delete();
};
