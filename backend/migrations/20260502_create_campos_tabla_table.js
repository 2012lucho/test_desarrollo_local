/*
 * Migración: crear tabla `campos_tabla` para los campos de tablas de proyecto
 */
exports.up = function(knex) {
  return knex.schema.hasTable('campos_tabla').then((exists) => {
    if (exists) {
      return Promise.resolve();
    }

    return knex.schema.createTable('campos_tabla', (table) => {
      table.increments('id').primary();
      table.string('nombre', 100).notNullable();
      table.text('descripcion').nullable();
      table.integer('proyecto_id').notNullable().references('id').inTable('proyectos').onDelete('CASCADE');
      table.integer('id_tabla').notNullable().references('id').inTable('tablas_db_proyectos').onDelete('CASCADE');
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('campos_tabla');
};
