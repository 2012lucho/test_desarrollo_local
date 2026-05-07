/**
 * Migración: agregar columna `clave_primaria` a `campos_tabla`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('campos_tabla').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('campos_tabla', 'clave_primaria').then((hasColumn) => {
      if (hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.alterTable('campos_tabla', (table) => {
        table.boolean('clave_primaria').notNullable().defaultTo(false);
      });
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('campos_tabla').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('campos_tabla', 'clave_primaria').then((hasColumn) => {
      if (!hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.alterTable('campos_tabla', (table) => {
        table.dropColumn('clave_primaria');
      });
    });
  });
};
