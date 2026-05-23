exports.up = function (knex) {
  return knex.schema.hasTable('config_general').then((exists) => {
    if (!exists) {
      return knex.schema.createTable('config_general', (table) => {
        table.string('clave', 36).primary();
        table.text('valor').nullable();
      });
    }
    return null;
  });
};

exports.down = function (knex) {
  return knex.schema.hasTable('config_general').then((exists) => {
    if (exists) {
      return knex.schema.dropTable('config_general');
    }
    return null;
  });
};
