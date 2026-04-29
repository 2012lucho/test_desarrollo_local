/*
 * Migración: agregar columna `orden` a `campos_tabla` para ordenar los campos de cada tabla
 */
exports.up = function(knex) {
  return knex.schema.hasTable('campos_tabla').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }
    return knex.schema.hasColumn('campos_tabla', 'orden').then((hasColumn) => {
      if (hasColumn) {
        return Promise.resolve();
      }
      return knex.schema.alterTable('campos_tabla', (table) => {
        table.integer('orden').notNullable().defaultTo(0);
      });
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasColumn('campos_tabla', 'orden').then((hasColumn) => {
    if (!hasColumn) {
      return Promise.resolve();
    }
    return knex.schema.alterTable('campos_tabla', (table) => {
      table.dropColumn('orden');
    });
  });
};
