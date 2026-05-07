/**
 * Migración: agregar columna `autoincremental` a `campos_tabla`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('campos_tabla').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('campos_tabla', 'autoincremental').then((hasColumn) => {
      if (hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.alterTable('campos_tabla', (table) => {
        table.boolean('autoincremental').notNullable().defaultTo(false);
      });
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('campos_tabla').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('campos_tabla', 'autoincremental').then((hasColumn) => {
      if (!hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.alterTable('campos_tabla', (table) => {
        table.dropColumn('autoincremental');
      });
    });
  });
};
