exports.up = function (knex) {
  return knex.schema.hasTable('agentes_tipo_bloques_especiales').then((exists) => {
    if (!exists) return;

    return knex.schema.table('agentes_tipo_bloques_especiales', (table) => {
      const hasRename = true;
      if (hasRename) {
        table.renameColumn('modelo_config', 'config_entrada');
      }
      table.json('config_general').nullable();
      table.json('config_salida').nullable();
    });
  });
};

exports.down = function (knex) {
  return knex.schema.hasTable('agentes_tipo_bloques_especiales').then((exists) => {
    if (!exists) return;

    return knex.schema.table('agentes_tipo_bloques_especiales', (table) => {
      table.dropColumn('config_general');
      table.dropColumn('config_salida');
      table.renameColumn('config_entrada', 'modelo_config');
    });
  });
};
