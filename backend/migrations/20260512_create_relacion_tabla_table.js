/**
 * Migración: crear tabla `relacion_tabla` para las relaciones entre campos de tablas del proyecto
 */
exports.up = function(knex) {
  return knex.schema.hasTable('relacion_tabla').then((exists) => {
    if (exists) {
      return Promise.resolve();
    }

    return knex.schema.createTable('relacion_tabla', (table) => {
      table.increments('id').primary();
      table.integer('id_campo_1').unsigned().notNullable().references('id').inTable('campos_tabla').onDelete('CASCADE');
      table.integer('id_campo_2').unsigned().notNullable().references('id').inTable('campos_tabla').onDelete('CASCADE');
      table.string('tipo_relacion', 10).notNullable().defaultTo('1-1');
      table.unique(['id_campo_1', 'id_campo_2', 'tipo_relacion']);
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('relacion_tabla');
};
