exports.up = function (knex) {
  return knex.schema.hasTable('agentes').then((exists) => {
    if (exists) return;

    return knex.schema.createTable('agentes', (table) => {
      table.string('id', 255).notNullable().primary();
      table.string('nombre', 255);
      table.text('descripcion');
      table.text('promt_sistema');
    });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('agentes');
};
