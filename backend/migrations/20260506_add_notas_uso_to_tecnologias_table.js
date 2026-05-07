/**
 * Migración: agregar columna `notas_uso` a `tecnologias`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('tecnologias').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('tecnologias', 'notas_uso').then((hasColumn) => {
      if (hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.table('tecnologias', (table) => {
        table.string('notas_uso', 512).notNullable().defaultTo('');
      });
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('tecnologias').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('tecnologias', 'notas_uso').then((hasColumn) => {
      if (!hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.table('tecnologias', (table) => {
        table.dropColumn('notas_uso');
      });
    });
  });
};
