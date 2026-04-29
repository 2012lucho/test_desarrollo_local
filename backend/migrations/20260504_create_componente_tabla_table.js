/**
 * Migración: crear tabla `componente_tabla` para la relación n-n entre componentes y tablas
 */
exports.up = function(knex) {
  return knex.schema.hasTable('componente_tabla').then((exists) => {
    if (exists) {
      return Promise.resolve();
    }
    return knex.schema.createTable('componente_tabla', (table) => {
      table.increments('id').primary();
      table.integer('componente_id').unsigned().notNullable().references('id').inTable('componentes').onDelete('CASCADE');
      table.integer('tabla_id').unsigned().notNullable().references('id').inTable('tablas_db_proyectos').onDelete('CASCADE');
      table.dateTime('creado_el').notNullable().defaultTo(knex.fn.now());
      table.unique(['componente_id', 'tabla_id']);
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('componente_tabla');
};
