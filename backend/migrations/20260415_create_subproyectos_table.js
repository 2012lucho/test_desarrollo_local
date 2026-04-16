/**
 * Migración: crear tabla `subproyectos` con relación N-1 a `proyectos`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('subproyectos').then((exists) => {
    if (exists) {
      return Promise.resolve();
    }
    return knex.schema.createTable('subproyectos', (table) => {
      table.increments('id').primary();
      table.integer('proyecto_id').notNullable().references('id').inTable('proyectos').onDelete('CASCADE');
      table.string('nombre', 100).notNullable();
      table.dateTime('creado_el').notNullable().defaultTo(knex.fn.now());
      table.dateTime('actualizado_el').notNullable().defaultTo(knex.fn.now());
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('subproyectos');
};
