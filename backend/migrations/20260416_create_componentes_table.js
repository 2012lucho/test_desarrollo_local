/**
 * Migración: crear tabla `componentes` con relación N-1 a `proyectos`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('componentes').then((exists) => {
    if (exists) {
      return Promise.resolve();
    }
    return knex.schema.createTable('componentes', (table) => {
      table.increments('id').primary();
      table.integer('proyecto_id').notNullable().references('id').inTable('proyectos').onDelete('CASCADE');
      table.string('nombre', 100).notNullable();
      table.string('descripcion', 255).notNullable();
      table.json('config').notNullable();
      table.dateTime('creado_el').notNullable().defaultTo(knex.fn.now());
      table.dateTime('actualizado_el').notNullable().defaultTo(knex.fn.now());
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('componentes');
};
