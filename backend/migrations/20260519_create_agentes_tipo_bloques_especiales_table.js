exports.up = function (knex) {
  return knex.schema.hasTable('agentes_tipo_bloques_especiales').then((exists) => {
    if (exists) return;

    return knex.schema.createTable('agentes_tipo_bloques_especiales', (table) => {
      table.increments('id').primary();
      table.string('nombre', 255).notNullable();
      table.text('descripcion');
    });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('agentes_tipo_bloques_especiales');
};
