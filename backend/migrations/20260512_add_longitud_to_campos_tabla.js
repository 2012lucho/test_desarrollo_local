/**
 * Migración: agregar columna `longitud` a `campos_tabla`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('campos_tabla').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('campos_tabla', 'longitud').then((hasColumn) => {
      if (hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.alterTable('campos_tabla', (table) => {
        table.integer('longitud').nullable();
      });
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('campos_tabla').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('campos_tabla', 'longitud').then((hasColumn) => {
      if (!hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.alterTable('campos_tabla', (table) => {
        table.dropColumn('longitud');
      });
    });
  });
};
