/**
 * Migración: crear tabla `tablas_db_proyectos` con relación N-1 a `proyectos`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('tablas_db_proyectos').then((exists) => {
    if (exists) {
      return Promise.resolve();
    }
    return knex.schema.createTable('tablas_db_proyectos', (table) => {
      table.increments('id').primary();
      table.string('nombre', 100).notNullable();
      table.integer('proyecto_id').notNullable().references('id').inTable('proyectos').onDelete('CASCADE');
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('tablas_db_proyectos');
};
