exports.up = function (knex) {
  return knex.schema.hasTable('agentes_tipo_bloques_especiales').then((exists) => {
    if (!exists) return;

    return knex.schema.table('agentes_tipo_bloques_especiales', (table) => {
      table.json('modelo_config').nullable();
    });
  });
};

exports.down = function (knex) {
  return knex.schema.hasTable('agentes_tipo_bloques_especiales').then((exists) => {
    if (!exists) return;

    return knex.schema.table('agentes_tipo_bloques_especiales', (table) => {
      table.dropColumn('modelo_config');
    });
  });
};
