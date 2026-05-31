exports.up = async function (knex) {
  const defaults = [
    { clave: 'v_agentes_scroll_x', valor: '0' },
    { clave: 'v_agentes_scroll_y', valor: '0' },
    { clave: 'v_basededatos_zoom', valor: '1' },
    { clave: 'v_basededatos_scroll_x', valor: '0' },
    { clave: 'v_basededatos_scroll_y', valor: '0' },
  ];
  for (const { clave, valor } of defaults) {
    const exists = await knex('config_general').where({ clave }).first();
    if (!exists) {
      await knex('config_general').insert({ clave, valor });
    }
  }
};

exports.down = async function (knex) {
  await knex('config_general')
    .whereIn('clave', [
      'v_agentes_scroll_x',
      'v_agentes_scroll_y',
      'v_basededatos_zoom',
      'v_basededatos_scroll_x',
      'v_basededatos_scroll_y',
    ])
    .delete();
};
