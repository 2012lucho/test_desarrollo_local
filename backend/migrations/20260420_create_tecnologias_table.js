/**
 * Migración: crear tabla `tecnologias`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('tecnologias').then((exists) => {
    if (exists) {
      return Promise.resolve();
    }
    return knex.schema.createTable('tecnologias', (table) => {
      table.increments('id').primary();
      table.string('nombre', 100).notNullable();
      table.string('tipo', 50).notNullable().defaultTo('lenguaje');
      table.string('tipo_aplicacion', 50).notNullable().defaultTo('backend');
      table.string('notas_uso', 512).notNullable().defaultTo('');
      table.dateTime('creado_el').notNullable().defaultTo(knex.fn.now());
      table.dateTime('actualizado_el').notNullable().defaultTo(knex.fn.now());
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('tecnologias');
};
