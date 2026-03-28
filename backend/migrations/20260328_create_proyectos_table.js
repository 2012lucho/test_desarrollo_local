/**
 * Migración: crear tabla `proyectos` según backend/src/db.md
 */
exports.up = function(knex) {
  return knex.schema.createTable('proyectos', (table) => {
    table.increments('id').primary();
    table.string('nombre', 50).notNullable();
    table.string('descripcion', 255).notNullable();
    table.dateTime('creado_el').notNullable().defaultTo(knex.fn.now());
    table.dateTime('actualizado_el').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('proyectos');
};
